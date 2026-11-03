import { useState, useEffect } from 'react';
import { getDictionary, addWord, removeWord, clearCache } from '../utils/dictionary';
import { saveDictionaryToFirestore } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface AdminProps {
  onBack: () => void;
}

const DEFAULT_WORDS = [
  'ala', 'amo', 'ana', 'ano', 'ara', 'aro', 'asa', 'ata', 'ate', 'ato',
  'ava', 'azo', 'bar', 'bas', 'bat', 'boa', 'bol', 'bon', 'bor', 'bos',
  'bot', 'bue', 'bus', 'buz', 'cab', 'cal', 'can', 'cap', 'car', 'cas',
  'cel', 'cen', 'cer', 'cia', 'cid', 'cie', 'cil', 'cin', 'cio', 'cir',
  'col', 'con', 'cor', 'cos', 'cre', 'cri', 'cru', 'cua', 'cub', 'cue',
  'cul', 'cur', 'dal', 'dan', 'dar', 'das', 'dea', 'del', 'den', 'des',
  'dia', 'die', 'din', 'dio', 'dis', 'don', 'dos', 'eco', 'efe', 'eje',
  'ela', 'eli', 'ema', 'ena', 'ene', 'era', 'ere', 'ero', 'esa', 'ese',
  'eso', 'eva', 'fal', 'fan', 'far', 'fin', 'fis', 'fon', 'for', 'fra',
  'fre', 'fri', 'fro', 'fue', 'fun', 'fur', 'gal', 'gan', 'gar', 'gas',
  'gel', 'gen', 'gil', 'gol', 'gon', 'gor', 'gos', 'gru', 'gua', 'gue',
  'gui', 'gun', 'gur', 'hal', 'han', 'har', 'has', 'hay', 'hel', 'hen',
  'her', 'hia', 'hie', 'hil', 'hip', 'his', 'hit', 'hol', 'hon', 'hor',
  'hos', 'hue', 'hui', 'hum', 'hur', 'iba', 'ice', 'ida', 'ide', 'ido',
  'ija', 'ijo', 'ila', 'ile', 'ilo', 'ima', 'ina', 'ine', 'ino', 'ion',
  'ira', 'ire', 'iro', 'isa', 'ise', 'iso', 'ita', 'ite', 'ito', 'iva',
  'ivo', 'jal', 'jar', 'jea', 'jin', 'jir', 'jol', 'jon', 'jor', 'jos',
  'joy', 'jun', 'jur', 'lan', 'lar', 'las', 'lat', 'lea', 'led', 'leg',
  'lei', 'leo', 'ler', 'les', 'ley', 'lia', 'lid', 'lie', 'lin', 'lio',
  'lir', 'lis', 'lit', 'lob', 'loc', 'log', 'lom', 'lon', 'lor', 'los',
  'luc', 'lue', 'lui', 'lun', 'lur', 'lus', 'luz', 'mac', 'mad', 'mal',
  'mam', 'man', 'map', 'mar', 'mas', 'mat', 'may', 'med', 'mel', 'men',
  'mer', 'mes', 'met', 'mia', 'mid', 'mil', 'min', 'mio', 'mir', 'mis',
  'mit', 'moc', 'mod', 'mol', 'mon', 'mor', 'mos', 'mot', 'mud', 'mug',
  'muj', 'mul', 'mun', 'mur', 'mus', 'mut', 'nac', 'nad', 'nal', 'nap',
  'nar', 'nas', 'nat', 'nel', 'neo', 'ner', 'nes', 'net', 'nia', 'nid',
  'nie', 'nin', 'nio', 'nis', 'nit', 'nob', 'non', 'nor', 'nos', 'not',
  'nov', 'nub', 'nul', 'nun', 'oca', 'oda', 'odi', 'odo', 'ojo', 'ola',
  'ole', 'oli', 'olo', 'oma', 'ona', 'one', 'ono', 'opa', 'ope', 'opi',
  'ora', 'ore', 'ori', 'oro', 'osa', 'ose', 'osi', 'oso', 'ota', 'ote',
  'oto', 'ova', 'ove', 'ovi', 'ovo', 'pac', 'pad', 'pag', 'pal', 'pan',
  'pap', 'par', 'pas', 'pat', 'pay', 'pea', 'pec', 'ped', 'peg', 'pel',
  'pen', 'per', 'pes', 'pet', 'pez', 'pia', 'pic', 'pid', 'pie', 'pil',
  'pin', 'pio', 'pir', 'pis', 'pit', 'pla', 'ple', 'pli', 'plo', 'plu',
  'pob', 'poc', 'pod', 'pol', 'pon', 'pop', 'por', 'pos', 'pot', 'poy',
  'poz', 'pra', 'pre', 'pri', 'pro', 'pru', 'pub', 'pud', 'pul', 'pun',
  'pur', 'pus', 'put', 'que', 'qui', 'ras', 'rat', 'ray', 'raz', 'red',
  'reg', 'rem', 'ren', 'reo', 'rep', 'res', 'ret', 'rey', 'rez', 'ria',
  'rid', 'rie', 'ril', 'rin', 'rio', 'rir', 'ris', 'rit', 'riz', 'rob',
  'roc', 'rod', 'roe', 'rol', 'rom', 'ron', 'rop', 'ror', 'ros', 'rot',
  'roz', 'rue', 'rui', 'rum', 'run', 'rus', 'rut', 'sab', 'sac', 'sal',
  'san', 'sap', 'sar', 'sas', 'sat', 'sea', 'sec', 'sed', 'seg', 'sel',
  'sen', 'ser', 'ses', 'set', 'sex', 'sid', 'sie', 'sil', 'sin', 'sir',
  'sis', 'sit', 'sob', 'soc', 'sol', 'son', 'sop', 'sor', 'sos', 'sot',
  'soy', 'sub', 'suc', 'sud', 'sue', 'sul', 'sum', 'sun', 'sup', 'sur',
  'sus', 'sut', 'tab', 'tac', 'tal', 'tan', 'tap', 'tar', 'tas', 'tat',
  'tea', 'ted', 'tel', 'tem', 'ten', 'ter', 'tes', 'tet', 'tez', 'tia',
  'tic', 'tie', 'til', 'tin', 'tio', 'tip', 'tir', 'tis', 'tit', 'tiz',
  'toc', 'tol', 'tom', 'ton', 'top', 'tor', 'tos', 'tot', 'toy', 'tra',
  'tre', 'tri', 'tro', 'tru', 'tub', 'tul', 'tum', 'tun', 'tur', 'tus',
  'tut', 'ube', 'ubi', 'uda', 'udo', 'ufa', 'uga', 'ugo', 'ula', 'ule',
  'ulo', 'uma', 'ume', 'umo', 'una', 'une', 'uni', 'uno', 'upa', 'upe',
  'ura', 'ure', 'uri', 'uro', 'usa', 'use', 'uso', 'uva', 'vac', 'vad',
  'vag', 'val', 'van', 'var', 'vas', 'vat', 'vea', 'ved', 'vel', 'ven',
  'ver', 'ves', 'vet', 'vez', 'via', 'vid', 'vie', 'vil', 'vin', 'vio',
  'vir', 'vis', 'vit', 'viv', 'vol', 'vor', 'vos', 'vot', 'voy', 'vul',
  'yen', 'yer', 'yes', 'yin', 'yod', 'zan', 'zar', 'zas', 'zen', 'zul',
  'zun', 'zur'
];

