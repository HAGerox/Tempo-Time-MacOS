# Architecture

The interface uses Tauri + React + TypeScript.

- `src/`: one React view with styled input/channel lists, an always-running channel meter, one
  large tap button, a small source indicator and six note-duration rows.
  No mode selector, BPM field, rhythm options or detector settings.
- `src-tauri/`: the Rust/Tauri shell bundles the frontend and launches
  the audio helper. Typed IPC commands travel over stdin; JSON snapshots return
  over stdout. The shell caches snapshots and terminates the helper on exit.
  The helper path is resolved beside the executable, independent of PATH.
- `Sources/TempoService`: headless Swift adapter for Core Audio permission,
  device selection, capture lifecycle and snapshots. Device/channel changes
  cancel the previous session before starting another. Stale audio clears values.
- `Sources/TempoCore`: existing detector, tracker, WAV and note math, plus
  `TempoSession`. Taps temporarily override the current audio reading. The first
  tap clears the audio value, subsequent taps establish the manual tempo, and
  exactly 30 seconds after the last tap the current audio reading resumes.
  Capture continues underneath the manual override. If audio is
  unavailable, returning to Audio shows empty values.
- `Sources/TempoInput` and `Sources/AudioBridge`: existing serial analysis worker
  and allocation-free C AUHAL callback/queue. One explicitly selected channel,
  no mixing, recording, playback or system-device changes. Detection uses fixed
  defaults. Permission is requested on launch. Capture starts automatically and reconnects
  after selection/device changes; there is no start/stop control.
- `tempo-analyze` and `tempo-service --demo`: diagnostic harnesses, not app modes.
  Tests exercise the same engine and service as the packaged app.

Tauri embeds the helper as an external binary, following its
[sidecar packaging](https://v2.tauri.app/develop/sidecar/) convention. The app and
helper are signed; the packager wraps them in an unsigned DMG. Runtime
dependencies come from macOS, with no Node, Swift or Rust installation needed.
