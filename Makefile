# Makefile for Jira Checker GNOME Extension

EXTENSION_UUID = jira-checker@gustavocoleta
EXTENSION_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(EXTENSION_UUID)
BUILD_DIR = build

# Files to include in the extension
FILES = extension.js prefs.js metadata.json
SCHEMAS = schemas/org.gnome.shell.extensions.jira-checker.gschema.xml

.PHONY: all clean install uninstall pack compile-schemas

all: compile-schemas

# Compile GSettings schemas
compile-schemas:
	@echo "Compiling schemas..."
	@glib-compile-schemas schemas/

# Install the extension
install: compile-schemas
	@echo "Installing extension to $(EXTENSION_DIR)..."
	@mkdir -p $(EXTENSION_DIR)
	@mkdir -p $(EXTENSION_DIR)/schemas
	@mkdir -p $(EXTENSION_DIR)/assets/icons
	@cp $(FILES) $(EXTENSION_DIR)/
	@cp -r schemas/* $(EXTENSION_DIR)/schemas/
	@cp -r assets/icons/* $(EXTENSION_DIR)/assets/icons/
	@echo "Installation complete. Please restart GNOME Shell:"
	@echo "  - On X11: Press Alt+F2, type 'r', and press Enter"
	@echo "  - On Wayland: Log out and log back in"
	@echo "Then enable the extension using GNOME Extensions app or:"
	@echo "  gnome-extensions enable $(EXTENSION_UUID)"

# Uninstall the extension
uninstall:
	@echo "Uninstalling extension..."
	@rm -rf $(EXTENSION_DIR)
	@echo "Extension uninstalled."

# Create a distributable package
pack:
	@echo "Creating package..."
	@mkdir -p $(BUILD_DIR)
	@cp $(FILES) $(BUILD_DIR)/
	@mkdir -p $(BUILD_DIR)/schemas
	@mkdir -p $(BUILD_DIR)/assets/icons
	@cp schemas/*.xml $(BUILD_DIR)/schemas/
	@cp -r assets/icons/* $(BUILD_DIR)/assets/icons/
	@cd $(BUILD_DIR) && zip -r ../$(EXTENSION_UUID).zip .
	@rm -rf $(BUILD_DIR)
	@echo "Package created: $(EXTENSION_UUID).zip"

# Clean build artifacts
clean:
	@echo "Cleaning..."
	@rm -rf $(BUILD_DIR)
	@rm -f $(EXTENSION_UUID).zip
	@rm -f schemas/*.compiled
	@echo "Clean complete."

# Enable the extension
enable:
	@gnome-extensions enable $(EXTENSION_UUID)

# Disable the extension
disable:
	@gnome-extensions disable $(EXTENSION_UUID)

# Show extension logs
logs:
	@journalctl -f -o cat /usr/bin/gnome-shell | grep -i jira
