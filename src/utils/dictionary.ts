import {
  getDictionaryFromFirestore,
  addWordToFirestore,
  removeWordFromFirestore,
  saveDictionaryToFirestore
} from '../firebase/firestore';

// Diccionario por defecto (fallback local)
const DEFAULT_WORDS: string[] = [
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

// Cache local para evitar peticiones constantes
let cachedDictionary: string[] | null = null;

export async function getDictionary(): Promise<string[]> {
  if (cachedDictionary) {
    return cachedDictionary;
  }
  
  try {
    const words = await getDictionaryFromFirestore();
    if (words.length > 0) {
      cachedDictionary = words;
      return words;
    }
  } catch (error) {
    console.error('Error fetching dictionary from Firestore:', error);
  }
  
  // Fallback al diccionario por defecto
  cachedDictionary = [...DEFAULT_WORDS];
  return cachedDictionary;
}

export async function initializeDictionary(userId: string): Promise<void> {
  try {
    const words = await getDictionaryFromFirestore();
    if (words.length === 0) {
      // Si no hay diccionario en Firestore, inicializar con el por defecto
      await saveDictionaryToFirestore(DEFAULT_WORDS, userId);
      cachedDictionary = [...DEFAULT_WORDS];
    }
  } catch (error) {
    console.error('Error initializing dictionary:', error);
  }
}

export async function addWord(word: string, userId: string): Promise<boolean> {
  try {
    const success = await addWordToFirestore(word, userId);
    if (success) {
      // Actualizar cache local
      cachedDictionary = null;
      await getDictionary();
    }
    return success;
  } catch (error) {
    console.error('Error adding word:', error);
    return false;
  }
}

export async function removeWord(word: string, userId: string): Promise<boolean> {
  try {
    const success = await removeWordFromFirestore(word, userId);
    if (success) {
      // Actualizar cache local
      cachedDictionary = null;
      await getDictionary();
    }
    return success;
  } catch (error) {
    console.error('Error removing word:', error);
    return false;
  }
}

export async function isValidWord(word: string): Promise<boolean> {
  const normalized = word.toLowerCase().trim();
  const dict = await getDictionary();
  return dict.includes(normalized);
}

export function clearCache(): void {
  cachedDictionary = null;
}
