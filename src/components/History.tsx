import { useState, useEffect } from 'react';
import { getUserGames, GameRecord } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface HistoryProps {
  onBack: () => void;
}

export default function History({ onBack }: HistoryProps) {
  const { user } = useAuth();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, [user]);

  const loadGames = async () => {
    if (!user) return;
    setLoading(true);
    const userGames = await getUserGames(user.uid);
    setGames(userGames);
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0a1128 0%, #1a1b4b 40%, #3d2c5e 70%, #c44b2b 100%)'
    }}>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-all border border-white/10"
          >
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
          <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300">
            📊 HISTORIAL
          </h1>
          <div className="px-3 py-2 bg-white/10 backdrop-blur-md rounded-xl text-white/70 text-xs border border-white/10">
            {games.length} partida{games.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-white/40 py-16">
            <i className="fas fa-spinner fa-spin text-3xl"></i>
            <p className="mt-3 font-semibold">Cargando historial...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="p-12 rounded-3xl backdrop-blur-md text-center" style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div className="text-6xl mb-4">🎮</div>
            <h2 className="text-xl font-black text-white mb-2">Sin partidas aún</h2>
            <p className="text-white/60">¡Juega tu primera partida y aparecerá aquí!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => {
              const isPlayer1 = game.player1.uid === user?.uid;
              const myScore = isPlayer1 ? game.player1.score : game.player2.score;
              const opponentScore = isPlayer1 ? game.player2.score : game.player1.score;
              const opponentName = isPlayer1 ? game.player2.displayName : game.player1.displayName;
              const won = game.winner === user?.uid;
              const draw = game.winner === null;

              return (
                <div
                  key={game.id}
                  className="p-4 rounded-2xl backdrop-blur-md transition-all hover:scale-[1.01]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
                    border: won ? '1px solid rgba(16, 185, 129, 0.3)' : draw ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(220, 38, 38, 0.2)',
                    boxShadow: won ? '0 8px 25px rgba(16, 185, 129, 0.15)' : '0 8px 25px rgba(0,0,0,0.2)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-black uppercase tracking-wider ${
                          won ? 'bg-green-500/20 text-green-300 border border-green-400/40' :
                          draw ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40' :
                          'bg-red-500/20 text-red-300 border border-red-400/40'
                        }`}>
                          {won ? '🏆 Victoria' : draw ? '🤝 Empate' : '💔 Derrota'}
                        </span>
                        <span className="text-white/50 text-xs font-semibold">
                          vs {opponentName}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mb-2">
                        <span className="text-white font-black text-2xl">
                          {myScore} <span className="text-white/30">-</span> {opponentScore}
                        </span>
                        <span className="text-white/40 text-xs font-semibold flex items-center gap-1">
                          <i className="far fa-clock"></i> {formatDuration(game.duration)}
                        </span>
                      </div>
                      {game.scoredLines.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {game.scoredLines.map((sl, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded-lg font-black uppercase tracking-wider"
                              style={{
                                background: (isPlayer1 && sl.player === 1) || (!isPlayer1 && sl.player === 2)
                                  ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%)'
                                  : 'linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(239, 68, 68, 0.15) 100%)',
                                color: (isPlayer1 && sl.player === 1) || (!isPlayer1 && sl.player === 2) ? '#67e8f9' : '#fdba74',
                                border: (isPlayer1 && sl.player === 1) || (!isPlayer1 && sl.player === 2)
                                  ? '1px solid rgba(34, 211, 238, 0.3)'
                                  : '1px solid rgba(251, 146, 60, 0.3)'
                              }}
                            >
                              {sl.word}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-white/40 text-xs font-semibold">
                        {formatDate(game.playedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
