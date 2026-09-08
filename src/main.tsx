import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke } from '@tauri-apps/api/core';
import './styles.css';

interface Device { uid: string; name: string; channels: number }
interface Snapshot {
  devices: Device[]; uid: string; channel: number; listening: boolean; starting: boolean;
  manual: boolean; status: string; bpm: number | null; pulse: number | null; error: string | null;
  peakDB: number;
}
const initial: Snapshot = { devices: [], uid: '', channel: 1, listening: false, starting: false, manual: false, status: 'Audio off', bpm: null, pulse: null, error: null, peakDB: -120 };
const notes = [ [1, 'Whole'], [2, 'Half'], [4, 'Quarter'], [8, 'Eighth'], [16, 'Sixteenth'], [32, 'Thirty-second'] ] as const;

function Note({ value }: { value: number }) {
  const flags = value === 8 ? 1 : value === 16 ? 2 : value === 32 ? 3 : 0;
  return <svg viewBox="0 0 32 40" className="note" aria-hidden="true">
    <ellipse cx="10" cy="30" rx="7" ry="4.5" transform="rotate(-18 10 30)" fill={value > 2 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" />
    {value > 1 && <path d="M16 29V5" fill="none" stroke="currentColor" strokeWidth="2" />}
    {Array.from({ length: flags }, (_, i) => <path key={i} d={`M16 ${6 + i * 6} C17 ${12 + i * 6}, 28 ${10 + i * 6}, 24 ${19 + i * 6}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />)}
  </svg>;
}

function App() {
  const [state, setState] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mounted = useRef(true);
  const command = async (action: string, extra = {}) => {
    try { await invoke('audio_command', { action, ...extra }); setError(null); }
    catch (error) { setError(String(error)); }
  };
  const tap = () => {
    setFlash(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(false), 100);
    void command('tap');
  };
  useEffect(() => {
    mounted.current = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try { const next = await invoke<Snapshot>('snapshot'); if (mounted.current) setState(next); }
      catch (error) { if (mounted.current) setError(String(error)); }
      if (mounted.current) timer = setTimeout(poll, 100);
    };
    void poll();
    return () => { mounted.current = false; clearTimeout(timer); clearTimeout(flashTimer.current); };
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = (event.target as HTMLElement)?.tagName;
      if (['SELECT', 'INPUT', 'TEXTAREA', 'BUTTON'].includes(tag)) return;
      event.preventDefault(); tap();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const device = state.devices.find(device => device.uid === state.uid);
  const active = state.listening || state.starting;
  const peakDB = state.listening && Number.isFinite(state.peakDB) ? Math.max(-60, Math.min(0, state.peakDB)) : -60;
  const listenLabel = state.starting ? 'Cancel connection' : state.listening ? 'Stop listening' : 'Listen to audio';
  return <main>
    <section className="tempo-panel" aria-label="Tempo">
      <div className="routing">
        <label><span>Input</span><div className="select-wrap"><select aria-label="Audio input" value={state.uid} onChange={event => void command('select', { uid: event.target.value })}>
          {!device && <option value={state.uid}>{state.uid ? 'Input unavailable' : 'Choose input'}</option>}
          {state.devices.map(device => <option key={device.uid} value={device.uid}>{device.name}</option>)}
        </select></div></label>
        <div className="channel-line">
          <label><span>Channel</span><div className="select-wrap"><select aria-label="Input channel" disabled={!device} value={state.channel} onChange={event => void command('select', { channel: Number(event.target.value) })}>
            {Array.from({ length: device?.channels || 1 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
          </select></div></label>
          <div className="audio-monitor">
          <div className="level-meter" role="meter" aria-label={`Channel ${state.channel} input level`} aria-valuemin={-60} aria-valuemax={0} aria-valuenow={peakDB} aria-valuetext={state.listening ? `${Math.round(peakDB)} dBFS` : 'Audio off'}>
            <span style={{ transform: `scaleX(${(peakDB + 60) / 60})`, background: peakDB >= -3 ? 'var(--coral)' : peakDB >= -12 ? '#d19a3c' : '#4f9870' }} />
          </div>
          <button className={`listen ${active ? 'active' : ''}`} disabled={!device && !active} onClick={() => void command(active ? 'stop' : 'start')} aria-label={listenLabel} title={listenLabel} aria-pressed={active}>
            <svg viewBox="0 0 20 20" aria-hidden="true">{active ? <rect x="5" y="5" width="10" height="10" rx="1" /> : <path d="M7 4L15 10L7 16Z" />}</svg>
          </button>
          </div>
        </div>
      </div>
      <div className="dial-area">
        <button className={`dial ${flash ? 'tapped' : ''}`} aria-label="Tap tempo" onPointerDown={event => { if (event.button === 0) { event.preventDefault(); event.currentTarget.focus(); tap(); } }} onClick={event => { if (event.detail === 0) tap(); }}>
          <span className="bpm">{state.bpm == null ? '—' : Math.round(state.bpm)}</span>
          <span className="bpm-label">BPM</span>
          <span className="tap-label">TAP</span>
        </button>
        <span className={`status ${state.manual ? 'manual' : ''}`} role="status"><i />{state.status}</span>
      </div>
      <p className="error" role="alert">{error || state.error || ''}</p>
    </section>
    <section className="notes-panel" aria-label="Note lengths">
      <div className="notes-heading"><span>NOTE LENGTHS</span><span>MILLISECONDS</span></div>
      <dl>{notes.map(([denominator, name]) => <div className="note-row" key={denominator}>
        <dt><Note value={denominator} /><span>{name}</span></dt>
        <dd>{state.pulse == null ? '—' : (state.pulse * 4 / denominator).toFixed(2)}<span className="unit"> ms</span></dd>
      </div>)}</dl>
    </section>
  </main>;
}

createRoot(document.getElementById('root')!).render(<App />);
