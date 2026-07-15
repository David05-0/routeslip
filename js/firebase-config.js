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
// The fixed route a slip travels, by stage index (0–6).
//
// Index 0 is the Evaluator, and it does triple duty — always check
// slip.status / slip.reapprovalFromStageIndex to know which:
//   • Creating the slip (currentStageIndex starts at 0)
//   • Complete & forward — Evaluator's own forward to Focal
//   • Resolving a reapproval — a division bounced the slip back; once
//     resolved it returns to that same division (not stage 1)
// Index 6 is the Evaluator's final Check Release step, after Cash Division,
// which marks the slip completed/Released.
//
// STAGE_ROLES is what permission checks compare `currentUser.role` against.
// STAGE_LABELS is what's shown on screen — index 6 gets a distinct label
// even though its role is still "Evaluator".
export const STAGE_ROLES = [
  "Evaluator",
  "Focal",
  "Program in Charge",
  "Budget Division",
  "Accounting Division",
  "Cash Division",
  "Evaluator"
];

export const STAGE_LABELS = [
  "Evaluator",
  "Focal",
  "Program in Charge",
  "Budget Division",
  "Accounting Division",
  "Cash Division",
  "Evaluator — Check Release"
];

// Which office may edit which field on the slip itself (not just the log),
// and what that field is called on the document. Enforced here in the UI —
// for real security, mirror this in Firestore rules (see README).
export const EDITABLE_FIELDS = {
  "Budget Division": [{ key: "bursNumber", label: "BURS No." }],
  "Accounting Division": [{ key: "voucherNumber", label: "Voucher No." }],
  "Cash Division": [
    { key: "chequeNumber", label: "Cheque No." },
    { key: "chequeDate", label: "Cheque Date", type: "date" }
  ]
};

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
