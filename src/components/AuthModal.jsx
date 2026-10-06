import { useState } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup
} from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { LogIn, UserPlus, X, Mail, Lock, ShieldCheck, User } from 'lucide-react';
import Logo from './Logo';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('approver'); // 'approver', 'creator', 'admin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!email || !password) {
          throw new Error('Por favor completa todos los campos obligatorios.');
        }
        if (password.length < 6) {
          throw new Error('La contraseña debe tener al menos 6 caracteres.');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Guardar perfil del usuario en Firestore
        try {
          await setDoc(doc(db, 'users', user.uid), {
            id: user.uid,
            email: user.email,
            displayName: displayName || email.split('@')[0],
            role: role,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('Nota: perfil en Firestore:', dbErr);
        }

        if (onAuthSuccess) onAuthSuccess(user, role);
        onClose();
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (onAuthSuccess) onAuthSuccess(userCredential.user);
        onClose();
      }
    } catch (err) {
      console.error(err);
      let msg = err.message || 'Error en la autenticación.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        msg = 'Credenciales inválidas. Verifica tu correo y contraseña.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'Este correo ya está registrado. Por favor inicia sesión.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'La contraseña debe contener al menos 6 caracteres.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      try {
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
          role: 'approver',
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn('Registro en Firestore con Google:', dbErr);
      }

      if (onAuthSuccess) onAuthSuccess(user, 'approver');
      onClose();
    } catch (err) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('No se pudo completar el inicio de sesión con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#231f20] border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl text-slate-100">
        
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado con Logo */}
        <div className="text-center mb-6 space-y-2">
          <div className="flex justify-center mb-1">
            <Logo />
          </div>
          <h3 className="text-xl font-extrabold text-white">
            {isRegister ? 'Registro de Usuario / Auditor' : 'Acceso a Plataforma MYOS'}
          </h3>
          <p className="text-xs text-slate-400">
            Control de Aprobación Humana y Gestión de Contenidos IA
          </p>
        </div>

        {/* Pestañas Login / Registro */}
        <div className="grid grid-cols-2 p-1 bg-slate-900 rounded-xl mb-5 text-sm font-semibold">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(''); }}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-2 ${
              !isRegister ? 'bg-[#1d7eae] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(''); }}
            className={`py-2 rounded-lg transition flex items-center justify-center gap-2 ${
              isRegister ? 'bg-[#1d7eae] text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Crear Cuenta
          </button>
        </div>

        {/* Banner de error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs text-center">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ej. Carlos Torres"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1d7eae]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@iottechnologies.mx"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1d7eae]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#1d7eae]"
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rol en el Flujo de Aprobación</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-[#98dae9]" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1d7eae]"
                >
                  <option value="approver">Aprobador Humano (Audit Trail - Ficha Merkatics)</option>
                  <option value="admin">Administrador General</option>
                  <option value="creator">Editor de Contenidos IA</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-[#1d7eae] hover:bg-[#0032a0] disabled:bg-slate-800 transition shadow-lg shadow-[#1d7eae]/30 text-sm"
          >
            {loading ? 'Procesando...' : isRegister ? 'Registrar Usuario' : 'Entrar a la Plataforma'}
          </button>
        </form>

        {/* Separador */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-[#231f20] text-slate-400">O también</span>
          </div>
        </div>

        {/* Botón Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 border border-slate-600 transition flex items-center justify-center gap-3 text-slate-200"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Continuar con Google
        </button>

      </div>
    </div>
  );
}
