#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

"$repo_root/scripts/check-context-size.sh"

if [ ! -f package.json ]; then
    echo "INFO: brak package.json — aplikacja nie została jeszcze zainicjalizowana; zakończono na walidacji harnessu."
    exit 0
fi

if ! command -v node >/dev/null 2>&1; then
    echo "Błąd: Node.js nie jest dostępny." >&2
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "Błąd: npm nie jest dostępny." >&2
    exit 1
fi

has_script() {
    node -e 'const scripts = require("./package.json").scripts ?? {}; process.exit(Object.hasOwn(scripts, process.argv[1]) ? 0 : 1)' "$1"
}

required_scripts=(lint typecheck test build)

for script_name in "${required_scripts[@]}"; do
    if ! has_script "$script_name"; then
        echo "Błąd: package.json nie definiuje wymaganego skryptu npm '$script_name'." >&2
        exit 1
    fi

    echo "+ npm run $script_name"
    npm run "$script_name"
done

if has_script test:e2e; then
    echo "+ npm run test:e2e"
    npm run test:e2e
else
    echo "INFO: brak opcjonalnego skryptu test:e2e — pominięto automatyczny smoke test przeglądarkowy."
fi
