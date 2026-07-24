# Changelog

All notable changes to this project will be documented in this file.

## [1.1.1] - 2026-07-24

- feat: add icon-panel.svg and update Makefile and install script to include it (eeec1f4)

## [1.1.0] - 2026-07-08

- feat: add changelog update script and integrate it into release workflow (64cf212)
- fix: update version retrieval to use "version-name" in metadata.json (c4078d6)
- fix: ensure version is a string in preferences window (eb45531)
- chore: removed unused files and itens on package.json (4bb9a4e)

## [1.0.5] - 2026-07-07

### Added

- New extension icon and updated badge colors (a63c603)

## [1.0.4] - 2026-07-06

### Fixed

- Adjusted errors reported by the GNOME Extensions site review for version 4 (e0cae03)

## [1.0.3] - 2026-07-06

### Fixed

- Addressed items pointed out in publish review #3 (9f81c02)

## [1.0.2] - 2026-06-26

### Added

- Extension icon (fa2f0f0, 1cfc272)

## [1.0.1] - 2026-06-26

### Fixed

- Adjusted items pointed out in review (18aca47)

## [1.0.0] - 2026-06-26

### Added

- "Jump to Task…" menu item; renamed "Open Jira" to "Browse Jira" on the icon menu (6bf6bd1)
- "About" section in extension preferences (86c9e8f)
- Helper script for testing in an isolated GNOME session (9026fa2)
- Script to automate version bumping and releases (db43c22, 94c43dd)

### Changed

- Tray icon color-indicator values (0344b3c)
- Adjusted extension to follow GNOME Extensions guidelines (1250318)
- Improved code quality and logging (d754fea)

### Removed

- Obsolete files; updated documentation for the GNOME Shell extension (2e8ebc2)

## [2.0.1] - 2026-06-02

### Added

- GNOME Shell 50 support (added `"50"` to `shell-version`; no API changes required)

### Fixed

- Missing `GLib` import in `prefs.js` that caused a `ReferenceError` when using the "Generate" auth-token button

## [2.0.0] - 2026-02-18

### Changed - Major Rewrite

- **Complete rewrite as GNOME Shell Extension**: Converted from Electron desktop application to native GNOME Shell extension
- **Technology Stack**:
  - Replaced Electron with native GNOME Shell APIs
  - Replaced Node.js with GJS (GNOME JavaScript)
  - Using GSettings for configuration instead of JSON files
- **User Interface**:
  - System tray indicator instead of separate window
  - Native GNOME preferences dialog
  - Better integration with GNOME Shell
- **Performance**:
  - Significantly reduced memory footprint
  - Native system integration
  - No separate process required
- **Configuration**:
  - Settings now stored in GSettings (dconf)
  - New preferences UI following GNOME HIG
  - Easy auth token generation in preferences

### Preserved Features

- ✅ Automatic Jira task checking at configurable intervals
- ✅ Desktop notifications for new tasks
- ✅ System tray indicator with task count badge
- ✅ Quick menu to access tasks
- ✅ Direct links to open tasks in browser
- ✅ Webhook support for new task notifications
- ✅ Configurable check intervals

### Added

- Native GNOME preferences dialog
- Better error handling and logging
- Installation via Makefile
- Distributable ZIP package support
- Comprehensive README with troubleshooting
- Development files preserved in `.old` directory

### Removed

- Electron window (replaced with native integration)
- Separate application process
- Local config.json file (now using GSettings)
- Tray icon badges (using text label instead)
- Desktop file (not needed for extensions)

### Migration Notes

The old Electron-based application code has been preserved in the `.old` directory for reference. To use the new GNOME Shell extension:

1. Remove any existing Electron version
2. Follow installation instructions in README.md
3. Reconfigure using GNOME Extensions preferences

## [1.0.0-alpha-6] - Previous Version

Previous Electron-based application. See `.old/` directory for original code.
