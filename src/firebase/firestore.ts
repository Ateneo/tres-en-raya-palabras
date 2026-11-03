import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

// ============ DICCIONARIO ============

const DICTIONARY_DOC_ID = 'global_dictionary';

export interface DictionaryData {
  words: string[];
  updatedAt: string;
  updatedBy: string;
}

export async function getDictionaryFromFirestore(): Promise<string[]> {
  const docSnap = await getDoc(doc(db, 'dictionary', DICTIONARY_DOC_ID));
  if (docSnap.exists()) {
    const data = docSnap.data() as DictionaryData;
    return data.words || [];
  }
  return [];
}

export async function saveDictionaryToFirestore(words: string[], userId: string): Promise<void> {
  await setDoc(doc(db, 'dictionary', DICTIONARY_DOC_ID), {
    words,
    updatedAt: serverTimestamp(),
    updatedBy: userId
  });
}

export async function addWordToFirestore(word: string, userId: string): Promise<boolean> {
  const normalized = word.toLowerCase().trim();
  if (normalized.length !== 3) return false;
  if (!/^[a-zñáéíóúü]+$/.test(normalized)) return false;

  const words = await getDictionaryFromFirestore();
  if (words.includes(normalized)) return false;

  words.push(normalized);
  await saveDictionaryToFirestore(words, userId);
  return true;
}

export async function removeWordFromFirestore(word: string, userId: string): Promise<boolean> {
  const normalized = word.toLowerCase().trim();
  const words = await getDictionaryFromFirestore();
  const index = words.indexOf(normalized);
  if (index === -1) return false;

  words.splice(index, 1);
  await saveDictionaryToFirestore(words, userId);
  return true;
}

// ============ PARTIDAS ============

export interface GameRecord {
  id?: string;
  player1: {
    uid: string;
    displayName: string;
    score: number;
    wordsFormed: string[];
  };
  player2: {
    uid: string;
    displayName: string;
    score: number;
    wordsFormed: string[];
  };
  winner: string | null; // uid del ganador o null si empate
  board: (string | null)[];
  scoredLines: {
    line: number[];
    word: string;
    player: number;
  }[];
  playedAt: string;
  duration: number; // segundos
}

export async function saveGameRecord(game: Omit<GameRecord, 'id'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'games'), {
    ...game,
    playedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function getUserGames(uid: string, limitCount: number = 20): Promise<GameRecord[]> {
  const gamesRef = collection(db, 'games');
  
  // Buscar partidas donde el usuario es player1 o player2
  const q1 = query(
    gamesRef,
    where('player1.uid', '==', uid),
    orderBy('playedAt', 'desc'),
    limit(limitCount)
  );
  
  const q2 = query(
    gamesRef,
    where('player2.uid', '==', uid),
    orderBy('playedAt', 'desc'),
    limit(limitCount)
  );

  try {
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    const games: GameRecord[] = [];
    
    snapshot1.forEach(doc => {
      games.push({ id: doc.id, ...doc.data() } as GameRecord);
    });
    
    snapshot2.forEach(doc => {
      games.push({ id: doc.id, ...doc.data() } as GameRecord);
    });

    // Ordenar por fecha descendente y eliminar duplicados
    const uniqueGames = games.reduce((acc: GameRecord[], game) => {
      if (!acc.find(g => g.id === game.id)) {
        acc.push(game);
      }
      return acc;
    }, []);

    return uniqueGames
      .sort((a, b) => {
        const dateA = a.playedAt ? new Date(a.playedAt).getTime() : 0;
        const dateB = b.playedAt ? new Date(b.playedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error fetching games:', error);
    return [];
  }
}

export async function updatePlayerStats(
  uid: string,
  won: boolean,
  score: number,
  wordsFormed: number
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    const stats = data.stats || { gamesPlayed: 0, gamesWon: 0, totalPoints: 0, wordsFormed: 0 };
    
    await updateDoc(userRef, {
      'stats.gamesPlayed': stats.gamesPlayed + 1,
      'stats.gamesWon': won ? stats.gamesWon + 1 : stats.gamesWon,
      'stats.totalPoints': stats.totalPoints + score,
      'stats.wordsFormed': stats.wordsFormed + wordsFormed
    });
  }
}
