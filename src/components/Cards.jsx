import { useEffect, useRef, useState } from 'react';
import { api, apiBlobUrl, errText } from '../api';
import { renderPostImage } from '../graphic';
import { Alert, PLATFORM, Tag, fmt } from './ui';

// ------------------------------------------------------------------ Vista previa de sitio
const WIDTHS = { Móvil: 390, Tableta: 768, Escritorio: '100%' };
export function SitePreview({ siteId }) {
  const [html, setHtml] = useState(null);
  const [err, setErr] = useState('');
  const [w, setW] = useState('Escritorio');
  useEffect(() => {
    let live = true;
    api('GET', `/api/content/${siteId}`).then((d) => live && setHtml(d.content.full_html)).catch((e) => live && setErr(errText(e)));
    return () => { live = false; };
  }, [siteId]);
  if (err) return <Alert>{err}</Alert>;
  if (!html) return <p className="muted">Cargando vista previa…</p>;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row" style={{ gap: 8 }}>
        {Object.keys(WIDTHS).map((k) => <button key={k} className={`btn small ${w === k ? 'navy' : 'secondary'}`} onClick={() => setW(k)}>{k}</button>)}
      </div>
      <div className="frame-wrap">
        <iframe className="frame" title="Vista previa del sitio" sandbox="allow-scripts" srcDoc={html} style={{ width: WIDTHS[w], maxWidth: '100%', flex: w === 'Escritorio' ? 1 : 'none' }} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Tarjeta de sitio
export function SiteCard({ site, onChange, onAskChanges, onAnnounce, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [confirm, setConfirm] = useState(false);
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ask, setAsk] = useState('');
  const needsAck = site.ai?.source === 'fallback' || site.ai?.source === 'seed';
  const approved = site.status === 'APPROVED' || site.status === 'PUBLISHED';
  const url = `${window.location.origin}/site/${site.id}`;

  const approve = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api('POST', `/api/approve/${site.id}`, { confirm_review: true, acknowledge_fallback: ack });
      onChange({ ...site, status: r.status, approved_by: r.record.approved_by, approved_by_email: r.record.approved_by_email, approved_at: r.record.approved_at });
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };
  const revise = async () => {
    setBusy(true); setErr('');
    try { const n = await api('POST', `/api/content/${site.id}/revise`, { instruction: ask }); setAsk(''); onChange({ ...site, ...n }); }
    catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };
  const reject = async () => {
    const reason = window.prompt('¿Por qué lo rechazas? (opcional)') ?? null;
    if (reason === null) return;
    setBusy(true); setErr('');
    try {
      const r = await api('POST', `/api/reject/${site.id}`, { reason });
      onChange({ ...site, status: r.status });
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  };

  return (
    <article className="piece">
      <div className="piece-head">
        <span className="grow">🌐 {site.title}</span>
        <Tag s={site.status} />
      </div>
      <div className="piece-body">
        <p className="muted">Sitio web · creado {fmt(site.created_at)}{site.ai?.model ? ` con ${site.ai.model}` : ''}{site.is_seed ? ' · ejemplo' : ''}</p>
        {needsAck && <Alert kind="warn">Este sitio NO fue generado por Gemini (origen: {site.ai.source}). Los textos son de ejemplo.</Alert>}
        {site.review_notes?.length > 0 && site.status === 'PENDING' && (
          <Alert kind="warn"><b>Verifica antes de aprobar:</b><ul>{site.review_notes.map((n, i) => <li key={i}>{n}</li>)}</ul></Alert>
        )}
        {site.rejected_reason && site.status === 'REJECTED' && <Alert>Rechazado: {site.rejected_reason}</Alert>}
        <div className="row">
          <button className="btn secondary small" onClick={() => setOpen((o) => !o)}>{open ? 'Ocultar vista previa' : 'Revisar vista previa'}</button>
          {approved && <a className="btn secondary small" href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>Abrir sitio público ↗</a>}
        </div>
        {open && <SitePreview key={site.updated_at} siteId={site.id} />}
        <div className="field revise">
          <label htmlFor={`sr-${site.id}`}>¿Qué quieres cambiar de la página?</label>
          <div className="row">
            <input id={`sr-${site.id}`} className="grow" type="text" value={ask} placeholder="Ej.: cambia el color a azul, un título más corto, quita la sección del blog" onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && ask.trim() && !busy) revise(); }} />
            <button className="btn secondary" disabled={!ask.trim() || busy} onClick={revise}>{busy ? 'La IA lo está cambiando…' : 'Cambiar'}</button>
          </div>
          <small className="muted">La IA aplica el cambio y la página vuelve a quedar pendiente de tu aprobación.</small>
        </div>
        {site.status === 'PENDING' && (
          <>
            <p className="ask">¿Lo apruebas y lo publico?</p>
            <label className="check"><input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
              <span>Revisé los textos, los datos de contacto y las imágenes. Se registrará mi correo como persona que aprueba.</span></label>
            {needsAck && <label className="check"><input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} /><span>Entiendo que no fue generado por Gemini.</span></label>}
            <div className="row">
              <button className="btn" disabled={!confirm || (needsAck && !ack) || busy} onClick={approve}>{busy ? 'Publicando…' : 'Aprobar y publicar sitio'}</button>
              {onAskChanges && <button className="btn secondary" onClick={() => onAskChanges(site)}>Pedir cambios</button>}
              <button className="btn link" disabled={busy} onClick={reject}>Rechazar</button>
            </div>
          </>
        )}
        {approved && (
          <>
            <Alert kind="ok">Aprobado por {site.approved_by_email || site.approved_by} · {fmt(site.approved_at)}. Ya está publicado en <a href={url} target="_blank" rel="noreferrer">{url}</a></Alert>
            <div className="row">
              {onAnnounce && <button className="btn secondary small" onClick={() => onAnnounce(site)}>Crear publicaciones para anunciarlo</button>}
              {onAskChanges && <button className="btn secondary small" onClick={() => onAskChanges(site)}>Pedir cambios</button>}
            </div>
          </>
        )}
        {site.status === 'REJECTED' && onAskChanges && <button className="btn secondary small" onClick={() => onAskChanges(site)}>Pedir una nueva versión</button>}
        <Alert>{err}</Alert>
      </div>
    </article>
  );
}

