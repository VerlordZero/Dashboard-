# Dashboard

- `index.html`: mobile prototype of the company dashboard (static, sample data).
- `admin/`: desktop admin console (products, plans, media, branding) backed by Firebase.

## Admin console (no login)

Open `admin-standalone.html` (double-click) or `admin/index.html`. It saves straight to Firebase project `dtarks-c75b8` over HTTPS.
One-time setup in the Firebase console:

1. Build > Firestore Database > Create database.
2. Build > Storage > Get started.
3. Rules tab of each: paste `firestore.test.rules` / `storage.test.rules` and Publish (test-only, anyone can read and write).

If something fails the page shows the exact reason. Try `?demo` on the address to preview with sample data (nothing saved).
Data layout: Firestore `products/{id}`, `settings/company`; files in Storage under `products/{id}/...` and `branding/...`.

## Cloudinary

- Uploads: in the console open Settings > Integrations, enter the Cloudinary **cloud name** and an **unsigned upload preset**. Media then uploads to Cloudinary; links are saved in Firestore.
- Usage (storage, credits, video count) and the Media library: deploy `functions/` (`cd functions && npm i`, then
  `firebase functions:secrets:set CLOUDINARY_API_SECRET`, `firebase deploy --only functions`; it asks for the cloud name and API key).
  Paste the printed `cloudinaryApi` URL into Integrations. The API secret lives only in the function, never in the page.
- Settings > Integrations > "Run connection tests" checks Firestore, Storage, Cloudinary upload and usage.
- Rebuild the single-file version with `python3 build-standalone.py`.
