# Jira Checker — GNOME Shell Extension

A GNOME Shell extension that monitors your assigned Jira tasks and displays them in the system tray with desktop notifications for new assignments.

## Features

- **Color-coded tray badge** — dot color reflects workload at a glance:
  - White dot: 1 task assigned
  - Yellow dot: 2–3 tasks assigned
  - Red dot: 4 or more tasks assigned
  - No dot: nothing assigned
- **Task list in panel menu** — see all assigned tasks without leaving the desktop
- **One-click task navigation** — click any task key to open it in your browser
- **Jump to Task dialog** — type any task ID to open it directly, with auto-uppercase input
- **Browse Jira** — shortcut to your Jira home page from the panel menu
- **Desktop notifications** — notified when new tasks are assigned between checks
- **Configurable check interval** — 1 to 60 minutes (default: 5)
- **Webhook support** — optional HTTP call when new tasks arrive
- **Inline auth token generator** — generate the Base64 auth token inside preferences without leaving GNOME Settings

## Requirements

- GNOME Shell 45, 46, 47, 48, 49, or 50
- `glib-compile-schemas` (included with most GNOME installations)

## Installation

### From GNOME Extensions website

Install directly from [extensions.gnome.org](https://extensions.gnome.org) and skip to [Configuration](#configuration).

### Quick install from source

```bash
git clone https://github.com/gustavocoleta/jira-checker
cd jira-checker
./install.sh
```

### From source with Make

1. Clone the repository:

   ```bash
   git clone https://github.com/gustavocoleta/jira-checker
   cd jira-checker
   ```

2. Install the extension:

   ```bash
   make install
   ```

3. Restart GNOME Shell:
   - **X11**: Press `Alt+F2`, type `r`, press Enter
   - **Wayland**: Log out and log back in

4. Enable the extension:

   ```bash
   make enable
   ```

   Or use the GNOME Extensions app.

## Configuration

Open the extension preferences:

```bash
gnome-extensions prefs jira-checker@gustavocoleta
```

Or open **GNOME Settings → Extensions → Jira Checker → Settings**.

### Jira Configuration

| Setting            | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| **Jira URL**       | Your Jira instance URL, e.g. `https://company.atlassian.net` |
| **Email**          | The email address of your Jira account                       |
| **API Token**      | Base64-encoded `email:token` credential (see below)          |
| **Check Interval** | How often to poll for tasks, in minutes (1–60)               |

### Generating the API token

1. Get your Atlassian API token at [id.atlassian.com/manage/api-tokens](https://id.atlassian.com/manage/api-tokens)
2. In preferences, fill in **Email**, then click **Generate** next to the API Token field
3. Paste your API token in the dialog — the extension encodes `email:token` to Base64 and saves it automatically

Alternatively, encode it manually:

```bash
echo -n "your@email.com:your-api-token" | base64
```

### Advanced

| Setting         | Description                                                  |
| --------------- | ------------------------------------------------------------ |
| **Webhook URL** | Optional URL called via HTTP GET when new tasks are assigned |

## Usage

Once installed and configured, the Jira icon appears in the top panel.

### Panel icon

The dot badge on the icon indicates your task load:

- **No dot** — no assigned tasks
- **White dot** — 1 task
- **Yellow dot** — 2 to 3 tasks
- **Red dot** — 4 or more tasks

### Menu

| Item                     | Action                                       |
| ------------------------ | -------------------------------------------- |
| Task count header        | Shows how many tasks are currently assigned  |
| `KEY-123` (task entries) | Opens that task in your browser              |
| **Browse Jira**          | Opens your Jira home page in the browser     |
| **Jump to Task…**        | Opens a dialog to navigate to any task by ID |
| **Refresh**              | Manually triggers a task check immediately   |

### Jump to Task

Click **Jump to Task…** in the panel menu to open a dialog. Type a task ID (e.g. `ARQ-100`) and press Enter or click **Ok**. Input is automatically uppercased. Press Escape to dismiss.

## Development

### Project structure

```
.
├── extension.js              # Main extension — panel icon, menu, Jira API, notifications
├── prefs.js                  # Preferences window (Adwaita)
├── metadata.json             # Extension metadata and supported GNOME versions
├── install.sh                # Quick installer script
├── Makefile                  # Build and installation tasks
├── schemas/
│   └── *.gschema.xml         # GSettings schema (jira-url, jira-email, jira-auth, etc.)
├── assets/icons/
│   └── jira-novo.svg         # Panel icon
├── scripts/
│   ├── upgrade-version.sh    # Bump version in metadata.json and package.json
│   └── test-isolated-session.sh  # Launch a nested Wayland session for testing
└── .github/workflows/
    └── release.yml           # Release automation workflow
```

### Make commands

| Command                | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `make compile-schemas` | Compile GSettings XML schemas to binary                       |
| `make install`         | Install extension to `~/.local/share/gnome-shell/extensions/` |
| `make uninstall`       | Remove the extension from the local directory                 |
| `make pack`            | Create `jira-checker@gustavocoleta.zip` for distribution      |
| `make enable`          | Enable the extension via `gnome-extensions`                   |
| `make disable`         | Disable the extension                                         |
| `make logs`            | Stream extension logs from `journalctl`                       |
| `make clean`           | Remove build artifacts and the ZIP file                       |

### Releasing a new version

The release workflow is automated via GitHub Actions. Go to **Actions → Release Extension → Run workflow** and choose the bump type:

- `patch` — bug fixes (e.g. `2.1.0 → 2.1.1`)
- `minor` — new features (e.g. `2.1.0 → 2.2.0`)
- `major` — breaking changes (e.g. `2.1.0 → 3.0.0`)

The workflow will:

1. Bump the version in `metadata.json` and `package.json`
2. Compile schemas and create the extension ZIP
3. Commit and push the version bump
4. Create and push a git tag (e.g. `v2.2.0`)
5. Publish a GitHub Release with the ZIP attached

To publish to GNOME Extensions, download the ZIP from the GitHub Release and upload it at [extensions.gnome.org/upload](https://extensions.gnome.org/upload/).

To bump the version locally without releasing:

```bash
./scripts/upgrade-version.sh -patch   # or -minor / -major
```

### Testing in an isolated GNOME session

Run from the host terminal (not inside a container or sandbox):

```bash
bash scripts/test-isolated-session.sh
```

This installs the extension locally, enables it, and launches a nested Wayland GNOME Shell session using `--devkit`. Warnings related to `gvfs`, `doc`, or portals are expected in some environments and do not affect extension functionality.

### Debugging

Stream extension logs live:

```bash
make logs
```

Or directly:

```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep -i jira
```

## Troubleshooting

### Extension not appearing after installation

1. Ensure GNOME Shell was restarted after installation
2. Check whether the extension is enabled:
   ```bash
   gnome-extensions list
   gnome-extensions enable jira-checker@gustavocoleta
   ```

### No tasks appearing

1. Open preferences and verify Jira URL, email, and API token
2. Confirm the URL has no trailing slash
3. Confirm the API token is valid and not expired
4. Check logs for error details: `make logs`

### Configuration not saving

1. Recompile the schemas:
   ```bash
   make compile-schemas
   ```
2. Reinstall:
   ```bash
   make uninstall && make install
   ```

## License

GPL-2.0-or-later

## Author

Gustavo Coleta ([gustavocoleta](https://github.com/gustavocoleta))
