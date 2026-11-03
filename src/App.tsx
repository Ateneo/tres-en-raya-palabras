import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { logoutUser } from './firebase/auth';
import { initializeDictionary } from './utils/dictionary';
import AuthScreen from './components/AuthScreen';
import Game from './components/Game';
import Admin from './components/Admin';
import History from './components/History';

type View = 'menu' | 'game' | 'admin' | 'history';

function AppContent() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [view, setView] = useState<View>('menu');
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (user && !initialized) {
      initializeDictionary(user.uid).then(() => setInitialized(true));
    }
  }, [user, initialized]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0a1128 0%, #1a1b4b 40%, #3d2c5e 70%, #c44b2b 100%)'
      }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="relative text-center">
          <div className="inline-block w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 animate-pulse mb-4 shadow-2xl shadow-orange-500/50"></div>
          <p className="text-white/70 font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={() => {}} />;
  }

  const handleLogout = async () => {
    await logoutUser();
  };

  if (view === 'game') {
    return <Game onBack={() => { setView('menu'); refreshProfile(); }} />;
  }
  if (view === 'admin') {
    return <Admin onBack={() => setView('menu')} />;
  }
  if (view === 'history') {
    return <History onBack={() => setView('menu')} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0a1128 0%, #1a1b4b 40%, #3d2c5e 70%, #c44b2b 100%)'
    }}>
      {/* Decorative orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-0 w-72 h-72 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-lg mx-auto p-4 min-h-screen flex flex-col">
        {/* User Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg" style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)'
            }}>
              {(profile?.displayName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div className="text-white font-bold text-sm">{profile?.displayName || 'Usuario'}</div>
              <div className="text-white/50 text-xs truncate max-w-[180px]">{profile?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white/70 hover:text-white text-sm transition-all border border-white/10"
            title="Cerrar sesión"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>

        {/* Logo / Title */}
        <div className="text-center mb-8 mt-4">
          <div className="inline-block mb-5 relative">
            <div className="w-28 h-28 mx-auto rounded-3xl flex items-center justify-center text-6xl relative overflow-hidden" style={{
              background: 'linear-gradient(145deg, #fbbf24 0%, #f59e0b 50%, #ea580c 100%)',
              boxShadow: '0 20px 50px rgba(245, 158, 11, 0.4), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -4px 0 rgba(0,0,0,0.2)'
            }}>
              <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-3xl" style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)'
              }}></div>
              <span className="relative drop-shadow-lg">📝</span>
            </div>
            {/* Floating sparkles */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-300 rounded-full blur-sm opacity-70 animate-pulse"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-orange-400 rounded-full blur-sm opacity-70 animate-pulse"></div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-2" style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 30%, #f59e0b 60%, #ea580c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
            filter: 'drop-shadow(0 4px 10px rgba(245, 158, 11, 0.3))'
          }}>
            PALABRAX3
          </h1>
          <p className="text-white/60 text-sm font-medium">Forma palabras, gana puntos</p>
        </div>

        {/* Stats */}
        {profile?.stats && (
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { value: profile.stats.gamesPlayed, label: 'Partidas', color: 'from-slate-500/20 to-slate-700/20', border: 'border-slate-400/20', text: 'text-white' },
              { value: profile.stats.gamesWon, label: 'Victorias', color: 'from-green-500/20 to-emerald-700/20', border: 'border-green-400/30', text: 'text-green-300' },
              { value: profile.stats.totalPoints, label: 'Puntos', color: 'from-yellow-500/20 to-orange-700/20', border: 'border-yellow-400/30', text: 'text-yellow-300' },
              { value: profile.stats.wordsFormed, label: 'Palabras', color: 'from-cyan-500/20 to-blue-700/20', border: 'border-cyan-400/30', text: 'text-cyan-300' }
            ].map((stat, i) => (
              <div key={i} className={`rounded-2xl p-3 text-center border backdrop-blur-md bg-gradient-to-br ${stat.color} ${stat.border}`}
                style={{ boxShadow: '0 4px 15px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
                <div className={`text-2xl font-black ${stat.text}`}>{stat.value}</div>
                <div className="text-white/50 text-[10px] uppercase tracking-wider font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Menu Buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => setView('game')}
            className="w-full group relative overflow-hidden px-8 py-5 rounded-2xl font-black text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%)',
              boxShadow: '0 15px 40px rgba(245, 158, 11, 0.4), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -4px 0 rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-1/2" style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)'
            }}></div>
            <div className="relative flex items-center justify-center gap-3 text-white">
              <i className="fas fa-gamepad text-xl"></i>
              <span className="tracking-wide">JUGAR</span>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setView('history')}
              className="group relative overflow-hidden px-4 py-4 rounded-2xl font-black transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)',
                boxShadow: '0 10px 25px rgba(8, 145, 178, 0.3), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -3px 0 rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)'
              }}></div>
              <div className="relative flex items-center justify-center gap-2 text-white">
                <i className="fas fa-history"></i>
                <span className="text-sm">Historial</span>
              </div>
            </button>

            <button
              onClick={() => setView('admin')}
              className="group relative overflow-hidden px-4 py-4 rounded-2xl font-black transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                boxShadow: '0 10px 25px rgba(124, 58, 237, 0.3), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -3px 0 rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-1/2" style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%)'
              }}></div>
              <div className="relative flex items-center justify-center gap-2 text-white">
                <i className="fas fa-book"></i>
                <span className="text-sm">Diccionario</span>
              </div>
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-auto p-5 rounded-3xl backdrop-blur-md" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.5) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
            <span className="text-yellow-400">💡</span> Cómo se juega
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { num: '1', text: 'Elige una letra y colócala en el tablero' },
              { num: '2', text: 'Completa líneas de 3 letras (fila, columna o diagonal)' },
              { num: '3', text: 'Si forma una palabra válida, ganas 3 puntos' }
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-xs font-black shadow-md">
                  {step.num}
                </div>
                <p className="text-white/60 text-xs leading-tight">{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 text-center text-white/30 text-xs pb-2">
          Partidas guardadas en la nube
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
