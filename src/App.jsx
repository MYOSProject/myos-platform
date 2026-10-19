import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { api, getDevUser, setDevUser } from './api';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Business from './pages/Business';
import Library from './pages/Library';
import Status from './pages/Status';
import { Alert } from './components/ui';

const icon = (d) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const NAV = [
  ['chat', 'Asistente', icon('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z')],
  ['business', 'Mi negocio', icon('M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6')],
  ['library', 'Mis contenidos', icon('M4 4h16v16H4zM4 9h16M9 9v11')],
  ['status', 'Estado y auditoría', icon('M22 12h-4l-3 9L9 3l-3 9H2')]
];

export default function App() {
  const [health, setHealth] = useState(null);
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState('');
  const [page, setPage] = useState('chat');
  const [profile, setProfile] = useState(null);
  const [pending, setPending] = useState(0);

  const loadMe = useCallback(async () => {
    setAuthError('');
    try { setMe((await api('GET', '/api/me')).user); } catch (e) {
      setMe(null);
      if (auth.currentUser || getDevUser()) setAuthError(`Entraste con ${auth.currentUser?.email || getDevUser()}, pero el servidor rechazó la sesión: ${e.message}${e.code ? ` (${e.code})` : ''}`);
    }
    setReady(true);
  }, []);
  const refreshPending = useCallback(async (list) => {
    try { const s = list || (await api('GET', '/api/all-content')); setPending(s.filter((i) => i.status === 'PENDING').length); } catch { /* sin sesión */ }
  }, []);

  useEffect(() => { fetch('/api/health').then((r) => r.json()).then(setHealth).catch(() => setHealth({ ok: false })); }, []);
  useEffect(() => onAuthStateChanged(auth, () => loadMe()), [loadMe]);
  useEffect(() => { if (getDevUser()) loadMe(); }, [loadMe]);
  useEffect(() => { if (me) { refreshPending(); api('GET', '/api/profile').then((d) => setProfile(d.profile)).catch(() => {}); } }, [me, refreshPending]);

  if (!ready) return <p style={{ padding: 24 }}>Cargando…</p>;
  if (!me) return <Login authError={authError} health={health} onDev={(e) => { setDevUser(e); loadMe(); }} />;

  return (
    <div className="shell">
      <aside className="side">
        <img className="logo" src="/logo-myos.png" alt="MYOS · My Online System" />
        <nav aria-label="Principal" style={{ display: 'contents' }}>
          {NAV.map(([k, label, ic]) => (
            <button key={k} className="nav" aria-current={page === k ? 'page' : undefined} onClick={() => setPage(k)}>
              {ic}{label}{k === 'library' && pending > 0 && <span className="badge" aria-label={`${pending} por revisar`}>{pending}</span>}
            </button>
          ))}
        </nav>
        <div className="user"><b>{me.name}</b>{me.email}
          <button className="nav" style={{ padding: '8px 0' }} onClick={() => { setDevUser(''); signOut(auth).catch(() => {}); setMe(null); }}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="main">
        {health?.ai && !health.ai.configured && <div style={{ marginBottom: 16 }}><Alert>Gemini no tiene llave: define GEMINI_API_KEY (en .env o en las variables de Vercel).</Alert></div>}
        {page === 'chat' && <Chat me={me} onProfile={setProfile} onSitesChanged={refreshPending} setPage={setPage} />}
        {page === 'business' && <Business onProfile={setProfile} />}
        {page === 'library' && <Library profile={profile} onSitesChanged={refreshPending} setPage={setPage} />}
        {page === 'status' && <Status health={health} />}
      </main>
    </div>
  );
}
