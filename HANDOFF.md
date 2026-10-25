# Project handoff (read this first)

Company platform: sells software (inventory, CRM and others) by plan, extra users and duration, and also creative services (graphic design, video editing, motion graphics). Owner works with Antigravity (design and front-end JavaScript) and Claude (backend, security, plans).

## Files in this project

| File | What it is |
|---|---|
| `HANDOFF.md` | This file. Current state, decisions, next steps, and the prompt to start a new chat |
| `BACKEND_PLAN.md` | Backend and security plan: platform choice, roles, data model, business rules, security, payments, phases, open questions |
| `FRONTEND_ADMIN.md` | Brief for the **team (admin) portal** front end: tech rules, folder structure, **design system**, navigation, every screen, Clients module, tax mode, data layer (`api.js` mock then real), entity shapes, security, definition of done, prompt |
| `FRONTEND_CLIENT.md` | Client portal and public shop. **ON HOLD**, different design to come later. Draft of data and rules only |
| `README.md` | Short run and setup notes |
| `design/reference-dashboard.png` | Look and feel reference for the team portal (use its layout and style, not its violet colour, not its "Upgrade to Pro" card) |

Code that exists (all demo quality):
- `index.html`: mobile prototype with sample data.
- `admin/` and `admin-standalone.html`: working admin console that saves to Firebase and Cloudinary. It will be replaced by the new front end.
- `server/`: local Cloudinary helper (Media library and usage). `netlify/functions/` and `functions/` hold older hosted versions of the same helper.
- Rule files for Firebase (open test rules and proper rules).

## Decisions made so far

- **Two portals:** team portal (internal) and client portal (customers). The client portal gets a different design and structure and shows only a few menus such as Overview. It is on hold.
- **Team portal design:** follow `design/reference-dashboard.png`: 5-icon rail, dark rounded panel with search (Ctrl+K), nested menu with count badges, pinned items, cards, pill tabs, tables with checkboxes, floating bulk-action bar. Default colour is a **medium-blue to deep-blue gradient** (violet preset kept as an option). **Light and dark modes** with a switch. Remove the "Upgrade to Pro" card.
- **Menu:** Dashboard (short overview of everything) first, then Clients (All clients, Add client), then Catalog, Billing, Orders, Settings.
- **Clients:** a client is a solo person, a person with one or more companies, or a company account with no person name. Companies (bill-to) and contacts are separate records.
- **Tax:** no GST and no Udyam today. Invoices start in `tax_mode = none`. If turnover grows the owner plans to register for GST and become a private limited company. The software must switch later without changing old invoices. The accountant confirms the exact rules.
- **Payments:** avoid the ~2% gateway fee. Start with manual UPI and bank transfer (client enters the UTR, team clicks Verify). Add Razorpay or another gateway later only for cards.
- **Backend platform:** planned move to **Supabase** (Postgres, row security, login, Edge Functions for secrets). Not started. Current demo data is in the Firebase Realtime Database.
- **Build approach:** front end first against a mock `api.js`, then swap in the real backend. The API function names and data shapes in `FRONTEND_ADMIN.md` are the contract with the backend.

## Current demo setup (not secure)

- Firebase project `dtarks-c75b8`, Realtime Database `https://dtarks-c75b8-default-rtdb.firebaseio.com`, **open rules**, no login. Storage bucket not created.
- Cloudinary cloud `e956iksj`, unsigned upload preset `dashboard_unsigned`. The Cloudinary **API key and secret are in plain text in `server/cloudinary-server.js`** (demo only). The secret was also pasted in chat. **Regenerate it in Cloudinary under API Keys** and move it to a real server secret before launch.
- Cloudinary blocks browsers from listing or deleting files, so the Media library needs a server. Uploads and showing images need no server.

## Things learned

- The Firestore database in this project is named `default`, not `(default)`.
- The Firebase SDK failed with "client is offline" when an ad blocker blocked Firestore, so the demo uses plain REST calls.
- Double-clicking an HTML file works for saving to Firebase and uploading to Cloudinary. Firebase login does not work from a file.

## Open questions (full list in `BACKEND_PLAN.md` section 12)

Supabase confirmation, roles (owner, admin, staff), seat pricing when added mid-term, grace days after expiry, email provider, hosting and domains, international pricing (fixed USD or converted INR), first admin emails, existing client list to import, logo file and exact logo colours.

## Next steps

1. Antigravity builds the team portal from `FRONTEND_ADMIN.md` (steps 1 and 2 first: shared files, mock API, shell, Dashboard, Clients). Review the result against the definition of done.
2. Owner sends the logo and exact colours, and answers the open questions.
3. Claude starts the backend phase 1 (Supabase project, tables, row security, login, roles) once the owner creates the Supabase project and shares its URL and `anon` key. The `service_role` key never goes into chat or files.
4. Later: media server function, subscriptions engine, payments verification, invoices, then the client portal with its own design.

## Prompt to start a new chat (copy and paste)

> I am continuing a project from another chat. Read `HANDOFF.md` first, then `BACKEND_PLAN.md` and `FRONTEND_ADMIN.md` in this folder. Do not build the client portal yet (`FRONTEND_CLIENT.md` is on hold). My split of work: Antigravity builds the design and front-end JavaScript from `FRONTEND_ADMIN.md`; you handle the backend, security and plans. Do not create new Markdown files unless I ask; update the existing ones. Keep answers short and simple, and ask me when something is unclear. Today I want to: [write your task here].
