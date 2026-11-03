import { useState } from 'react';
import Game from './components/Game';
import Admin from './components/Admin';

type View = 'menu' | 'game' | 'admin';

function App() {
  const [view, setView] = useState<View>('menu');

  if (view === 'game') {
    return <Game onBack={() => setView('menu')} />;
  }

  if (view === 'admin') {
    return <Admin onBack={() => setView('menu')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Logo / Title */}
        <div className="text-center mb-10">
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
          <p className="text-white/60 mt-4 text-sm md:text-base max-w-sm mx-auto">
            Forma palabras de 3 letras en filas, columnas y diagonales para ganar puntos
          </p>
        </div>

        {/* Menu Buttons */}
        <div className="space-y-4">
          <button
            onClick={() => setView('game')}
            className="w-full group relative overflow-hidden px-8 py-5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-2xl text-white font-bold text-lg transition-all transform hover:scale-[1.02] shadow-xl shadow-blue-500/20"
          >
            <div className="flex items-center justify-center gap-3">
              <i className="fas fa-gamepad text-xl"></i>
              <span>Jugar</span>
            </div>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all"></div>
          </button>

          <button
            onClick={() => setView('admin')}
            className="w-full group relative overflow-hidden px-8 py-5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-2xl text-white font-bold text-lg transition-all transform hover:scale-[1.02] shadow-xl shadow-purple-500/20"
          >
            <div className="flex items-center justify-center gap-3">
              <i className="fas fa-cog text-xl"></i>
              <span>Administrar Diccionario</span>
            </div>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all"></div>
          </button>
        </div>

        {/* Info */}
        <div className="mt-10 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5">
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
        <div className="mt-6 text-center text-white/40 text-xs">
          <p>Multijugador local • 2 jugadores • Palabras de 3 letras</p>
        </div>
      </div>
    </div>
  );
}

export default App;
