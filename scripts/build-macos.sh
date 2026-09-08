#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/check-version.py
npm test
npm run package -- --bundles app -- --locked
python3 scripts/check-macos-bundle.py 'src-tauri/target/release/bundle/macos/Tempo Time.app'
mkdir -p dist/dmg-stage
# Keep the familiar local launch path pointing to the Tauri build.
python3 - <<'PY'
from pathlib import Path
import shutil
app = Path('dist/dmg-stage/Tempo Time.app')
if app.exists(): shutil.rmtree(app)
shutil.copytree('src-tauri/target/release/bundle/macos/Tempo Time.app', app)
PY
python3 scripts/package-macos-dmg.py 'dist/dmg-stage/Tempo Time.app' dist/tempo-time-macOS.dmg
