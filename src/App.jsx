import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { api, getActiveProject, getDevUser, setActiveProject, setDevUser } from './api';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Chat from './pages/Chat';
import Guide from './pages/Guide';
import Content from './pages/Content';
import Calendar from './pages/Calendar';
import Connections from './pages/Connections';
import Status from './pages/Status';
import { Alert } from './components/ui';

const icon = (d) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
// [clave, texto, ícono, ¿necesita proyecto abierto?]
const NAV = [
  ['projects', 'Mis proyectos', icon('M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'), false],
  ['guide', 'Empezar', icon('M5 12l5 5L20 7'), true],
  ['content', 'Contenido con IA', icon('M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z'), true],
  ['calendar', 'Calendario', icon('M3 6h18v14H3zM3 10h18M8 3v4M16 3v4'), true],
  ['connections', 'Conexiones', icon('M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7'), true],
  ['chat', 'Asistente', icon('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'), true],
  ['status', 'Estado y auditoría', icon('M22 12h-4l-3 9L9 3l-3 9H2'), false]
];

export default function App() {
  const [health, setHealth] = useState(null);
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [page, setPage] = useState('projects');
  const [visited, setVisited] = useState(() => new Set(['projects']));
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(getActiveProject());
  const [profile, setProfile] = useState(null);
  const [pending, setPending] = useState(0);

  const go = useCallback((p) => { setVisited((v) => (v.has(p) ? v : new Set(v).add(p))); setPage(p); window.scrollTo({ top: 0 }); }, []);

  const loadMe = useCallback(async () => {
    setAuthError('');
    try { setMe((await api('GET', '/api/me')).user); } catch (e) {
      setMe(null);
      if (auth.currentUser || getDevUser()) setAuthError(`Entraste con ${auth.currentUser?.email || getDevUser()}, pero el servidor rechazó la sesión: ${e.message}${e.code ? ` (${e.code})` : ''}`);
    }
    setReady(true);
  }, []);

  const openProject = useCallback((p, to = 'guide') => {
    setActiveProject(p.id); setProjectId(p.id); setProfile(null); setPending(0);
    setVisited(new Set(['projects', to]));
    setPage(to); window.scrollTo({ top: 0 });
  }, []);

  const refreshPending = useCallback(async () => {
    try {
      const s = await api('GET', '/api/social');
      setPending(s.filter((i) => i.status === 'DRAFT' || i.status === 'PENDING_APPROVAL').length);
      setProjects((await api('GET', '/api/projects')).projects);
    } catch { /* sin sesión */ }
  }, []);

  useEffect(() => { fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => setHealth({ ok: false })); }, []);
  useEffect(() => onAuthStateChanged(auth, () => loadMe()), [loadMe]);
  useEffect(() => { if (getDevUser()) loadMe(); }, [loadMe]);

  // Al entrar: lista de proyectos; si el proyecto recordado ya no existe se descarta.
  useEffect(() => {
    if (!me) return;
    api('GET', '/api/projects').then((d) => {
      setProjects(d.projects);
      if (projectId && !d.projects.some((p) => p.id === projectId)) { setActiveProject(null); setProjectId(null); }
    }).catch(() => {});
  }, [me]); // eslint-disable-line

  useEffect(() => {
    if (!me || !projectId) return;
    api('GET', '/api/profile').then((d) => setProfile(d.profile)).catch(() => {});
    refreshPending();
  }, [me, projectId, refreshPending]);

  if (!ready) return <p style={{ padding: 24 }}>Cargando…</p>;
  if (!me) return <Login authError={authError} health={health} onDev={(e) => { setDevUser(e); loadMe(); }} />;

  const active = projects.find((p) => p.id === projectId);
  const needs = NAV.find((n) => n[0] === page)?.[3];
  const NoProject = () => (
    <div className="card stack"><h2>Primero elige un proyecto</h2><p className="muted">Cada proyecto guarda su propia información y contenidos.</p>
      <div><button className="btn" onClick={() => go('projects')}>Ir a Mis proyectos</button></div></div>
  );
  const body = {
    projects: <Projects activeId={projectId} onOpen={openProject} onList={setProjects} setPage={go} />,
    guide: <Guide onProfile={setProfile} setPage={go} />,
    content: <Content profile={profile} setPage={go} onChanged={refreshPending} />,
    calendar: <Calendar profile={profile} setPage={go} />,
    connections: <Connections setPage={go} />,
    chat: <Chat me={me} onProfile={setProfile} onSitesChanged={refreshPending} setPage={go} />,
    status: <Status health={health} />
  };

  return (
    <div className="shell">
      <aside className="side">
        <img className="logo" src="/logo-myos.png" alt="MYOS · My Online System" />
        <button className="proj-chip" onClick={() => go('projects')} aria-label="Cambiar de proyecto">
          <small>Proyecto</small>
          <b>{active ? active.name : 'Ninguno abierto'}</b>
          <span>{active ? 'Cambiar' : 'Elegir o crear'}</span>
        </button>
        <nav aria-label="Principal" style={{ display: 'contents' }}>
          {NAV.map(([k, label, ic, req]) => (
            <button key={k} className="nav" aria-current={page === k ? 'page' : undefined} disabled={req && !projectId} onClick={() => go(k)}>
              {ic}{label}{k === 'content' && pending > 0 && <span className="badge" aria-label={`${pending} por revisar`}>{pending}</span>}
            </button>
          ))}
        </nav>
        <div className="user"><b>{me.name}</b>{me.email}
          <button className="nav" style={{ padding: '8px 0' }} onClick={() => { setDevUser(''); setActiveProject(null); signOut(auth).catch(() => {}); setMe(null); setProjectId(null); }}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="main">
        {health?.ai && !health.ai.configured && <div style={{ marginBottom: 16 }}><Alert>Gemini no tiene llave: define GEMINI_API_KEY (en .env o en las variables de Vercel).</Alert></div>}
        {active && (
          <header className="topbar" aria-label="Resumen del proyecto">
            <div className="topbar-main">
              <small>Proyecto abierto</small>
              <b>{active.name}</b>
            </div>
            <ul className="chips">
              <li className="chip" title="Pasos del recorrido «Empezar» confirmados"><span aria-hidden="true">🧭</span>Recorrido {active.steps_confirmed}/8</li>
              <li className={`chip ${pending ? 'warn' : ''}`}><span aria-hidden="true">⏳</span>{pending ? `${pending} por aprobar` : 'Nada por aprobar'}</li>
              <li className="chip"><span aria-hidden="true">📣</span>{active.posts_published} publicadas</li>
              <li className={`chip ${active.connected ? 'ok' : ''}`}><span aria-hidden="true">🔗</span>{active.connected ? 'Redes conectadas' : 'Redes en simulación'}</li>
            </ul>
            <button className="btn small" onClick={() => go(active.steps_confirmed || active.business_name ? 'content' : 'guide')}>{active.steps_confirmed || active.business_name ? '✨ Generar con IA' : 'Completar «Empezar»'}</button>
          </header>
        )}
        {needs && !projectId && <NoProject />}
        {/* Las páginas visitadas siguen montadas (ocultas) para que no se pierda lo escrito al cambiar de pestaña.
            Al cambiar de proyecto se vuelven a montar con los datos del proyecto nuevo. */}
        <div key={projectId || 'none'}>
          {NAV.map(([k, , , req]) => visited.has(k) && (!req || projectId) && (
            <div key={k} className="page" hidden={page !== k}>{body[k]}</div>
          ))}
        </div>
      </main>
    </div>
  );
}
