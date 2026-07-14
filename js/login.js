import { auth, signInWithEmailAndPassword, onAuthStateChanged } from "./firebase-config.js";

const form = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");
const loginBtn = document.getElementById("loginBtn");

// If already signed in, skip straight to dashboard.
onAuthStateChanged(auth, (user) => {
  if (user) window.location.href = "dashboard.html";
});

function showError(text) {
  errorMsg.textContent = text;
  errorMsg.classList.add("show");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.classList.remove("show");
  loginBtn.disabled = true;
  loginBtn.textContent = "Signing in…";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "dashboard.html";
  } catch (err) {
    const map = {
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/user-not-found": "No account found with that email.",
      "auth/wrong-password": "Incorrect email or password.",
      "auth/too-many-requests": "Too many attempts. Try again later."
    };
    showError(map[err.code] || "Couldn't sign in. Check your details and try again.");
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Sign in";
  }
});
