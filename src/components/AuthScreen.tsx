import { useState } from 'react';
import { registerUser, loginUser } from '../firebase/auth';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await loginUser(email, password);
      } else {
        if (displayName.trim().length < 2) {
          setError('El nombre debe tener al menos 2 caracteres');
          setLoading(false);
          return;
        }
        await registerUser(email, password, displayName.trim());
      }
      onAuthenticated();
    } catch (err: any) {
      const code = err.code || '';
      switch (code) {
        case 'auth/email-already-in-use':
          setError('Este email ya está registrado');
          break;
        case 'auth/invalid-email':
          setError('Email no válido');
          break;
        case 'auth/weak-password':
          setError('La contraseña debe tener al menos 6 caracteres');
          break;
        case 'auth/invalid-credential':
          setError('Email o contraseña incorrectos');
          break;
        case 'auth/user-not-found':
          setError('Usuario no encontrado');
          break;
        default:
          setError(err.message || 'Error al autenticar');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{
      background: 'linear-gradient(135deg, #0a1128 0%, #1a1b4b 40%, #3d2c5e 70%, #c44b2b 100%)'
    }}>
      {/* Decorative orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 relative">
            <div className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-5xl relative overflow-hidden" style={{
              background: 'linear-gradient(145deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
              boxShadow: '0 20px 50px rgba(245, 158, 11, 0.4), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -4px 0 rgba(0,0,0,0.2)'
            }}>
              <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-3xl" style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)'
              }}></div>
              <span className="relative drop-shadow-lg">📝</span>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full blur-sm opacity-70 animate-pulse"></div>
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-2" style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 30%, #f59e0b 60%, #ea580c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 4px 10px rgba(245, 158, 11, 0.3))'
          }}>
            PALABRAX3
          </h1>
          <p className="text-white/60 text-sm font-medium">Forma palabras, gana puntos</p>
        </div>

        {/* Form */}
        <div className="p-6 rounded-3xl backdrop-blur-md" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
          <h2 className="text-xl font-black text-white mb-5 text-center tracking-wide">
            {isLogin ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-white/70 text-xs font-semibold mb-2 block uppercase tracking-wider">Nombre</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre..."
                  className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/50 font-semibold transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)'
                  }}
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="text-white/70 text-xs font-semibold mb-2 block uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/50 font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)'
                }}
                required
              />
            </div>

            <div>
              <label className="text-white/70 text-xs font-semibold mb-2 block uppercase tracking-wider">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/50 font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)'
                }}
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 text-red-200 px-4 py-2.5 rounded-xl text-sm font-semibold">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-black text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%)',
                boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)'
              }}></div>
              <span className="relative tracking-wide">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-spinner fa-spin"></i>
                    PROCESANDO...
                  </span>
                ) : (
                  isLogin ? 'ENTRAR' : 'REGISTRARSE'
                )}
              </span>
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-orange-300 hover:text-orange-200 text-sm font-semibold underline underline-offset-4"
            >
              {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-5">
          Regístrate para guardar tus partidas y competir
        </p>
      </div>
    </div>
  );
}
