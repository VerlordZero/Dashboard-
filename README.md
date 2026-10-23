# Dashboard

- `index.html`: mobile prototype of the company dashboard (static, sample data).
- `admin/`: desktop admin console (products, plans, media, branding) backed by Firebase.

## Admin console (no login)

Open `admin-standalone.html` (double-click) or `admin/index.html`. It saves straight to Firebase project `dtarks-c75b8` over HTTPS.
One-time setup in the Firebase console:

1. Build > Realtime Database > Create database (the page uses `databaseURL` from `admin/firebase-config.js`).
2. Build > Storage > Get started (optional if you use Cloudinary for media).
3. Realtime Database > Rules: paste `database.test.rules.json` and Publish (test-only, anyone can read and write). Same for Storage with `storage.test.rules`.

If something fails the page shows the exact reason. Try `?demo` on the address to preview with sample data (nothing saved).
Data layout: Firestore `products/{id}`, `settings/company`; files in Storage under `products/{id}/...` and `branding/...`.

## Cloudinary

- **Uploads:** create an unsigned upload preset named `dashboard_unsigned` (Cloudinary Settings > Upload > Upload presets). The cloud name is in `admin/firebase-config.js`.
- **Media library and usage numbers (hosted on Netlify, nothing to run for teammates):**
  1. Netlify > Add new site > Import from GitHub > pick this repo and branch. `netlify.toml` sets the publish folder (`admin`) and the function.
  2. Site configuration > Environment variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `ADMIN_CODE` (any shared code for your team). Redeploy.
  3. Each person opens Settings > Integrations once and types the access code.
- **Local alternative** (when working from a file): double-click `server/start-helper.bat` or run `node server/cloudinary-server.js`.
- Settings > Integrations > "Run connection tests" checks the database, Cloudinary upload and the helper.
- `functions/` is an older Firebase version of the same function and is not needed with Netlify.
- Rebuild the single-file version with `python3 build-standalone.py`.
