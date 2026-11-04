// Pieza gráfica para redes: estructura repetible del manual MYOS (idea principal, apoyo, llamada a la acción)
// dibujada en un <canvas> y exportada a JPEG (Instagram solo acepta JPEG).
const DEFAULT = { primary: '#111827', secondary: '#E2554F', accent: '#8CCFD9' };

function hexToRgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(h || '');
  if (!m) return [17, 24, 39];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

function wrap(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Formato de cada red: Facebook 1.91:1, Instagram 4:5 (vertical), LinkedIn 1.91:1 y X 16:9.
export const FORMATS = { facebook: [1200, 630], instagram: [1080, 1350], linkedin: [1200, 627], x: [1200, 675] };

let wmLogo = null;
let wmLogoPromise = null;
/** Carga (una sola vez) el logo de MYOS que se usa como marca de agua. */
export function loadWatermarkLogo() {
  if (wmLogo) return Promise.resolve(wmLogo);
  wmLogoPromise ||= new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { wmLogo = img; resolve(img); };
    img.onerror = () => resolve(null);
    img.src = '/logo-myos.png';
  });
  return wmLogoPromise;
}

/** Marca de agua pequeña (plan Gratis): el logo de MYOS sobre una pastilla blanca en la esquina inferior derecha. */
export function drawWatermark(ctx, W, H) {
  const lh = Math.max(16, Math.round(Math.min(W, H) * 0.05));
  const pad = lh * 0.45;
  ctx.save();
  if (wmLogo) {
    const lw = lh * (wmLogo.naturalWidth / wmLogo.naturalHeight);
    const w = lw + pad * 2; const h = lh + pad * 2;
    const x = W - w - lh * 0.7; const y = H - h - lh * 0.7;
    ctx.fillStyle = 'rgba(255,255,255,.88)';
    ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2.4); ctx.fill();
    ctx.drawImage(wmLogo, x + pad, y + pad, lw, lh);
  } else {
    const text = 'MYOSAPP';
    ctx.font = `800 ${lh}px Inter, Arial, sans-serif`; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + pad * 2; const h = lh + pad * 2;
    const x = W - w - lh * 0.7; const y = H - h - lh * 0.7;
    ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, h / 2.4); ctx.fill();
    ctx.fillStyle = '#111827'; ctx.fillText(text, x + pad, y + h / 2 + 1);
  }
  ctx.restore();
}

export async function renderPostImage({ headline, subline, cta, colors, logo, platform, watermark = false }) {
  if (watermark) await loadWatermarkLogo();
  const c = { ...DEFAULT, ...(colors || {}) };
  const [W, H] = FORMATS[platform] || [1080, 1080];
  const wide = W > H;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  try {
    await Promise.all([document.fonts.load('800 60px "Plus Jakarta Sans"'), document.fonts.load('500 30px Inter')]);
  } catch { /* usa la fuente de respaldo */ }

  const bg = c.primary;
  const dark = luminance(bg) < 0.4;
  const fg = dark ? '#FFFFFF' : '#111827';
  const sub = dark ? 'rgba(255,255,255,.82)' : 'rgba(17,24,39,.75)';
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Detalles geométricos en la esquina inferior derecha (bandas diagonales)
  const s = Math.min(W, H);
  ctx.save();
  ctx.translate(W, H);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = c.accent;
  ctx.fillRect(-s * 0.22, -s * 0.5, s * 0.1, s * 1.2);
  ctx.fillStyle = c.secondary;
  ctx.fillRect(-s * 0.36, -s * 0.5, s * 0.12, s * 1.2);
  ctx.restore();

  const pad = Math.round(W * 0.08);
  const maxW = W - pad * 2 - (wide ? 160 : 120);
  let y = pad;

  const logoImg = await loadImage(logo);
  if (logoImg) {
    const lh = Math.round(H * 0.09);
    const lw = Math.round((logoImg.width / logoImg.height) * lh);
    // Sobre fondo oscuro el logo va sobre una tarjeta blanca para conservar el contraste.
    if (dark) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(pad - 12, y - 12, lw + 24, lh + 24, 12);
      ctx.fill();
    }
    ctx.drawImage(logoImg, pad, y, lw, lh);
    y += lh + Math.round(H * 0.07);
  } else {
    y += Math.round(H * 0.04);
  }

  // Titular
  const hSize = Math.round(W * (wide ? 0.056 : 0.075));
  ctx.fillStyle = fg;
  ctx.textBaseline = 'top';
  ctx.font = `800 ${hSize}px "Plus Jakarta Sans", Inter, Arial, sans-serif`;
  const hLines = wrap(ctx, headline || '', maxW).slice(0, 4);
  hLines.forEach((l, i) => ctx.fillText(l, pad, y + i * hSize * 1.12));
  y += hLines.length * hSize * 1.12 + Math.round(H * 0.035);

  // Apoyo
  const sSize = Math.round(W * (wide ? 0.028 : 0.036));
  ctx.fillStyle = sub;
  ctx.font = `500 ${sSize}px Inter, Arial, sans-serif`;
  const sLines = wrap(ctx, subline || '', maxW).slice(0, 3);
  sLines.forEach((l, i) => ctx.fillText(l, pad, y + i * sSize * 1.4));

  // Llamada a la acción
  if (cta) {
    const bSize = Math.round(W * 0.03);
    ctx.font = `700 ${bSize}px "Plus Jakarta Sans", Inter, Arial, sans-serif`;
    const label = `${cta}  →`;
    const bw = ctx.measureText(label).width + bSize * 1.8;
    const bh = bSize * 2.2;
    const by = H - pad - bh;
    ctx.fillStyle = c.secondary;
    ctx.beginPath();
    ctx.roundRect(pad, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = luminance(c.secondary) > 0.35 ? '#111827' : '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, pad + bSize * 0.9, by + bh / 2 + 2);
  }
  if (watermark) drawWatermark(ctx, W, H);
  return canvas.toDataURL('image/jpeg', 0.9);
}
