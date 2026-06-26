/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

const DEBUG = false;

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as ModalDialog from 'resource:///org/gnome/shell/ui/modalDialog.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup';
import St from 'gi://St';

export default class JiraCheckerExtension extends Extension {
  constructor(metadata) {
    super(metadata);
    this._indicator = null;
    this._timeoutId = null;
    this._lastTasks = null;
    this._cancellable = null;
  }

  enable() {
    this._settings = this.getSettings();
    this._cancellable = new Gio.Cancellable();

    // Create indicator
    this._indicator = new PanelMenu.Button(0, 'Jira Checker', false);

    // Create icon
    const icon = this._createPanelIcon();

    this._indicator.add_child(icon);

    // Add to panel
    Main.panel.addToStatusArea(this.uuid, this._indicator);

    // Build initial menu
    this._buildMenu([]);

    // Start checking tasks if configured
    if (this._isConfigured()) {
      this._startTaskCheck();
    } else if (DEBUG) {
      console.warn(
        '[Jira Checker] Extension not configured. Please set Jira credentials in preferences.',
      );
    }
  }

  disable() {
    if (this._cancellable) {
      this._cancellable.cancel();
      this._cancellable = null;
    }

    if (this._timeoutId !== null) {
      GLib.Source.remove(this._timeoutId);
      this._timeoutId = null;
    }

    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }

