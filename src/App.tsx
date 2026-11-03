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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-white mb-4"></i>
          <p className="text-white/70">Cargando...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* User Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
              {(profile?.displayName || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div className="text-white font-bold text-sm">{profile?.displayName || 'Usuario'}</div>
              <div className="text-white/50 text-xs">{profile?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white text-sm transition-all"
            title="Cerrar sesión"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>

        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-24 h-24 mx-auto bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center text-5xl shadow-2xl">
              📝
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Tres en Raya
          </h1>
          <h2 className="text-xl md:text-2xl text-purple-200 font-light">
            Edición Palabras
          </h2>
        </div>

        {/* Stats */}
        {profile?.stats && (
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3 text-center">
              <div className="text-2xl font-bold text-white">{profile.stats.gamesPlayed}</div>
              <div className="text-white/50 text-xs">Partidas</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3 text-center">
              <div className="text-2xl font-bold text-green-300">{profile.stats.gamesWon}</div>
              <div className="text-white/50 text-xs">Victorias</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3 text-center">
              <div className="text-2xl font-bold text-yellow-300">{profile.stats.totalPoints}</div>
              <div className="text-white/50 text-xs">Puntos</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-3 text-center">
              <div className="text-2xl font-bold text-blue-300">{profile.stats.wordsFormed}</div>
              <div className="text-white/50 text-xs">Palabras</div>
            </div>
          </div>
        )}

        {/* Menu Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => setView('game')}
            className="w-full group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-2xl text-white font-bold text-lg transition-all transform hover:scale-[1.02] shadow-xl shadow-blue-500/20"
          >
            <div className="flex items-center justify-center gap-3">
              <i className="fas fa-gamepad text-xl"></i>
              <span>Jugar</span>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setView('history')}
              className="group relative overflow-hidden px-4 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-2xl text-white font-bold transition-all transform hover:scale-[1.02] shadow-xl shadow-amber-500/20"
            >
              <div className="flex items-center justify-center gap-2">
                <i className="fas fa-history"></i>
                <span>Historial</span>
              </div>
            </button>

            <button
              onClick={() => setView('admin')}
              className="group relative overflow-hidden px-4 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-2xl text-white font-bold transition-all transform hover:scale-[1.02] shadow-xl shadow-purple-500/20"
            >
              <div className="flex items-center justify-center gap-2">
                <i className="fas fa-cog"></i>
                <span>Admin</span>
              </div>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
          <h3 className="text-white font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-info-circle text-blue-300"></i>
            ¿Cómo se juega?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-start gap-2">
              <span className="text-2xl">1️⃣</span>
              <p className="text-white/70 text-sm">Cada jugador elige una letra y la coloca en el tablero</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-2xl">2️⃣</span>
              <p className="text-white/70 text-sm">Cuando se completa una línea de 3 letras, se verifica si es una palabra</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-2xl">3️⃣</span>
              <p className="text-white/70 text-sm">Si es una palabra válida del diccionario, ¡ganas 3 puntos!</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-white/40 text-xs">
          <p>Multijugador local • 2 jugadores • Partidas guardadas en la nube</p>
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
