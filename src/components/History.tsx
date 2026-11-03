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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
          >
            <i className="fas fa-arrow-left"></i>
            Volver
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            📊 Historial de Partidas
          </h1>
          <div className="text-white/70 text-sm">
            {games.length} partida{games.length !== 1 ? 's' : ''}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-white/40 py-16">
            <i className="fas fa-spinner fa-spin text-3xl"></i>
            <p className="mt-3">Cargando historial...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-12 text-center">
            <div className="text-5xl mb-4">🎮</div>
            <h2 className="text-xl font-bold text-white mb-2">Sin partidas aún</h2>
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
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          won ? 'bg-green-500/20 text-green-300 border border-green-400/30' :
                          draw ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30' :
                          'bg-red-500/20 text-red-300 border border-red-400/30'
                        }`}>
                          {won ? '✓ Victoria' : draw ? '— Empate' : '✗ Derrota'}
                        </span>
                        <span className="text-white/40 text-xs">
                          vs {opponentName}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-white font-bold text-lg">
                          {myScore} - {opponentScore}
                        </span>
                        <span className="text-white/40 text-xs">
                          ⏱ {formatDuration(game.duration)}
                        </span>
                      </div>
                      {game.scoredLines.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {game.scoredLines.map((sl, i) => (
                            <span
                              key={i}
                              className={`text-xs px-2 py-0.5 rounded uppercase ${
                                (isPlayer1 && sl.player === 1) || (!isPlayer1 && sl.player === 2)
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {sl.word}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-white/40 text-xs">
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
