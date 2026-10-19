import { useCallback, useEffect, useState } from 'react';
import { api, errText } from '../api';
import { PostCard, SiteCard } from '../components/Cards';
import { Alert } from '../components/ui';

export default function Library({ profile, onSitesChanged, setPage }) {
  const [tab, setTab] = useState('sites');
  const [sites, setSites] = useState([]);
  const [posts, setPosts] = useState([]);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([api('GET', '/api/all-content'), api('GET', '/api/social')]);
      setSites(s); setPosts(p); onSitesChanged?.(s);
    } catch (e) { setErr(errText(e)); }
  }, [onSitesChanged]);
  useEffect(() => { load(); }, [load]);

  const pendingSites = sites.filter((s) => s.status === 'PENDING').length;
  const pendingPosts = posts.filter((p) => p.status === 'DRAFT' || p.status === 'PENDING_APPROVAL').length;
  return (
    <div className="stack">
      <div>
        <h1>Mis contenidos</h1>
        <p className="sub">Todo lo que se ha creado y su estado. Nada se publica hasta que una persona lo aprueba.</p>
      </div>
      <div className="tabs" role="group" aria-label="Tipo de contenido">
        <button aria-pressed={tab === 'sites'} onClick={() => setTab('sites')}>Sitios web ({sites.length}{pendingSites ? ` · ${pendingSites} por revisar` : ''})</button>
        <button aria-pressed={tab === 'posts'} onClick={() => setTab('posts')}>Publicaciones ({posts.length}{pendingPosts ? ` · ${pendingPosts} por revisar` : ''})</button>
      </div>
      <Alert>{err}</Alert>
      {tab === 'sites' && (
        <div className="grid">
          {sites.map((s) => <SiteCard key={s.id} site={s}
            onChange={(n) => { setSites((x) => x.map((i) => (i.id === n.id ? n : i))); load(); }}
            onAskChanges={() => setPage('chat')} onAnnounce={() => setPage('chat')} />)}
          {!sites.length && <p className="muted">Aún no hay sitios. Pídele uno al asistente.</p>}
        </div>
      )}
      {tab === 'posts' && (
        <div className="grid">
          {posts.map((p) => <PostCard key={p.id} post={p} profile={profile}
            onChange={(n) => setPosts((x) => x.map((i) => (i.id === n.id ? n : i)))}
            onRemove={(id) => setPosts((x) => x.filter((i) => i.id !== id))} />)}
          {!posts.length && <p className="muted">Aún no hay publicaciones. Pídele al asistente que prepare algunas.</p>}
        </div>
      )}
    </div>
  );
}
