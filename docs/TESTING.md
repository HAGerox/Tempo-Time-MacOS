# Testing

`npm test` builds the audio helper and runs the Swift engine suite plus a real
helper-protocol test. The protocol test includes a 30-second wait to verify
that manual tapping returns to the current audio reading. Fixtures are
synthetic and do not access the microphone.

`bash scripts/build-macos.sh` additionally builds the production Tauri app,
checks its signed helper and system dependencies, and creates an unsigned DMG.
The GitHub workflow also runs Clippy, formatter checks, CLI integration,
the sanitized C queue stress test, and tests the helper inside the app bundle.

Before publishing an installer, verify:

- First launch with fresh preferences and microphone permission denied/allowed.
- An isolated audio click through the selected device and channel, including
  high channel numbers. At 120 quarter-note BPM, expect 500 ms per quarter
  note and 62.50 ms per thirty-second note.
- Tap override and automatic return after 30 seconds, stop/restart and quit.
- Input disconnect, sample-rate changes, sleep/wake and recovery.
- Window sizing, both appearances, keyboard access and VoiceOver.
- The actual downloaded app on the advertised architecture and macOS baseline.

Automated PCM tests and a successful CI build are not hardware validation.
