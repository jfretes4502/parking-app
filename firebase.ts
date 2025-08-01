// firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDcNaWbpF7PhvvE6ahaabS6ko-OYbE-lG4',
  authDomain: 'parkease-5d00e.firebaseapp.com',
  projectId: 'parkease-5d00e',
  storageBucket: 'parkease-5d00e.appspot.com',
  messagingSenderId: '293830701117',
  appId: '1:293830701117:web:e5ceeedfa6e0982b3dba54',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

