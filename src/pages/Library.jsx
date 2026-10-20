import { useCallback, useEffect, useState } from 'react';
import { api, errText } from '../api';
import { PostCard, SiteCard } from '../components/Cards';
import { Alert, PLATFORM, Tag } from '../components/ui';

export default function Library({ profile, projects = [], projectId, onSwitch, onSitesChanged, setPage }) {
  const [tab, setTab] = useState('posts');
  const [sites, setSites] = useState([]);
  const [posts, setPosts] = useState([]);
  const [sel, setSel] = useState(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([api('GET', '/api/all-content'), api('GET', '/api/social')]);
      setSites(s); setPosts(p); onSitesChanged?.(s);
      setSel((cur) => cur ?? p[0]?.id ?? null);
    } catch (e) { setErr(errText(e)); }
  }, [onSitesChanged]);
  useEffect(() => { load(); }, [load]);

  const current = posts.find((p) => p.id === sel);
  const upsert = (n) => setPosts((x) => (x.some((i) => i.id === n.id) ? x.map((i) => (i.id === n.id ? n : i)) : [n, ...x]));
  const pendingPosts = posts.filter((p) => p.status === 'DRAFT' || p.status === 'PENDING_APPROVAL').length;
  const pendingSites = sites.filter((s) => s.status === 'PENDING').length;

  return (
    <div className="stack">
      <div>
        <h1>Actualizar contenido</h1>
        <p className="sub">Elige el proyecto y la publicación que quieres cambiar. Puedes pedir un ajuste, pedirle a la IA otra versión si no te gusta, volver a una versión anterior y, cuando esté bien, aprobar y publicar.</p>
      </div>
      <div className="card row">
        <label htmlFor="proj" style={{ fontWeight: 600 }}>Proyecto</label>
        <select id="proj" value={projectId || ''} onChange={(e) => { const p = projects.find((x) => x.id === Number(e.target.value)); if (p) onSwitch(p); }}>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="tabs" role="group" aria-label="Tipo de contenido">
        <button aria-pressed={tab === 'posts'} onClick={() => setTab('posts')}>Publicaciones ({posts.length}{pendingPosts ? ` · ${pendingPosts} por revisar` : ''})</button>
        <button aria-pressed={tab === 'sites'} onClick={() => setTab('sites')}>Sitios web ({sites.length}{pendingSites ? ` · ${pendingSites} por revisar` : ''})</button>
      </div>
      <Alert>{err}</Alert>
      {tab === 'posts' && (
        posts.length === 0 ? (
          <div className="card stack"><p className="muted">Este proyecto aún no tiene publicaciones.</p><div><button className="btn" onClick={() => setPage('create')}>Crear contenido</button></div></div>
        ) : (
          <div className="split">
            <ul className="picker" aria-label="Publicaciones">
              {posts.map((p) => (
                <li key={p.id}>
                  <button className="pick" aria-current={p.id === sel ? 'true' : undefined} onClick={() => setSel(p.id)}>
                    <span className="pick-top"><b>{PLATFORM[p.platform]}</b><Tag s={p.status} /></span>
                    <span className="pick-copy">{p.copy.slice(0, 90)}{p.copy.length > 90 ? '…' : ''}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div>
              {current && <PostCard key={current.id} post={current} profile={profile}
                onChange={upsert}
                onNewVersion={(n) => { upsert(n); setSel(n.id); }}
                onRemove={(id) => { setPosts((x) => x.filter((i) => i.id !== id)); setSel(null); }} />}
            </div>
          </div>
        )
      )}
      {tab === 'sites' && (
        <div className="grid">
          {sites.map((s) => <SiteCard key={s.id} site={s}
            onChange={(n) => { setSites((x) => x.map((i) => (i.id === n.id ? n : i))); load(); }}
            onAskChanges={() => setPage('chat')} onAnnounce={() => setPage('create')} />)}
          {!sites.length && <p className="muted">Aún no hay sitios en este proyecto.</p>}
        </div>
      )}
    </div>
  );
}
