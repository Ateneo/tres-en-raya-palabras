import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCqpmcHnDleUmKMtwPzG1oKYXEADaewmXU",
  authDomain: "tres-en-raya-palabras.firebaseapp.com",
  projectId: "tres-en-raya-palabras",
  storageBucket: "tres-en-raya-palabras.firebasestorage.app",
  messagingSenderId: "454332523860",
  appId: "1:454332523860:web:6e2805fdb3d9b7880d14c1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
