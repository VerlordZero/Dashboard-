# Company dashboard: handoff notes

Written at the end of the first working session so the project can continue in a local chat.

## What exists

| Piece | Where | What it is |
|---|---|---|
| Mobile prototype | `index.html` | Static sample-data demo: Home, Customers (subscriptions with seat limits and end dates), Products and pricing, Services (design, video, motion), Shop (plan + extra users + months, price and expiry date). Not connected to anything. |
| Admin console | `admin/` (`index.html`, `app.js`, `styles.css`, `firebase-config.js`) | Desktop corporate dashboard. Dashboard, Media library, Products (list, add, edit, delete), Settings (Branding logo, Company, Integrations). |
| Single-file console | `admin-standalone.html` | The same console in one file. Rebuild with `python3 build-standalone.py`. |
| Local helper | `server/cloudinary-server.js`, `server/core.js`, `server/start-helper.bat` | Small Node program (Node 18+, no packages). Serves the console at `http://localhost:8787` and talks to Cloudinary for the Media library and usage numbers. |
| Netlify version of the helper | `netlify/functions/cloudinary.js`, `netlify.toml` | Same logic as a Netlify function with a shared `ADMIN_CODE`. Written and tested against a fake Cloudinary, never deployed. |
| Old Firebase function | `functions/` | Earlier version of the helper for Firebase Functions. Not needed. |
| Rules | `firestore.rules`, `storage.rules` (proper), `firestore.test.rules`, `storage.test.rules`, `database.test.rules.json` (open, test only) | |

## How data flows (current setup)

- **Products and settings** are saved to the Firebase **Realtime Database** at `https://dtarks-c75b8-default-rtdb.firebaseio.com`, over plain HTTPS (no Firebase SDK, no login). Paths: `products/{id}`, `settings/company`.
- **Product images, video and logo** upload straight from the browser to **Cloudinary** (cloud `e956iksj`, unsigned preset `dashboard_unsigned`). The link and public id are saved inside the product record.
- If Cloudinary is not configured, files go to Firebase Storage instead. The project has no Storage bucket yet.
- **Media library and usage numbers** need the helper running, because Cloudinary does not let browsers call its admin service (confirmed in testing: the browser blocks it).

## How to run it locally

1. Install Node.js 18 or newer.
2. Double-click `server/start-helper.bat` (or run `node server/cloudinary-server.js`).
3. Open `http://localhost:8787`.

Without the helper the console still works for products, plans and uploads. Only the Media library and Cloudinary usage numbers need it.

## Where to change settings

- `admin/firebase-config.js`: Firebase config (`databaseURL` selects Realtime Database; remove that line to use Firestore instead) and Cloudinary cloud name and preset.
- `server/cloudinary-server.js`: demo Cloudinary API key and secret (see Security).
- Settings, Integrations in the console: override cloud name, preset and helper address; Cloudinary connection tests.

## Security status: DEMO, NOT SECURE

- Realtime Database rules are open: `.read` and `.write` are `true`. Anyone with the address can read, change and delete data.
- The Cloudinary API key and secret are written in plain text in `server/cloudinary-server.js`. The secret was also pasted into chat and an earlier version of the repo. **Regenerate it in Cloudinary, API Keys**, and move it to a real server secret before launch.
- The unsigned upload preset lets anyone who knows the cloud name upload to the account.
- A yellow bar at the top of every console screen says this for the team.

## Things learned (so they are not repeated)

- Firestore database in this project is named `default`, not `(default)`. The REST code tries both.
- Firestore returned "client is offline" through the Firebase SDK when an ad blocker blocked `firestore.googleapis.com`. The console now uses REST calls to avoid this.
- `auth/configuration-not-found` means Authentication was never switched on. The login screen was removed for the demo.
- Cloudinary's admin service (list, usage, delete) cannot be called from a browser. It needs a server.
- Opening an HTML file by double-click works for saving to Firebase and uploading to Cloudinary. Firebase Auth would not work from a file.

## Not built yet

- Customers, subscriptions and invoices screens (the mobile prototype shows the idea: plan, seats, months, end date, reminders, lock on expiry).
- The public shop page that reads published products.
- Login and roles: admin list, rules so only admins write, public read for published products only.
- Move data to Firestore (better queries and rules). Existing products in Realtime Database do not copy over automatically.
- Supabase: planned home for server-side secrets (for example an Edge Function replacing the helper). Then regenerate the Cloudinary secret.
- Delete Cloudinary files when a product is deleted (needs the server).
- Credits tracking for the AI tool is not visible in this console. Check it in the Claude account settings.

## Suggested next steps

1. Run the helper and confirm the Media library and dashboard usage show real numbers.
2. Decide Firestore or Realtime Database, then switch the console and migrate the few products.
3. Add login, admin list and real rules, then remove the open rules and the demo bar.
4. Build customers, subscriptions and invoices, then the public shop.
5. Move secrets to Supabase (or Netlify env vars) and regenerate the Cloudinary secret.
