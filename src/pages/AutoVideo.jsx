import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, errText } from '../api';
import { drawWatermark, loadImage, loadWatermarkLogo, luminance } from '../graphic';
import { Alert, TONES } from '../components/ui';

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

const pickMime = () => ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => window.MediaRecorder?.isTypeSupported?.(m)) || '';

export default function AutoVideo({ profile, plan }) {
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
  useEffect(() => { if (edit && !playing && !exporting) { if (view === 'main' && vref.current) seek(vref.current, edit.trim_start + Math.min(1, (edit.trim_end - edit.trim_start) / 3)).then(() => draw('main')); else draw(view); } }, [edit, opts, view, format, watermark, stage]); // eslint-disable-line

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
      setEdit(r.plan); setView('main'); setStage('ready');
      setNote(`${r.plan.summary || 'La IA preparó tu video.'} ${r.plan.heard_speech ? 'Escuché lo que se dice y puse subtítulos.' : 'No escuché a nadie hablando, así que no hay subtítulos.'} Revisa y ajusta lo que quieras.`);
    } catch (e) { setErr(errText(e)); setStage('idle'); }
  };

  // ---------------------------------------------------------------- reproducir y exportar
  const ensureAudio = () => {
    if (audioRef.current) return audioRef.current;
    const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC();
    const src = ac.createMediaElementSource(vref.current); const speaker = ac.createGain(); const dest = ac.createMediaStreamDestination();
    src.connect(speaker); speaker.connect(ac.destination); src.connect(dest);
    audioRef.current = { ac, speaker, dest }; return audioRef.current;
  };

  const run = async (record, onProgress) => {
    const id = ++runRef.current; const { edit: e, opts: o } = st.current; const v = vref.current; const cv = canvasRef.current; const ctx = cv.getContext('2d');
    const a = ensureAudio(); await a.ac.resume(); a.speaker.gain.value = record ? 0 : 1;
    const mainLen = e.trim_end - e.trim_start; const total = (o.intro ? INTRO : 0) + mainLen + (o.outro ? OUTRO : 0);
    const alive = () => runRef.current === id;
    const paint = (ph, t) => { if (ph === 'intro') card(ctx, 'intro'); else if (ph === 'outro') card(ctx, 'outro'); else frame(ctx, t); if (st.current.watermark) drawWatermark(ctx, st.current.W, st.current.H); };
    const wait = (ph, secs, tick) => new Promise((res) => { const t0 = performance.now(); const f = (now) => { if (!alive()) return res(false); const el = (now - t0) / 1000; paint(ph, el); tick?.(el); if (el >= secs) return res(true); requestAnimationFrame(f); }; requestAnimationFrame(f); });
    let done = 0;
    if (o.intro) { if (!(await wait('intro', INTRO, (el) => onProgress?.(el / total)))) return false; done = INTRO; }
    await seek(v, e.trim_start); await v.play().catch(() => {});
    const okMain = await new Promise((res) => { const f = () => { if (!alive()) return res(false); const t = v.currentTime; paint('main', t); onProgress?.((done + Math.max(0, t - e.trim_start)) / total); if (t >= e.trim_end - 0.05 || v.ended) return res(true); requestAnimationFrame(f); }; requestAnimationFrame(f); });
    v.pause(); if (!okMain) return false; done += mainLen;
    if (o.outro) { if (!(await wait('outro', OUTRO, (el) => onProgress?.((done + el) / total)))) return false; }
    return true;
  };

  const play = async () => {
    if (playing) { runRef.current++; vref.current?.pause(); setPlaying(false); return; }
    setPlaying(true); setResult(null);
    try { await run(false); } finally { setPlaying(false); draw(); }
  };
  const exportVideo = async () => {
    setErr(''); setResult(null);
    if (!window.MediaRecorder || !canvasRef.current.captureStream) return setErr('Tu navegador no puede exportar video. Usa Chrome o Edge actualizado.');
    setExporting(true); setPct(0);
    try {
      const a = ensureAudio(); const stream = canvasRef.current.captureStream(30);
      a.dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      const mime = pickMime(); const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 5_000_000 } : undefined);
      const chunks = []; rec.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
      const stopped = new Promise((r) => { rec.onstop = r; });
      rec.start(250);
      const ok = await run(true, (p) => setPct(Math.round(p * 100)));
      await new Promise((r) => setTimeout(r, 250)); rec.stop(); await stopped;
      if (ok) { const type = rec.mimeType || mime || 'video/webm'; const blob = new Blob(chunks, { type }); setResult({ url: URL.createObjectURL(blob), ext: type.includes('mp4') ? 'mp4' : 'webm', mb: (blob.size / 1048576).toFixed(1) }); }
    } catch (e) { setErr(`No se pudo exportar: ${e?.message || e}`); } finally { setExporting(false); draw(); }
  };

  const setE = (p) => setEdit((x) => ({ ...x, ...p }));
  const setCap = (i, text) => setEdit((x) => ({ ...x, captions: x.captions.map((c, k) => (k === i ? { ...c, text: text.slice(0, 70) } : c)) }));
  const total = useMemo(() => (edit ? (opts.intro ? INTRO : 0) + (edit.trim_end - edit.trim_start) + (opts.outro ? OUTRO : 0) : 0), [edit, opts]);
  const portrait = H >= W;
  const busy = stage === 'reading' || stage === 'thinking';

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
        <div className="vid-grid">
          <div className="card stack">
            <h2>2. Resultado</h2>
            <div className="net-tabs" role="tablist" aria-label="Parte del video">
              {[['intro', 'Apertura'], ['main', 'Tu video'], ['outro', 'Cierre']].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={view === k} className={`net-tab${view === k ? ' on' : ''}`} disabled={playing || exporting || (k === 'intro' && !opts.intro) || (k === 'outro' && !opts.outro)} onClick={() => setView(k)}>{l}</button>)}
            </div>
            <div className="vid-stage"><canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', maxWidth: portrait ? 320 : 560, height: 'auto', aspectRatio: `${W} / ${H}` }} aria-label="Vista previa del video editado" /></div>
            <div className="row"><button className="btn" disabled={exporting} onClick={play}>{playing ? '■ Detener' : '▶ Ver con sonido'}</button><span className="muted">Dura {Math.round(total)} s</span></div>
            <div className="row">
              <button className="btn navy" disabled={exporting || playing} onClick={exportVideo}>{exporting ? `Grabando… ${pct}%` : '⬇ Exportar video'}</button>
              {exporting && <span className="muted">No cambies de pestaña mientras se graba.</span>}
            </div>
            {result && <Alert kind="ok">Listo ({result.mb} MB). <a className="btn small" href={result.url} download={`myos-video-${new Date().toISOString().slice(0, 10)}.${result.ext}`}>Descargar .{result.ext}</a></Alert>}
            {watermark && <p className="muted">Con el plan Gratis el video lleva la marca de agua de MYOSAPP. Con Pro sale limpio.</p>}
          </div>

          <div className="card stack">
            <h2>3. Ajusta lo que quieras</h2>
            <div className="field"><label htmlFor="at">Título de la apertura</label><input id="at" type="text" maxLength={50} value={edit.title} onChange={(e) => setE({ title: e.target.value })} /></div>
            <div className="field"><label htmlFor="as">Frase de apoyo (opcional)</label><input id="as" type="text" maxLength={60} value={edit.subtitle} onChange={(e) => setE({ subtitle: e.target.value })} /></div>
            <div className="field"><label htmlFor="ac">Llamado del cierre</label><input id="ac" type="text" maxLength={40} value={edit.cta} onChange={(e) => setE({ cta: e.target.value })} /></div>
            <div className="row">
              <label className="check"><input type="checkbox" checked={opts.intro} onChange={(e) => { setOpts({ ...opts, intro: e.target.checked }); if (!e.target.checked && view === 'intro') setView('main'); }} />Apertura</label>
              <label className="check"><input type="checkbox" checked={opts.outro} onChange={(e) => { setOpts({ ...opts, outro: e.target.checked }); if (!e.target.checked && view === 'outro') setView('main'); }} />Cierre</label>
              <label className="check"><input type="checkbox" checked={opts.captions} onChange={(e) => setOpts({ ...opts, captions: e.target.checked })} />Subtítulos</label>
              <label className="check"><input type="checkbox" checked={opts.logo} onChange={(e) => setOpts({ ...opts, logo: e.target.checked })} />Logo en el video</label>
            </div>
            <div className="field"><label>Tipo de letra</label><div className="seg">{Object.entries(FONTS).map(([k, f]) => <button key={k} type="button" className={`tone-btn${edit.font === k ? ' on' : ''}`} aria-pressed={edit.font === k} onClick={() => setE({ font: k })}>{f.label}</button>)}</div></div>
            <div className="row">
              <div className="field grow"><label>Empieza en {edit.trim_start.toFixed(1)} s</label><input type="range" min="0" max={Math.max(0, edit.trim_end - 3)} step="0.1" value={edit.trim_start} onChange={(e) => setE({ trim_start: Number(e.target.value) })} /></div>
              <div className="field grow"><label>Termina en {edit.trim_end.toFixed(1)} s</label><input type="range" min={Math.min(meta.duration, edit.trim_start + 3)} max={Math.min(meta.duration, edit.trim_start + 60)} step="0.1" value={Math.min(edit.trim_end, edit.trim_start + 60)} onChange={(e) => setE({ trim_end: Number(e.target.value) })} /></div>
            </div>
            <div className="field"><label>Encuadre: {edit.focus_x < 0.35 ? 'a la izquierda' : edit.focus_x > 0.65 ? 'a la derecha' : 'al centro'}</label><input type="range" min="0" max="1" step="0.05" value={edit.focus_x} onChange={(e) => setE({ focus_x: Number(e.target.value) })} /></div>
            <details open={edit.captions.length > 0 && edit.captions.length <= 12}>
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
            <button className="btn secondary" disabled={busy || exporting} onClick={analyze}>↻ Pedirle otra edición a la IA</button>
          </div>
        </div>
      )}
      <Alert kind="ok">{note}</Alert>
      <Alert>{err}</Alert>
    </div>
  );
}
