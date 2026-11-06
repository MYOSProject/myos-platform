import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, errText } from '../api';
import { drawWatermark, loadImage, loadWatermarkLogo, luminance } from '../graphic';
import { Alert, TONES } from '../components/ui';
import { uploadVideo } from '../videoUpload';

// Edición automática con IA: la persona sube su video y la IA lo edita con la marca del negocio
// (logo, colores y tipo de letra): apertura, subtítulos de lo que se dice, recorte al formato y cierre.
// El video se procesa en el navegador; al servidor solo viajan fotogramas pequeños y el audio en mono para entenderlo.
const FORMATS = { '9:16': [720, 1280, 'Vertical 9:16'], '4:5': [864, 1080, 'Vertical 4:5'], '1:1': [900, 900, 'Cuadrado 1:1'], '16:9': [1280, 720, 'Horizontal 16:9'] };
const FONTS = {
  moderna: { label: 'Moderna', css: (px) => `800 ${px}px "Plus Jakarta Sans", Inter, Arial, sans-serif` },
  elegante: { label: 'Elegante', css: (px) => `700 ${px}px Georgia, "Times New Roman", serif` },
  fuerte: { label: 'Fuerte', css: (px) => `900 ${px}px Impact, "Arial Black", Arial, sans-serif` }
};
const INTRO = 2.5; const OUTRO = 3;
const MAX_MB = 300; const MAX_SEC = 120;
const BRAND0 = { primary: '#111827', secondary: '#E2554F', accent: '#8CCFD9' };

const seek = (v, t) => new Promise((res) => {
  const done = () => { v.removeEventListener('seeked', done); res(); };
  v.addEventListener('seeked', done);
  v.currentTime = Math.min(Math.max(0, t), Math.max(0, (v.duration || t) - 0.05));
  setTimeout(done, 3000);
});

function wrap(ctx, text, maxW) {
  const out = []; let line = '';
  for (const w of String(text || '').split(/\s+/).filter(Boolean)) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

async function extractAudio(file) {
  if (file.size > 200 * 1024 * 1024) return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AC || !OAC) return null;
  const ac = new AC();
  try {
    const decoded = await ac.decodeAudioData(await file.arrayBuffer());
    const sr = 16000;
    const off = new OAC(1, Math.max(1, Math.ceil(decoded.duration * sr)), sr);
    const src = off.createBufferSource(); src.buffer = decoded; src.connect(off.destination); src.start();
    const pcm = (await off.startRendering()).getChannelData(0);
    let sum = 0; for (let i = 0; i < pcm.length; i += 7) sum += pcm[i] * pcm[i];
    if (Math.sqrt(sum / (pcm.length / 7)) < 0.003) return null; // sin audio útil
    const buf = new ArrayBuffer(44 + pcm.length * 2); const dv = new DataView(buf);
    const str = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
    str(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length * 2, true); str(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); str(36, 'data'); dv.setUint32(40, pcm.length * 2, true);
    for (let i = 0; i < pcm.length; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, pcm[i])) * 0x7fff, true);
    const bytes = new Uint8Array(buf); let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  } catch { return null; } finally { ac.close().catch(() => {}); }
}

// Música de fondo generada en el navegador (sin derechos de autor). También se puede subir un archivo propio.
const PRESETS = { suave: 'Suave', animada: 'Animada', inspiradora: 'Inspiradora' };
async function renderPreset(kind) {
  const sr = 44100; const dur = 16;
  const oc = new OfflineAudioContext(2, sr * dur, sr);
  const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = kind === 'animada' ? 2600 : 1800;
  const master = oc.createGain(); master.gain.value = 0.55; lp.connect(master); master.connect(oc.destination);
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);
  const note = (m, t0, len, type, vol, atk = 0.04, rel = 0.25) => {
    const o = oc.createOscillator(); o.type = type; o.frequency.value = hz(m);
    const g = oc.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + atk); g.gain.setValueAtTime(vol, Math.max(t0 + atk, t0 + len - rel)); g.gain.linearRampToValueAtTime(0, t0 + len);
    o.connect(g); g.connect(lp); o.start(t0); o.stop(t0 + len + 0.05);
  };
  const noise = (t0, len, vol) => {
    const b = oc.createBuffer(1, Math.ceil(sr * len), sr); const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    const n = oc.createBufferSource(); n.buffer = b; const g = oc.createGain(); g.gain.value = vol; const hp = oc.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000; n.connect(hp); hp.connect(g); g.connect(master); n.start(t0);
  };
  const kick = (t0) => { const o = oc.createOscillator(); o.frequency.setValueAtTime(130, t0); o.frequency.exponentialRampToValueAtTime(45, t0 + 0.12); const g = oc.createGain(); g.gain.setValueAtTime(0.9, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.28); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + 0.3); };
  const prog = kind === 'inspiradora' ? [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]] : [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]];
  prog.forEach((ch, i) => {
    const t = i * 4;
    if (kind === 'suave') { ch.forEach((m) => note(m, t, 4, 'triangle', 0.16, 0.9, 0.9)); note(ch[0] - 24, t, 4, 'sine', 0.3, 0.3, 0.6); }
    else if (kind === 'inspiradora') {
      ch.forEach((m) => note(m - 12, t, 4, 'triangle', 0.1, 0.8, 0.8)); note(ch[0] - 24, t, 4, 'sine', 0.26, 0.3, 0.6);
      for (let k = 0; k < 8; k++) note(ch[k % 3] + 12 + (k % 6 > 2 ? 12 : 0), t + k * 0.5, 0.9, 'sine', 0.13, 0.01, 0.8);
    } else {
      for (let k = 0; k < 8; k++) { const bt = t + k * 0.5; kick(bt); noise(bt + 0.25, 0.06, 0.18); note(ch[0] - 24, bt, 0.4, 'sawtooth', 0.2, 0.01, 0.15); note(ch[k % 3] + 12, bt + 0.25, 0.22, 'square', 0.05, 0.005, 0.1); }
    }
  });
  return oc.startRendering();
}

