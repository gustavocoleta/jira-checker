#!/usr/bin/env bash

set -euo pipefail

EXTENSION_UUID="jira-checker@gustavocoleta"
WAYLAND_DISPLAY_NAME="wayland-jira-test"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

require_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Erro: comando '$1' não encontrado." >&2
        exit 1
    fi
}

require_cmd make
require_cmd gnome-shell
require_cmd gnome-extensions
require_cmd dbus-run-session
require_cmd glib-compile-schemas

cd "$REPO_ROOT"

echo "==> Instalando a extensão localmente"
make install

echo "==> Garantindo que a extensão esteja habilitada na sessão alvo"
gnome-extensions disable "$EXTENSION_UUID" >/dev/null 2>&1 || true
gnome-extensions enable "$EXTENSION_UUID"

echo ""
echo "==> Iniciando sessão GNOME isolada (Wayland nested)"
echo "Socket Wayland: $WAYLAND_DISPLAY_NAME"
echo ""
echo "Para encerrar a sessão de teste, feche a janela do GNOME testado ou use Ctrl+C neste terminal."
echo "Aviso: mensagens sobre gvfs/doc/portal podem aparecer e geralmente não impedem o teste da extensão."
echo ""

rm -f "$XDG_RUNTIME_DIR/gnome-shell-disable-extensions" 2>/dev/null || true

dbus-run-session -- gnome-shell --wayland --devkit --wayland-display="$WAYLAND_DISPLAY_NAME"
