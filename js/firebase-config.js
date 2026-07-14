// ── Firebase configuration ───────────────────────────────────────────────
// Replace with your own project's config (Firebase Console → Project settings → Your apps).
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCnpndyyM5ZDzQ5ySo4xUhGcFgYCDFcTgk",
  authDomain: "routeslip-5d075.firebaseapp.com",
  projectId: "routeslip-5d075",
  storageBucket: "routeslip-5d075.firebasestorage.app",
  messagingSenderId: "688359113227",
  appId: "1:688359113227:web:e84ca5908696b3783c3d0e",
  measurementId: "G-0EYWN40DYB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut,
  doc, setDoc, getDoc, addDoc, updateDoc, collection, onSnapshot, query, orderBy, serverTimestamp
};

// ── Shared constants ─────────────────────────────────────────────────────
// Order = the fixed route the slip travels.
export const STAGES = [
  "Evaluator",
  "Focal",
  "Program in Charge",
  "Budget Division",
  "Accounting Division",
  "Cash Division"
];

// Lightweight gate so new sign-ups pick the right role. This is CLIENT-SIDE
// ONLY and not a real security boundary — lock the `role` field server-side
// with Firestore rules (see README) before this touches real data.
export const ACCESS_CODES = {
  "Evaluator": "EVAL-2026",
  "Focal": "FOCAL-2026",
  "Program in Charge": "PIC-2026",
  "Budget Division": "BUDGET-2026",
  "Accounting Division": "ACCTG-2026",
  "Cash Division": "CASH-2026"
};

export function initials(name) {
  return name.split(/\s+/).filter(Boolean).map(p => p[0].toUpperCase()).slice(0, 3).join("");
}
