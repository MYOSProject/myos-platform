import { useCallback, useEffect, useRef, useState } from 'react';
import { api, errText } from '../api';
import { PostCard, SiteCard } from '../components/Cards';
import { Alert } from '../components/ui';

const STARTERS = [
  'Quiero crear mi página web',
  'Prepárame publicaciones para Instagram, Facebook y LinkedIn',
  'Quiero que me conozcas: te cuento de mi negocio'
];

export default function Chat({ me, onProfile, onSitesChanged, setPage }) {
  const [messages, setMessages] = useState([]);
  const [sites, setSites] = useState({});
  const [posts, setPosts] = useState({});
  const [profileInfo, setProfileInfo] = useState({ profile: null, completeness: 0, missing: [] });
  const [fresh, setFresh] = useState(new Set()); // publicaciones recién creadas: se les dibuja la imagen sola
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [running, setRunning] = useState({});
  const [err, setErr] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const bottom = useRef(null);
  const input = useRef(null);
  const started = useRef(new Set());

  const applyProfile = useCallback((d) => {
    setProfileInfo({ profile: d.profile, completeness: d.completeness, missing: d.missing });
    onProfile?.(d.profile);
  }, [onProfile]);

  useEffect(() => {
    api('GET', '/api/chat').then((d) => {
      setMessages(d.messages);
      setSites(Object.fromEntries(d.sites.map((s) => [s.id, s])));
      setPosts(Object.fromEntries(d.posts.map((p) => [p.id, p])));
      applyProfile(d);
      setLoaded(true);
    }).catch((e) => { setErr(e); setLoaded(true); });
  }, [applyProfile]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages.length, sending, Object.keys(running).length]);

  const runAction = useCallback(async (msg) => {
    setRunning((r) => ({ ...r, [msg.id]: true }));
    try {
      const r = await api('POST', '/api/chat/run', { message_id: msg.id });
      setMessages((ms) => ms.map((m) => (m.id === msg.id ? r.message : m)));
      setSites((s) => ({ ...s, [r.site.id]: r.site }));
      onSitesChanged?.();
    } catch (e) {
      setMessages((ms) => ms.map((m) => (m.id === msg.id ? { ...m, action: { ...m.action, status: 'failed', error: errText(e) } } : m)));
    } finally {
      setRunning((r) => { const n = { ...r }; delete n[msg.id]; return n; });
    }
  }, [onSitesChanged]);

  // Las páginas se crean solas después de la respuesta (tardan más que el chat)
  useEffect(() => {
    for (const m of messages) {
      if (m.action?.status === 'pending' && !started.current.has(m.id)) {
        started.current.add(m.id);
        runAction(m);
      }
    }
  }, [messages, runAction]);

  const send = async (raw) => {
    const t = (raw ?? text).trim();
    if (!t || sending) return;
    setSending(true); setErr(null); setText('');
    const tempId = `tmp-${Date.now()}`;
    setMessages((ms) => [...ms, { id: tempId, role: 'user', text: t, at: new Date().toISOString() }]);
    try {
      const r = await api('POST', '/api/chat', { message: t });
      setMessages((ms) => [...ms.filter((m) => m.id !== tempId), r.user_message, r.message]);
      if (r.posts.length) {
        setPosts((p) => ({ ...p, ...Object.fromEntries(r.posts.map((x) => [x.id, x])) }));
        setFresh((f) => new Set([...f, ...r.posts.map((x) => x.id)]));
      }
      applyProfile(r);
    } catch (e) {
      setMessages((ms) => ms.filter((m) => m.id !== tempId));
      setText(t);
      setErr(e);
    } finally { setSending(false); input.current?.focus(); }
  };

  const clear = async () => {
    if (!window.confirm('¿Borrar la conversación? Lo que sé de tu negocio se conserva.')) return;
    await api('DELETE', '/api/chat');
    setMessages([]);
  };
  const askChanges = (site) => { setText(`Quiero cambiar mi sitio "${site.title}": `); input.current?.focus(); };
  const prof = profileInfo.profile;
  const name = (me.name || '').split(' ')[0];

  return (
    <div className="chat-wrap">
      <div className="chat">
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h1>Asistente MYOS</h1>
            <p className="sub" style={{ marginBottom: 0 }}>Cuéntame de tu negocio y te ayudo a crear y actualizar tu sitio y tus publicaciones. Tú decides qué se publica.</p>
          </div>
          {messages.length > 0 && <button className="btn link" onClick={clear}>Borrar conversación</button>}
        </div>

        <div className="msgs" aria-live="polite">
          {loaded && messages.length === 0 && (
            <div className="msg assistant">
              <div className="bubble">
                {`Hola${name ? `, ${name}` : ''}. Soy tu asistente MYOS. Para crear contenido que suene a ti, primero necesito conocer tu negocio.\n\nEmpecemos: ¿cómo se llama y a qué se dedica?`}
              </div>
              <div className="chips">{STARTERS.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}</div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.role}`}>
              <div className="bubble">{m.text}</div>
              {m.learned?.length > 0 && <div className="learned">✓ Guardé en tu perfil: {m.learned.join(', ')}</div>}
              {m.action && m.action.status !== 'done' && (
                <div className="piece"><div className="piece-body">
                  {m.action.status === 'failed' ? (
                    <>
                      <Alert>{m.action.error}</Alert>
                      <div><button className="btn secondary small" onClick={() => runAction(m)} disabled={running[m.id]}>Reintentar</button></div>
                    </>
                  ) : (
                    <div className="row"><span className="typing" aria-hidden="true"><i /><i /><i /></span><span>{m.action.type === 'update_site' ? 'Actualizando tu sitio…' : 'Creando tu página web…'} puede tardar hasta un minuto.</span></div>
                  )}
                </div></div>
              )}
              {(m.artifacts || []).map((a) => {
                if (a.kind === 'site' && sites[a.id]) {
                  return <SiteCard key={`s${a.id}`} site={sites[a.id]} defaultOpen
                    onChange={(s) => { setSites((x) => ({ ...x, [s.id]: s })); onSitesChanged?.(); }}
                    onAskChanges={askChanges} onAnnounce={() => send('Crea publicaciones para anunciar mi sitio web')} />;
                }
                if (a.kind === 'post' && posts[a.id]) {
                  return <PostCard key={`p${a.id}`} post={posts[a.id]} profile={prof} autoImage={fresh.has(a.id)}
                    onChange={(p) => setPosts((x) => ({ ...x, [p.id]: p }))}
                    onRemove={(id) => setPosts((x) => { const n = { ...x }; delete n[id]; return n; })} />;
                }
                return null;
              })}
            </div>
          ))}
          {sending && <div className="msg assistant"><div className="bubble"><span className="typing" aria-label="Escribiendo"><i /><i /><i /></span></div></div>}
          {err && <Alert>{err.message}{err.details?.hint ? ` ${err.details.hint}` : ''}{err.details?.ai_code === 'OVERLOADED' || err.details?.ai_code === 'QUOTA' ? ' Vuelve a enviar tu mensaje en un momento.' : ''}</Alert>}
          <div ref={bottom} />
        </div>

        <div className="composer">
          <form onSubmit={(e) => { e.preventDefault(); send(); }}>
            <textarea ref={input} rows={1} value={text} maxLength={3000} aria-label="Escribe tu mensaje"
              placeholder="Escribe aquí… (Enter envía, Shift+Enter salto de línea)"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
            <button className="btn" type="submit" disabled={sending || !text.trim()}>Enviar</button>
          </form>
        </div>
      </div>

      <aside className="profile-panel card stack" style={{ position: 'sticky', top: 16 }} aria-label="Lo que sé de tu negocio">
        <h2>Lo que sé de tu negocio</h2>
        <div className="bar" role="progressbar" aria-valuenow={profileInfo.completeness} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${profileInfo.completeness}%` }} /></div>
        <p className="muted">{profileInfo.completeness}% de lo esencial</p>
        {prof?.business_name && <p><b>{prof.business_name}</b><br /><span className="muted">{prof.what_they_do}</span></p>}
        {profileInfo.missing.length > 0 ? (
          <div><p className="muted" style={{ marginBottom: 4 }}>Aún te preguntaré por:</p><ul className="hist" style={{ marginTop: 0 }}>{profileInfo.missing.map((m) => <li key={m}>{m}</li>)}</ul></div>
        ) : <p className="muted">✓ Ya tengo lo esencial para crear tu contenido.</p>}
        <button className="btn secondary small" onClick={() => setPage('guide')}>Ver y editar lo que sabes de mí</button>
      </aside>
    </div>
  );
}
