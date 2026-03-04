# Jira Checker - GNOME Shell Extension

A GNOME Shell extension that monitors your assigned Jira tasks and displays them in the system tray with notifications for new tasks.

## Features

- 🔔 System tray indicator showing the number of assigned tasks
- 📋 Quick access menu to view and open tasks
- 🔄 Automatic task checking at configurable intervals
- 📢 Desktop notifications for new tasks
- 🔗 Direct links to tasks in your browser
- 🎣 Optional webhook support for new task notifications
- ⚙️ Easy configuration through GNOME Settings

## Migration from Electron Version

This is a complete rewrite of the original Electron-based application as a native GNOME Shell extension. The old code has been preserved in the `.old` directory.

### Key Differences:

- **Platform**: Native GNOME Shell instead of Electron
- **Language**: JavaScript/TypeScript instead of Node.js
- **Configuration**: GSettings instead of config.json
- **Integration**: System tray instead of separate application window
- **Performance**: Lighter memory footprint and better system integration

## Requirements

- GNOME Shell 45, 46, 47, 48, or 49
- `glib-compile-schemas` (usually included with GNOME)

## Installation

### Quick Install

Use the installer script:

```bash
./install.sh
```

### Test in an Isolated GNOME Session

Run the helper script from the host terminal (outside sandboxes/containers):

```bash
bash scripts/test-isolated-session.sh
```

What it does:

- Installs the extension locally (`make install`)
- Re-enables the extension (`jira-checker@gcoletaalves`)
- Starts a separate nested GNOME Wayland session for validation (using `--devkit`)

Note: startup warnings related to `gvfs`, `doc`, or portals may appear in some environments and are often non-blocking for extension testing.

### From Source (Makefile)

1. Clone the repository:

   ```bash
   cd ~/GitHub/jira-checker
   ```

2. Compile schemas:

   ```bash
   make compile-schemas
   ```

3. Install the extension:

   ```bash
   make install
   ```

4. Restart GNOME Shell:
   - **X11**: Press `Alt+F2`, type `r`, and press Enter
   - **Wayland**: Log out and log back in

5. Enable the extension:
   ```bash
   make enable
   ```
   Or use the GNOME Extensions app.

### Configuration

1. Open GNOME Extensions app or run:

   ```bash
   gnome-extensions prefs jira-checker@gcoletaalves
   ```

2. Configure the following settings:
   - **Jira URL**: Your Jira instance URL (e.g., `https://company.atlassian.net`)
   - **Email**: Your Jira account email
   - **API Token**:
     - Get your API token from: https://id.atlassian.com/manage/api-tokens
     - Use the "Generate" button in preferences to create the BASE64 encoded auth
   - **Check Interval**: How often to check for tasks (in minutes, default: 5)
   - **Webhook URL** (optional): URL to call when new tasks are found

## Usage

Once installed and configured:

1. The extension will appear in your system tray
2. Click the icon to see your assigned tasks
3. Click on any task to open it in your browser
4. The number badge shows how many tasks are assigned to you
5. You'll receive notifications when new tasks are assigned

### Menu Options

- **Task List**: Click any task key to open it in Jira
- **Open Jira**: Opens your Jira home page
- **Refresh**: Manually check for new tasks

## Development

### Project Structure

```
.
├── extension.js           # Main extension entry point
├── prefs.js              # Preferences UI
├── metadata.json         # Extension metadata
├── install.sh            # Quick installer script
├── schemas/              # GSettings schemas
│   └── *.gschema.xml
├── assets/icons/         # Panel icon assets
├── .old/                 # Original Electron app
└── Makefile              # Build and installation tasks
```

### Available Make Commands

- `make compile-schemas` - Compile GSettings schemas
- `make install` - Install extension to local extensions directory
- `make uninstall` - Uninstall the extension
- `make pack` - Create a distributable ZIP package
- `make enable` - Enable the extension
- `make disable` - Disable the extension
- `make logs` - View extension logs
- `make clean` - Remove build artifacts

### Debugging

View logs in real-time:

```bash
make logs
```

Or manually:

```bash
journalctl -f -o cat /usr/bin/gnome-shell | grep -i jira
```

## Troubleshooting

### Extension not appearing after installation

1. Make sure GNOME Shell was restarted
2. Check if the extension is enabled:
   ```bash
   gnome-extensions list
   gnome-extensions enable jira-checker@gcoletaalves
   ```

### No tasks showing up

1. Verify your configuration in preferences
2. Check that your Jira URL doesn't have trailing slashes
3. Ensure your API token is valid
4. Check logs for errors: `make logs`

### Configuration not saving

1. Ensure schemas are compiled:
   ```bash
   make compile-schemas
   ```
2. Reinstall the extension:
   ```bash
   make uninstall
   make install
   ```

## License

ISC License

## Author

Gustavo Coleta (GCOLETAALVES)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Old Version

The original Electron-based version is preserved in the `.old` directory for reference.