const pickMime = () => ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => window.MediaRecorder?.isTypeSupported?.(m)) || '';

export default function AutoVideo({ profile, plan, setPage }) {
  const brand = { ...BRAND0, ...(profile?.brand_colors || {}) };
  const watermark = plan !== 'pro';
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState(null);
  const [format, setFormat] = useState('9:16');
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState('');
  const [stage, setStage] = useState('idle'); // idle | reading | thinking | ready
  const [edit, setEdit] = useState(null);
  const [opts, setOpts] = useState({ intro: true, outro: true, captions: true, logo: true });
  const [view, setView] = useState('main');
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [pct, setPct] = useState(0);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [t, setT] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fs, setFs] = useState(false);
  const [mix, setMix] = useState({ voice: 100, music: 25 });
  const [music, setMusic] = useState({ kind: 'none', name: '', buffer: null });
  const [musicBusy, setMusicBusy] = useState(false);
  const [pub, setPub] = useState({ nets: { facebook: true, instagram: true, linkedin: false, x: false }, topic: '', busy: '', pct: 0, done: null, url: '', storage: null });
  const playerRef = useRef(null);
  const recRef = useRef(false);
  const musicRef = useRef(null);
  const canvasRef = useRef(null);
  const vref = useRef(null);
  const audioRef = useRef(null);
  const logoRef = useRef(null);
  const runRef = useRef(0);
  const [W, H] = FORMATS[format];
  const st = useRef({});
  st.current = { edit, opts, brand, profile, format, W, H, watermark };

  useEffect(() => { loadImage(profile?.logo).then((i) => { logoRef.current = i; draw(); }); loadWatermarkLogo(); }, [profile?.logo]); // eslint-disable-line
  useEffect(() => () => { runRef.current++; if (vref.current?.src) URL.revokeObjectURL(vref.current.src); }, []);

  // ---------------------------------------------------------------- dibujo
  const lumDark = (hex) => luminance(hex) < 0.45;
  const logoBadge = (ctx, x, y, h, alignRight = false) => {
    const lg = logoRef.current; if (!lg) return 0;
    const w = (lg.width / lg.height) * h; const p = h * 0.28;
    const bx = alignRight ? x - w - p * 2 : x;
    ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.beginPath(); ctx.roundRect(bx, y, w + p * 2, h + p * 2, (h + p * 2) / 4); ctx.fill();
    ctx.drawImage(lg, bx + p, y + p, w, h);
    return w + p * 2;
  };
  const card = (ctx, kind, alpha = 1) => {
    const { edit: e, brand: c, profile: pf, W: w, H: h } = st.current;
    const font = FONTS[e.font] || FONTS.moderna;
    const dark = lumDark(c.primary); const fg = dark ? '#FFFFFF' : '#111827';
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = c.primary; ctx.fillRect(0, 0, w, h);
    const s = Math.min(w, h);
    ctx.save(); ctx.translate(w, h); ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = c.accent; ctx.fillRect(-s * 0.24, -s * 0.6, s * 0.1, s * 1.4);
    ctx.fillStyle = c.secondary; ctx.fillRect(-s * 0.4, -s * 0.6, s * 0.13, s * 1.4);
    ctx.restore();
    const pad = w * 0.09;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillStyle = fg;
    const lh = Math.round(s * 0.085);
    logoBadge(ctx, pad, pad, Math.round(s * 0.07));
    const main = kind === 'intro' ? e.title : e.cta;
    const sub = kind === 'intro' ? e.subtitle : [pf?.business_name, pf?.website, pf?.phone].filter(Boolean).join(' · ');
    const size = Math.round(s * (kind === 'intro' ? 0.085 : 0.095));
    ctx.font = font.css(size);
    const lines = wrap(ctx, main, w - pad * 2 - s * 0.1);
    const total = lines.length * size * 1.15;
    let y = (h - total) / 2 - (sub ? s * 0.03 : 0);
    lines.forEach((l) => { ctx.fillText(l, pad, y); y += size * 1.15; });
    ctx.fillStyle = c.accent; ctx.fillRect(pad, y + s * 0.015, s * 0.14, Math.max(4, s * 0.008));
    if (sub) { ctx.fillStyle = dark ? 'rgba(255,255,255,.85)' : 'rgba(17,24,39,.8)'; ctx.font = `500 ${Math.round(s * 0.036)}px Inter, Arial, sans-serif`; wrap(ctx, sub, w - pad * 2 - s * 0.1).slice(0, 3).forEach((l, i) => ctx.fillText(l, pad, y + s * 0.05 + i * s * 0.05)); }
    ctx.restore();
  };
  const frame = (ctx, tNow) => {
    const { edit: e, opts: o, brand: c, W: w, H: h } = st.current;
    const v = vref.current;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);
    if (v && v.readyState >= 2 && v.videoWidth) {
      const k = Math.max(w / v.videoWidth, h / v.videoHeight);
      const dw = v.videoWidth * k; const dh = v.videoHeight * k;
      const dx = -Math.min(Math.max(dw * e.focus_x - w / 2, 0), Math.max(0, dw - w));
      ctx.drawImage(v, dx, (h - dh) / 2, dw, dh);
    }
    const s = Math.min(w, h);
    if (o.logo) logoBadge(ctx, s * 0.04, s * 0.04, Math.round(s * 0.05));
    if (o.captions) {
      const cap = e.captions.find((x) => tNow >= x.start && tNow < x.end);
      if (cap) {
        const size = Math.round(s * 0.058);
        ctx.font = FONTS[e.font].css(size); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        const lines = wrap(ctx, cap.text, w * 0.84).slice(0, 3);
        const bh = lines.length * size * 1.2 + size * 0.7; const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + size * 1.1;
        const by = h * (w < h ? 0.7 : 0.8) - bh / 2;
        ctx.fillStyle = `${c.primary}E6`; ctx.beginPath(); ctx.roundRect((w - bw) / 2, by, bw, bh, size * 0.35); ctx.fill();
        ctx.fillStyle = c.accent; ctx.fillRect((w - bw) / 2 + size * 0.25, by + bh - size * 0.12, bw - size * 0.5, Math.max(3, size * 0.07));
        ctx.fillStyle = lumDark(c.primary) ? '#FFFFFF' : '#111827';
        lines.forEach((l, i) => ctx.fillText(l, w / 2, by + size * 0.35 + i * size * 1.2));
      }
    }
    const span = Math.max(0.1, e.trim_end - e.trim_start);
    ctx.fillStyle = c.secondary; ctx.fillRect(0, h - Math.max(6, s * 0.012), w * Math.min(1, Math.max(0, (tNow - e.trim_start) / span)), Math.max(6, s * 0.012));
  };
  const draw = useCallback((phase = view) => {
    const cv = canvasRef.current; const { edit: e, watermark: wm, W: w, H: h } = st.current; if (!cv || !e) return;
    const ctx = cv.getContext('2d');
    if (phase === 'intro') card(ctx, 'intro'); else if (phase === 'outro') card(ctx, 'outro'); else frame(ctx, vref.current?.currentTime ?? e.trim_start);
    if (wm) drawWatermark(ctx, w, h);
  }, [view]); // eslint-disable-line

  // ---------------------------------------------------------------- subir y analizar
  const onFile = (f) => {
    setErr(''); setNote(''); setResult(null); setEdit(null); setStage('idle');
    if (!f) return;
    if (!f.type.startsWith('video/')) return setErr('Elige un archivo de video (mp4, mov o webm).');
    if (f.size > MAX_MB * 1024 * 1024) return setErr(`El video pesa más de ${MAX_MB} MB. Usa uno más corto o comprimido.`);
    if (vref.current?.src) URL.revokeObjectURL(vref.current.src);
    const v = document.createElement('video'); v.playsInline = true; v.preload = 'auto'; v.src = URL.createObjectURL(f);
    v.onloadedmetadata = () => {
      if (v.duration > MAX_SEC) { setErr(`El video dura ${Math.round(v.duration)} s. Para videos cortos el máximo es ${MAX_SEC} s (2 minutos).`); return; }
      if (v.duration < 3) { setErr('El video es muy corto (mínimo 3 segundos).'); return; }
      vref.current = v; audioRef.current = null; setFile(f); setMeta({ duration: v.duration, w: v.videoWidth, h: v.videoHeight });
    };
    v.onerror = () => setErr('No se pudo leer ese video. Prueba con otro formato (mp4 suele funcionar mejor).');
  };

  const analyze = async () => {
    const v = vref.current; if (!v || !file) return;
    setErr(''); setNote(''); setResult(null); setStage('reading');
    try {
      const n = Math.min(8, Math.max(4, Math.ceil(meta.duration / 8)));
      const frames = []; const tmp = document.createElement('canvas'); const tw = 480; tmp.width = tw; tmp.height = Math.round(tw * (v.videoHeight / v.videoWidth)) || 270;
      for (let i = 0; i < n; i++) {
        const t = ((i + 0.5) / n) * meta.duration; await seek(v, t);
        tmp.getContext('2d').drawImage(v, 0, 0, tmp.width, tmp.height);
        frames.push({ t, data: tmp.toDataURL('image/jpeg', 0.6) });
      }
      const audio = await extractAudio(file);
      setStage('thinking');
      const r = await api('POST', '/api/video/autoedit', { duration: meta.duration, frames, audio_b64: audio || undefined, brief, format, tone: tone || undefined });
      setEdit(r.plan); setView('main'); setT(0); setStage('ready');
      setNote(`${r.plan.summary || 'La IA preparó tu video.'} ${r.plan.heard_speech ? 'Escuché lo que se dice y puse subtítulos.' : 'No escuché a nadie hablando, así que no hay subtítulos.'} Revisa y ajusta lo que quieras.`);
    } catch (e) { setErr(errText(e)); setStage('idle'); }
  };


  // ---------------------------------------------------------------- línea de tiempo (apertura + video + cierre)
  const tl = useMemo(() => {
    if (!edit) return { intro: 0, main: 0, outro: 0, total: 0 };
    const intro = opts.intro ? INTRO : 0; const outro = opts.outro ? OUTRO : 0; const main = Math.max(0.1, edit.trim_end - edit.trim_start);
    return { intro, main, outro, total: intro + main + outro };
  }, [edit, opts]);
  const phaseAt = (T) => (T < tl.intro ? { ph: 'intro', local: T } : T < tl.intro + tl.main ? { ph: 'main', local: T - tl.intro } : { ph: 'outro', local: T - tl.intro - tl.main });

  const stillAt = useCallback(async (T) => {
    const e = st.current.edit; if (!e || !canvasRef.current) return;
    const tt = st.current.tl; const intro = tt.intro; const main = tt.main;
    if (T < intro) draw('intro'); else if (T < intro + main) { if (vref.current) await seek(vref.current, e.trim_start + (T - intro)); draw('main'); } else draw('outro');
  }, [draw]); // eslint-disable-line
  st.current.tl = tl;
  // Cuando no se reproduce, el lienzo muestra el instante elegido (y se actualiza al cambiar ajustes).
  useEffect(() => { if (edit && !playing && !exporting) stillAt(Math.min(t, Math.max(0, tl.total - 0.01))); }, [edit, opts, format, watermark, stage, t]); // eslint-disable-line

  // ---------------------------------------------------------------- audio: tu video + música de fondo
  const ensureAudio = () => {
    if (audioRef.current) return audioRef.current;
    const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC();
    const src = ac.createMediaElementSource(vref.current);
    const voice = ac.createGain(); const musicG = ac.createGain(); const master = ac.createGain(); const dest = ac.createMediaStreamDestination();
    src.connect(voice); voice.connect(master); voice.connect(dest); musicG.connect(master); musicG.connect(dest); master.connect(ac.destination);
    audioRef.current = { ac, voice, musicG, master, dest }; return audioRef.current;
  };
  const applyGains = useCallback(() => {
    const a = audioRef.current; if (!a) return;
    a.voice.gain.value = mix.voice / 100; a.musicG.gain.value = mix.music / 100;
    a.master.gain.value = recRef.current || muted ? 0 : vol;
  }, [mix, muted, vol]);
  useEffect(() => { applyGains(); if (vref.current) vref.current.volume = 1; }, [applyGains]);
  const stopMusic = () => { try { musicRef.current?.stop(); } catch { /* ya detenida */ } musicRef.current = null; };
  const startMusic = (T0, total) => {
    stopMusic(); const a = audioRef.current; const buf = st.current.music.buffer; if (!a || !buf) return;
    const src = a.ac.createBufferSource(); src.buffer = buf; src.loop = true; src.connect(a.musicG);
    const g = st.current.mix.music / 100; const now = a.ac.currentTime; const left = Math.max(0.1, total - T0);
    a.musicG.gain.cancelScheduledValues(now); a.musicG.gain.setValueAtTime(g, now);
    a.musicG.gain.setValueAtTime(g, now + Math.max(0, left - 1.5)); a.musicG.gain.linearRampToValueAtTime(0, now + left);
    src.start(0, T0 % buf.duration); musicRef.current = src;
  };
  st.current.music = music; st.current.mix = mix;

  const pickMusicPreset = async (kind) => {
    if (kind === 'none') { setMusic({ kind: 'none', name: '', buffer: null }); return; }
    setMusicBusy(true); setErr('');
    try { setMusic({ kind, name: PRESETS[kind], buffer: await renderPreset(kind) }); } catch { setErr('No se pudo preparar la música en este navegador.'); } finally { setMusicBusy(false); }
  };
  const onMusicFile = async (f) => {
    if (!f) return;
    if (!f.type.startsWith('audio/')) return setErr('Elige un archivo de audio (mp3, m4a o wav).');
    if (f.size > 30 * 1024 * 1024) return setErr('La canción pesa más de 30 MB.');
    setMusicBusy(true); setErr('');
    const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC();
    try { setMusic({ kind: 'file', name: f.name, buffer: await ac.decodeAudioData(await f.arrayBuffer()) }); } catch { setErr('No se pudo leer esa canción. Prueba con un mp3 o wav.'); } finally { ac.close().catch(() => {}); setMusicBusy(false); }
  };

  // ---------------------------------------------------------------- reproducir y exportar
  const run = async (record, T0, onProgress) => {
    const id = ++runRef.current; const { edit: e } = st.current; const tt = st.current.tl; const v = vref.current; const ctx = canvasRef.current.getContext('2d');
    const a = ensureAudio(); await a.ac.resume(); recRef.current = record; applyGains();
    const alive = () => runRef.current === id;
    const paint = (ph, tv) => { if (ph === 'main') frame(ctx, tv); else card(ctx, ph); if (st.current.watermark) drawWatermark(ctx, st.current.W, st.current.H); };
    startMusic(T0, tt.total);
    const timed = (ph, from, len, base) => new Promise((res) => { const t0 = performance.now(); const f = (now) => { if (!alive()) return res(false); const el = from + (now - t0) / 1000; paint(ph); onProgress?.(base + Math.min(el, len)); if (el >= len) return res(true); requestAnimationFrame(f); }; requestAnimationFrame(f); });
    let ok = true;
    try {
      if (tt.intro && T0 < tt.intro) ok = await timed('intro', T0, tt.intro, 0);
      if (ok && T0 < tt.intro + tt.main) {
        const off = Math.max(0, T0 - tt.intro);
        await seek(v, e.trim_start + off); await v.play().catch(() => {});
        ok = await new Promise((res) => { const f = () => { if (!alive()) return res(false); const tv = v.currentTime; paint('main', tv); onProgress?.(tt.intro + Math.max(0, tv - e.trim_start)); if (tv >= e.trim_end - 0.05 || v.ended) return res(true); requestAnimationFrame(f); }; requestAnimationFrame(f); });
        v.pause();
      }
      if (ok && tt.outro) ok = await timed('outro', Math.max(0, T0 - tt.intro - tt.main), tt.outro, tt.intro + tt.main);
    } finally { if (alive()) { stopMusic(); v.pause(); } recRef.current = false; applyGains(); }
    return ok && alive();
  };

  const startAt = async (T0) => {
    setPlaying(true); setResult(null);
    const done = await run(false, T0, (T) => setT(T));
    if (done) { setPlaying(false); setT(0); } else if (runRef.current && !st.current.restarting) setPlaying(false);
  };
  const stop = () => { runRef.current++; stopMusic(); vref.current?.pause(); setPlaying(false); };
  const togglePlay = () => { if (exporting) return; if (playing) stop(); else startAt(t >= tl.total - 0.1 ? 0 : t); };
  const seekTo = (T) => {
    setT(T);
    if (playing) { st.current.restarting = true; runRef.current++; stopMusic(); vref.current?.pause(); setTimeout(() => { st.current.restarting = false; startAt(T); }, 30); }
  };
  const toggleFs = () => { if (document.fullscreenElement) document.exitFullscreen?.(); else playerRef.current?.requestFullscreen?.(); };
  useEffect(() => { const h = () => setFs(Boolean(document.fullscreenElement)); document.addEventListener('fullscreenchange', h); return () => document.removeEventListener('fullscreenchange', h); }, []);
  const onKey = (e) => {
    if (e.target.tagName === 'INPUT' && e.target.type !== 'range') return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); togglePlay(); }
    else if (e.key === 'm') setMuted((m) => !m);
    else if (e.key === 'f') toggleFs();
    else if (e.key === 'ArrowRight') { e.preventDefault(); seekTo(Math.min(tl.total - 0.05, t + 5)); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); seekTo(Math.max(0, t - 5)); }
  };

  const exportVideo = async () => {
    setErr(''); setResult(null); setPub((p) => ({ ...p, done: null, url: '' }));
    if (!window.MediaRecorder || !canvasRef.current.captureStream) return setErr('Tu navegador no puede exportar video. Usa Chrome o Edge actualizado.');
    if (playing) stop();
    setExporting(true); setPct(0);
    try {
      const a = ensureAudio(); const stream = canvasRef.current.captureStream(30);
      a.dest.stream.getAudioTracks().forEach((tr) => stream.addTrack(tr));
      const mime = pickMime(); const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 5_000_000 } : undefined);
      const chunks = []; rec.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
      const stopped = new Promise((r) => { rec.onstop = r; });
      rec.start(250);
      const ok = await run(true, 0, (T) => { setT(T); setPct(Math.round((T / tl.total) * 100)); });
      await new Promise((r) => setTimeout(r, 250)); rec.stop(); await stopped;
      if (ok) { const type = rec.mimeType || mime || 'video/webm'; const blob = new Blob(chunks, { type }); setResult({ blob, url: URL.createObjectURL(blob), ext: type.includes('mp4') ? 'mp4' : 'webm', mb: (blob.size / 1048576).toFixed(1) }); }
    } catch (e) { setErr(`No se pudo exportar: ${e?.message || e}`); } finally { setExporting(false); setT(0); }
  };

  // ---------------------------------------------------------------- publicar en las redes
  useEffect(() => { if (result && !pub.storage) api('GET', '/api/video/storage').then((s) => setPub((p) => ({ ...p, storage: s }))).catch(() => setPub((p) => ({ ...p, storage: { provider: 'off' } }))); }, [result]); // eslint-disable-line
  useEffect(() => { if (edit && !pub.topic) setPub((p) => ({ ...p, topic: [edit.title, brief].filter(Boolean).join('. ') })); }, [edit]); // eslint-disable-line
  const NETS = [
    ['facebook', 'Facebook', 'Se publica como video en tu página.'],
    ['instagram', 'Instagram', 'Se publica como Reel.'],
    ['linkedin', 'LinkedIn', 'Sale por tu conexión (Make o Zapier).'],
    ['x', 'X', 'Se prepara el texto; el video se sube a mano por ahora.']
  ];
  const publish = async () => {
    const chosen = Object.entries(pub.nets).filter(([, on]) => on).map(([k]) => k);
    if (!chosen.length) return setErr('Elige al menos una red.');
    if (!pub.topic.trim()) return setErr('Cuéntame de qué trata para escribir los textos.');
    setErr(''); setPub((p) => ({ ...p, busy: 'upload', pct: 0, done: null }));
    try {
      const url = pub.url || await uploadVideo(result.blob, result.ext, (n) => setPub((p) => ({ ...p, pct: n })));
      setPub((p) => ({ ...p, url, busy: 'posts' }));
      const posts = await api('POST', '/api/create/posts', { platforms: chosen, topic: pub.topic, tone: tone || undefined });
      for (const p of posts) await api('PUT', `/api/social/${p.id}`, { video_url: url, video_name: edit.title.slice(0, 100) });
      setPub((p) => ({ ...p, busy: '', done: posts.length }));
    } catch (e) { setErr(errText(e)); setPub((p) => ({ ...p, busy: '' })); }
  };

  const fmtT = (x) => { const s = Math.max(0, Math.floor(x)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  const setE = (p) => setEdit((x) => ({ ...x, ...p }));
  const setCap = (i, text) => setEdit((x) => ({ ...x, captions: x.captions.map((c, k) => (k === i ? { ...c, text: text.slice(0, 70) } : c)) }));
  const portrait = H >= W;
  const busy = stage === 'reading' || stage === 'thinking';
  const jump = (k) => { setView(k); seekTo(k === 'intro' ? 0 : k === 'main' ? tl.intro : tl.intro + tl.main); };
  const effVol = muted ? 0 : vol;

  return (
    <div className="stack">
      <div className="card stack">
        <h2>1. Sube tu video</h2>
        <p className="muted">Grábalo como siempre (con un cliente, en tu negocio, para un blog). La IA ya conoce tu marca y lo edita por ti.</p>
        <div className="brand-know" aria-label="Lo que la IA sabe de tu marca">
          <span className="muted">La IA usa tu marca:</span>
          {profile?.logo ? <img src={profile.logo} alt="Tu logo" className="brand-logo" /> : <span className="tag draft">Sin logo</span>}
          {[brand.primary, brand.secondary, brand.accent].map((c) => <span key={c} className="vid-sw on" style={{ background: c, cursor: 'default' }} title={c} />)}
          <span className="muted">{profile?.business_name || 'Tu negocio'}</span>
          {(!profile?.logo || !profile?.brand_colors) && <span className="muted">· Completa el logo y los colores en «Empezar» para que se vea aún mejor.</span>}
        </div>
        <input type="file" accept="video/*" aria-label="Elegir video" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
        {meta && <p className="muted">{file.name} · {Math.round(meta.duration)} s · {(file.size / 1048576).toFixed(1)} MB</p>}
        <div className="net-tabs" role="radiogroup" aria-label="Formato del video">
          {Object.entries(FORMATS).map(([k, f]) => <button key={k} type="button" role="radio" aria-checked={format === k} className={`net-tab${format === k ? ' on' : ''}`} onClick={() => setFormat(k)}>{f[2]}</button>)}
        </div>
        <div className="row">
          <input className="grow" type="text" maxLength={300} value={brief} onChange={(e) => setBrief(e.target.value)} placeholder="Opcional: ¿de qué trata? Ej.: testimonio de un cliente sobre su sitio nuevo" aria-label="De qué trata el video" />
          <select value={tone} onChange={(e) => setTone(e.target.value)} aria-label="Tono"><option value="">Tono automático</option>{TONES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <button className="btn" disabled={!file || busy || exporting} onClick={analyze}>{stage === 'reading' ? 'Leyendo el video…' : stage === 'thinking' ? 'La IA lo está editando…' : '✨ Editar con IA'}</button>
        </div>
        {busy && <p className="muted" role="status">{stage === 'reading' ? 'Sacando fotogramas y el audio (se queda en tu computadora)…' : 'La IA está viendo y escuchando tu video; puede tardar hasta un minuto.'}</p>}
      </div>

      {edit && (
        <div className="vid-wrap">
          <div className="card stack vid-left">
            <h2>2. Resultado</h2>
            <div className="net-tabs" role="tablist" aria-label="Parte del video">
              {[['intro', 'Apertura'], ['main', 'Tu video'], ['outro', 'Cierre']].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={view === k} className={`net-tab${view === k ? ' on' : ''}`} disabled={exporting || (k === 'intro' && !opts.intro) || (k === 'outro' && !opts.outro)} onClick={() => jump(k)}>{l}</button>)}
            </div>
            <div className={`vp${fs ? ' fs' : ''}`} ref={playerRef} tabIndex={0} onKeyDown={onKey} aria-label="Reproductor del video editado">
              <div className="vp-screen" onClick={togglePlay}>
                <canvas ref={canvasRef} width={W} height={H} style={{ aspectRatio: `${W} / ${H}`, maxHeight: fs ? 'calc(100vh - 64px)' : (portrait ? '74vh' : '60vh'), maxWidth: '100%' }} aria-label="Vista previa del video editado" />
                {!playing && !exporting && <span className="vp-big" aria-hidden="true">▶</span>}
              </div>
              <div className="vp-bar">
                <input className="vp-seek" type="range" min="0" max={tl.total} step="0.05" value={Math.min(t, tl.total)} disabled={exporting} onChange={(e) => seekTo(Number(e.target.value))} aria-label="Posición del video" style={{ '--p': `${tl.total ? (Math.min(t, tl.total) / tl.total) * 100 : 0}%` }} />
                <div className="vp-ctl">
                  <button type="button" className="vp-b" disabled={exporting} onClick={togglePlay} aria-label={playing ? 'Pausar' : 'Reproducir'}>{playing ? '❚❚' : '▶'}</button>
                  <button type="button" className="vp-b" onClick={() => setMuted((m) => !m)} aria-label={effVol === 0 ? 'Activar sonido' : 'Silenciar'}>{effVol === 0 ? '🔇' : effVol < 0.5 ? '🔉' : '🔊'}</button>
                  <input className="vp-vol" type="range" min="0" max="1" step="0.05" value={effVol} onChange={(e) => { setVol(Number(e.target.value)); setMuted(false); }} aria-label="Volumen" style={{ '--p': `${effVol * 100}%` }} />
                  <span className="vp-time">{fmtT(t)} / {fmtT(tl.total)}</span>
                  <span className="grow" />
                  <button type="button" className="vp-b" onClick={toggleFs} aria-label={fs ? 'Salir de pantalla completa' : 'Pantalla completa'}>{fs ? '⤡' : '⤢'}</button>
                </div>
              </div>
            </div>
            <p className="muted vp-hint">Espacio: reproducir · M: silencio · F: pantalla completa · ← →: saltar 5 s. {watermark && 'Con el plan Gratis lleva la marca de agua de MYOSAPP; con Pro sale limpio.'}</p>

            <div className="vid-music">
              <b>🎵 Música de fondo</b>
              <div className="row">
                <select value={music.kind === 'file' ? 'file' : music.kind} onChange={(e) => e.target.value !== 'file' && pickMusicPreset(e.target.value)} aria-label="Música de fondo" disabled={musicBusy || exporting}>
                  <option value="none">Sin música</option>
                  {Object.entries(PRESETS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  {music.kind === 'file' && <option value="file">Tu canción: {music.name}</option>}
                </select>
                <label className="btn secondary small" style={{ cursor: 'pointer' }}>Usar mi canción<input type="file" accept="audio/*" hidden onChange={(e) => { onMusicFile(e.target.files?.[0]); e.target.value = ''; }} /></label>
                {musicBusy && <span className="muted" role="status">Preparando…</span>}
              </div>
              {music.buffer && (
                <div className="row">
                  <div className="field grow"><label htmlFor="mv">Tu voz: {mix.voice}%</label><input id="mv" type="range" min="0" max="100" value={mix.voice} onChange={(e) => setMix({ ...mix, voice: Number(e.target.value) })} /></div>
                  <div className="field grow"><label htmlFor="mm">Música: {mix.music}%</label><input id="mm" type="range" min="0" max="100" value={mix.music} onChange={(e) => setMix({ ...mix, music: Number(e.target.value) })} /></div>
                </div>
              )}
              <small className="muted">Las melodías incluidas son propias y libres de derechos. Si subes una canción, asegúrate de tener permiso para usarla.</small>
            </div>

            <div className="row">
              <button className="btn navy" disabled={exporting} onClick={exportVideo}>{exporting ? `Grabando… ${pct}%` : '⬇ Exportar video'}</button>
              {exporting && <span className="muted">No cambies de pestaña mientras se graba.</span>}
            </div>
            {result && <Alert kind="ok">Listo ({result.mb} MB). <a className="btn small" href={result.url} download={`myos-video-${new Date().toISOString().slice(0, 10)}.${result.ext}`}>Descargar .{result.ext}</a></Alert>}
          </div>

          <div className="stack">
            <div className="card stack vid-adj">
              <h2>3. Ajusta lo que quieras</h2>
              <div className="field"><label htmlFor="at">Título de la apertura</label><input id="at" type="text" maxLength={50} value={edit.title} onChange={(e) => setE({ title: e.target.value })} /></div>
              <div className="row">
                <div className="field grow"><label htmlFor="as">Frase de apoyo</label><input id="as" type="text" maxLength={60} value={edit.subtitle} onChange={(e) => setE({ subtitle: e.target.value })} /></div>
                <div className="field grow"><label htmlFor="ac">Llamado del cierre</label><input id="ac" type="text" maxLength={40} value={edit.cta} onChange={(e) => setE({ cta: e.target.value })} /></div>
              </div>
              <div className="row">
                <label className="check"><input type="checkbox" checked={opts.intro} onChange={(e) => { setOpts({ ...opts, intro: e.target.checked }); if (!e.target.checked && view === 'intro') setView('main'); }} />Apertura</label>
                <label className="check"><input type="checkbox" checked={opts.outro} onChange={(e) => { setOpts({ ...opts, outro: e.target.checked }); if (!e.target.checked && view === 'outro') setView('main'); }} />Cierre</label>
                <label className="check"><input type="checkbox" checked={opts.captions} onChange={(e) => setOpts({ ...opts, captions: e.target.checked })} />Subtítulos</label>
                <label className="check"><input type="checkbox" checked={opts.logo} onChange={(e) => setOpts({ ...opts, logo: e.target.checked })} />Logo</label>
              </div>
              <div className="seg" role="group" aria-label="Tipo de letra">{Object.entries(FONTS).map(([k, f]) => <button key={k} type="button" className={`tone-btn${edit.font === k ? ' on' : ''}`} aria-pressed={edit.font === k} onClick={() => setE({ font: k })}>{f.label}</button>)}</div>
              <details>
                <summary>Recorte y encuadre</summary>
                <div className="stack" style={{ marginTop: 8 }}>
                  <div className="field"><label>Empieza en {edit.trim_start.toFixed(1)} s</label><input type="range" min="0" max={Math.max(0, edit.trim_end - 3)} step="0.1" value={edit.trim_start} onChange={(e) => setE({ trim_start: Number(e.target.value) })} /></div>
                  <div className="field"><label>Termina en {edit.trim_end.toFixed(1)} s</label><input type="range" min={Math.min(meta.duration, edit.trim_start + 3)} max={Math.min(meta.duration, edit.trim_start + 60)} step="0.1" value={Math.min(edit.trim_end, edit.trim_start + 60)} onChange={(e) => setE({ trim_end: Number(e.target.value) })} /></div>
                  <div className="field"><label>Encuadre: {edit.focus_x < 0.35 ? 'a la izquierda' : edit.focus_x > 0.65 ? 'a la derecha' : 'al centro'}</label><input type="range" min="0" max="1" step="0.05" value={edit.focus_x} onChange={(e) => setE({ focus_x: Number(e.target.value) })} /></div>
                </div>
              </details>
              <details>
                <summary>Subtítulos ({edit.captions.length})</summary>
                {edit.captions.length === 0 && <p className="muted">No hay subtítulos: la IA no escuchó a nadie hablar.</p>}
                <div className="stack" style={{ gap: 6, marginTop: 8 }}>
                  {edit.captions.map((c, i) => (
                    <div className="row" key={i}>
                      <small className="muted" style={{ minWidth: 74 }}>{c.start.toFixed(1)}–{c.end.toFixed(1)} s</small>
                      <input className="grow" type="text" value={c.text} onChange={(e) => setCap(i, e.target.value)} aria-label={`Subtítulo ${i + 1}`} />
                      <button type="button" className="btn link small" onClick={() => setE({ captions: edit.captions.filter((_, k) => k !== i) })} aria-label={`Quitar subtítulo ${i + 1}`}>Quitar</button>
                    </div>
                  ))}
                </div>
              </details>
              <button className="btn secondary small" disabled={busy || exporting} onClick={analyze}>↻ Pedirle otra edición a la IA</button>
            </div>

            <div className="card stack">
              <h2>4. Publicar en tus redes</h2>
              {!result ? <p className="muted">Primero pulsa «Exportar video». Después lo subes aquí a las redes que elijas.</p> : (
                <>
                  {result.ext !== 'mp4' && <Alert>Tu navegador grabó el video en formato .webm. Facebook e Instagram solo aceptan .mp4: usa Chrome o Edge actualizados, o publica en LinkedIn por tu conexión.</Alert>}
                  {pub.storage?.provider === 'off' && <Alert>Falta activar el almacenamiento de videos en el servidor (BLOB_READ_WRITE_TOKEN en Vercel). Mientras tanto puedes descargar el video.</Alert>}
                  <div className="stack" style={{ gap: 6 }}>
                    {NETS.map(([k, l, d]) => (
                      <label className="check" key={k} style={{ alignItems: 'flex-start' }}>
                        <input type="checkbox" checked={Boolean(pub.nets[k])} onChange={(e) => setPub((p) => ({ ...p, nets: { ...p.nets, [k]: e.target.checked } }))} />
                        <span><b>{l}</b><br /><small className="muted">{d}</small></span>
                      </label>
                    ))}
                  </div>
                  <div className="field"><label htmlFor="pt">¿De qué trata? (la IA escribe un texto para cada red)</label><input id="pt" type="text" maxLength={300} value={pub.topic} onChange={(e) => setPub((p) => ({ ...p, topic: e.target.value }))} /></div>
                  <button className="btn" disabled={Boolean(pub.busy) || pub.storage?.provider === 'off'} onClick={publish}>
                    {pub.busy === 'upload' ? `Subiendo video… ${pub.pct}%` : pub.busy === 'posts' ? 'Preparando los textos…' : '🚀 Preparar para publicar'}
                  </button>
                  {pub.done != null && (
                    <Alert kind="ok">Listo: {pub.done} publicación(es) con tu video quedaron en Contenido. Revisa cada vista previa y pulsa «Autorizar» para que salgan. <button type="button" className="btn small" onClick={() => setPage?.('content')}>Ir a Contenido</button></Alert>
                  )}
                  <small className="muted">Por seguridad, nada se publica sin tu autorización.</small>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <Alert kind="ok">{note}</Alert>
      <Alert>{err}</Alert>
    </div>
  );
}
