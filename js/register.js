import {
  auth, db, createUserWithEmailAndPassword, doc, setDoc, serverTimestamp, ACCESS_CODES
} from "./firebase-config.js";

const form = document.getElementById("registerForm");
const errorMsg = document.getElementById("errorMsg");
const registerBtn = document.getElementById("registerBtn");

function showError(text) {
  errorMsg.textContent = text;
  errorMsg.classList.add("show");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.classList.remove("show");

  const name = document.getElementById("name").value.trim();
  const role = document.getElementById("role").value;
  const accessCode = document.getElementById("accessCode").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (ACCESS_CODES[role] !== accessCode) {
    showError("That access code doesn't match the selected office.");
    return;
  }

  registerBtn.disabled = true;
  registerBtn.textContent = "Creating account…";

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), {
      name, role, email, createdAt: serverTimestamp()
    });
    window.location.href = "dashboard.html";
  } catch (err) {
    const map = {
      "auth/email-already-in-use": "An account already exists with that email.",
      "auth/weak-password": "Password is too weak — use at least 6 characters.",
      "auth/invalid-email": "That email address doesn't look right."
    };
    showError(map[err.code] || "Couldn't create your account. Please try again.");
    registerBtn.disabled = false;
    registerBtn.textContent = "Create account";
  }
});
