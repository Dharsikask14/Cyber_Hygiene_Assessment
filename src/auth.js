// Authentication helpers
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase.js';

// Save/update user profile in Firestore
export async function saveUserProfile(uid, data) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, { ...data, lastLogin: serverTimestamp() }, { merge: true });
}

// Get user profile from Firestore
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

// Sign up with email + password
export async function signUpWithEmail({ name, email, password, phone, company }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await saveUserProfile(cred.user.uid, {
    name,
    email,
    phone: phone || '',
    company: company || '',
    photoURL: '',
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

// Sign in with email + password
export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await saveUserProfile(cred.user.uid, { lastLogin: serverTimestamp() });
  return cred.user;
}

// Sign out
export function signOutUser() {
  return signOut(auth);
}

// Listen to auth state changes
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