// ------------------------------------------------------------------ Tarjeta de publicación
export function PostCard({ post, profile, onChange, onRemove, onNewVersion, autoImage = false, auto = false }) {
  const [ask, setAsk] = useState('');
  const [imgUrl, setImgUrl] = useState(null);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const rendered = useRef(false);
  const pending = ['DRAFT', 'PENDING_APPROVAL', 'REJECTED'].includes(post.status);

  // Imagen guardada en el servidor (la <img> no manda el token, se baja con fetch)
  useEffect(() => {
    if (!post.has_media) { setImgUrl(null); return undefined; }
    let live = true;
    let created = null;
    apiBlobUrl(`/api/social/${post.id}/image`).then((u) => { created = u; live ? setImgUrl(u) : URL.revokeObjectURL(u); }).catch(() => {});
    return () => { live = false; if (created) URL.revokeObjectURL(created); };
  }, [post.id, post.has_media, post.image_url]);

  const makeImage = async (p = post) => {
    setBusy('image'); setErr('');
    try {
      const dataUrl = await renderPostImage({
        headline: p.image_headline || p.copy.slice(0, 60),
        subline: p.image_subline || '',
        cta: p.cta,
        colors: profile?.brand_colors || undefined,
        logo: profile?.logo || undefined,
        platform: p.platform
      });
      onChange(await api('POST', `/api/social/${p.id}/image`, { data_url: dataUrl }));
    } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };

  useEffect(() => { if (!autoImage) rendered.current = false; }, [autoImage]);
  useEffect(() => {
    if (autoImage && !post.has_media && !rendered.current && post.status === 'DRAFT') {
      rendered.current = true;
      makeImage();
    }
    // eslint-disable-next-line
  }, [autoImage, post.id]);

  const approveAndPublish = async () => {
    setBusy('publish'); setErr('');
    try {
      let p = post;
      if (p.status === 'DRAFT' || p.status === 'REJECTED') { p = await api('POST', `/api/social/${p.id}/submit`); onChange(p); }
      if (p.status === 'PENDING_APPROVAL') { p = await api('POST', `/api/social/${p.id}/approve`, { confirm_review: true }); onChange(p); }
      if (p.status === 'APPROVED' || p.status === 'FAILED') { p = await api('POST', `/api/social/${p.id}/publish`); onChange(p); }
    } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };

  const revise = async () => {
    setBusy('revise'); setErr('');
    try {
      const p = await api('POST', `/api/social/${post.id}/revise`, { instruction: ask });
      setAsk('');
      if (p.is_new_version) onNewVersion?.(p); else onChange(p);
      await makeImage(p);
    } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };
  const regenerate = async () => {
    setBusy('regen'); setErr('');
    try {
      const p = await api('POST', `/api/social/${post.id}/regenerate`);
      if (p.is_new_version) onNewVersion?.(p); else onChange(p);
      await makeImage(p);
    } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };
  const restore = async (i) => {
    setBusy('restore'); setErr('');
    try { const p = await api('POST', `/api/social/${post.id}/restore`, { index: i }); onChange(p); await makeImage(p); }
    catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };
  const startEdit = () => {
    setDraft({ copy: post.copy, hashtags: post.hashtags, cta: post.cta, headline: post.image_headline || '', subline: post.image_subline || '' });
    setEditing(true);
  };
  const saveEdit = async () => {
    setBusy('save'); setErr('');
    try {
      const p = await api('PUT', `/api/social/${post.id}`, { copy: draft.copy, hashtags: draft.hashtags, cta: draft.cta, image_headline: draft.headline, image_subline: draft.subline });
      onChange(p); setEditing(false);
      await makeImage(p);
    } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };
  const remove = async () => {
    if (!window.confirm('¿Descartar esta publicación?')) return;
    setBusy('del'); setErr('');
    try {
      if (post.status === 'DRAFT' || post.status === 'REJECTED') await api('DELETE', `/api/social/${post.id}`);
      else await api('POST', `/api/social/${post.id}/reject`, { reason: 'Descartada desde el asistente' });
      onRemove?.(post.id);
    } catch (e) { setErr(errText(e)); } finally { setBusy(''); }
  };

  const name = PLATFORM[post.platform];
  const done = post.status === 'PUBLISHED';
  return (
    <article className="piece">
      <div className="piece-head">
        <span className="grow">{name}{post.site_name ? ` · ${post.site_name}` : ''}{auto && post.scheduled_at && post.status !== 'PUBLISHED' ? ` · sugerida ${new Date(post.scheduled_at).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}` : ''}</span>
        <Tag s={post.status} />
      </div>
      <div className="piece-body">
        {imgUrl ? <img className="piece-img" src={imgUrl} alt={`Imagen de la publicación de ${name}`} /> : (
          <div className="row">
            <button className="btn secondary small" disabled={busy === 'image'} onClick={() => makeImage()}>{busy === 'image' ? 'Creando imagen…' : 'Crear imagen'}</button>
            {post.platform === 'instagram' && <span className="muted">Instagram necesita una imagen.</span>}
          </div>
        )}
        {editing ? (
          <div className="stack" style={{ gap: 12 }}>
            <div className="field"><label>Texto</label><textarea value={draft.copy} rows={5} onChange={(e) => setDraft({ ...draft, copy: e.target.value })} /></div>
            <div className="field"><label>Hashtags</label><input type="text" value={draft.hashtags} onChange={(e) => setDraft({ ...draft, hashtags: e.target.value })} /></div>
            <div className="row">
              <div className="field grow"><label>Titular de la imagen</label><input type="text" value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} /></div>
              <div className="field grow"><label>Texto de apoyo de la imagen</label><input type="text" value={draft.subline} onChange={(e) => setDraft({ ...draft, subline: e.target.value })} /></div>
              <div className="field"><label>Botón</label><input type="text" value={draft.cta} onChange={(e) => setDraft({ ...draft, cta: e.target.value })} /></div>
            </div>
            <div className="row"><button className="btn" disabled={busy === 'save'} onClick={saveEdit}>Guardar cambios</button><button className="btn secondary" onClick={() => setEditing(false)}>Cancelar</button></div>
          </div>
        ) : (
          <>
            <p className="piece-text">{post.copy}</p>
            {post.hashtags && <p className="muted">{post.hashtags}</p>}
          </>
        )}
        {post.problems?.length > 0 && pending && <Alert kind="warn">{post.problems.join(' · ')}</Alert>}
        {post.status === 'REJECTED' && post.rejected_reason && <Alert>Rechazada: {post.rejected_reason}</Alert>}
        {post.last_dry_run && post.status === 'APPROVED' && (
          <Alert kind="info"><b>Aprobada, pero no se envió a {name}.</b> {post.last_dry_run.note}</Alert>
        )}
        {post.status === 'FAILED' && <Alert>No se pudo publicar: {post.publish_result?.error}</Alert>}
        {done && <Alert kind="ok">Publicada en {name} · {fmt(post.published_at)} · aprobó {post.approved_by_email}{post.publish_result?.external_id ? ` · id ${post.publish_result.external_id}` : ''}</Alert>}
        {!editing && (
          <div className="field revise">
            <label htmlFor={`rv-${post.id}`}>{done ? 'Crear una nueva versión' : '¿Qué quieres cambiar de esta publicación?'}</label>
            <div className="row">
              <input id={`rv-${post.id}`} className="grow" type="text" value={ask} placeholder="Ej.: más corto, otro tono, cambia el color de la imagen" onChange={(e) => setAsk(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && ask.trim() && !busy) revise(); }} />
              <button className="btn secondary" disabled={!ask.trim() || Boolean(busy)} onClick={revise}>{busy === 'revise' ? 'La IA lo está cambiando…' : 'Cambiar'}</button>
            </div>
            {done && <small className="muted">Esta ya se publicó y no se modifica: se crea un borrador nuevo que tendrás que aprobar.</small>}
          </div>
        )}
        {!done && !editing && !auto && post.versions?.length > 0 && (
          <div className="field">
            <label htmlFor={`vs-${post.id}`}>Volver a una versión anterior</label>
            <div className="row">
              <select id={`vs-${post.id}`} className="grow" defaultValue="" onChange={(e) => { if (e.target.value !== '') { restore(Number(e.target.value)); e.target.value = ''; } }} disabled={Boolean(busy)}>
                <option value="">Elige una versión…</option>
                {post.versions.map((v, i) => <option key={i} value={i}>{fmt(v.at)} · {v.copy.slice(0, 50)}{v.copy.length > 50 ? '…' : ''}</option>).reverse()}
              </select>
            </div>
          </div>
        )}
        {!done && !editing && (
          <>
            <p className="ask">{post.status === 'APPROVED' ? '¿La publico ahora?' : '¿La apruebas y la publico?'}</p>
            {post.status !== 'APPROVED' && <p className="muted">Al continuar confirmas que revisaste el texto y la imagen. Se registrará tu correo como persona que aprueba.</p>}
            <div className="row">
              <button className="btn" disabled={Boolean(busy) || (post.platform === 'instagram' && !post.has_media)} onClick={approveAndPublish}>
                {busy === 'publish' ? 'Procesando…' : post.status === 'APPROVED' ? 'Publicar ahora' : post.status === 'FAILED' ? 'Reintentar' : 'Aprobar y publicar'}
              </button>
              {!auto && <button className="btn secondary" disabled={Boolean(busy)} onClick={startEdit}>Editar</button>}
              <button className="btn secondary" disabled={Boolean(busy)} onClick={regenerate}>{busy === 'regen' ? 'La IA escribe otra…' : auto ? 'Que la IA haga otra' : 'No me gusta, hazme otra'}</button>
              <button className="btn link" disabled={Boolean(busy)} onClick={remove}>Descartar</button>
            </div>
          </>
        )}
        <Alert>{err}</Alert>
      </div>
    </article>
  );
}
