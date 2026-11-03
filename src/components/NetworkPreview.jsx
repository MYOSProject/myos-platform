import { useState } from 'react';

// Vista previa de cómo se verá una publicación en cada red. Es una simulación aproximada del formato
// (proporción de la imagen, encabezado, límite de texto); cada red puede cambiar su diseño.
const slug = (s) => String(s || 'tunegocio').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '').toLowerCase().slice(0, 24) || 'tunegocio';

function Avatar({ name, logo, shape }) {
  return logo
    ? <img className={`np-av ${shape || ''}`} src={logo} alt="" />
    : <span className={`np-av ${shape || ''}`} aria-hidden="true">{(name || 'T').trim()[0]?.toUpperCase()}</span>;
}

export const FORMAT_NOTE = {
  facebook: 'Imagen horizontal 1.91:1 · hasta 5,000 caracteres',
  instagram: 'Imagen vertical 4:5 (obligatoria) · hasta 2,200 caracteres y 30 hashtags',
  linkedin: 'Imagen horizontal 1.91:1 · hasta 3,000 caracteres · tono profesional',
  x: 'Imagen 16:9 · hasta 280 caracteres (por ahora se publica solo el texto)'
};

export default function NetworkPreview({ post, imgUrl, profile }) {
  const [more, setMore] = useState(false);
  const name = profile?.business_name || post.site_name || 'Tu negocio';
  const user = slug(name);
  const logo = profile?.logo || '';
  const tags = post.hashtags ? ` ${post.hashtags}` : '';
  const img = (cls) => (imgUrl ? <img className={`np-img ${cls}`} src={imgUrl} alt={`Imagen de la publicación de ${post.platform}`} /> : <div className={`np-img np-ph ${cls}`}>Sin imagen todavía</div>);
  const p = post.platform;

  if (p === 'instagram') {
    const cap = post.copy;
    const short = cap.length > 125 && !more ? `${cap.slice(0, 125)}… ` : cap;
    return (
      <div className="np np-ig" aria-label="Vista previa de Instagram">
        <div className="np-head"><Avatar name={name} logo={logo} shape="round ring" /><b>{user}</b><span className="np-dots" aria-hidden="true">•••</span></div>
        {img('r45')}
        <div className="np-actions" aria-hidden="true"><span>♡</span><span>💬</span><span>➤</span><span className="np-right">🔖</span></div>
        <div className="np-body"><b>{user}</b> {short}{cap.length > 125 && !more && <button type="button" className="np-link" onClick={() => setMore(true)}>más</button>}
          {post.hashtags && <div className="np-tags">{post.hashtags}</div>}</div>
      </div>
    );
  }
  if (p === 'linkedin') {
    return (
      <div className="np np-li" aria-label="Vista previa de LinkedIn">
        <div className="np-head"><Avatar name={name} logo={logo} shape="square" /><div><b>{name}</b><small>1,234 seguidores · Ahora · 🌐</small></div></div>
        <div className="np-body np-pre">{post.copy}{post.hashtags && <div className="np-tags">{post.hashtags}</div>}</div>
        {img('r191')}
        <div className="np-actions np-text" aria-hidden="true"><span>👍 Recomendar</span><span>💬 Comentar</span><span>↻ Compartir</span><span>✉ Enviar</span></div>
      </div>
    );
  }
  if (p === 'x') {
    const text = `${post.copy}${tags}`;
    const left = 280 - text.length;
    return (
      <div className="np np-x" aria-label="Vista previa de X">
        <div className="np-xrow">
          <Avatar name={name} logo={logo} shape="round" />
          <div className="np-xmain">
            <div className="np-xhead"><b>{name}</b> <span>@{user} · ahora</span></div>
            <div className="np-pre">{post.copy}{post.hashtags && <span className="np-xtag">{tags}</span>}</div>
            {post.has_media && img('r169 rounded')}
            <div className="np-actions np-text" aria-hidden="true"><span>💬</span><span>↻</span><span>♡</span><span>📊</span></div>
          </div>
        </div>
        <div className={`np-count ${left < 0 ? 'over' : left < 20 ? 'warn' : ''}`} role="status">{left >= 0 ? `Te quedan ${left} caracteres de 280` : `Te pasas por ${-left} caracteres (el máximo es 280)`}</div>
      </div>
    );
  }
  return (
    <div className="np np-fb" aria-label="Vista previa de Facebook">
      <div className="np-head"><Avatar name={name} logo={logo} shape="round" /><div><b>{name}</b><small>Ahora · 🌐</small></div></div>
      <div className="np-body np-pre">{post.copy}{post.hashtags && <div className="np-tags">{post.hashtags}</div>}</div>
      {img('r191')}
      {post.cta && <div className="np-cta"><span>{post.link_url ? post.link_url.replace(/^https?:\/\//, '').split('/')[0] : name}</span><b>{post.cta}</b></div>}
      <div className="np-actions np-text" aria-hidden="true"><span>👍 Me gusta</span><span>💬 Comentar</span><span>↪ Compartir</span></div>
    </div>
  );
}
