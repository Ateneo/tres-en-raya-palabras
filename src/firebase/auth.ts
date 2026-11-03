import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: Date;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    totalPoints: number;
    wordsFormed: number;
  };
}

// Escuchar cambios de autenticación
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Registro de usuario
export async function registerUser(email: string, password: string, displayName: string): Promise<UserProfile> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  
  await updateProfile(user, { displayName });
  
  const profile: UserProfile = {
    uid: user.uid,
    email: user.email || email,
    displayName,
    isAdmin: false,
    createdAt: new Date(),
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      totalPoints: 0,
      wordsFormed: 0
    }
  };
  
  await setDoc(doc(db, 'users', user.uid), {
    ...profile,
    createdAt: new Date().toISOString()
  });
  
  return profile;
}

// Login
export async function loginUser(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

// Logout
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

// Obtener perfil del usuario
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
}

// Usuario actual
export function getCurrentUser(): User | null {
  return auth.currentUser;
}
