# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-02-18

### Changed - Major Rewrite

- **Complete rewrite as GNOME Shell Extension**: Converted from Electron desktop application to native GNOME Shell extension
- **Technology Stack**: 
  - Replaced Electron with native GNOME Shell APIs
  - Replaced Node.js with GJS (GNOME JavaScript)
  - Added TypeScript support for development (source files in `src/`)
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
