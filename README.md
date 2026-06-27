# Tech Verse

Multi-vendor IT e-commerce site (Firebase Auth + Firestore).

## Firebase — where to see users

Users appear in **two** places in [Firebase Console](https://console.firebase.google.com/):

| Location | What it shows |
|----------|----------------|
| **Authentication → Users** | Login accounts (email/password) |
| **Firestore Database → users** | Profile data (name, role, phone, etc.) |

After signup or login, a profile document is created automatically in the `users` collection.

### If users still don't appear

1. Open **Firestore Database** in Firebase Console (not Realtime Database).
2. Publish security rules: copy [`firestore.rules`](firestore.rules) → Firebase Console → Firestore → **Rules** → Publish.
3. Sign up a new account on the site, then refresh the `users` collection.

## Run locally

Serve over HTTP (required for Firebase):

```bash
npx serve .
```

Then open `http://localhost:3000`
