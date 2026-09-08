# Tempo Time for macOS

Tap a tempo or listen to an audio click track. Read the note lengths in milliseconds.

Choose an input and channel from the lists, then press **Listen**. Tap the circle
(or press Space) whenever you want to set the tempo yourself. A **Manual** indicator
appears; after 30 seconds without a tap, the display returns to audio automatically.

The six note lengths run from whole to thirty-second notes. Each audio click is
treated as a quarter note. Tempo Time processes audio locally, without recording
or playback. Core Audio inputs, including Dante Virtual Soundcard, are supported.
Allow Microphone access when macOS asks.

The downloadable build requires an Apple Silicon Mac with macOS 13 or later. Dante Virtual Soundcard is separate software from Audinate.

## Development

The interface uses the Tauri + React + TypeScript utility template. The tested
Swift/Core Audio detector is bundled as a helper; users need no developer tools.

```sh
npm ci
npm run dev
```

Build and test locally with Xcode, Swift 6, Rust and Node installed:

```sh
bash scripts/build-macos.sh
open 'dist/dmg-stage/Tempo Time.app'
```

Local builds use the current Mac's architecture and creates an ad-hoc-signed app
and unsigned `dist/tempo-time-macOS.dmg`. Nothing is published by these commands.

[Testing](docs/TESTING.md) · [Packaging](RELEASE.md) · [MIT license](LICENSE)
