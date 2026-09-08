# Notices

Tempo Time and its original icon are copyright © 2026 Finn Stanley, under the MIT license in LICENSE.

This macOS app starts from [HAGerox/utility-app-template](https://github.com/HAGerox/utility-app-template), commit `12cf6445a8c421ebae03d5441685ad584676d372`. Its Tauri starter, design guidance, project instructions, packaging scripts and workflow were adapted here. The original Tempo Time Android palette, icon and interaction informed the macOS version; its Gradle project is retired in this worktree.

The interface bundles React (MIT) and Tauri (MIT or Apache-2.0), with their dependency trees pinned in package-lock.json and Cargo.lock. Foundation, AVFoundation, Core Audio, AudioToolbox and WebKit are supplied by macOS. Dante and Dante Virtual Soundcard are Audinate trademarks. This app uses Core Audio; it does not bundle, implement or license Dante networking software.

The packaged app includes THIRD_PARTY.txt with license notices and source-package links for its macOS dependencies. The source repository includes pinned upstream license copies where crate archives omit them.
