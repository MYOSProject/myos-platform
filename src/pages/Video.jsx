import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, errText } from '../api';
import { drawWatermark } from '../graphic';
import { Alert, TONES } from '../components/ui';

// Editor de videos cortos: escenas con fondo (color, foto o clip), texto acomodable, formato por red y exportación.
// Todo se arma en el navegador (canvas + MediaRecorder): no se sube nada al servidor.
const FORMATS = {
  '9:16': { w: 720, h: 1280, label: 'Vertical 9:16', for: 'Reels, Historias y videos verticales' },
  '4:5': { w: 864, h: 1080, label: 'Vertical 4:5', for: 'Feed de Instagram y Facebook' },
  '1:1': { w: 900, h: 900, label: 'Cuadrado 1:1', for: 'Feed de Facebook e Instagram' },
  '16:9': { w: 1280, h: 720, label: 'Horizontal 16:9', for: 'Facebook, LinkedIn y X' }
};
const SIZES = { s: 0.05, m: 0.07, l: 0.095 };
const MAX_SCENES = 8;
const MAX_TOTAL = 40;
const FADE = 0.35;

let uid = 1;
const newScene = (over = {}) => ({ id: uid++, text: '', seconds: 3, pos: 'center', size: 'm', textColor: '#FFFFFF', bg: '#111827', media: null, dim: true, box: false, ...over });

