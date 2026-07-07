// Firestore database helpers — no Firebase Storage needed
// PDFs are generated on-demand in the browser (free, no storage cost)
import {
  doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

// ─── Certificates ─────────────────────────────────────────────────

// Save a certificate record to Firestore
export async function saveCertificate({ uid, certId, name, email, company, assessmentType, score, maxScore, percentage, grade, gradeLabel, answers, qrPayload, verifyUrl, issuedAt }) {
  const certRef = doc(db, 'certificates', certId);
  await setDoc(certRef, {
    uid,
    certId,
    name,
    email,
    company: company || '',
    assessmentType,
    score,
    maxScore,
    percentage,
    grade,
    gradeLabel,
    answers: answers || {},
    qrPayload: qrPayload || '',
    verifyUrl: verifyUrl || '',
    issuedAt: issuedAt || serverTimestamp(),
  });
  return certId;
}

// Get a single certificate by ID (works on ANY device globally)
export async function getCertificate(certId) {
  if (!certId) return null;
  const snap = await getDoc(doc(db, 'certificates', certId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// Get all certificates for a user
export async function getUserCertificates(uid) {
  const q = query(collection(db, 'certificates'), where('uid', '==', uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── User Profile ─────────────────────────────────────────────────

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}
