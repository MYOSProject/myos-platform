import { useCallback, useEffect, useState } from 'react';
import { api, errText } from '../api';
import { PostCard, SiteCard } from '../components/Cards';
import { Alert } from '../components/ui';

const pendingOf = (p) => ['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'APPROVED', 'FAILED'].includes(p.status);

export default function Content({ profile, setPage, onChanged }) {
  const [posts, setPosts] = useState(null);
  const [sites, setSites] = useState([]);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [errCode, setErrCode] = useState('');
  const [fresh, setFresh] = useState({}); // id -> versión: obliga a rehacer la imagen de lo que la IA acaba de escribir

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([api('GET', '/api/social'), api('GET', '/api/all-content')]);
      setPosts(p); setSites(s); onChanged?.();
    } catch (e) { setErr(errText(e)); }
  }, [onChanged]);
  useEffect(() => { load(); }, [load]);

  const fail = (e) => { setErr(errText(e)); setErrCode(e?.code || ''); };
  const markFresh = (list) => setFresh((f) => ({ ...f, ...Object.fromEntries(list.map((p) => [p.id, Date.now()])) }));
  const upsert = (n) => {
    if (n.has_media) setFresh((f) => { if (!(n.id in f)) return f; const { [n.id]: _x, ...rest } = f; return rest; });
    setPosts((x) => (x.some((i) => i.id === n.id) ? x.map((i) => (i.id === n.id ? n : i)) : [n, ...x])); onChanged?.(); };

  const generate = async () => {
    setBusy('create'); setErr(''); setErrCode(''); setNote('');
    try {
      const made = await api('POST', '/api/content/auto-create', { count: 6 });
      markFresh(made);
      setPosts((x) => [...made, ...(x || [])]);
      setNote(`La IA creó ${made.length} publicaciones con la información de tu negocio. Revísalas y aprueba las que quieras publicar.`);
      onChanged?.();
    } catch (e) { fail(e); } finally { setBusy(''); }
  };
  const update = async () => {
    setBusy('update'); setErr(''); setErrCode(''); setNote('');
    try {
      const out = await api('POST', '/api/content/auto-update');
      const all = [...out.posts, ...out.created];
      markFresh(all);
      setPosts((x) => {
        const map = new Map(out.posts.map((p) => [p.id, p]));
        return [...out.created, ...(x || []).map((p) => map.get(p.id) || p)];
      });
      setNote(out.created.length ? `La IA preparó ${out.created.length} versiones nuevas de lo ya publicado, como borrador.` : `La IA renovó ${out.posts.length} ${out.posts.length === 1 ? 'publicación pendiente' : 'publicaciones pendientes'}. Su aprobación anterior ya no vale: vuelve a aprobar.`);
      onChanged?.();
    } catch (e) { fail(e); } finally { setBusy(''); }
  };
  const generateSite = async () => {
    setBusy('site'); setErr(''); setErrCode(''); setNote('');
    try { await api('POST', '/api/create/site', { topic: '' }); await load(); setNote('La IA armó tu sitio web. Revisa la vista previa y apruébalo.'); }
    catch (e) { fail(e); } finally { setBusy(''); }
  };

  if (!posts) return err ? <Alert>{err}</Alert> : <p className="muted">Cargando…</p>;
  const todo = posts.filter(pendingOf);
  const done = posts.filter((p) => p.status === 'PUBLISHED');
  const pendingSites = sites.filter((s) => s.status === 'PENDING');
  const aiBusy = Boolean(busy);

  const card = (p) => (
    <PostCard key={p.id} post={fresh[p.id] ? { ...p, has_media: false } : p} profile={profile} auto autoImage={Boolean(fresh[p.id])}
      onChange={upsert} onNewVersion={upsert}
      onRemove={(id) => { setPosts((x) => x.filter((i) => i.id !== id)); onChanged?.(); }} />
  );

  return (
    <div className="stack">
      <section className="hero">
        <div>
          <h1>Contenido con IA</h1>
          <p>La IA decide los temas, escribe los textos, crea las imágenes y propone las fechas con lo que sabe de tu negocio. <b>Tú solo revisas, apruebas y publicas.</b></p>
        </div>
        <div className="hero-actions">
          <button className="btn big" disabled={aiBusy} onClick={generate}>{busy === 'create' ? 'La IA está creando…' : '✨ Generar contenido con IA'}</button>
          <button className="btn secondary big" disabled={aiBusy || !posts.length} onClick={update}>{busy === 'update' ? 'La IA está actualizando…' : '↻ Actualizar con IA'}</button>
        </div>
        {aiBusy && <p className="muted" role="status">{busy === 'site' ? 'Armando tu sitio; puede tardar hasta un minuto.' : 'Pensando y escribiendo; puede tardar unos segundos…'}</p>}
      </section>

      <Alert kind="ok">{note}</Alert>
      <Alert>{err}</Alert>
      {errCode === 'NEEDS_INFO' && <div><button className="btn" onClick={() => setPage('guide')}>Ir a «Empezar»</button></div>}

      {pendingSites.length > 0 && <div className="stack"><h2>Sitio web por aprobar</h2><div className="stack">{pendingSites.map((s) => <SiteCard key={s.id} site={s} defaultOpen onChange={(n) => { setSites((x) => x.map((i) => (i.id === n.id ? n : i))); load(); }} />)}</div></div>}

      <div className="stack">
        <h2>Por aprobar y publicar {todo.length > 0 && <span className="count">{todo.length}</span>}</h2>
        {todo.length === 0 ? <div className="card"><p className="muted">No hay nada pendiente. Pulsa «Generar contenido con IA» y la IA arma las publicaciones por ti.</p></div> : <div className="grid">{todo.map(card)}</div>}
      </div>

      {done.length > 0 && <div className="stack"><h2>Ya publicadas</h2><div className="grid">{done.map(card)}</div></div>}

      <div className="card stack">
        <h2>Sitio web</h2>
        <p className="muted">También puedes dejar que la IA arme un sitio de una página con tus datos y colores.{sites.length ? ` Este proyecto tiene ${sites.length}.` : ''}</p>
        <div className="row">
          <button className="btn secondary" disabled={aiBusy} onClick={generateSite}>{busy === 'site' ? 'Armando sitio…' : 'Generar sitio web con IA'}</button>
          <button className="btn link" onClick={() => setPage('calendar')}>Ver calendario</button>
        </div>
        {sites.filter((s) => s.status !== 'PENDING').length > 0 && <div className="stack">{sites.filter((s) => s.status !== 'PENDING').map((s) => <SiteCard key={s.id} site={s} onChange={(n) => { setSites((x) => x.map((i) => (i.id === n.id ? n : i))); load(); }} onAskChanges={() => setPage('chat')} />)}</div>}
      </div>
    </div>
  );
}
