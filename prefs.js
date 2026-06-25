/* prefs.js
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

import Adw from 'gi://Adw';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class JiraCheckerPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const version = this.metadata.version ?? 'Unknown';

    // Create a preferences page
    const page = new Adw.PreferencesPage();
    window.add(page);

    // Create a preferences group for Jira settings
    const group = new Adw.PreferencesGroup({
      title: 'Jira Configuration',
      description: 'Configure your Jira instance connection',
    });
    page.add(group);

    // Jira URL
    const urlRow = new Adw.EntryRow({
      title: 'Jira URL',
      text: settings.get_string('jira-url'),
    });
    urlRow.connect('changed', (widget) => {
      settings.set_string('jira-url', widget.text);
    });
    group.add(urlRow);

    // Email
    const emailRow = new Adw.EntryRow({
      title: 'Email',
      text: settings.get_string('jira-email'),
    });
    emailRow.connect('changed', (widget) => {
      settings.set_string('jira-email', widget.text);
    });
    group.add(emailRow);

    // API Token row with button to generate token
    const tokenRow = new Adw.ActionRow({
      title: 'API Token',
      subtitle: 'Base64 encoded authentication (email:token)',
    });

    const tokenEntry = new Gtk.Entry({
      text: settings.get_string('jira-auth'),
      hexpand: true,
      valign: Gtk.Align.CENTER,
    });
    tokenEntry.connect('changed', (widget) => {
      settings.set_string('jira-auth', widget.get_text());
    });
    tokenRow.add_suffix(tokenEntry);

    const generateButton = new Gtk.Button({
      label: 'Generate',
      valign: Gtk.Align.CENTER,
    });
    generateButton.connect('clicked', () => {
      const email = settings.get_string('jira-email');

      const apiTokenEntry = new Adw.EntryRow({
        title: 'API Token',
        show_apply_button: false,
      });

      const body = new Adw.PreferencesGroup();
      body.add(apiTokenEntry);

      const dialog = new Adw.AlertDialog({
        heading: 'Generate Auth Token',
        body: 'Get your API token from:\nhttps://id.atlassian.com/manage/api-tokens',
        extra_child: body,
      });
      dialog.add_response('cancel', 'Cancel');
      dialog.add_response('generate', 'Generate');
      dialog.set_response_appearance('generate', Adw.ResponseAppearance.SUGGESTED);
      dialog.set_default_response('generate');
      dialog.set_close_response('cancel');

      dialog.connect('response', (_dialog, response) => {
        if (response === 'generate') {
          const apiToken = apiTokenEntry.text;
          if (email && apiToken) {
            const authString = `${email}:${apiToken}`;
            const encoded = GLib.base64_encode(
              new TextEncoder().encode(authString),
            );
            settings.set_string('jira-auth', encoded);
            tokenEntry.set_text(encoded);
          }
        }
      });

      dialog.present(window);
    });
    tokenRow.add_suffix(generateButton);
    group.add(tokenRow);

    // Check interval
    const intervalRow = new Adw.SpinRow({
      title: 'Check Interval (minutes)',
      adjustment: new Gtk.Adjustment({
        lower: 1,
        upper: 60,
        step_increment: 1,
        page_increment: 5,
        value: settings.get_int('check-interval'),
      }),
    });
    intervalRow.connect('changed', (widget) => {
      settings.set_int('check-interval', widget.value);
    });
    group.add(intervalRow);

    // Webhook URL
    const webhookGroup = new Adw.PreferencesGroup({
      title: 'Advanced',
      description: 'Optional webhook configuration',
    });
    page.add(webhookGroup);

    const webhookRow = new Adw.EntryRow({
      title: 'Webhook URL',
      text: settings.get_string('webhook-url'),
    });
    webhookRow.connect('changed', (widget) => {
      settings.set_string('webhook-url', widget.text);
    });
    webhookGroup.add(webhookRow);

    // About
    const aboutGroup = new Adw.PreferencesGroup({
      title: 'About',
    });
    page.add(aboutGroup);

    const versionRow = new Adw.ActionRow({
      title: 'Version',
      subtitle: version,
    });
    aboutGroup.add(versionRow);

    const repoRow = new Adw.ActionRow({
      title: 'Source Code',
      subtitle: this.metadata.url,
      activatable: true,
    });
    repoRow.add_suffix(
      new Gtk.Image({
        icon_name: 'external-link-symbolic',
        valign: Gtk.Align.CENTER,
      }),
    );
    repoRow.connect('activated', () => {
      Gtk.show_uri(window, this.metadata.url, GLib.PRIORITY_DEFAULT);
    });
    aboutGroup.add(repoRow);
  }
}
