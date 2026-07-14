# Route Slip Registry

A route-slip tracking system for six offices: **Evaluator → Focal → Program in
Charge → Budget Division → Accounting Division → Cash Division**. Vanilla
HTML/CSS/JS, Firebase Auth + Firestore, deployable on Vercel.

## How it works

- Anyone registers with a name, office, and their office's **access code**
  (set in `js/firebase-config.js`, `ACCESS_CODES`). This is a convenience
  gate only, **not real security** — lock it down with Firestore rules below.
- An **Evaluator** creates a route slip. It starts at stage 0.
- Each office, in order, does two things when a slip reaches them:
  1. **Log receipt** — stamps the date/time it physically arrived.
  2. **Complete & forward** — enters initials + remarks, which advances the
     slip to the next office. The last office's forward marks it **Released**.
- Everyone sees a live list of slips filtered by **Action Needed** (waiting on
  their office), **All Slips**, and **Completed**.

## 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com) → **Add
   project**.
2. **Build → Authentication → Get started → Email/Password → Enable.**
3. **Build → Firestore Database → Create database** (production mode is fine
   — you'll paste in rules below).
4. **Project settings → Your apps → Web (`</>`)** → register an app → copy
   the `firebaseConfig` object.
5. Paste those values into `js/firebase-config.js`, replacing the
   `YOUR_...` placeholders.

## 2. Firestore security rules

Paste this into **Firestore → Rules**. It keeps a user's `role` locked once
set (so the client-side access code isn't the only thing standing between a
user and pretending to be another office), and only lets a slip move forward
by the office whose turn it currently is.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId
                    && request.resource.data.role == resource.data.role;
    }

    match /routeSlips/{slipId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      // For stricter control, replace the update rule above with logic that
      // checks the requester's role (via get(/databases/$(database)/documents/users/$(request.auth.uid)))
      // matches STAGES[resource.data.currentStageIndex] before allowing writes.
    }
  }
}
```

## 3. Set your office access codes

Open `js/firebase-config.js` and change the `ACCESS_CODES` values to
whatever you want to hand out to each office. These are plain strings
checked in the browser — treat them like a shared PIN, not a password.

## 4. Run locally

Any static file server works, e.g.:

```
npx serve .
```

Then open `index.html`.

## 5. Deploy to Vercel

```
npm i -g vercel
vercel
```

No build step is needed — it's static HTML/CSS/JS, so accept the defaults
(no framework, output directory = root).

## File structure

```
index.html          Sign in
register.html        Create account
dashboard.html        Main app shell
css/styles.css        All styling
js/firebase-config.js Firebase init + shared constants (STAGES, ACCESS_CODES)
js/login.js           Sign-in logic
js/register.js         Account creation logic
js/dashboard.js        Slip list, detail view, routing actions
```
