#!/bin/bash
# Quick installation script for Jira Checker GNOME Extension

set -e

EXTENSION_UUID="jira-checker@gcoletaalves"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "Installing Jira Checker GNOME Extension..."

# Check if glib-compile-schemas is available
if ! command -v glib-compile-schemas &> /dev/null; then
    echo "Error: glib-compile-schemas not found. Please install glib development tools."
    exit 1
fi

# Compile schemas
echo "Compiling GSettings schemas..."
glib-compile-schemas schemas/

# Create extension directory
echo "Creating extension directory..."
mkdir -p "$EXTENSION_DIR/schemas"
mkdir -p "$EXTENSION_DIR/assets/icons"

# Copy files
echo "Copying extension files..."
cp extension.js "$EXTENSION_DIR/"
cp prefs.js "$EXTENSION_DIR/"
cp metadata.json "$EXTENSION_DIR/"
cp -r schemas/* "$EXTENSION_DIR/schemas/"
cp -r assets/icons/* "$EXTENSION_DIR/assets/icons/"

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Restart GNOME Shell:"
echo "   - On X11: Press Alt+F2, type 'r', and press Enter"
echo "   - On Wayland: Log out and log back in"
echo ""
echo "2. Enable the extension:"
echo "   gnome-extensions enable $EXTENSION_UUID"
echo ""
echo "3. Configure the extension:"
echo "   gnome-extensions prefs $EXTENSION_UUID"
echo ""
