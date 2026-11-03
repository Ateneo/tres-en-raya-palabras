import { useState, useEffect, useCallback } from 'react';
import { isValidWord, getDictionary } from '../utils/dictionary';
import { saveGameRecord, updatePlayerStats } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface GameProps {
  onBack: () => void;
}

type CellValue = string | null;
type Board = CellValue[];

interface LineScore {
  line: number[];
  word: string;
  player: number;
}

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export default function Game({ onBack }: GameProps) {
  const { user, profile } = useAuth();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [scoredLines, setScoredLines] = useState<LineScore[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'warning' | 'info' | 'end'>('info');
  const [gameOver, setGameOver] = useState(false);
  const [dictSize, setDictSize] = useState(0);
  const [player1Name, setPlayer1Name] = useState('Jugador 1');
  const [player2Name, setPlayer2Name] = useState('Jugador 2');
  const [startTime] = useState(Date.now());
  const [wordsFormedByPlayer, setWordsFormedByPlayer] = useState<{ 1: string[]; 2: string[] }>({ 1: [], 2: [] });
  const [lastScoredWord, setLastScoredWord] = useState<string | null>(null);
  const [lastScoredLine, setLastScoredLine] = useState<number[] | null>(null);

  useEffect(() => {
    getDictionary().then(dict => setDictSize(dict.length));
    if (user) {
      setPlayer1Name(profile?.displayName || 'Jugador 1');
      setPlayer2Name('Jugador 2');
    }
  }, [user, profile]);

  const checkNewLines = useCallback((newBoard: Board, player: number, existingScored: LineScore[]): LineScore[] => {
    const newScores: LineScore[] = [];
    for (const line of LINES) {
      const alreadyScored = existingScored.some(
        sl => sl.line[0] === line[0] && sl.line[1] === line[1] && sl.line[2] === line[2]
      );
      if (alreadyScored) continue;
      const cells = line.map(i => newBoard[i]);
      if (cells.every(c => c !== null)) {
        const word = cells.join('');
        newScores.push({ line, word, player });
      }
    }
    return newScores;
  }, []);

  const handleCellClick = async (index: number) => {
    if (board[index] !== null || !selectedLetter || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = selectedLetter;
    const newLineScores = checkNewLines(newBoard, currentPlayer, scoredLines);
    const validLineScores: LineScore[] = [];
    for (const ls of newLineScores) {
      const valid = await isValidWord(ls.word);
      if (valid) validLineScores.push(ls);
    }

    const pointsEarned = validLineScores.length * 3;
    const newScores = { ...scores };
    if (pointsEarned > 0) newScores[currentPlayer as 1 | 2] += pointsEarned;

    const newWordsFormed = { ...wordsFormedByPlayer };
    if (validLineScores.length > 0) {
      newWordsFormed[currentPlayer as 1 | 2] = [
        ...newWordsFormed[currentPlayer as 1 | 2],
        ...validLineScores.map(ls => ls.word)
      ];
      setWordsFormedByPlayer(newWordsFormed);
      setLastScoredWord(validLineScores[0].word.toUpperCase());
      setLastScoredLine(validLineScores[0].line);
      setTimeout(() => {
        setLastScoredWord(null);
        setLastScoredLine(null);
      }, 2000);
    }

    setBoard(newBoard);
    setScores(newScores);

    if (validLineScores.length > 0) {
      setScoredLines(prev => [...prev, ...validLineScores]);
      const words = validLineScores.map(ls => ls.word.toUpperCase()).join(', ');
      setMessage(`¡${currentPlayer === 1 ? player1Name : player2Name} formó "${words}"! +${pointsEarned} pts`);
      setMessageType('success');
    } else {
      let invalidCompleted = false;
      for (const line of LINES) {
        const alreadyScored = scoredLines.some(
          sl => sl.line[0] === line[0] && sl.line[1] === line[1] && sl.line[2] === line[2]
        );
        if (alreadyScored) continue;
        const cells = line.map(i => newBoard[i]);
        if (cells.every(c => c !== null)) invalidCompleted = true;
      }
      if (invalidCompleted) {
        setMessage('Línea completada, pero no es una palabra válida');
        setMessageType('warning');
      } else {
        setMessage(`${currentPlayer === 1 ? player1Name : player2Name} colocó "${selectedLetter.toUpperCase()}"`);
        setMessageType('info');
      }
    }

    const isFull = newBoard.every(c => c !== null);
    if (isFull) {
      setGameOver(true);
      let winnerMsg = '';
      let winnerUid: string | null = null;
      if (newScores[1] > newScores[2]) {
        winnerMsg = `¡${player1Name} gana! (${newScores[1]} - ${newScores[2]})`;
        winnerUid = user?.uid || null;
      } else if (newScores[2] > newScores[1]) {
        winnerMsg = `¡${player2Name} gana! (${newScores[2]} - ${newScores[1]})`;
      } else {
        winnerMsg = `¡Empate! (${newScores[1]} - ${newScores[2]})`;
      }
      setMessage(winnerMsg);
      setMessageType('end');

      if (user) {
        try {
          const duration = Math.floor((Date.now() - startTime) / 1000);
          await saveGameRecord({
            player1: { uid: user.uid, displayName: player1Name, score: newScores[1], wordsFormed: newWordsFormed[1] },
            player2: { uid: 'guest', displayName: player2Name, score: newScores[2], wordsFormed: newWordsFormed[2] },
            winner: winnerUid,
            board: newBoard,
            scoredLines: [...scoredLines, ...validLineScores],
            playedAt: new Date().toISOString(),
            duration
          });
          await updatePlayerStats(user.uid, newScores[1] > newScores[2], newScores[1], newWordsFormed[1].length);
        } catch (error) {
          console.error('Error saving game:', error);
        }
      }
    }

    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setSelectedLetter('');
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer(1);
    setSelectedLetter('');
    setScores({ 1: 0, 2: 0 });
    setScoredLines([]);
    setMessage('');
    setMessageType('info');
    setGameOver(false);
    setWordsFormedByPlayer({ 1: [], 2: [] });
    setLastScoredWord(null);
    setLastScoredLine(null);
  };

  const getCellInfo = (index: number) => {
    const scored = scoredLines.find(sl => sl.line.includes(index));
    const isLastScored = lastScoredLine?.includes(index);
    return { scored, isLastScored };
  };

  const alphabet = 'abcdefghijklmnñopqrstuvwxyz'.split('');

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0a1128 0%, #1a1b4b 40%, #3d2c5e 70%, #c44b2b 100%)'
    }}>
      {/* Decorative background orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-all border border-white/10"
          >
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-400 tracking-tight">
              PALABRAX3
            </h1>
          </div>
          <div className="px-3 py-2 bg-white/10 backdrop-blur-md rounded-xl text-white/70 text-xs border border-white/10">
            📖 {dictSize}
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className={`relative p-3 rounded-2xl border-2 transition-all overflow-hidden ${
            currentPlayer === 1 && !gameOver
              ? 'border-cyan-400 shadow-lg shadow-cyan-500/40'
              : 'border-white/20'
          }`} style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)'
          }}>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/5"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-cyan-300 font-bold text-sm md:text-base truncate max-w-[110px]">{player1Name}</div>
                <div className="text-white/50 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span> Azul
                </div>
              </div>
              <div className="text-3xl font-black text-white drop-shadow-lg">{scores[1]}</div>
            </div>
          </div>
          <div className={`relative p-3 rounded-2xl border-2 transition-all overflow-hidden ${
            currentPlayer === 2 && !gameOver
              ? 'border-orange-400 shadow-lg shadow-orange-500/40'
              : 'border-white/20'
          }`} style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)'
          }}>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/5"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <div className="text-orange-300 font-bold text-sm md:text-base truncate max-w-[110px]">{player2Name}</div>
                <div className="text-white/50 text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span> Rojo
                </div>
              </div>
              <div className="text-3xl font-black text-white drop-shadow-lg">{scores[2]}</div>
            </div>
          </div>
        </div>

        {/* Message / Word Complete Banner */}
        {message && (
          <div className={`mb-4 text-center p-3 rounded-2xl backdrop-blur-md border ${
            messageType === 'success' ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400/40' :
            messageType === 'end' ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/40' :
            messageType === 'warning' ? 'bg-red-500/10 border-red-400/30' :
            'bg-white/5 border-white/10'
          }`}>
            <span className={`font-bold text-sm md:text-base ${
              messageType === 'success' ? 'text-yellow-200' :
              messageType === 'end' ? 'text-white' :
              messageType === 'warning' ? 'text-red-300' :
              'text-white/80'
            }`}>
              {message}
            </span>
          </div>
        )}

        {/* Word Complete Banner */}
        {lastScoredWord && (
          <div className="mb-3 text-center animate-pulse">
            <div className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 shadow-2xl shadow-orange-500/50">
              <span className="text-white font-black text-lg tracking-wider drop-shadow-lg">
                ✨ ¡PALABRA COMPLETA! ✨
              </span>
            </div>
          </div>
        )}

        {/* Game Over */}
        {gameOver && (
          <div className="mb-4 text-center">
            <button
              onClick={resetGame}
              className="px-8 py-3 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-black rounded-2xl transition-all transform hover:scale-105 shadow-xl shadow-green-500/30 border border-green-300/30"
            >
              🔄 JUGAR DE NUEVO
            </button>
          </div>
        )}

        {/* Board - 3D Glossy Tiles */}
        <div className="flex justify-center mb-5">
          <div className="relative p-4 md:p-5 rounded-3xl" style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {board.map((cell, index) => {
                const { scored, isLastScored } = getCellInfo(index);
                const isEmpty = cell === null;
                const canPlace = isEmpty && selectedLetter && !gameOver;

                return (
                  <button
                    key={index}
                    onClick={() => handleCellClick(index)}
                    disabled={isEmpty && (!selectedLetter || gameOver)}
                    className={`relative w-[5.5rem] h-[5.5rem] md:w-24 md:h-24 rounded-2xl font-black text-4xl md:text-5xl uppercase transition-all duration-300 ${
                      canPlace ? 'cursor-pointer active:scale-95 hover:scale-105' : ''
                    } ${
                      !canPlace && !isEmpty ? 'cursor-default' : 'cursor-not-allowed'
                    }`}
                    style={{
                      transform: isLastScored ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  >
                    {/* Tile base */}
                    {isEmpty ? (
                      <div className="absolute inset-0 rounded-2xl" style={{
                        background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                        border: '2px dashed rgba(255,255,255,0.15)',
                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
                      }}>
                        {canPlace && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white/20 text-3xl font-black">{selectedLetter}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {/* Glossy 3D Tile */}
                        <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{
                          background: isLastScored
                            ? 'linear-gradient(145deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)'
                            : scored
                              ? scored.player === 1
                                ? 'linear-gradient(145deg, #22d3ee 0%, #0891b2 50%, #0e7490 100%)'
                                : 'linear-gradient(145deg, #fb923c 0%, #ea580c 50%, #c2410c 100%)'
                              : 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)',
                          boxShadow: isLastScored
                            ? '0 10px 30px rgba(251, 191, 36, 0.6), 0 0 60px rgba(251, 191, 36, 0.4), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -4px 0 rgba(0,0,0,0.2)'
                            : scored
                              ? scored.player === 1
                                ? '0 8px 20px rgba(34, 211, 238, 0.4), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -4px 0 rgba(0,0,0,0.2)'
                                : '0 8px 20px rgba(251, 146, 60, 0.4), inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -4px 0 rgba(0,0,0,0.2)'
                              : '0 8px 20px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -4px 0 rgba(0,0,0,0.2)'
                        }}>
                          {/* Glossy shine */}
                          <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl" style={{
                            background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)'
                          }}></div>
                          {/* Letter */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`${
                              isLastScored || scored ? 'text-white' : 'text-slate-800'
                            } drop-shadow-lg`} style={{
                              textShadow: isLastScored || scored
                                ? '0 2px 4px rgba(0,0,0,0.3)'
                                : '0 2px 4px rgba(255,255,255,0.5)'
                            }}>
                              {cell}
                            </span>
                          </div>
                        </div>
                        {/* Glow effect for last scored */}
                        {isLastScored && (
                          <div className="absolute -inset-2 rounded-3xl animate-pulse pointer-events-none" style={{
                            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)'
                          }}></div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Letter Selector */}
        {!gameOver && (
          <div className="mb-4 p-4 rounded-3xl backdrop-blur-md" style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.5) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div className="text-center mb-3">
              <span className="text-white/90 text-sm font-semibold">
                Turno de{' '}
                <span className={currentPlayer === 1 ? 'text-cyan-300' : 'text-orange-300'}>
                  {currentPlayer === 1 ? player1Name : player2Name}
                </span>
              </span>
              {selectedLetter && (
                <span className="ml-2 inline-block px-3 py-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg">
                  <span className="text-white font-black uppercase">{selectedLetter}</span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {alphabet.map(letter => {
                const isSelected = selectedLetter === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => setSelectedLetter(letter)}
                    className="relative w-8 h-8 md:w-9 md:h-9 rounded-lg font-black text-xs md:text-sm uppercase transition-all duration-150 active:scale-90"
                    style={{
                      transform: isSelected ? 'scale(1.15) translateY(-2px)' : 'scale(1)',
                      background: isSelected
                        ? currentPlayer === 1
                          ? 'linear-gradient(145deg, #22d3ee 0%, #0891b2 100%)'
                          : 'linear-gradient(145deg, #fb923c 0%, #ea580c 100%)'
                        : 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                      color: isSelected ? 'white' : 'rgba(255,255,255,0.8)',
                      boxShadow: isSelected
                        ? currentPlayer === 1
                          ? '0 4px 15px rgba(34, 211, 238, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
                          : '0 4px 15px rgba(251, 146, 60, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
                        : 'inset 0 1px 0 rgba(255,255,255,0.1)',
                      border: isSelected ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Scored Words */}
        {scoredLines.length > 0 && (
          <div className="mb-4 p-4 rounded-3xl backdrop-blur-md" style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.5) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 className="text-white font-bold mb-2 text-sm flex items-center gap-2">
              <span className="text-yellow-400">✨</span> Palabras formadas
            </h3>
            <div className="flex flex-wrap gap-2">
              {scoredLines.map((sl, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider"
                  style={{
                    background: sl.player === 1
                      ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(59, 130, 246, 0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(251, 146, 60, 0.3) 0%, rgba(239, 68, 68, 0.2) 100%)',
                    color: sl.player === 1 ? '#67e8f9' : '#fdba74',
                    border: sl.player === 1 ? '1px solid rgba(34, 211, 238, 0.4)' : '1px solid rgba(251, 146, 60, 0.4)',
                    boxShadow: sl.player === 1
                      ? '0 2px 10px rgba(34, 211, 238, 0.2)'
                      : '0 2px 10px rgba(251, 146, 60, 0.2)'
                  }}
                >
                  {sl.word}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <details className="p-4 rounded-3xl backdrop-blur-md" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.5) 0%, rgba(30, 41, 59, 0.3) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <summary className="text-white font-bold text-sm cursor-pointer hover:text-white/80 flex items-center gap-2">
            <span>💡</span> Cómo jugar
          </summary>
          <ul className="text-white/60 text-xs mt-3 space-y-1.5">
            <li>• Los jugadores se turnan para colocar letras en el tablero</li>
            <li>• Primero selecciona una letra, luego haz clic en una casilla vacía</li>
            <li>• Cuando se completa una línea de 3 letras, se verifica si es una palabra válida</li>
            <li>• Si la palabra existe en el diccionario, ganas <strong className="text-yellow-300">3 puntos</strong></li>
            <li>• Gana quien tenga más puntos al llenar el tablero</li>
          </ul>
        </details>
      </div>
    </div>
  );
}
