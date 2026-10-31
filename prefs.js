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
import Soup from 'gi://Soup';

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class JiraCheckerPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    const version = String(this.metadata.version ?? 'Unknown');

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

    // Deployment type drives both the REST endpoint and the credential format
    const serverTypeRow = new Adw.ComboRow({
      title: 'Jira Type',
      subtitle: 'Cloud uses REST API v3 with Basic auth; Data Center uses v2 with a Bearer token',
      model: Gtk.StringList.new([
        'Jira Cloud',
        'Jira Data Center / Server',
      ]),
      selected: settings.get_string('server-type') === 'datacenter' ? 1 : 0,
    });
    group.add(serverTypeRow);

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

    // "Test connection" runs the exact query the extension uses, so a wrong
    // deployment type or stale token is reported here instead of failing
    // silently in the panel menu.
    const testRow = new Adw.ActionRow({
      title: 'Test connection',
      subtitle: 'Checks the saved URL, token and Jira type',
    });
    const testButton = new Gtk.Button({
      label: 'Test',
      valign: Gtk.Align.CENTER,
    });
    testRow.add_suffix(testButton);
    group.add(testRow);

    const reportConnection = (status, detail) => {
      const ok = status === 200;
      testRow.set_subtitle(
        ok
          ? `Connected — ${detail}`
          : `Failed${status ? ` (HTTP ${status})` : ''} — ${detail}`,
      );
    };

    testButton.connect('clicked', () => {
      const url = settings.get_string('jira-url').replace(/\/+$/, '');
      const email = settings.get_string('jira-email');
      const auth = settings.get_string('jira-auth');
      if (!url || !email || !auth) {
        reportConnection(0, 'fill in Jira URL, email and API token first');
        return;
      }

      const isCloud = settings.get_string('server-type') !== 'datacenter';
      const jql = encodeURIComponent(
        `assignee = "${email}" AND resolution IS EMPTY`,
      );
      const endpoint = isCloud
        ? `${url}/rest/api/3/search/jql?jql=${jql}&fields=key`
        : `${url}/rest/api/2/search?jql=${jql}&fields=key&maxResults=100`;

      testButton.set_sensitive(false);
      testRow.set_subtitle('Checking…');

      const session = new Soup.Session();
      const message = Soup.Message.new('GET', endpoint);
      message
        .get_request_headers()
        .append('Authorization', `${isCloud ? 'Basic' : 'Bearer'} ${auth}`);
      message.get_request_headers().append('Accept', 'application/json');

      session.send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        null,
        (source, result) => {
          let body = '';
          try {
            const bytes = source.send_and_read_finish(result);
            body = new TextDecoder().decode(bytes.get_data() ?? []);
          } catch (error) {
            body = String(error);
          }

          const status = message.get_status();
          if (status === 200) {
            let count = 0;
            try {
              count = (JSON.parse(body).issues ?? []).length;
            } catch {
              count = 0;
            }
            reportConnection(status, `${count} assigned task(s) found`);
          } else if (status === 401 || status === 403) {
            reportConnection(
              status,
              isCloud
                ? 'check the Base64 email:token value'
                : 'check the personal access token',
            );
          } else if (status === 404) {
            reportConnection(
              status,
              isCloud
                ? 'endpoint not found — is this really Jira Cloud?'
                : 'endpoint not found — is this really Data Center / Server?',
            );
          } else {
            reportConnection(status, 'see the extension log for details');
          }
          testButton.set_sensitive(true);
        },
      );
    });

    // The generate helper talks to Atlassian's Cloud token page; on Data Center
    // and Server a personal access token is created in the user's profile.
    const updateAuthUi = () => {
      const bearer = settings.get_string('server-type') === 'datacenter';
      tokenRow.set_subtitle(
        bearer
          ? 'Personal access token (Data Center / Server)'
          : 'Base64 encoded authentication (email:token)',
      );
      generateButton.set_visible(!bearer);
    };
    serverTypeRow.connect('notify::selected', (widget) => {
      settings.set_string(
        'server-type',
        widget.selected === 1 ? 'datacenter' : 'cloud',
      );
      updateAuthUi();
    });
    updateAuthUi();

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