function wrapText(ctx, text, maxW) {
  const out = [];
  for (const para of String(text || '').split('\n')) {
    let line = '';
    for (const w of para.split(/\s+/).filter(Boolean)) {
      const t = line ? `${line} ${w}` : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

function cover(ctx, src, sw, sh, W, H) {
  const k = Math.max(W / sw, H / sh);
  const w = sw * k; const h = sh * k;
  ctx.drawImage(src, (W - w) / 2, (H - h) / 2, w, h);
}

function drawScene(ctx, sc, W, H, textAlpha = 1) {
  ctx.fillStyle = sc.bg || '#111827';
  ctx.fillRect(0, 0, W, H);
  const m = sc.media;
  if (m?.kind === 'image' && m.el.complete) cover(ctx, m.el, m.el.naturalWidth, m.el.naturalHeight, W, H);
  if (m?.kind === 'video' && m.el.readyState >= 2) cover(ctx, m.el, m.el.videoWidth, m.el.videoHeight, W, H);
  if (m && sc.dim) { ctx.fillStyle = 'rgba(0,0,0,.38)'; ctx.fillRect(0, 0, W, H); }
  if (!sc.text.trim()) return;
  const size = Math.round(W * SIZES[sc.size]);
  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.font = `800 ${size}px "Plus Jakarta Sans", Inter, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const lines = wrapText(ctx, sc.text, W * 0.84);
  const lh = size * 1.18;
  const bh = lines.length * lh;
  const y0 = sc.pos === 'top' ? H * 0.1 : sc.pos === 'bottom' ? H * 0.9 - bh : (H - bh) / 2;
  if (sc.box) {
    const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + size * 1.2;
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.beginPath();
    ctx.roundRect((W - bw) / 2, y0 - size * 0.45, bw, bh + size * 0.9, size * 0.4);
    ctx.fill();
  }
  ctx.fillStyle = sc.textColor;
  if (!sc.box && sc.textColor === '#FFFFFF') { ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = size * 0.25; }
  lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * lh));
  ctx.restore();
}

function sceneAt(scenes, t) {
  let acc = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (t < acc + scenes[i].seconds || i === scenes.length - 1) return { i, local: t - acc };
    acc += scenes[i].seconds;
  }
  return { i: 0, local: 0 };
}

function drawAt(ctx, scenes, t, W, H, watermark) {
  const { i, local } = sceneAt(scenes, t);
  if (i > 0 && local < FADE) {
    drawScene(ctx, scenes[i - 1], W, H, 1);
    ctx.save(); ctx.globalAlpha = local / FADE; drawScene(ctx, scenes[i], W, H, local / FADE); ctx.restore();
  } else drawScene(ctx, scenes[i], W, H, 1);
  if (watermark) drawWatermark(ctx, W, H);
}

const pickMime = () => ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) => window.MediaRecorder?.isTypeSupported?.(m)) || '';

export default function Video({ profile, plan }) {
  const brand = { primary: '#111827', secondary: '#E2554F', accent: '#8CCFD9', ...(profile?.brand_colors || {}) };
  const swatches = useMemo(() => [brand.primary, brand.secondary, brand.accent, '#000000', '#FFFFFF'], [brand.primary, brand.secondary, brand.accent]);
  const [format, setFormat] = useState('9:16');
  const [scenes, setScenes] = useState(() => [newScene({ text: 'Tu mensaje aquí', bg: '#111827' })]);
  const [sel, setSel] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState(null);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const canvasRef = useRef(null);
  const scenesRef = useRef(scenes);
  const runRef = useRef(0);
  scenesRef.current = scenes;
  const { w: W, h: H } = FORMATS[format];
  const watermark = plan !== 'pro';
  const total = scenes.reduce((a, s) => a + s.seconds, 0);
  const cur = scenes[Math.min(sel, scenes.length - 1)];

  const redraw = useCallback((time = t) => {
    const c = canvasRef.current; if (!c) return;
    drawAt(c.getContext('2d'), scenesRef.current, Math.min(time, Math.max(0, scenesRef.current.reduce((a, s) => a + s.seconds, 0) - 0.01)), W, H, watermark);
  }, [t, W, H, watermark]);

  // Cuando no se reproduce, el lienzo muestra el instante elegido.
  useEffect(() => { if (!playing && !exporting) redraw(t); }, [scenes, t, format, watermark, playing, exporting, redraw]);
  useEffect(() => { document.fonts?.load('800 40px "Plus Jakarta Sans"').then(() => redraw()).catch(() => {}); }, []); // eslint-disable-line
  useEffect(() => () => { runRef.current++; scenesRef.current.forEach((s) => s.media && URL.revokeObjectURL(s.media.url)); }, []);

  const patch = (idx, p) => setScenes((l) => l.map((s, i) => (i === idx ? { ...s, ...p } : s)));
  const addScene = () => {
    if (scenes.length >= MAX_SCENES) return setErr(`Máximo ${MAX_SCENES} escenas: son videos cortos.`);
    setErr(''); setScenes((l) => [...l, newScene({ bg: swatches[l.length % 3], text: '' })]); setSel(scenes.length);
  };
  const removeScene = (i) => {
    if (scenes.length === 1) return;
    scenes[i].media && URL.revokeObjectURL(scenes[i].media.url);
    setScenes((l) => l.filter((_, k) => k !== i)); setSel(Math.max(0, i - 1)); setT(0);
  };
  const move = (i, d) => {
    const j = i + d; if (j < 0 || j >= scenes.length) return;
    setScenes((l) => { const c = [...l]; [c[i], c[j]] = [c[j], c[i]]; return c; }); setSel(j);
  };
  const dup = (i) => {
    if (scenes.length >= MAX_SCENES) return setErr(`Máximo ${MAX_SCENES} escenas.`);
    const { media, ...rest } = scenes[i];
    setScenes((l) => { const c = [...l]; c.splice(i + 1, 0, newScene({ ...rest })); return c; }); setSel(i + 1);
  };
  const setSeconds = (i, v) => {
    const n = Math.min(6, Math.max(2, Number(v) || 3));
    const others = scenes.reduce((a, s, k) => a + (k === i ? 0 : s.seconds), 0);
    if (others + n > MAX_TOTAL) return setErr(`El video completo no puede pasar de ${MAX_TOTAL} segundos.`);
    setErr(''); patch(i, { seconds: n });
  };

  const onFile = (i, file) => {
    if (!file) return;
    setErr('');
    const isVideo = file.type.startsWith('video/');
    if (!isVideo && !file.type.startsWith('image/')) return setErr('Elige una foto o un clip de video.');
    if (file.size > 60 * 1024 * 1024) return setErr('El archivo pesa más de 60 MB. Usa uno más corto o ligero.');
    const url = URL.createObjectURL(file);
    const el = isVideo ? document.createElement('video') : new Image();
    if (isVideo) { el.muted = true; el.loop = true; el.playsInline = true; el.preload = 'auto'; el.onloadeddata = () => redraw(); el.src = url; }
    else { el.onload = () => redraw(); el.src = url; }
    if (scenes[i].media) URL.revokeObjectURL(scenes[i].media.url);
    patch(i, { media: { kind: isVideo ? 'video' : 'image', el, url, name: file.name } });
  };
  const clearMedia = (i) => { scenes[i].media && URL.revokeObjectURL(scenes[i].media.url); patch(i, { media: null }); };

  // Reproduce (o graba) la línea de tiempo en tiempo real.
  const run = (onFrame) => new Promise((resolve) => {
    const id = ++runRef.current;
    const list = scenesRef.current;
    const tot = list.reduce((a, s) => a + s.seconds, 0);
    let lastScene = -1;
    const c = canvasRef.current; const ctx = c.getContext('2d');
    const t0 = performance.now();
    const tick = (now) => {
      if (runRef.current !== id) { list.forEach((s) => s.media?.kind === 'video' && s.media.el.pause()); return resolve(false); }
      const el = (now - t0) / 1000;
      if (el >= tot) { list.forEach((s) => s.media?.kind === 'video' && s.media.el.pause()); drawAt(ctx, list, tot - 0.01, W, H, watermark); return resolve(true); }
      const { i } = sceneAt(list, el);
      if (i !== lastScene) {
        lastScene = i;
        list.forEach((s, k) => { if (s.media?.kind === 'video' && k !== i) s.media.el.pause(); });
        const m = list[i].media; if (m?.kind === 'video') { m.el.currentTime = 0; m.el.play().catch(() => {}); }
      }
      drawAt(ctx, list, el, W, H, watermark);
      onFrame?.(el);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const play = async () => {
    if (playing) { runRef.current++; setPlaying(false); return; }
    setPlaying(true); setResult(null);
    await run((el) => setT(el));
    setPlaying(false); setT(0);
  };

  const exportVideo = async () => {
    setErr(''); setResult(null);
    if (!window.MediaRecorder || !canvasRef.current.captureStream) return setErr('Tu navegador no puede exportar video. Prueba con Chrome o Edge actualizado.');
    setExporting(true); setNote('');
    try {
      const mime = pickMime();
      const stream = canvasRef.current.captureStream(30);
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4_000_000 } : undefined);
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      const stopped = new Promise((r) => { rec.onstop = r; });
      rec.start(250);
      const ok = await run((el) => setT(el));
      await new Promise((r) => setTimeout(r, 200));
      rec.stop(); await stopped;
      if (ok) {
        const type = rec.mimeType || mime || 'video/webm';
        const blob = new Blob(chunks, { type });
        setResult({ url: URL.createObjectURL(blob), ext: type.includes('mp4') ? 'mp4' : 'webm', mb: (blob.size / 1048576).toFixed(1) });
      }
    } catch (e) { setErr(`No se pudo exportar: ${e?.message || e}`); } finally { setExporting(false); setT(0); }
  };

  const aiScript = async () => {
    setBusy(true); setErr(''); setNote('');
    try {
      const r = await api('POST', '/api/video/script', { topic, format, tone: tone || undefined });
      scenes.forEach((s) => s.media && URL.revokeObjectURL(s.media.url));
      setScenes(r.scenes.map((s, i) => newScene({ text: s.text, seconds: s.seconds, bg: swatches[i % 3], pos: 'center', size: 'l' })));
      setSel(0); setT(0);
      setNote('La IA escribió el guion. Ajusta los fondos y textos a tu gusto; puedes agregar tus fotos o clips en cada escena.');
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };

  const portrait = H >= W;
  return (
    <div className="stack">
      <div>
        <h1>Videos cortos</h1>
        <p className="sub">Arma un video corto con tus fotos o clips y frases en pantalla. Elige el formato de cada red, acomoda el texto y descárgalo. Es un editor sencillo, pensado para videos de 15 a 30 segundos.</p>
      </div>
      <Alert kind="info">MYOS todavía no publica videos por ti: descarga el video y súbelo a la red que quieras. {watermark ? 'Con el plan Gratis el video lleva la marca de agua «Hecho con MYOS».' : 'Con el plan Pro el video sale sin marca de agua.'}</Alert>

      <div className="card stack">
        <h2>1. Formato</h2>
        <div className="net-tabs" role="radiogroup" aria-label="Formato del video">
          {Object.entries(FORMATS).map(([k, f]) => <button key={k} type="button" role="radio" aria-checked={format === k} className={`net-tab${format === k ? ' on' : ''}`} onClick={() => { setFormat(k); setT(0); }}>{f.label}</button>)}
        </div>
        <p className="muted">Ideal para: {FORMATS[format].for}.</p>
      </div>

      <div className="card stack">
        <h2>2. Guion con IA (opcional)</h2>
        <div className="row">
          <input className="grow" type="text" value={topic} maxLength={300} onChange={(e) => setTopic(e.target.value)} placeholder="¿De qué trata el video? Ej.: promoción de tacos de fin de semana" aria-label="Tema del video" />
          <select value={tone} onChange={(e) => setTone(e.target.value)} aria-label="Tono del video"><option value="">Tono automático</option>{TONES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <button className="btn" disabled={busy || !topic.trim()} onClick={aiScript}>{busy ? 'La IA escribe…' : '✨ Escribir guion'}</button>
        </div>
      </div>

      <div className="vid-grid">
        <div className="card stack">
          <h2>3. Vista previa</h2>
          <div className="vid-stage"><canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', maxWidth: portrait ? 320 : 560, height: 'auto', aspectRatio: `${W} / ${H}` }} aria-label="Vista previa del video" /></div>
          <div className="row">
            <button className="btn" disabled={exporting} onClick={play}>{playing ? '■ Detener' : '▶ Reproducir'}</button>
            <input className="grow" type="range" min="0" max={Math.max(0.1, total - 0.01)} step="0.05" value={Math.min(t, total)} disabled={playing || exporting} onChange={(e) => setT(Number(e.target.value))} aria-label="Instante del video" />
            <span className="muted">{Math.min(t, total).toFixed(1)} / {total}s</span>
          </div>
          <div className="row">
            <button className="btn navy" disabled={exporting || playing} onClick={exportVideo}>{exporting ? `Grabando… ${Math.round((t / total) * 100)}%` : '⬇ Exportar video'}</button>
            {exporting && <span className="muted">No cambies de pestaña mientras se graba.</span>}
          </div>
          {result && (
            <Alert kind="ok">Listo ({result.mb} MB). <a className="btn small" href={result.url} download={`myos-video-${new Date().toISOString().slice(0, 10)}.${result.ext}`}>Descargar .{result.ext}</a></Alert>
          )}
        </div>

        <div className="card stack">
          <h2>4. Escenas <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>({scenes.length}/{MAX_SCENES} · {total}s de {MAX_TOTAL}s)</span></h2>
          <div className="vid-strip" role="tablist" aria-label="Escenas">
            {scenes.map((s, i) => (
              <button key={s.id} type="button" role="tab" aria-selected={sel === i} className={`vid-chip${sel === i ? ' on' : ''}`} onClick={() => { setSel(i); setT(scenes.slice(0, i).reduce((a, x) => a + x.seconds, 0)); }}>
                <span className="vid-dot" style={{ background: s.bg }} aria-hidden="true" />{i + 1} · {s.seconds}s<small>{s.text.slice(0, 18) || 'sin texto'}</small>
              </button>
            ))}
            <button type="button" className="vid-chip add" onClick={addScene}>＋ Agregar escena</button>
          </div>
          {cur && (
            <div className="stack" style={{ gap: 12 }}>
              <div className="field"><label htmlFor="vt">Texto en pantalla</label><textarea id="vt" rows={3} maxLength={120} value={cur.text} onChange={(e) => patch(sel, { text: e.target.value })} placeholder="Frase corta y fácil de leer" /></div>
              <div className="row">
                <div className="field"><label>Duración: {cur.seconds}s</label><input type="range" min="2" max="6" step="1" value={cur.seconds} onChange={(e) => setSeconds(sel, e.target.value)} /></div>
                <div className="field"><label>Posición</label><div className="seg">{[['top', 'Arriba'], ['center', 'Centro'], ['bottom', 'Abajo']].map(([k, l]) => <button key={k} type="button" className={`tone-btn${cur.pos === k ? ' on' : ''}`} aria-pressed={cur.pos === k} onClick={() => patch(sel, { pos: k })}>{l}</button>)}</div></div>
                <div className="field"><label>Tamaño</label><div className="seg">{[['s', 'Chico'], ['m', 'Mediano'], ['l', 'Grande']].map(([k, l]) => <button key={k} type="button" className={`tone-btn${cur.size === k ? ' on' : ''}`} aria-pressed={cur.size === k} onClick={() => patch(sel, { size: k })}>{l}</button>)}</div></div>
              </div>
              <div className="row">
                <div className="field"><label>Color del texto</label><div className="seg">{['#FFFFFF', '#000000', brand.secondary, brand.accent].map((c) => <button key={c} type="button" className={`vid-sw${cur.textColor === c ? ' on' : ''}`} style={{ background: c }} aria-label={`Texto ${c}`} aria-pressed={cur.textColor === c} onClick={() => patch(sel, { textColor: c })} />)}</div></div>
                <div className="field"><label>Color de fondo</label><div className="seg">{swatches.map((c) => <button key={c} type="button" className={`vid-sw${cur.bg === c ? ' on' : ''}`} style={{ background: c }} aria-label={`Fondo ${c}`} aria-pressed={cur.bg === c} onClick={() => patch(sel, { bg: c })} />)}</div></div>
                <label className="check"><input type="checkbox" checked={cur.box} onChange={(e) => patch(sel, { box: e.target.checked })} />Caja detrás del texto</label>
              </div>
              <div className="field">
                <label htmlFor="vf">Foto o clip de fondo (opcional)</label>
                <div className="row">
                  <input id="vf" type="file" accept="image/*,video/*" onChange={(e) => { onFile(sel, e.target.files?.[0]); e.target.value = ''; }} />
                  {cur.media && <button type="button" className="btn link" onClick={() => clearMedia(sel)}>Quitar «{cur.media.name.slice(0, 24)}»</button>}
                </div>
                {cur.media && <label className="check"><input type="checkbox" checked={cur.dim} onChange={(e) => patch(sel, { dim: e.target.checked })} />Oscurecer un poco el fondo para que se lea el texto</label>}
              </div>
              <div className="row">
                <button type="button" className="btn secondary small" disabled={sel === 0} onClick={() => move(sel, -1)}>← Antes</button>
                <button type="button" className="btn secondary small" disabled={sel === scenes.length - 1} onClick={() => move(sel, 1)}>Después →</button>
                <button type="button" className="btn secondary small" onClick={() => dup(sel)}>Duplicar</button>
                <button type="button" className="btn link" disabled={scenes.length === 1} onClick={() => removeScene(sel)}>Eliminar escena</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Alert kind="ok">{note}</Alert>
      <Alert>{err}</Alert>
    </div>
  );
}
