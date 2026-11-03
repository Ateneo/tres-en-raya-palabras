import { useState, useEffect, useRef } from 'react';
import { PrologEngine, PrologMove } from '../prolog/PrologEngine';
import { isValidWord, getDictionary } from '../utils/dictionary';
import { saveGameRecord, updatePlayerStats } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface PrologGameProps {
  onBack: () => void;
}

type CellValue = string | null;
type Board = CellValue[];

interface LineScore {
  line: number[];
  word: string;
  player: number;
}

interface LogEntry {
  type: 'query' | 'result' | 'info' | 'reasoning';
  content: string;
  timestamp: number;
}

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export default function PrologGame({ onBack }: PrologGameProps) {
  const { user, profile } = useAuth();
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState(1); // 1 = humano, 2 = IA
  const [selectedLetter, setSelectedLetter] = useState<string>('');
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [scoredLines, setScoredLines] = useState<LineScore[]>([]);
  const [message, setMessage] = useState<string>('');
  const [gameOver, setGameOver] = useState(false);
  const [prologLoaded, setPrologLoaded] = useState(false);
  const [prologLoading, setPrologLoading] = useState(true);
  const [iaThinking, setIaThinking] = useState(false);
  const [lastMove, setLastMove] = useState<PrologMove | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [dictSize, setDictSize] = useState(0);
  const [playerName, setPlayerName] = useState('Jugador');
  const [startTime] = useState(Date.now());
  const [wordsFormedByPlayer, setWordsFormedByPlayer] = useState<{ 1: string[]; 2: string[] }>({ 1: [], 2: [] });
  const prologEngineRef = useRef<PrologEngine | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeProlog();
    if (user) {
      setPlayerName(profile?.displayName || 'Jugador');
    }
  }, [user, profile]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (type: LogEntry['type'], content: string) => {
    setLogs(prev => [...prev, { type, content, timestamp: Date.now() }]);
  };

  const initializeProlog = async () => {
    try {
      addLog('info', '🔄 Inicializando motor SWI-Prolog (WebAssembly)...');
      const engine = await PrologEngine.getInstance();
      prologEngineRef.current = engine;
      
      addLog('info', '✅ Motor Prolog cargado correctamente');
      addLog('info', '📖 Cargando diccionario en la base de conocimiento...');
      
      const dict = await getDictionary();
      setDictSize(dict.length);
      await engine.loadDictionary(dict);
      
      addLog('info', `✅ ${dict.length} palabras cargadas como hechos Prolog`);
      addLog('info', '🎮 Sistema listo. ¡Comienza la partida!');
      
      setPrologLoaded(true);
      setPrologLoading(false);
    } catch (error) {
      addLog('info', `❌ Error al cargar Prolog: ${error}`);
      setPrologLoading(false);
    }
  };

  const checkNewLines = async (newBoard: Board, player: number, existingScored: LineScore[]): Promise<LineScore[]> => {
    const newScores: LineScore[] = [];
    for (const line of LINES) {
      const alreadyScored = existingScored.some(
        sl => sl.line[0] === line[0] && sl.line[1] === line[1] && sl.line[2] === line[2]
      );
      if (alreadyScored) continue;
      const cells = line.map(i => newBoard[i]);
      if (cells.every(c => c !== null)) {
        const word = cells.join('');
        const valid = await isValidWord(word);
        if (valid) {
          newScores.push({ line, word, player });
        }
      }
    }
    return newScores;
  };

  const handleCellClick = async (index: number) => {
    if (board[index] !== null || !selectedLetter || gameOver || currentPlayer !== 1) return;

    const newBoard = [...board];
    newBoard[index] = selectedLetter;
    
    addLog('query', `👤 Jugador coloca '${selectedLetter.toUpperCase()}' en posición ${index}`);
    
    const validLineScores = await checkNewLines(newBoard, 1, scoredLines);
    const pointsEarned = validLineScores.length * 3;
    const newScores = { ...scores };
    if (pointsEarned > 0) newScores[1] += pointsEarned;

    const newWordsFormed = { ...wordsFormedByPlayer };
    if (validLineScores.length > 0) {
      newWordsFormed[1] = [...newWordsFormed[1], ...validLineScores.map(ls => ls.word)];
      setWordsFormedByPlayer(newWordsFormed);
      const words = validLineScores.map(ls => ls.word.toUpperCase()).join(', ');
      setMessage(`¡Formaste "${words}"! +${pointsEarned} pts`);
      addLog('result', `✨ Palabra válida detectada: ${words}`);
    } else {
      setMessage(`Colocaste "${selectedLetter.toUpperCase()}"`);
    }

    setBoard(newBoard);
    setScores(newScores);
    if (validLineScores.length > 0) {
      setScoredLines(prev => [...prev, ...validLineScores]);
    }

    const isFull = newBoard.every(c => c !== null);
    if (isFull) {
      endGame(newBoard, newScores, newWordsFormed);
      return;
    }

    // Turno de la IA
    setCurrentPlayer(2);
    setSelectedLetter('');
    setTimeout(() => executeAIMove(newBoard, newScores, newWordsFormed), 800);
  };

  const executeAIMove = async (currentBoard: Board, currentScores: typeof scores, currentWords: typeof wordsFormedByPlayer) => {
    if (!prologEngineRef.current) return;
    
    setIaThinking(true);
    addLog('info', '🤖 Turno de la IA Prolog...');
    addLog('query', '🔍 Ejecutando consulta: mejor_jugada(Tablero, _, Letra, Pos, Punt, Raz)');
    
    // La IA elige una letra aleatoria del alfabeto
    const alphabet = 'abcdefghijklmnñopqrstuvwxyz'.split('');
    const iaLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    
    addLog('info', `🎲 IA selecciona letra: '${iaLetter.toUpperCase()}'`);
    addLog('query', `🧠 Consultando Prolog con backtracking para encontrar posición óptima...`);
    
    // Simular tiempo de "pensamiento"
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    try {
      const move = await prologEngineRef.current.calculateBestMove(currentBoard, iaLetter);
      setLastMove(move);
      
      addLog('result', `📍 Posición seleccionada: ${move.position}`);
      addLog('result', `📊 Puntuación evaluada: ${move.score}`);
      
      if (move.reasoning && move.reasoning.length > 0) {
        move.reasoning.forEach((r, i) => {
          addLog('reasoning', `   ${i + 1}. ${r}`);
        });
      }
      
      // Ejecutar la jugada
      const newBoard = [...currentBoard];
      newBoard[move.position] = iaLetter;
      
      const validLineScores = await checkNewLines(newBoard, 2, scoredLines);
      const pointsEarned = validLineScores.length * 3;
      const newScores = { ...currentScores };
      if (pointsEarned > 0) newScores[2] += pointsEarned;

      const newWordsFormed = { ...currentWords };
      if (validLineScores.length > 0) {
        newWordsFormed[2] = [...newWordsFormed[2], ...validLineScores.map(ls => ls.word)];
        setWordsFormedByPlayer(newWordsFormed);
        const words = validLineScores.map(ls => ls.word.toUpperCase()).join(', ');
        setMessage(`IA formó "${words}" +${pointsEarned} pts`);
        addLog('result', `✨ IA formó palabra: ${words}`);
      } else {
        setMessage(`IA colocó "${iaLetter.toUpperCase()}" en posición ${move.position}`);
      }

      setBoard(newBoard);
      setScores(newScores);
      if (validLineScores.length > 0) {
        setScoredLines(prev => [...prev, ...validLineScores]);
      }

      const isFull = newBoard.every(c => c !== null);
      if (isFull) {
        endGame(newBoard, newScores, newWordsFormed);
        return;
      }

      setCurrentPlayer(1);
    } catch (error) {
      addLog('info', `❌ Error en consulta Prolog: ${error}`);
      // Fallback: jugada aleatoria
      const emptyPositions = currentBoard.map((c, i) => c === null ? i : -1).filter(i => i !== -1);
      const randomPos = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
      const newBoard = [...currentBoard];
      newBoard[randomPos] = iaLetter;
      setBoard(newBoard);
      setCurrentPlayer(1);
    } finally {
      setIaThinking(false);
    }
  };

  const endGame = async (finalBoard: Board, finalScores: typeof scores, finalWords: typeof wordsFormedByPlayer) => {
    setGameOver(true);
    let winnerMsg = '';
    let winnerUid: string | null = null;
    
    if (finalScores[1] > finalScores[2]) {
      winnerMsg = `¡${playerName} gana! (${finalScores[1]} - ${finalScores[2]})`;
      winnerUid = user?.uid || null;
      addLog('result', `🏆 ¡Victoria del jugador humano!`);
    } else if (finalScores[2] > finalScores[1]) {
      winnerMsg = `¡IA Prolog gana! (${finalScores[2]} - ${finalScores[1]})`;
      addLog('result', `🤖 ¡Victoria de la máquina Prolog!`);
    } else {
      winnerMsg = `¡Empate! (${finalScores[1]} - ${finalScores[2]})`;
      addLog('result', `🤝 ¡Empate!`);
    }
    setMessage(winnerMsg);

    if (user) {
      try {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        await saveGameRecord({
          player1: { uid: user.uid, displayName: playerName, score: finalScores[1], wordsFormed: finalWords[1] },
          player2: { uid: 'prolog-ai', displayName: 'IA Prolog', score: finalScores[2], wordsFormed: finalWords[2] },
          winner: winnerUid,
          board: finalBoard,
          scoredLines,
          playedAt: new Date().toISOString(),
          duration
        });
        await updatePlayerStats(user.uid, finalScores[1] > finalScores[2], finalScores[1], finalWords[1].length);
      } catch (error) {
        console.error('Error saving game:', error);
      }
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer(1);
    setSelectedLetter('');
    setScores({ 1: 0, 2: 0 });
    setScoredLines([]);
    setMessage('');
    setGameOver(false);
    setLastMove(null);
    setLogs([]);
    setWordsFormedByPlayer({ 1: [], 2: [] });
    addLog('info', '🔄 Nueva partida iniciada');
  };

  const alphabet = 'abcdefghijklmnñopqrstuvwxyz'.split('');

  if (prologLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #0a1128 0%, #1a1b4b 40%, #3d2c5e 70%, #1e3a5f 100%)'
      }}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="relative text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center relative overflow-hidden" style={{
            background: 'linear-gradient(145deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
            boxShadow: '0 20px 50px rgba(6, 182, 212, 0.4), inset 0 2px 0 rgba(255,255,255,0.4)'
          }}>
            <div className="absolute top-0 left-0 right-0 h-1/2" style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)'
            }}></div>
            <span className="text-4xl relative">🧠</span>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Cargando Motor Prolog</h2>
          <p className="text-white/60 mb-4">Inicializando SWI-Prolog WebAssembly...</p>
          <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
          <div className="mt-6 text-left max-w-md mx-auto">
            {logs.map((log, i) => (
              <div key={i} className="text-xs text-white/50 mb-1 font-mono">{log.content}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0a1128 0%, #1a1b4b 40%, #3d2c5e 70%, #1e3a5f 100%)'
    }}>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white transition-all border border-white/10">
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300">
              🧠 vs IA PROLOG
            </h1>
            <p className="text-white/40 text-xs">SWI-Prolog WebAssembly</p>
          </div>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 backdrop-blur-md rounded-xl text-blue-300 transition-all border border-blue-400/30 text-sm"
          >
            <i className="fas fa-info-circle"></i>
          </button>
        </div>

        {/* Explanation Panel */}
        {showExplanation && (
          <div className="mb-4 p-5 rounded-2xl backdrop-blur-md" style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.3)'
          }}>
            <h3 className="text-cyan-300 font-black text-lg mb-3">🔬 ¿Cómo funciona la IA Prolog?</h3>
            <div className="space-y-3 text-sm text-white/80">
              <div>
                <strong className="text-cyan-300">🧮 Programación Simbólica:</strong> A diferencia de las redes neuronales, Prolog usa lógica formal y backtracking para encontrar soluciones. Cada jugada se calcula mediante reglas lógicas, no patrones estadísticos.
              </div>
              <div>
                <strong className="text-cyan-300">🔄 Backtracking:</strong> Prolog explora automáticamente todas las posibilidades. Si una jugada no funciona, vuelve atrás y prueba otra. Esto garantiza encontrar la solución óptima.
              </div>
              <div>
                <strong className="text-cyan-300">📚 Base de Conocimiento:</strong> El diccionario se carga como hechos Prolog (<code className="bg-black/30 px-1 rounded">palabra_valida(sol).</code>). El motor puede consultar esta base instantáneamente.
              </div>
              <div>
                <strong className="text-cyan-300">🤝 Neurosimbólico:</strong> Este juego combina lo mejor de ambos mundos: la interfaz moderna (neural) con el razonamiento lógico (simbólico). Es un ejemplo de programación neurosimbólica.
              </div>
              <div>
                <strong className="text-cyan-300">⚡ WebAssembly:</strong> SWI-Prolog se ejecuta nativamente en tu navegador gracias a WASM, sin necesidad de servidor.
              </div>
            </div>
            <button
              onClick={() => setShowExplanation(false)}
              className="mt-3 px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 text-sm"
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Game Area */}
          <div className="lg:col-span-2">
            {/* Scores */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className={`p-3 rounded-2xl border-2 transition-all ${
                currentPlayer === 1 && !gameOver ? 'border-cyan-400 shadow-lg shadow-cyan-500/40' : 'border-white/20'
              }`} style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-cyan-300 font-bold text-sm truncate max-w-[110px]">{playerName}</div>
                    <div className="text-white/50 text-xs">👤 Humano</div>
                  </div>
                  <div className="text-3xl font-black text-white">{scores[1]}</div>
                </div>
              </div>
              <div className={`p-3 rounded-2xl border-2 transition-all ${
                currentPlayer === 2 && !gameOver ? 'border-purple-400 shadow-lg shadow-purple-500/40' : 'border-white/20'
              }`} style={{ background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-purple-300 font-bold text-sm">IA Prolog</div>
                    <div className="text-white/50 text-xs">🤖 Máquina</div>
                  </div>
                  <div className="text-3xl font-black text-white">{scores[2]}</div>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className="mb-3 text-center p-2 rounded-xl bg-white/5 border border-white/10">
                <span className="font-bold text-sm text-white/90">{message}</span>
              </div>
            )}

            {/* IA Thinking Indicator */}
            {iaThinking && (
              <div className="mb-3 text-center p-3 rounded-xl" style={{
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
                border: '1px solid rgba(147, 51, 234, 0.3)'
              }}>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  <span className="text-purple-300 font-bold text-sm">IA Prolog calculando con backtracking...</span>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="mb-3 text-center">
                <button onClick={resetGame} className="px-6 py-2 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-black rounded-xl transition-all transform hover:scale-105 shadow-lg">
                  🔄 JUGAR DE NUEVO
                </button>
              </div>
            )}

            {/* Board */}
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-3xl" style={{
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}>
                <div className="grid grid-cols-3 gap-2">
                  {board.map((cell, index) => {
                    const scored = scoredLines.find(sl => sl.line.includes(index));
                    const isLastMove = lastMove?.position === index;
                    const isEmpty = cell === null;
                    const canPlace = isEmpty && selectedLetter && !gameOver && currentPlayer === 1;

                    return (
                      <button
                        key={index}
                        onClick={() => handleCellClick(index)}
                        disabled={isEmpty && (!selectedLetter || gameOver || currentPlayer !== 1)}
                        className={`relative w-20 h-20 md:w-24 md:h-24 rounded-2xl font-black text-4xl uppercase transition-all duration-300 ${
                          canPlace ? 'cursor-pointer active:scale-95 hover:scale-105' : ''
                        }`}
                        style={{
                          transform: isLastMove ? 'scale(1.1)' : 'scale(1)'
                        }}
                      >
                        {isEmpty ? (
                          <div className="absolute inset-0 rounded-2xl" style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                            border: '2px dashed rgba(255,255,255,0.15)'
                          }}>
                            {canPlace && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white/20 text-2xl font-black">{selectedLetter}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{
                              background: isLastMove
                                ? 'linear-gradient(145deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%)'
                                : scored
                                  ? scored.player === 1
                                    ? 'linear-gradient(145deg, #22d3ee 0%, #0891b2 50%, #0e7490 100%)'
                                    : 'linear-gradient(145deg, #a855f7 0%, #7c3aed 50%, #6d28d9 100%)'
                                  : 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)',
                              boxShadow: isLastMove || (scored && scored.player === 2)
                                ? '0 10px 30px rgba(168, 85, 247, 0.5), inset 0 2px 0 rgba(255,255,255,0.3)'
                                : scored?.player === 1
                                  ? '0 8px 20px rgba(34, 211, 238, 0.4), inset 0 2px 0 rgba(255,255,255,0.3)'
                                  : '0 8px 20px rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.5)'
                            }}>
                              <div className="absolute top-0 left-0 right-0 h-1/2 rounded-t-2xl" style={{
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)'
                              }}></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className={`${isLastMove || (scored && scored.player === 2) ? 'text-white' : scored?.player === 1 ? 'text-white' : 'text-slate-800'} drop-shadow-lg`}>
                                  {cell}
                                </span>
                              </div>
                            </div>
                            {isLastMove && (
                              <div className="absolute -inset-2 rounded-3xl animate-pulse pointer-events-none" style={{
                                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)'
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
            {!gameOver && currentPlayer === 1 && (
              <div className="p-3 rounded-2xl backdrop-blur-md mb-4" style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.5) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div className="text-center mb-2">
                  <span className="text-white/90 text-sm font-semibold">Tu turno — Elige letra:</span>
                  {selectedLetter && (
                    <span className="ml-2 inline-block px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg">
                      <span className="text-white font-black uppercase">{selectedLetter}</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                  {alphabet.map(letter => (
                    <button
                      key={letter}
                      onClick={() => setSelectedLetter(letter)}
                      className="w-8 h-8 rounded-lg font-black text-xs uppercase transition-all active:scale-90"
                      style={{
                        transform: selectedLetter === letter ? 'scale(1.15)' : 'scale(1)',
                        background: selectedLetter === letter
                          ? 'linear-gradient(145deg, #22d3ee 0%, #0891b2 100%)'
                          : 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                        color: selectedLetter === letter ? 'white' : 'rgba(255,255,255,0.8)',
                        boxShadow: selectedLetter === letter ? '0 4px 15px rgba(34, 211, 238, 0.5)' : 'none'
                      }}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prolog Console */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl overflow-hidden h-full flex flex-col" style={{
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.8) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
            }}>
              <div className="p-3 border-b border-white/10" style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)'
              }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-cyan-300 font-bold text-sm">Consola Prolog</span>
                  <span className="text-white/40 text-xs ml-auto">📖 {dictSize} hechos</span>
                </div>
              </div>
              <div ref={logContainerRef} className="flex-1 p-3 overflow-y-auto max-h-[500px] font-mono text-xs space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className={`${
                    log.type === 'query' ? 'text-yellow-300' :
                    log.type === 'result' ? 'text-green-300' :
                    log.type === 'reasoning' ? 'text-purple-300' :
                    'text-white/70'
                  }`}>
                    {log.content}
                  </div>
                ))}
                {logs.length === 0 && (
                  <div className="text-white/40 text-center py-8">
                    Esperando primera jugada...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