    this._settings = null;
    this._lastTasks = null;
  }

  _isConfigured() {
    const url = this._settings.get_string('jira-url');
    const email = this._settings.get_string('jira-email');
    const auth = this._settings.get_string('jira-auth');
    return !!(url && email && auth);
  }

  _getConfig() {
    return {
      url: this._settings.get_string('jira-url'),
      email: this._settings.get_string('jira-email'),
      auth: this._settings.get_string('jira-auth'),
      checkInterval: this._settings.get_int('check-interval'),
      webhookUrl: this._settings.get_string('webhook-url'),
    };
  }

  _createPanelIcon() {
    const iconPath = GLib.build_filenamev([this.path, 'icon.svg']);
    const file = Gio.File.new_for_path(iconPath);
    const gicon = new Gio.FileIcon({ file });

    return new St.Icon({
      gicon,
      style_class: 'system-status-icon',
    });
  }

  _startTaskCheck() {
    // Check immediately
    this._checkTasks();

    // Schedule periodic checks
    const config = this._getConfig();
    const intervalMinutes = config.checkInterval || 5;
    const intervalMs = intervalMinutes * 60 * 1000;

    this._timeoutId = GLib.timeout_add(
      GLib.PRIORITY_DEFAULT,
      intervalMs,
      () => {
        this._checkTasks();
        return GLib.SOURCE_CONTINUE;
      },
    );
  }

  async _checkTasks() {
    try {
      const config = this._getConfig();
      const tasks = await this._getTasks(config);

      if (tasks === null) {
        return;
      }

      // Update UI
      this._updateIndicator(tasks);
      this._buildMenu(tasks);

      // Check for new tasks and notify
      this._checkForNewTasks(tasks);

      this._lastTasks = tasks;
    } catch (error) {
      if (DEBUG) console.error(`[Jira Checker] Error checking tasks: ${error}`);
    }
  }

  async _getTasks(config) {
    return new Promise((resolve) => {
      try {
        const jql = `assignee = "${config.email}" AND resolution IS EMPTY`;
        const encodedJql = encodeURIComponent(jql);
        const url = `${config.url}/rest/api/3/search/jql?jql=${encodedJql}&fields=key`;

        const session = new Soup.Session();
        const message = Soup.Message.new('GET', url);

        // Set headers
        message
          .get_request_headers()
          .append('Authorization', `Basic ${config.auth}`);
        message.get_request_headers().append('Accept', 'application/json');
        message
          .get_request_headers()
          .append('Content-Type', 'application/json');

        session.send_and_read_async(
          message,
          GLib.PRIORITY_DEFAULT,
          this._cancellable,
          (session, result) => {
            try {
              if (message.get_status() !== 200) {
                if (DEBUG)
                  console.error(
                    `[Jira Checker] HTTP error: ${message.get_status()}`,
                  );
                resolve(null);
                return;
              }

              const bytes = session.send_and_read_finish(result);
              const decoder = new TextDecoder('utf-8');
              const response = decoder.decode(bytes.get_data());

              const data = JSON.parse(response);

              if (data.errorMessages) {
                if (DEBUG)
                  console.error(
                    `[Jira Checker] ${data.errorMessages.join(', ')}`,
                  );
                resolve(null);
                return;
              }

              const tasks = data.issues.map((issue) => ({
                id: issue.id,
                key: issue.key,
              }));

              resolve(tasks);
            } catch (error) {
              if (
                !error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED) &&
                DEBUG
              )
                console.error(`[Jira Checker] Parse error: ${error}`);
              resolve(null);
            }
          },
        );
      } catch (error) {
        if (DEBUG) console.error(`[Jira Checker] Request error: ${error}`);
        resolve(null);
      }
    });
  }

  _updateIndicator(tasks) {
    // Clear existing children
    this._indicator.remove_all_children();

    // Add icon with badge container
    const iconContainer = new St.Widget({
      layout_manager: new Clutter.BinLayout(),
      reactive: false,
      can_focus: false,
      x_expand: false,
      y_expand: false,
    });

    const icon = this._createPanelIcon();
    iconContainer.add_child(icon);

    // Add red dot badge when there are tasks
    if (tasks.length > 0) {
      let color = '#FAFAFA';

      if (tasks.length > 1 && tasks.length < 4) {
        color = '#FFC107';
      } else if (tasks.length >= 4) {
        color = '#F44336';
      }

      const badge = new St.Widget({
        style: `background-color: ${color}; min-width: 7px; min-height: 7px; border-radius: 999px;`,
        x_align: Clutter.ActorAlign.END,
        y_align: Clutter.ActorAlign.END,
        x_expand: false,
        y_expand: false,
      });

      badge.set_translation(8, 8, 0);

      iconContainer.add_child(badge);
    }

    this._indicator.add_child(iconContainer);
  }

  _buildMenu(tasks) {
    // Clear existing menu
    this._indicator.menu.removeAll();

    const config = this._getConfig();

    // Task count label
    let taskLabel = 'No tasks assigned';
    if (tasks.length === 1) {
      taskLabel = '1 task assigned';
    } else if (tasks.length > 1) {
      taskLabel = `${tasks.length} tasks assigned`;
    }

    const headerItem = new PopupMenu.PopupMenuItem(taskLabel, {
      reactive: false,
    });

    this._indicator.menu.addMenuItem(headerItem);

    // Add separator
    this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    // Add tasks
    if (tasks.length > 0) {
      tasks.forEach((task) => {
        const item = new PopupMenu.PopupMenuItem(task.key);
        item.connect('activate', () => {
          this._openUrl(`${config.url}/browse/${task.key}`);
        });
        this._indicator.menu.addMenuItem(item);
      });

      this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
    }

    // Open Jira button
    const openJiraItem = new PopupMenu.PopupMenuItem('Browse Jira');
    openJiraItem.connect('activate', () => {
      this._openUrl(config.url);
    });
    this._indicator.menu.addMenuItem(openJiraItem);

    // Open Task button
    const openTaskItem = new PopupMenu.PopupMenuItem('Jump to Task…');
    openTaskItem.connect('activate', () => {
      this._openTaskDialog();
    });
    this._indicator.menu.addMenuItem(openTaskItem);

    // Refresh button
    const refreshItem = new PopupMenu.PopupMenuItem('Refresh');
    refreshItem.connect('activate', () => {
      this._checkTasks();
    });
    this._indicator.menu.addMenuItem(refreshItem);
  }

  _checkForNewTasks(currentTasks) {
    if (this._lastTasks === null) {
      return; // First check, don't notify
    }

    const oldKeys = new Set(this._lastTasks.map((t) => t.key));
    const newTasks = currentTasks.filter((t) => !oldKeys.has(t.key));

    if (newTasks.length > 0) {
      const message =
        newTasks.length === 1
          ? `You have 1 new task: ${newTasks[0].key}`
          : `You have ${newTasks.length} new tasks`;

      Main.notify('Jira Checker', message);

      // Call webhook if configured
      const config = this._getConfig();
      if (config.webhookUrl) {
        this._callWebhook(config.webhookUrl);
      }
    }
  }

  _openTaskDialog() {
    const config = this._getConfig();

    const dialog = new ModalDialog.ModalDialog({ destroyOnClose: true });

    const label = new St.Label({
      text: 'Enter the Jira Task ID:',
      style: 'margin-bottom: 8px;',
    });
    dialog.contentLayout.add_child(label);

    const entry = new St.Entry({
      hint_text: 'e.g. ARQ-100',
      can_focus: true,
      x_expand: true,
    });
    dialog.contentLayout.add_child(entry);

    const confirm = () => {
      const taskId = entry.get_text().trim();
      if (taskId) this._openUrl(`${config.url}/browse/${taskId}`);
      dialog.close();
    };

    const clutterText = entry.get_clutter_text();

    const textChangedId = clutterText.connect('text-changed', () => {
      const text = clutterText.get_text();
      const upper = text.toUpperCase();
      if (text !== upper) {
        const pos = clutterText.get_cursor_position();
        clutterText.set_text(upper);
        clutterText.set_cursor_position(pos);
      }
    });

    const activateId = clutterText.connect('activate', () => confirm());

    dialog.connect('destroy', () => {
      clutterText.disconnect(textChangedId);
      clutterText.disconnect(activateId);
    });

    dialog.setButtons([
      {
        label: 'Cancel',
        action: () => dialog.close(),
        key: Clutter.KEY_Escape,
      },
      {
        label: 'Ok',
        action: confirm,
        default: true,
        key: Clutter.KEY_Return,
      },
    ]);

    dialog.open();
    entry.grab_key_focus();
  }

  _openUrl(url) {
    try {
      Gio.AppInfo.launch_default_for_uri(url, null);
    } catch (error) {
      if (DEBUG) console.error(`[Jira Checker] Failed to open URL: ${error}`);
    }
  }

  _callWebhook(url) {
    try {
      const session = new Soup.Session();
      const message = Soup.Message.new('GET', url);
      session.send_async(
        message,
        GLib.PRIORITY_DEFAULT,
        this._cancellable,
        (session, result) => {
          try {
            session.send_finish(result);
          } catch (error) {
            if (
              !error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED) &&
              DEBUG
            )
              console.error(`[Jira Checker] Webhook error: ${error}`);
          }
        },
      );
    } catch (error) {
      if (DEBUG)
        console.error(`[Jira Checker] Failed to call webhook: ${error}`);
    }
  }
}