export default function Admin({ onBack }: AdminProps) {
  const { user } = useAuth();
  const [words, setWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setLoading(true);
    const dict = await getDictionary();
    setWords(dict.sort());
    setLoading(false);
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAddWord = async () => {
    if (!user) {
      showMessage('Debes iniciar sesión', 'error');
      return;
    }
    const word = newWord.toLowerCase().trim();
    if (word.length !== 3) {
      showMessage('La palabra debe tener exactamente 3 letras', 'error');
      return;
    }
    if (!/^[a-zñáéíóúü]+$/.test(word)) {
      showMessage('La palabra solo puede contener letras', 'error');
      return;
    }
    const success = await addWord(word, user.uid);
    if (success) {
      showMessage(`"${word.toUpperCase()}" añadida al diccionario`, 'success');
      setNewWord('');
      await loadWords();
    } else {
      showMessage(`"${word.toUpperCase()}" ya existe en el diccionario`, 'error');
    }
  };

  const handleRemoveWord = async (word: string) => {
    if (!user) {
      showMessage('Debes iniciar sesión', 'error');
      return;
    }
    const success = await removeWord(word, user.uid);
    if (success) {
      showMessage(`"${word.toUpperCase()}" eliminada`, 'success');
      await loadWords();
    }
  };

  const handleBulkAdd = async () => {
    if (!user) {
      showMessage('Debes iniciar sesión', 'error');
      return;
    }
    const wordList = bulkInput
      .split(/[\n,;]+/)
      .map(w => w.toLowerCase().trim())
      .filter(w => w.length === 3 && /^[a-zñáéíóúü]+$/.test(w));

    let added = 0;
    let skipped = 0;
    const uniqueWords = [...new Set(wordList)];
    for (const word of uniqueWords) {
      const success = await addWord(word, user.uid);
      if (success) added++;
      else skipped++;
    }
    showMessage(`Añadidas: ${added} | Omitidas: ${skipped}`, 'success');
    setBulkInput('');
    setShowBulkInput(false);
    await loadWords();
  };

  const handleReset = async () => {
    if (!user) return;
    try {
      await saveDictionaryToFirestore(DEFAULT_WORDS, user.uid);
      clearCache();
      await loadWords();
      setShowConfirmReset(false);
      showMessage('Diccionario restaurado', 'success');
    } catch {
      showMessage('Error al restaurar', 'error');
    }
  };

  const filteredWords = words.filter(w => w.includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #0a1128 0%, #1a1b4b 40%, #3d2c5e 70%, #c44b2b 100%)'
    }}>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
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
          <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-orange-300">
            📚 DICCIONARIO
          </h1>
          <div className="px-3 py-2 bg-white/10 backdrop-blur-md rounded-xl text-white/70 text-xs border border-white/10">
            {words.length} palabras
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-2xl text-center font-bold backdrop-blur-md border ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-200 border-green-400/30'
              : 'bg-red-500/20 text-red-200 border-red-400/30'
          }`}>
            {message.text}
          </div>
        )}

        {/* Add Word Section */}
        <div className="p-5 rounded-3xl backdrop-blur-md mb-5" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
            <span className="text-green-400">➕</span> Añadir palabra
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
              placeholder="3 letras..."
              maxLength={3}
              className="flex-1 px-4 py-3 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/50 uppercase text-lg tracking-wider font-black text-center"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)'
              }}
            />
            <button
              onClick={handleAddWord}
              className="px-6 py-3 rounded-xl font-black text-white transition-all transform hover:scale-105 active:scale-95 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3), inset 0 2px 0 rgba(255,255,255,0.2), inset 0 -3px 0 rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.15)'
              }}
            >
              AÑADIR
            </button>
          </div>
          <div className="mt-3">
            <button
              onClick={() => setShowBulkInput(!showBulkInput)}
              className="text-sm text-cyan-300 hover:text-cyan-200 font-semibold"
            >
              {showBulkInput ? '✕ Ocultar' : '✨ Añadir varias a la vez'}
            </button>
          </div>
          {showBulkInput && (
            <div className="mt-4">
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="sol, mar, pan, luz, rey..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 text-sm"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)'
                }}
              />
              <button
                onClick={handleBulkAdd}
                className="mt-2 px-4 py-2 rounded-xl font-bold text-cyan-200 transition-all hover:bg-cyan-500/20"
                style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.3)'
                }}
              >
                Procesar
              </button>
            </div>
          )}
        </div>

        {/* Search and List */}
        <div className="p-5 rounded-3xl backdrop-blur-md mb-5" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span className="text-yellow-400">📖</span> Palabras
            </h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="px-3 py-2 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-400/50 text-sm"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.2)'
                }}
              />
              <span className="text-white/50 text-xs font-semibold">{filteredWords.length}</span>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-white/40 py-8">
              <i className="fas fa-spinner fa-spin text-2xl"></i>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto pr-2">
              <div className="flex flex-wrap gap-2">
                {filteredWords.map(word => (
                  <div
                    key={word}
                    className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                    }}
                  >
                    <span className="text-white font-black uppercase text-sm tracking-wider">{word}</span>
                    <button
                      onClick={() => handleRemoveWord(word)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
              {filteredWords.length === 0 && (
                <div className="text-center text-white/40 py-8">Sin resultados</div>
              )}
            </div>
          )}
        </div>

        {/* Reset */}
        <div className="p-5 rounded-3xl backdrop-blur-md" style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <h2 className="text-lg font-black text-white mb-2 flex items-center gap-2">
            <span className="text-orange-400">🔄</span> Restaurar
          </h2>
          <p className="text-white/60 text-sm mb-4">
            Elimina las palabras añadidas y restaura el diccionario original.
          </p>
          {showConfirmReset ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl font-black text-white transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  boxShadow: '0 8px 20px rgba(220, 38, 38, 0.3), inset 0 2px 0 rgba(255,255,255,0.2)'
                }}
              >
                ⚠️ CONFIRMAR
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 rounded-xl font-bold text-white/70 hover:text-white bg-white/10 hover:bg-white/20 transition-all"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="px-4 py-2 rounded-xl font-bold text-orange-300 transition-all hover:bg-orange-500/10"
              style={{
                background: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.3)'
              }}
            >
              Restaurar original
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
