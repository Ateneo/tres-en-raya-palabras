import { useState, useEffect } from 'react';
import { getDictionary, addWord, removeWord, initializeDictionary, clearCache } from '../utils/dictionary';
import { saveDictionaryToFirestore } from '../firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface AdminProps {
  onBack: () => void;
}

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
      showMessage('Debes iniciar sesión para modificar el diccionario', 'error');
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
      showMessage('Debes iniciar sesión para modificar el diccionario', 'error');
      return;
    }

    const success = await removeWord(word, user.uid);
    if (success) {
      showMessage(`"${word.toUpperCase()}" eliminada del diccionario`, 'success');
      await loadWords();
    }
  };

  const handleBulkAdd = async () => {
    if (!user) {
      showMessage('Debes iniciar sesión para modificar el diccionario', 'error');
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
      if (success) {
        added++;
      } else {
        skipped++;
      }
    }

    showMessage(`Añadidas: ${added} | Omitidas (duplicadas): ${skipped}`, 'success');
    setBulkInput('');
    setShowBulkInput(false);
    await loadWords();
  };

  const handleReset = async () => {
    if (!user) {
      showMessage('Debes iniciar sesión', 'error');
      return;
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

    try {
      await saveDictionaryToFirestore(DEFAULT_WORDS, user.uid);
      clearCache();
      await loadWords();
      setShowConfirmReset(false);
      showMessage('Diccionario restaurado al original', 'success');
    } catch (error) {
      showMessage('Error al restaurar el diccionario', 'error');
    }
  };

  const filteredWords = words.filter(w => 
    w.includes(searchTerm.toLowerCase())
  );

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
            ⚙️ Administrador
          </h1>
          <div className="text-white/70 text-sm">
            {words.length} palabras
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-center font-semibold ${
            message.type === 'success'
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-red-500/20 text-red-300 border border-red-500/30'
          }`}>
            {message.text}
          </div>
        )}

        {/* Add Word Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">➕ Añadir palabra</h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddWord()}
              placeholder="Escribe una palabra de 3 letras..."
              maxLength={3}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 uppercase text-lg tracking-wider"
            />
            <button
              onClick={handleAddWord}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg transition-all transform hover:scale-105"
            >
              Añadir
            </button>
          </div>
          
          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={() => setShowBulkInput(!showBulkInput)}
              className="text-sm text-blue-300 hover:text-blue-200 underline"
            >
              {showBulkInput ? 'Ocultar' : 'Añadir varias palabras a la vez'}
            </button>
          </div>

          {showBulkInput && (
            <div className="mt-4">
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Escribe varias palabras separadas por comas, espacios o saltos de línea&#10;Ejemplo: sol, mar, pan, luz, rey"
                rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 text-sm"
              />
              <button
                onClick={handleBulkAdd}
                className="mt-2 px-4 py-2 bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 border border-blue-400/30 rounded-lg transition-all"
              >
                Procesar palabras
              </button>
            </div>
          )}
        </div>

        {/* Search and List */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-white">📚 Palabras del diccionario</h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-400 text-sm w-40"
              />
              <span className="text-white/50 text-sm">
                {filteredWords.length} resultado{filteredWords.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-white/40 py-8">
              <i className="fas fa-spinner fa-spin text-2xl"></i>
              <p className="mt-2">Cargando diccionario...</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto pr-2">
              <div className="flex flex-wrap gap-2">
                {filteredWords.map(word => (
                  <div
                    key={word}
                    className="group flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-400/50 rounded-lg transition-all"
                  >
                    <span className="text-white font-mono uppercase text-sm">{word}</span>
                    <button
                      onClick={() => handleRemoveWord(word)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity ml-1"
                      title="Eliminar palabra"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>
              {filteredWords.length === 0 && (
                <div className="text-center text-white/40 py-8">
                  No se encontraron palabras
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reset */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <h2 className="text-xl font-bold text-white mb-3">🔄 Restaurar diccionario</h2>
          <p className="text-white/60 text-sm mb-4">
            Esto eliminará todas las palabras añadidas y restaurará el diccionario original.
          </p>
          
          {showConfirmReset ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-all"
              >
                ⚠️ Confirmar restauración
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-400/30 rounded-lg transition-all"
            >
              Restaurar diccionario original
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
