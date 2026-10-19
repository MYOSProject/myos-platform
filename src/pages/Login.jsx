import { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { Alert } from '../components/ui';

export default function Login({ health, onDev, authError }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const run = async (fn) => { setErr(''); try { await fn(); } catch (e) { setErr(e.message); } };
  return (
    <main className="login">
      <div className="card">
        <img src="/logo-myos.png" alt="MYOS · My Online System" />
        <p className="lead">Tu presencia digital, organizada en un solo sistema. Crea, revisa y prepara contenido con ayuda de IA, manteniendo el control antes de publicar.</p>
        {health?.auth?.mode === 'dev' && (
          <>
            <Alert kind="warn">Modo desarrollo: entra con un correo de prueba (no se usa en producción).</Alert>
            <div className="field"><label htmlFor="dev">Correo de prueba</label><input id="dev" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" /></div>
            <button className="btn navy" disabled={!email.includes('@')} onClick={() => onDev(email)}>Entrar (desarrollo)</button>
            <div className="divider">o</div>
          </>
        )}
        <button className="btn" onClick={() => run(() => signInWithPopup(auth, googleProvider))}>Continuar con Google</button>
        <div className="divider">o con correo y contraseña</div>
        <div className="field"><label htmlFor="em">Correo</label><input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field"><label htmlFor="pw">Contraseña</label><input id="pw" type="password" value={pass} onChange={(e) => setPass(e.target.value)} /></div>
        <div className="row">
          <button className="btn secondary" onClick={() => run(() => signInWithEmailAndPassword(auth, email, pass))}>Entrar</button>
          <button className="btn secondary" onClick={() => run(() => createUserWithEmailAndPassword(auth, email, pass))}>Crear cuenta</button>
        </div>
        <Alert>{err}</Alert>
        <Alert>{authError}</Alert>
        <p className="muted">Para aprobar contenido necesitas un correo verificado (con Google ya lo está).</p>
      </div>
    </main>
  );
}
