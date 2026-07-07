// Firebase initialization — Cyber Hygiene Assessment
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBI69bbx5ZRnCyUjKyIJRzrM9wEQ4dH6p8",
  authDomain: "cyber-hygiene-assessment.firebaseapp.com",
  projectId: "cyber-hygiene-assessment",
  storageBucket: "cyber-hygiene-assessment.firebasestorage.app",
  messagingSenderId: "905533469702",
  appId: "1:905533469702:web:2c8d1baf0a6fd2acc0bf87",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
