import { useState, useEffect, useCallback } from 'react';
import { isValidWord, getDictionary } from '../utils/dictionary';

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
  [0, 1, 2], // fila 1
  [3, 4, 5], // fila 2
  [6, 7, 8], // fila 3
  [0, 3, 6], // col 1
  [1, 4, 7], // col 2
  [2, 5, 8], // col 3
  [0, 4, 8], // diagonal ↘
  [2, 4, 6], // diagonal ↙
];

export default function Game({ onBack }: GameProps) {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [scoredLines, setScoredLines] = useState<LineScore[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'warning' | 'info' | 'end'>('info');
  const [gameOver, setGameOver] = useState(false);
  const [dictSize, setDictSize] = useState(0);

  useEffect(() => {
    setDictSize(getDictionary().length);
  }, []);

  const checkNewLines = useCallback((newBoard: Board, player: number, existingScored: LineScore[]): LineScore[] => {
    const newScores: LineScore[] = [];
    
    for (const line of LINES) {
      // Skip already scored lines
      const alreadyScored = existingScored.some(
        sl => sl.line[0] === line[0] && sl.line[1] === line[1] && sl.line[2] === line[2]
      );
      if (alreadyScored) continue;

      const cells = line.map(i => newBoard[i]);
      if (cells.every(c => c !== null)) {
        const word = cells.join('');
        if (isValidWord(word)) {
          newScores.push({ line, word, player });
        }
      }
    }
    
    return newScores;
  }, []);

  const handleCellClick = (index: number) => {
    if (board[index] !== null || !selectedLetter || gameOver) return;

    const newBoard = [...board];
    newBoard[index] = selectedLetter;
    
    // Check for new completed valid lines
    const newLineScores = checkNewLines(newBoard, currentPlayer, scoredLines);
    
    // Calculate new scores
    const pointsEarned = newLineScores.length * 3;
    const newScores = { ...scores };
    if (pointsEarned > 0) {
      newScores[currentPlayer as 1 | 2] += pointsEarned;
    }

    // Update all state
    setBoard(newBoard);
    setScores(newScores);

    if (newLineScores.length > 0) {
      setScoredLines(prev => [...prev, ...newLineScores]);
      const words = newLineScores.map(ls => ls.word.toUpperCase()).join(', ');
      setMessage(`¡Jugador ${currentPlayer} formó "${words}"! +${pointsEarned} pts`);
      setMessageType('success');
    } else {
      // Check if any line was completed but invalid
      let invalidCompleted = false;
      for (const line of LINES) {
        const alreadyScored = scoredLines.some(
          sl => sl.line[0] === line[0] && sl.line[1] === line[1] && sl.line[2] === line[2]
        );
        if (alreadyScored) continue;
        const cells = line.map(i => newBoard[i]);
        if (cells.every(c => c !== null)) {
          invalidCompleted = true;
        }
      }
      if (invalidCompleted) {
        setMessage('Línea completada, pero no es una palabra válida del diccionario');
        setMessageType('warning');
      } else {
        setMessage(`Jugador ${currentPlayer} colocó "${selectedLetter.toUpperCase()}"`);
        setMessageType('info');
      }
    }

    // Check if board is full (game over)
    const isFull = newBoard.every(c => c !== null);
    if (isFull) {
      setGameOver(true);
      if (newScores[1] > newScores[2]) {
        setMessage(`¡Jugador 1 gana la partida! (${newScores[1]} - ${newScores[2]})`);
      } else if (newScores[2] > newScores[1]) {
        setMessage(`¡Jugador 2 gana la partida! (${newScores[2]} - ${newScores[1]})`);
      } else {
        setMessage(`¡Empate! (${newScores[1]} - ${newScores[2]})`);
      }
      setMessageType('end');
    }

    // Switch player
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setSelectedLetter('');
  };

  const handleLetterSelect = (letter: string) => {
    setSelectedLetter(letter);
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
  };

  const isCellInScoredLine = (index: number): LineScore | undefined => {
    return scoredLines.find(sl => sl.line.includes(index));
  };

  const alphabet = 'abcdefghijklmnñopqrstuvwxyz'.split('');

  const getMessageColor = () => {
    switch (messageType) {
      case 'success': return 'text-green-300';
      case 'warning': return 'text-yellow-300';
      case 'end': return 'text-white';
      default: return 'text-white/70';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
          >
            <i className="fas fa-arrow-left"></i>
            <span className="hidden sm:inline">Volver</span>
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-white text-center">
            🎯 Tres en Raya: Palabras
          </h1>
          <div className="text-white/50 text-xs">
            📖 {dictSize}
          </div>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-3 rounded-xl border-2 transition-all ${
            currentPlayer === 1 && !gameOver
              ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20'
              : 'border-white/20 bg-white/5'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-blue-300 font-bold text-sm md:text-base">Jugador 1</div>
                <div className="text-white/50 text-xs">🔵 Azul</div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white">{scores[1]}</div>
            </div>
          </div>
          <div className={`p-3 rounded-xl border-2 transition-all ${
            currentPlayer === 2 && !gameOver
              ? 'border-red-400 bg-red-500/20 shadow-lg shadow-red-500/20'
              : 'border-white/20 bg-white/5'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-red-300 font-bold text-sm md:text-base">Jugador 2</div>
                <div className="text-white/50 text-xs">🔴 Rojo</div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-white">{scores[2]}</div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 text-center p-2 rounded-lg ${
            messageType === 'end' ? 'bg-white/10 border border-white/20' : ''
          }`}>
            <span className={`font-semibold text-sm md:text-base ${getMessageColor()}`}>
              {message}
            </span>
          </div>
        )}

        {/* Game Over */}
        {gameOver && (
          <div className="mb-4 text-center">
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              🔄 Jugar de nuevo
            </button>
          </div>
        )}

        {/* Board */}
        <div className="flex justify-center mb-5">
          <div className="grid grid-cols-3 gap-2 p-3 md:p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
            {board.map((cell, index) => {
              const scored = isCellInScoredLine(index);
              return (
                <button
                  key={index}
                  onClick={() => handleCellClick(index)}
                  disabled={cell !== null || !selectedLetter || gameOver}
                  className={`w-[5.5rem] h-[5.5rem] md:w-24 md:h-24 rounded-xl text-3xl md:text-4xl font-bold transition-all duration-200 flex items-center justify-center ${
                    cell !== null
                      ? scored
                        ? scored.player === 1
                          ? 'bg-blue-500/40 border-2 border-blue-400 text-blue-100 shadow-lg shadow-blue-500/30 scale-105'
                          : 'bg-red-500/40 border-2 border-red-400 text-red-100 shadow-lg shadow-red-500/30 scale-105'
                        : 'bg-white/15 border-2 border-white/30 text-white'
                      : selectedLetter && !gameOver
                        ? 'bg-white/10 border-2 border-dashed border-white/30 hover:bg-white/20 hover:border-white/50 hover:scale-105 cursor-pointer active:scale-95'
                        : 'bg-white/5 border-2 border-white/10 cursor-not-allowed'
                  }`}
                >
                  {cell ? (
                    <span className="uppercase drop-shadow-lg">{cell}</span>
                  ) : (
                    selectedLetter && !gameOver && (
                      <span className="text-white/20 uppercase text-2xl">{selectedLetter}</span>
                    )
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Letter Selector */}
        {!gameOver && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-3 md:p-4 mb-4">
            <div className="text-center mb-3">
              <span className="text-white/80 text-sm">
                Turno del{' '}
                <strong className={currentPlayer === 1 ? 'text-blue-300' : 'text-red-300'}>
                  Jugador {currentPlayer}
                </strong>
                {' '}— Elige una letra:
              </span>
              {selectedLetter && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 border border-yellow-400/30 rounded-full">
                  <span className="text-yellow-300 font-bold uppercase text-lg">{selectedLetter}</span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              {alphabet.map(letter => (
                <button
                  key={letter}
                  onClick={() => handleLetterSelect(letter)}
                  className={`w-8 h-8 md:w-9 md:h-9 rounded-lg font-bold text-xs md:text-sm uppercase transition-all duration-150 ${
                    selectedLetter === letter
                      ? currentPlayer === 1
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50 scale-110'
                        : 'bg-red-500 text-white shadow-lg shadow-red-500/50 scale-110'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white hover:scale-105'
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scored Lines */}
        {scoredLines.length > 0 && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 mb-4">
            <h3 className="text-white font-bold mb-2 text-sm">📝 Palabras formadas:</h3>
            <div className="flex flex-wrap gap-2">
              {scoredLines.map((sl, i) => (
                <span
                  key={i}
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    sl.player === 1
                      ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                      : 'bg-red-500/30 text-red-200 border border-red-400/50'
                  }`}
                >
                  {sl.word} <span className="opacity-60">(J{sl.player})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <details className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
          <summary className="text-white font-bold text-sm cursor-pointer hover:text-white/80">
            📖 Cómo jugar
          </summary>
          <ul className="text-white/60 text-xs mt-2 space-y-1.5">
            <li>• Los jugadores se turnan para colocar letras en el tablero</li>
            <li>• Primero selecciona una letra, luego haz clic en una casilla vacía</li>
            <li>• Cuando se completa una línea de 3 letras (fila, columna o diagonal), se verifica si es una palabra válida</li>
            <li>• Si la palabra existe en el diccionario, el jugador que colocó la última letra gana <strong className="text-green-300">3 puntos</strong></li>
            <li>• Gana quien tenga más puntos al llenar el tablero</li>
            <li>• Puedes añadir palabras al diccionario desde el panel de administración</li>
          </ul>
        </details>
      </div>
    </div>
  );
}
