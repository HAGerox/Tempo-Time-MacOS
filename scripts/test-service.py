#!/usr/bin/env python3
"""Exercise the actual bundled-audio protocol, including the real 30-second timeout."""
import json
import queue
import subprocess
import sys
import threading
import time

process = subprocess.Popen([sys.argv[1], '--demo'], stdin=subprocess.PIPE, stdout=subprocess.PIPE, text=True)
updates = queue.Queue()
def read():
    for line in process.stdout:
        updates.put(json.loads(line))
threading.Thread(target=read, daemon=True).start()
def send(action, **extra):
    process.stdin.write(json.dumps(dict(action=action, **extra)) + '\n')
    process.stdin.flush()
def until(predicate, timeout=7):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        value = updates.get(timeout=max(.01, deadline - time.monotonic()))
        if predicate(value):
            return value
    raise AssertionError('Timed out waiting for audio service')
try:
    first = until(lambda s: 'devices' in s)
    assert not first['listening'] and first['pulse'] is None
    send('start')
    audio = until(lambda s: s['pulse'] is not None)
    assert abs(audio['pulse'] - 500) < .1 and not audio['manual']
    send('tap')
    first_tap = until(lambda s: s['manual'])
    assert first_tap['pulse'] is None and first_tap['listening']
    time.sleep(.75)
    send('tap')
    manual = until(lambda s: s['manual'] and s['pulse'] is not None)
    assert 650 < manual['pulse'] < 900, manual
    print('Audio 120 BPM; first tap clears audio value; taps override while capture continues.', flush=True)
    restored = until(lambda s: not s['manual'], timeout=33)
    assert abs(restored['pulse'] - 500) < .1 and restored['listening']
    send('stop')
    stopped = until(lambda s: not s['listening'])
    assert stopped['pulse'] is None
    send('start')
    restarted = until(lambda s: s['listening'] and s['pulse'] is not None)
    assert abs(restarted['pulse'] - 500) < .1
    print('30-second return to live audio, stop clears output, and restart passed.', flush=True)
finally:
    process.stdin.close()
    process.wait(timeout=5)
