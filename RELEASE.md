# Builds and releases

Run `npm ci`, then `bash scripts/build-macos.sh` on macOS with Xcode/Swift 6,
Rust and Node. The script tests the engine and audio-service protocol, builds
the Tauri frontend and native shell, verifies the bundled helper/signatures,
and uses the utility template's unsigned-DMG packager.

Outputs are `dist/dmg-stage/Tempo Time.app` and `dist/tempo-time-macOS.dmg`.
The build targets the current Mac's architecture. It is ad-hoc signed and not
notarized. No account, publication or developer certificate is needed for this
local workflow. Users of the app need no development runtimes.

For further development, `npm run dev` builds the helper and opens Tauri.
`npm run build` checks only the frontend. Verify the packaged app for native
audio and permission changes. Keep `app.json`, `package.json`, the Tauri config
and Cargo package versions aligned.

## GitHub workflow

The independent repository is `HAGerox/Tempo-Time-MacOS`. Pushes to `main`, pull
requests and manual dispatch run tests and produce a temporary installer
artifact. Actions are pinned to commit IDs and updated by Dependabot. Build
jobs have read-only repository access and do not retain checkout credentials.

A `vX.Y.Z` tag must match all four version declarations. After its checks pass,
a separate job publishes only `tempo-time-macOS.dmg`. The tagged release job
alone receives write permission. CI uses the Apple Silicon `macos-15` runner;
the download must not be described as universal or Intel-tested.

A source-code publication is separate from an installer release. Keep a new
repository private until the publication audit is reviewed. Do not tag a release
until the manual hardware checks in `docs/TESTING.md` are completed.
