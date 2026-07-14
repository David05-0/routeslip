// ── Firebase configuration ───────────────────────────────────────────────
// Replace with your own project's config (Firebase Console → Project settings → Your apps).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, doc, setDoc, getDoc, addDoc, updateDoc, collection,
  onSnapshot, query, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnpndyyM5ZDzQ5ySo4xUhGcFgYCDFcTgk",
  authDomain: "routeslip-5d075.firebaseapp.com",
  projectId: "routeslip-5d075",
  storageBucket: "routeslip-5d075.firebasestorage.app",
  messagingSenderId: "688359113227",
  appId: "1:688359113227:web:e84ca5908696b3783c3d0e"
};

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
