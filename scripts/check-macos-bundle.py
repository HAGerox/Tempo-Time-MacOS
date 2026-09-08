#!/usr/bin/env python3
"""Verify the actual Tauri bundle and its self-contained audio service."""
from pathlib import Path
import plistlib
import subprocess
import sys
app = Path(sys.argv[1]).resolve()
info = plistlib.loads((app / 'Contents/Info.plist').read_bytes())
assert info['NSMicrophoneUsageDescription']
assert info['CFBundleIdentifier'] == 'io.github.hagerox.tempotime'
subprocess.run(['codesign', '--verify', '--deep', '--strict', str(app)], check=True)
for name in [info['CFBundleExecutable'], 'tempo-service']:
    binary = app / 'Contents/MacOS' / name
    assert binary.is_file(), binary
    subprocess.run(['codesign', '--verify', '--strict', str(binary)], check=True)
    print(name, subprocess.check_output(['lipo', str(binary), '-archs'], text=True).strip())
    libraries = subprocess.check_output(['otool', '-L', str(binary)], text=True)
    commands = subprocess.check_output(['otool', '-l', str(binary)], text=True)
    for line in libraries.splitlines():
        if not line.startswith('\t'): continue
        dependency = line.strip().split(' (', 1)[0]
        if dependency.startswith(('/System/Library/', '/usr/lib/')): continue
        if dependency.startswith('@rpath/libswift') and 'path /usr/lib/swift ' in commands: continue
        raise SystemExit(f'Unexpected unbundled dependency: {dependency}')
print('Tauri app, bundled audio service, signature, microphone description and system-only dependencies verified.')
