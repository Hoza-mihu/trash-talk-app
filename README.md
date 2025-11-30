# 🗑️ Trash Talk App — Monorepo

This repository now houses the entire Trash Talk project: a Next.js frontend, a Flask inference backend, and the TensorFlow training pipeline that produces the model used for predictions.

## Repository Layout

- `frontend/` – Next.js 14 + Tailwind UI for uploads, auth, dashboards, and visualizations.
- `backend/` – Flask API that loads the latest `model/model.h5` file and exposes `/api/analyze`.
- `model-training/` – TensorFlow/Keras training scripts, notebooks, and dataset helpers.
- `scripts/` – cross-cutting utilities (e.g., `copy_model.py` to sync trained weights into the backend).

Legacy files from the original single Next.js project have been removed to avoid confusion.

## Getting Started

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

Important env vars (create `frontend/.env.local`):
```
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 2. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # or source venv/bin/activate
pip install -r requirements.txt
python app.py           # http://localhost:5000
```

Ensure `backend/model/model.h5` exists. You can copy the latest trained model with:
```bash
python scripts/copy_model.py
```

### 3. Model Training (optional)
```bash
cd model-training
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python scripts/train_model.py
```

Datasets, checkpoints, and TensorBoard logs are git-ignored; follow `model-training/README.md` for download instructions. After training, run `python ../scripts/copy_model.py` from the repo root to sync the newest weights into the backend.

### Firebase Setup

1. In [Firebase Console](https://console.firebase.google.com/), create a project and add a Web App.
2. Enable **Authentication** (Email/Password) and **Cloud Firestore** (Start in production mode).
3. Enable **Cloud Storage**. The default bucket name becomes your `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`.
4. Update Storage security rules so authenticated users can read/write their own profile folder, e.g.:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /profiles/{userId}/{allPaths=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
5. Copy the web app configuration into `frontend/.env.local` using the variables listed above.
6. Restart `npm run dev` so the new env vars load.

With storage enabled, the profile page lets users upload an avatar; uploaded files land under `profiles/{uid}/avatar-<timestamp>` in your bucket, and the public URL is stored in Firestore.

### Changing a Profile Photo (End-User Flow)

1. Visit `/profile` while signed in.
2. Click the green **Change** pill under the avatar and pick an image (≤5 MB). A local preview appears immediately.
3. Hit **Save Changes**. The UI will:
   - Upload the image to Firebase Storage under `profiles/{uid}/`.
   - Store the resulting download URL inside the `users/{uid}` Firestore document.
   - Reset the button once Firebase confirms both writes.
4. Reloading the page later pulls the saved `photoUrl`, so the same avatar shows on every visit. Users can repeat the steps at any time to replace the photo.

## Development Tips

- Keep virtual environments, logs, uploads, datasets, and large binaries out of version control (already handled via `.gitignore`).
- Use `DEBUG_SUMMARY.md` and `CONNECTION_GUIDE.md` for troubleshooting notes and verifying the frontend ↔ backend flow.
- When adding new assets or directories that should exist empty (uploads, logs, etc.), drop a `.gitkeep` file so collaborators receive the structure.

With this layout, each subsystem can evolve independently while sharing a single Git history. Let me know if you need additional automation (e.g., root scripts for running both servers).

