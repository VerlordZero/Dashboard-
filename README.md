# Dashboard

- `index.html`: mobile prototype of the company dashboard (static, sample data).
- `admin/`: desktop admin console (products, plans, media, branding) backed by Firebase.

## Admin console setup (Firebase project `dtarks-c75b8`)

1. Firebase console > Build > **Authentication** > Sign-in method: enable **Email/Password**, then add your admin user.
2. Build > **Firestore Database**: create a database.
3. Build > **Storage**: get started (the bucket is `dtarks-c75b8.firebasestorage.app`).
4. Deploy rules and hosting: `firebase deploy` (uses `firebase.json`, `firestore.rules`, `storage.rules`).
5. Open the hosted URL, sign in, then go to Settings > Branding to upload the logo.

Preview without Firebase: serve `admin/` over http (`python3 -m http.server -d admin`) and open `/?demo=1`.
Demo mode keeps data in memory only.

Data layout: Firestore `products/{id}` (name, plans, media links), `settings/company` (name, `logoUrl`).
Files go to Storage under `products/{id}/...` and `branding/...`.
