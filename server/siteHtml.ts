// Generador del HTML autónomo de cada sitio.
//
// Cambios frente a la versión anterior:
//  - TODO texto se escapa (antes se insertaba crudo: XSS almacenado, y estas páginas se sirven
//    desde el mismo origen que el panel de aprobación).
//  - Colores e imágenes se validan (antes llegaban directo a style="" y src="").
//  - Sin CDN de Tailwind: CSS propio incrustado, iconos Lucide en línea. Funciona sin internet.
//  - Respeta los 3 temas de la interfaz (dark-modern, light-clean, luxury-gold).
//  - El botón de WhatsApp usa el teléfono del propio sitio (antes: un número fijo falso) y solo
//    aparece si hay teléfono. El formulario envía los datos a /api/leads (antes: un alert falso).
import type { GeneratedWebsite } from './types.js';
import { iconSvg } from './icons.js';
import { safeColor } from './gemini.js';

export interface RenderOptions {
  /** Vista previa: agrega noindex y el formulario no envía datos. */
  preview?: boolean;
  /** Origen del API para el formulario de contacto (p. ej. https://myos.vercel.app). */
  apiBase?: string;
  siteId?: number | null;
  /** Nonce de CSP para el script del formulario. */
  nonce?: string;
}

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Solo permite imágenes https:// o data:image/... (no javascript:, no data:text/html). */
export function safeImageSrc(value: unknown): string {
  if (typeof value !== 'string') return '';
  const v = value.trim();
  if (!v) return '';
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml|avif);base64,[a-z0-9+/=\s]+$/i.test(v) && v.length < 9_000_000) return v;
  if (/^https:\/\/[^\s"'<>]+$/i.test(v) && v.length < 2000) return v;
  return '';
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Color de texto legible sobre un fondo dado (blanco o casi negro). */
export function readableOn(bg: string): string {
  return luminance(bg) > 0.42 ? '#10131f' : '#ffffff';
}

/** WhatsApp: normaliza a dígitos con lada de México si hace falta. */
export function whatsappNumber(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) return '52' + digits;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return '';
}

const THEMES: Record<string, Record<string, string>> = {
  'dark-modern': {
    bg: '#0b0f1a', bgAlt: '#0f1424', surface: '#141b30', border: '#232c49', text: '#f3f5fb', muted: '#a2abc4', scheme: 'dark'
  },
  'light-clean': {
    bg: '#ffffff', bgAlt: '#f5f6fa', surface: '#ffffff', border: '#e4e7ef', text: '#12172b', muted: '#586178', scheme: 'light'
  },
  'luxury-gold': {
    bg: '#0c0a07', bgAlt: '#14110c', surface: '#1b1711', border: '#3a2f1c', text: '#f7f0e1', muted: '#bdae8c', scheme: 'dark'
  }
};

export function generateStandaloneHtml(site: GeneratedWebsite, opts: RenderOptions = {}): string {
  const themeKey = THEMES[String(site.design_theme)] ? String(site.design_theme) : 'dark-modern';
  const t = THEMES[themeKey];
  const primary = safeColor(site.brand_colors?.primary, '#e8504a');
  const secondary = safeColor(site.brand_colors?.secondary, '#0f1c3c');
  const accent = safeColor(site.brand_colors?.accent, '#f4b6b3');
  const gold = themeKey === 'luxury-gold' ? '#d4af37' : primary;
  const onPrimary = readableOn(primary);

  const name = site.site_name || site.titulo || 'Mi negocio';
  const tagline = site.tagline || '';
  const logo = safeImageSrc(site.custom_logo);
  const heroImage = safeImageSrc(site.hero_image);
  const aboutImage = safeImageSrc(site.about?.image);
  const contact = site.contact || ({} as GeneratedWebsite['contact']);
  const wa = whatsappNumber(contact.phone);
  const description = site.resumen_web || tagline || name;

  const services = (site.services || [])
    .map((s) => {
      const img = safeImageSrc(s.image);
      return `
      <article class="card">
        ${img ? `<img class="card-img" src="${esc(img)}" alt="${esc(s.title)}" loading="lazy">` : ''}
        <div class="card-top">
          <span class="icon">${iconSvg(s.icon || 'Sparkles', 22)}</span>
          ${s.badge ? `<span class="chip">${esc(s.badge)}</span>` : ''}
        </div>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.description)}</p>
      </article>`;
    })
    .join('');

  const metrics = (site.about?.metrics || [])
    .map((m) => `<div class="metric"><strong>${esc(m.value)}</strong><span>${esc(m.label)}</span></div>`)
    .join('');

  const badges = (site.hero?.trust_badges || [])
    .map((b) => `<li>${iconSvg('CircleCheck', 16)}<span>${esc(b)}</span></li>`)
    .join('');

  const posts = (site.blog_posts || [])
    .map(
      (p) => `
      <article class="card post">
        <span class="meta">${esc(p.date || 'Reciente')} · ${esc(p.read_time || '3 min')}</span>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.excerpt)}</p>
      </article>`
    )
    .join('');

  const infoItems = [
    contact.address ? `<li>${iconSvg('MapPin', 18)}<div><b>Ubicación</b><span>${esc(contact.address)}</span></div></li>` : '',
    contact.phone ? `<li>${iconSvg('Phone', 18)}<div><b>Teléfono</b><a href="tel:${esc(contact.phone.replace(/[^\d+]/g, ''))}">${esc(contact.phone)}</a></div></li>` : '',
    contact.email ? `<li>${iconSvg('Mail', 18)}<div><b>Correo</b><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></div></li>` : ''
  ].join('');

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    description,
    ...(contact.phone ? { telephone: contact.phone } : {}),
    ...(contact.email ? { email: contact.email } : {}),
    ...(contact.address ? { address: contact.address } : {})
  }).replace(/</g, '\\u003c');

  const apiBase = (opts.apiBase || '').replace(/\/+$/, '');
  const nonceAttr = opts.nonce ? ` nonce="${esc(opts.nonce)}"` : '';

  const css = `
:root{--primary:${primary};--secondary:${secondary};--accent:${accent};--gold:${gold};--on-primary:${onPrimary};
--bg:${t.bg};--bg-alt:${t.bgAlt};--surface:${t.surface};--border:${t.border};--text:${t.text};--muted:${t.muted};color-scheme:${t.scheme}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:'Plus Jakarta Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}a{color:inherit}
.skip{position:absolute;left:-999px;top:8px;background:var(--primary);color:var(--on-primary);padding:8px 14px;border-radius:8px;z-index:100}.skip:focus{left:8px}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px}
header.top{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
.bar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 0}
.brand{display:flex;align-items:center;gap:12px;text-decoration:none;min-width:0}
.brand img{height:38px;max-width:150px;object-fit:contain;border-radius:8px}
.mark{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;font-weight:800;color:var(--on-primary);background:linear-gradient(135deg,var(--primary),var(--secondary));flex:none}
.brand b{display:block;font-size:16px;line-height:1.15;letter-spacing:-.01em}
.brand small{display:block;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px}
nav.links{display:flex;gap:26px;font-size:14px;font-weight:600;color:var(--muted)}
nav.links a{text-decoration:none}nav.links a:hover{color:var(--text)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;padding:13px 26px;font-weight:700;font-size:14px;text-decoration:none;border:1px solid transparent;cursor:pointer;font-family:inherit;transition:transform .15s,box-shadow .15s,background .15s}
.btn-primary{background:var(--primary);color:var(--on-primary);box-shadow:0 8px 24px color-mix(in srgb,var(--primary) 35%,transparent)}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 12px 28px color-mix(in srgb,var(--primary) 45%,transparent)}
.btn-ghost{background:transparent;color:var(--text);border-color:var(--border)}.btn-ghost:hover{background:var(--surface)}
.btn-sm{padding:10px 20px;font-size:13px}
section{padding:84px 0}
section.alt{background:var(--bg-alt);border-block:1px solid var(--border)}
.eyebrow{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)}
h1,h2,h3{letter-spacing:-.02em;line-height:1.12;margin:0}
h1{font-size:clamp(34px,5.4vw,62px);font-weight:800}
h2{font-size:clamp(26px,3.6vw,38px);font-weight:800}
h3{font-size:18px;font-weight:700}
.lead{font-size:clamp(16px,1.6vw,19px);color:var(--muted);max-width:60ch}
.hero{padding:76px 0 70px;position:relative;overflow:hidden}
.hero::before{content:"";position:absolute;inset:-20% -10% auto auto;width:640px;height:640px;background:radial-gradient(closest-side,color-mix(in srgb,var(--primary) 28%,transparent),transparent);pointer-events:none}
.hero-grid{display:grid;gap:48px;align-items:center;position:relative}
.hero-grid.two{grid-template-columns:1.1fr .9fr}
.hero-copy{display:flex;flex-direction:column;gap:22px;align-items:flex-start}
.hero-grid:not(.two) .hero-copy{align-items:center;text-align:center;margin:0 auto;max-width:820px}
.badge{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;background:var(--surface);border:1px solid var(--border);font-size:13px;font-weight:600}
.cta-row{display:flex;gap:12px;flex-wrap:wrap}
.hero-grid:not(.two) .cta-row{justify-content:center}
.trust{display:flex;flex-wrap:wrap;gap:10px 20px;list-style:none;padding:0;margin:6px 0 0;color:var(--muted);font-size:13.5px}
.trust li{display:flex;align-items:center;gap:7px}.trust svg{color:var(--primary)}
.hero-img{border-radius:28px;overflow:hidden;border:1px solid var(--border);box-shadow:0 30px 70px rgba(0,0,0,.28);aspect-ratio:4/3;background:var(--surface)}
.hero-img img{width:100%;height:100%;object-fit:cover}
.head{display:flex;flex-direction:column;gap:10px;margin-bottom:44px;max-width:640px}
.center{margin-inline:auto;text-align:center;align-items:center}
.grid{display:grid;gap:22px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr))}
.card{background:var(--surface);border:1px solid var(--border);border-radius:22px;padding:26px;display:flex;flex-direction:column;gap:12px;transition:transform .18s,border-color .18s,box-shadow .18s}
.card:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--primary) 55%,var(--border));box-shadow:0 18px 40px rgba(0,0,0,.14)}
.card p{margin:0;color:var(--muted);font-size:15px}
.card-img{border-radius:14px;height:150px;width:100%;object-fit:cover}
.card-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
.icon{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;color:var(--primary);background:color-mix(in srgb,var(--primary) 15%,transparent)}
.chip{font-size:11.5px;font-weight:700;padding:5px 11px;border-radius:999px;border:1px solid var(--border);color:var(--muted);background:var(--bg-alt)}
.about{display:grid;gap:44px;grid-template-columns:1.2fr .8fr;align-items:start}
.about.solo{grid-template-columns:1fr;max-width:820px;margin-inline:auto}
.about p{color:var(--muted);font-size:16.5px;white-space:pre-line;margin:16px 0 0}
.about img{border-radius:22px;border:1px solid var(--border);width:100%;max-height:340px;object-fit:cover}
.metrics{display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin-top:30px}
.metric{background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:18px;text-align:center}
.metric strong{display:block;font-size:24px;font-weight:800;color:var(--gold);letter-spacing:-.02em}
.metric span{font-size:13px;color:var(--muted)}
.post .meta{font-size:12px;color:var(--muted);font-weight:600}
.contact{display:grid;gap:40px;grid-template-columns:1fr 1fr;background:var(--surface);border:1px solid var(--border);border-radius:30px;padding:clamp(24px,5vw,52px)}
.info{list-style:none;padding:0;margin:26px 0 0;display:flex;flex-direction:column;gap:18px}
.info li{display:flex;gap:14px;align-items:flex-start}.info svg{color:var(--primary);margin-top:3px;flex:none}
.info b{display:block;font-size:13px;color:var(--muted);font-weight:600}.info span,.info a{font-weight:600;text-decoration:none}
form{display:flex;flex-direction:column;gap:12px}
label{font-size:13px;font-weight:600;color:var(--muted);display:flex;flex-direction:column;gap:6px}
input,textarea{font:inherit;color:var(--text);background:var(--bg);border:1px solid var(--border);border-radius:14px;padding:13px 15px;width:100%}
input:focus,textarea:focus{outline:2px solid var(--primary);outline-offset:1px;border-color:transparent}
.hp{position:absolute;left:-9999px;opacity:0;height:0;overflow:hidden}
.form-msg{font-size:14px;font-weight:600;min-height:20px}.form-msg.ok{color:#22a06b}.form-msg.err{color:#e5484d}
footer{padding:34px 0;border-top:1px solid var(--border);color:var(--muted);font-size:13px;text-align:center;background:var(--bg)}
.wa{position:fixed;right:22px;bottom:22px;width:58px;height:58px;border-radius:50%;background:#25d366;color:#fff;display:grid;place-items:center;box-shadow:0 10px 28px rgba(0,0,0,.3);z-index:60;transition:transform .15s}.wa:hover{transform:scale(1.08)}
@media (max-width:860px){nav.links{display:none}.hero-grid.two,.about,.contact{grid-template-columns:1fr}section{padding:60px 0}.hero{padding:48px 0}.brand small{display:none}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;scroll-behavior:auto!important}}
`;

  const script = `
(function(){
  var f=document.getElementById('lead-form'); if(!f) return;
  var msg=document.getElementById('form-msg');
  f.addEventListener('submit',function(e){
    e.preventDefault();
    if(f.dataset.preview==='1'){msg.className='form-msg';msg.textContent='Vista previa: en el sitio publicado este formulario enviará los datos.';return;}
    msg.className='form-msg';msg.textContent='Enviando…';
    var d=Object.fromEntries(new FormData(f).entries());
    fetch(f.dataset.api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)})
      .then(function(r){if(!r.ok)throw new Error('http '+r.status);return r.json();})
      .then(function(){f.reset();msg.className='form-msg ok';msg.textContent='¡Gracias! Recibimos tu mensaje y te responderemos pronto.';})
      .catch(function(){msg.className='form-msg err';msg.textContent='No pudimos enviar tu mensaje. Inténtalo de nuevo o contáctanos directamente.';});
  });
})();`;

  const showAbout = Boolean(site.about?.content);
  const showMetrics = Boolean(metrics);

  return `<!DOCTYPE html>
<html lang="es-MX">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)}${tagline ? ' — ' + esc(tagline) : ''}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(name)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
${opts.preview ? '<meta name="robots" content="noindex, nofollow">' : ''}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>${css}</style>
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<a class="skip" href="#contacto">Ir al contacto</a>
<header class="top">
  <div class="wrap bar">
    <a href="#inicio" class="brand" aria-label="${esc(name)}">
      ${logo ? `<img src="${esc(logo)}" alt="${esc(name)}">` : `<span class="mark">${esc(name.charAt(0).toUpperCase())}</span>`}
      <span><b>${esc(name)}</b>${site.industry ? `<small>${esc(site.industry)}</small>` : ''}</span>
    </a>
    <nav class="links" aria-label="Principal">
      <a href="#servicios">Servicios</a>
      ${showAbout ? '<a href="#nosotros">Nosotros</a>' : ''}
      ${posts ? '<a href="#blog">Blog</a>' : ''}
      <a href="#contacto">Contacto</a>
    </nav>
    <a class="btn btn-primary btn-sm" href="#contacto">${esc(site.hero?.primary_cta || 'Contactar')}</a>
  </div>
</header>

<main id="inicio">
  <section class="hero">
    <div class="wrap">
      <div class="hero-grid${heroImage ? ' two' : ''}">
        <div class="hero-copy">
          ${site.hero?.badge ? `<span class="badge">${esc(site.hero.badge)}</span>` : ''}
          <h1>${esc(site.hero?.title || site.titulo)}</h1>
          <p class="lead">${esc(site.hero?.subtitle || site.resumen_web)}</p>
          <div class="cta-row">
            <a class="btn btn-primary" href="#contacto">${esc(site.hero?.primary_cta || 'Comenzar')}</a>
            <a class="btn btn-ghost" href="#servicios">${esc(site.hero?.secondary_cta || 'Conocer más')}</a>
          </div>
          ${badges ? `<ul class="trust">${badges}</ul>` : ''}
        </div>
        ${heroImage ? `<div class="hero-img"><img src="${esc(heroImage)}" alt="${esc(name)}"></div>` : ''}
      </div>
    </div>
  </section>

  <section id="servicios" class="alt">
    <div class="wrap">
      <div class="head center"><span class="eyebrow">Lo que ofrecemos</span><h2>Nuestros servicios</h2></div>
      <div class="grid">${services}</div>
    </div>
  </section>

  ${
    showAbout
      ? `<section id="nosotros">
    <div class="wrap">
      <div class="about${aboutImage ? '' : ' solo'}">
        <div>
          <span class="eyebrow">Quiénes somos</span>
          <h2>${esc(site.about.title)}</h2>
          <p>${esc(site.about.content)}</p>
          ${showMetrics ? `<div class="metrics">${metrics}</div>` : ''}
        </div>
        ${aboutImage ? `<img src="${esc(aboutImage)}" alt="${esc(site.about.title)}" loading="lazy">` : ''}
      </div>
    </div>
  </section>`
      : ''
  }

  ${
    posts
      ? `<section id="blog" class="alt">
    <div class="wrap">
      <div class="head center"><span class="eyebrow">Recursos</span><h2>Blog y novedades</h2></div>
      <div class="grid">${posts}</div>
    </div>
  </section>`
      : ''
  }

  <section id="contacto">
    <div class="wrap">
      <div class="contact">
        <div>
          <span class="eyebrow">Hablemos</span>
          <h2>${esc(contact.title || 'Contáctanos')}</h2>
          ${contact.subtitle ? `<p class="lead" style="margin-top:12px">${esc(contact.subtitle)}</p>` : ''}
          ${infoItems ? `<ul class="info">${infoItems}</ul>` : ''}
        </div>
        <form id="lead-form" data-api="${esc(apiBase)}/api/leads" data-preview="${opts.preview ? '1' : '0'}" novalidate>
          <input type="hidden" name="site_id" value="${esc(opts.siteId ?? '')}">
          <div class="hp" aria-hidden="true"><label>Sitio web<input type="text" name="website" tabindex="-1" autocomplete="off"></label></div>
          <label>Nombre<input type="text" name="name" required autocomplete="name" placeholder="Tu nombre"></label>
          <label>Teléfono o WhatsApp<input type="tel" name="phone" autocomplete="tel" placeholder="656 000 0000"></label>
          <label>Correo electrónico<input type="email" name="email" autocomplete="email" placeholder="tu@correo.com"></label>
          <label>¿En qué podemos ayudarte?<textarea name="message" rows="4" required placeholder="Cuéntanos qué necesitas"></textarea></label>
          <button class="btn btn-primary" type="submit">Enviar mensaje</button>
          <div id="form-msg" class="form-msg" role="status" aria-live="polite"></div>
        </form>
      </div>
    </div>
  </section>
</main>

${wa ? `<a class="wa" href="https://wa.me/${esc(wa)}?text=${encodeURIComponent('Hola, vi su sitio web y me gustaría más información.')}" target="_blank" rel="noopener noreferrer" aria-label="Escribir por WhatsApp"><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.969.586 1.771.88 2.796.88 3.179 0 5.767-2.587 5.767-5.766.001-3.187-2.575-5.767-5.767-5.767zm0 10.428c-.887 0-1.593-.243-2.316-.672l-.166-.098-1.58.415.422-1.541-.107-.171c-.482-.767-.736-1.554-.735-2.595.001-2.459 2.003-4.461 4.466-4.461 2.464 0 4.467 2.002 4.467 4.461 0 2.464-2.003 4.462-4.467 4.462z"/></svg></a>` : ''}

<footer>
  <div class="wrap">© ${new Date().getFullYear()} ${esc(name)}. Todos los derechos reservados.</div>
</footer>
<script${nonceAttr}>${script}</script>
</body>
</html>`;
}
