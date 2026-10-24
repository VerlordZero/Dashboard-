# Front-end brief: Team (admin) portal

Give this file to any AI or developer who will design and build the **team portal** front end.
It also holds the shared rules (tech, design system, data layer, security) that the client portal follows. The client portal has its own file, `FRONTEND_CLIENT.md`.
The backend and security are built separately (`BACKEND_PLAN.md`). This file defines what the front end must do so both sides fit together.

## 1. What we are building

A company platform that sells software (inventory, CRM and others) by plan, extra users and duration, and also sells creative services (graphic design, video editing, motion graphics).

Front-end surfaces, built separately:

| Surface | Users | Address (example) |
|---|---|---|
| **Team portal** | Owner, admin, staff | `admin.yourdomain.com` |
| **Client portal** | Customers and their team members | `app.yourdomain.com` |
| **Public shop** | Anyone | `yourdomain.com/shop` |

The client portal contains **no admin code**. Do not share components that hide admin features behind an `if`. Share only plain, harmless UI parts (buttons, inputs, formatters) through a common folder.

## 2. Tech rules

- Plain **HTML, CSS and JavaScript (ES modules)**. No React, no build step required. Tailwind via CDN is allowed.
- Desktop first for the team portal (also usable on a phone). Mobile first for the client portal and shop.
- One `api.js` file is the only place that talks to the backend. Screens never call `fetch` directly.
- No secrets, keys, tokens or service credentials in any front-end file. Public identifiers (project URL, public `anon` key, Cloudinary cloud name and unsigned preset name) are allowed in one `config.js`.
- Works in the latest Chrome, Edge, Safari and Firefox. Keyboard accessible. Respect `prefers-reduced-motion`.
- Indian context: currency ₹ with Indian digit grouping (`1,00,000`), dates like `24 Oct 2026`, phone numbers with +91, GST fields.

## 3. Folder structure

```
/common
  tokens.css          design tokens (colours, type, spacing, radius)
  components.css      buttons, inputs, tables, cards, pills, modals, toasts
  format.js           money(), date(), bytes(), pluralize()
  validate.js         shared field checks (email, phone, GSTIN, price rules)
  api.js              ONE data layer: mock now, real backend later (see section 8)
  store.js            tiny state store (see section 7)
  ui.js               toast(), confirm(), modal(), progress(), empty-state()
/team                 team portal
  index.html
  app.js              router and shell
  screens/            one file per screen (dashboard.js, products.js ...)
/client               client portal
  index.html
  app.js
  screens/
/shop                 public shop
  index.html
  app.js
```

Rules: one screen per file, each exports `render(container, params)` and an optional `destroy()`. Routing uses `#/path` so the site works on any static host.

## 4. Design system

Keep the existing look unless a designer replaces it. It is already coded in `admin/styles.css`.

- **Style**: corporate and calm. Dark navy sidebar, light grey page, white cards, one blue accent.
- **Tokens** (change only in `tokens.css`): `--ink` navy `#0e2236`, `--bg` `#f3f5f8`, `--surface` `#fff`, `--line` `#dbe2ea`, `--fg` `#16202b`, `--mute` `#5b6a7a`, `--accent` `#0b5cab`, status colours good `#17703a`, warn `#8a5200`, bad `#b0231a`.
- **Type**: Public Sans for text, IBM Plex Mono for numbers, prices, dates and ids (tabular figures).
- **Status pills** always use colour **and** a label: Active (green), Expiring (amber), Payment due (red), Expired (red), Suspended (grey), Draft (grey), Published (green).
- **Spacing** on a 4 px scale. Cards radius 10 px. Buttons min height 38 px (44 px on touch screens).
- Dark mode is optional. If added, every colour must come from tokens.

Required component states: default, hover, focus (visible outline), disabled, loading, error, empty.

## 5. Screens (team portal)


| Route | Screen | Must have |
|---|---|---|
| `#/dashboard` | Dashboard | KPI cards (products, published, drafts, plans, active subscriptions, expiring in 30 days, unpaid amount, open jobs), "Needs attention" list (expired, payment due, expiring, unpaid orders), recent activity, usage card (storage and credits) |
| `#/products` | Product list | Search, status filter, table with thumbnail, name, category, status, plan count, lowest price, edit, delete (with confirm) |
| `#/products/new`, `#/products/edit/:id` | Product form | Name, short and full description, category, status. **Plans repeater**: name, users included, original price, selling price, extra-user price, live discount display. **Media**: thumbnail, main image, up to 5 gallery images, one video, each with progress, preview, remove. Sticky save bar. Validation list at top on save |
| `#/clients`, `#/clients/new`, `#/clients/:id` | Clients | See "Clients module" below |
| `#/subscriptions` | Subscriptions | Filters (all, active, expiring, needs action). Card or row shows customer, product and plan, seats used / allowed, start, end, days left, status, amount. Actions: renew +N months, add seat, mark paid, send reminder, suspend / resume |
| `#/services` | Services and orders | Stage filter (Brief, In progress, Review, Delivered), order cards with client, service, price, due date, paid flag, "move to next stage", "mark paid". Price list with list/unlist switch |
| `#/invoices` | Invoices | List, filter by status, create, send, mark paid, void, download PDF |
| `#/payments` | Payments | Pending UPI or bank-transfer proofs with amount, invoice, UTR and screenshot. **Verify** and **Reject** buttons with reason |
| `#/media` | Media library | Grid of files, filter all / images / videos, preview, select several, delete, "in use / unused" badge |
| `#/settings/branding` | Branding | Logo upload and replace |
| `#/settings/company` | Company | Name, email, website, currency, GSTIN, address, bank and UPI details |
| `#/settings/team` | Team and roles | Invite, change role, remove |
| `#/settings/integrations` | Integrations | Connection tests with green and red results |

Settings, Company also holds the **tax mode** (see "Tax mode").

## Clients module (team portal)

### Who the clients are
Clients in India and abroad. Some have **several businesses or companies**, some are **one person with no business**, some are **registered** (GST, company registration) and some are not. One client may buy software, creative services, or both.

### Three layers
```
CLIENT   the relationship. One row per client. kind = individual or organisation.
 +- BUSINESSES   bill-to entities (0, 1 or many). Own tax details and currency.
 +- CONTACTS     people (1 or many). Some can log in to the client portal.
```
- An **individual** with no business gets one automatic **personal** bill-to (name and address only).
- An **organisation** can have several businesses. An invoice always goes to one chosen business.
- Subscriptions, orders, invoices and payments point to a **client and the business billed**.

### Fields

#### Client
| Field | Notes |
|---|---|
| `id`, `display_name` | Name shown in lists |
| `kind` | `individual` or `organisation` |
| `status` | `lead`, `active`, `inactive`, `blocked` |
| `country`, `city` | Used for filtering and defaults |
| `preferred_currency` | INR, USD, EUR and others |
| `account_manager` | Team member who owns the relationship |
| `source` | Referral, website, ad, other |
| `tags`, `notes` | Free labels and notes |
| `created_at`, `updated_at` | |

#### Business (bill-to)
| Field | Notes |
|---|---|
| `id`, `client_id` | |
| `legal_name`, `trade_name` | Legal name goes on the invoice |
| `entity_type` | Sole proprietor, partnership, LLP, private limited, public limited, trust, other, **personal** (an individual with no business) |
| `is_registered` | Registered business: yes or no |
| `registration_no` | Company registration number (CIN in India, equivalent abroad). Optional |
| `country`, `state` | State matters for Indian GST |
| `tax_regime` | See section 4 |
| `gstin`, `pan` | India. Format-checked |
| `foreign_tax_id`, `foreign_tax_label` | VAT, EIN, ABN or other, with its label |
| `billing_address`, `shipping_address` | |
| `currency` | Invoice currency |
| `payment_terms_days` | For example 0, 7, 15, 30 |
| `invoice_email` | Where invoices go |
| `tds_applicable` | India: client deducts tax at source |
| `status` | active, inactive |

#### Contact
`id`, `client_id`, `business_id` (optional), `name`, `role`, `email`, `phone` with country code, `whatsapp`, `is_primary`, `portal_access` (can log in), `portal_role` (`client_owner` or `client_member`).

#### Documents and notes
Agreements, GST certificate, registration certificate, ID proof, work-order. Stored privately, shown only to the team (and optionally the client). Notes and activity log per client.

### What to store about registration and country
| Case | Stored | Invoice |
|---|---|---|
| India, GST registered | GSTIN, state, PAN | Tax invoice (once the company itself is on `tax_mode = gst`) |
| India, not registered | Name, address, PAN optional | Invoice without GSTIN |
| India, individual | Personal bill-to | Simple invoice |
| International business | Country, foreign tax id (optional), currency | Export invoice. Treatment depends on the company's own registration |
| International individual | Name, country, address | Export invoice |

Checks: GSTIN format and checksum, PAN format, duplicate warning on same email or tax id.

### International clients
- Each business has its own **currency**. Price lists stay in INR. Foreign price is either a fixed price in their currency or INR converted at a rate saved on the invoice. **Decision pending.**
- UPI does not work for foreign clients. Show bank wire details (SWIFT) or an international payment option.
- International phone format, flexible address lines, time zone per client.

### Clients screens (route `#/clients`)

**Clients list**
- Search by name, email, GSTIN, phone.
- Filters: kind (individual or organisation), status, country (India or international), registered or not, tag, account manager.
- Columns: name, kind, country, number of businesses, active subscriptions, open orders, unpaid amount, status.
- Buttons: Add client, Import from file (later).

**Add client** (short steps, with a quick-add for a minimum of name and email)
1. Choose: **Individual** or **Organisation**.
2. If organisation: add one or more businesses (legal name, registered yes or no, tax ids, country, state, currency). An individual gets a personal bill-to automatically.
3. Add contacts and choose who gets portal access.
4. Review and save.

**Client detail** (tabs)
- **Overview**: status, account manager, totals (active subscriptions, unpaid, lifetime billed), alerts (expiring, payment due).
- **Businesses**: cards with tax details, add and edit, set a default bill-to.
- **Contacts**: list with portal access switch, send invite.
- **Subscriptions**: all subscriptions, grouped by business.
- **Orders**: creative service orders.
- **Invoices and payments**: all invoices, status, payment proofs.
- **Documents**: upload and download.
- **Activity**: notes and changes (who did what and when).

**Everywhere else** (subscription, order, invoice forms): a client picker, then a business picker that lists only that client's businesses and shows the tax details that will print on the invoice.

### Data shapes (Postgres sketch)
```
clients(id, display_name, kind, status, country, city, preferred_currency, account_manager, source, tags text[], notes, created_at, updated_at)
businesses(id, client_id fk, legal_name, trade_name, entity_type, is_registered, registration_no, country, state, tax_regime,
           gstin, pan, foreign_tax_id, foreign_tax_label, billing_address jsonb, shipping_address jsonb, currency,
           payment_terms_days, invoice_email, tds_applicable, is_default, status)
contacts(id, client_id fk, business_id fk null, name, role, email, phone, whatsapp, is_primary, portal_access, portal_role, auth_user_id null)
client_documents(id, client_id fk, business_id null, type, file_path, uploaded_by, created_at)
client_notes(id, client_id fk, author, body, created_at)
```
Rules: a business and contact must belong to the same client; an individual always has exactly one `personal` business; a subscription's business must belong to its client.

### Open questions (answer when ready)
1. International pricing: fixed USD or EUR prices, or INR converted at that day's rate?
2. Can one client want a single invoice covering two of their businesses? Default: no.
3. Do individuals need invoices or only receipts?
4. Parent company and subsidiaries linked together? Default: no.
5. Documents stored per client, and should clients see them?
6. Existing client list to import?

## Tax mode (starts with no GST)

Right now the business has **no GST number and no Udyam certificate**. Later it may register for GST and become a private limited company with its own PAN. The software must work now and switch later without rework.

- **Company setting `tax_mode`**: `none` (today) or `gst` (after registration). Also store `gst_effective_from` (date), the company GSTIN, PAN, legal name, address and state.
- While `tax_mode = none`: invoices are plain **"Invoice"** documents with no tax lines and no GSTIN fields. Client GSTIN fields stay optional and hidden by default.
- When the company registers: an admin switches `tax_mode` to `gst` and sets the effective date. From that date new invoices become **"Tax invoice"** with GSTIN, HSN or SAC code, CGST plus SGST (same state) or IGST (other state). **Old invoices never change.**
- A change of legal entity (sole proprietor to private limited) is handled as a new "issuer profile" with its own name, PAN, GSTIN and invoice number series, effective from a date. Old invoices keep the old issuer.
- Invoice numbers use a series per issuer profile and financial year, for example `INV-2526-0001`.
- Prices: decide whether listed prices include tax or exclude it **before** the switch. The data model stores `price` and `tax_inclusive` so the switch does not change what clients see.
- The accountant confirms the exact rules (registration threshold, inter-state services, exports, TDS) before the switch.

## 6. Business logic the front end must show (display only)

The server calculates the real price. The front end repeats the formula only to show a live preview, and always uses the server's `quote()` result as the final number.

```
extra_users   = max(0, seats - plan.users_included)
monthly       = plan.selling_price + extra_users * plan.extra_user_price
gross         = monthly * months
total         = round(gross * (1 - discount_percent / 100))
end_date      = start_date + months   (month-end clamped: 31 Jan + 1 month = 28 Feb)
discount_each = plan.original_price - plan.selling_price   (show "Save ₹X (Y% off)" only if selling < original)
status        = suspended > expired > payment_due > expiring (30 days or fewer) > active
```

Show a hint when a bigger plan is cheaper for the chosen seat count (example: Basic with 20 users costs more than Standard).

Validation (also enforced on the server): name required, selling price not higher than original, prices not negative, users at least 1, image 5 MB or less and image type, video 100 MB or less and video type, gallery 5 items or fewer, GSTIN 15 characters, phone 10 digits.

## 7. State and data flow

- `store.js`: a small store with `get`, `set`, `subscribe`. Keep only: current user and role, loaded lists, UI flags. No global variables elsewhere.
- Screens load data through `api.js`, put it in the store, and render from the store. After a write, update the store, then re-render.
- Every list screen has four visible states: loading (skeleton or "Loading…"), error (message and **Retry**), empty (what is missing and the button to add it), and data.
- Every action button disables itself while its request runs, then shows a toast for success or error.
- Forms keep what the user typed if a request fails.
- Destructive actions (delete, void, suspend, reject) always use an in-page confirm dialog. Never `alert()` or `confirm()`.
- Never re-render a whole form on each keystroke (inputs lose focus).

## 8. The data layer (`api.js`)

Build the front end **before** the backend exists by writing `api.js` with two interchangeable implementations behind one interface:

```js
// common/api.js
import { mock } from './api.mock.js';
import { real } from './api.real.js';
export const api = USE_MOCK ? mock : real;   // USE_MOCK set in config.js
```

Same function names and shapes in both. The mock keeps data in memory (and `localStorage`) and returns the same shapes with a short fake delay. When the backend is ready, only `api.real.js` changes.

Function list (names match `BACKEND_PLAN.md`, section 7):

```
auth.signIn(email) / auth.verify(code) / auth.signOut() / auth.me()
shop.listProducts() / shop.getProduct(id) / shop.quote({productId, planId, seats, months})
shop.checkout({quote, customer})
admin.products.list/get/save/remove
admin.clients.list/get/save   admin.businesses.save/remove   admin.contacts.save/remove/invite
admin.subscriptions.list/extend/addSeat/suspend/resume/markPaid/remind
admin.services.list/save/remove      admin.orders.list/advance/markPaid
admin.invoices.list/create/send/markPaid/void
admin.payments.listPending/verify/reject
admin.media.signUpload/list/remove/usage
client.me / client.subscriptions.list/get/renew/addSeats
client.invoices.list/pay / client.orders.list/create / client.files.download
licence.check(key)
```

Every function returns `{ data }` on success or throws an `ApiError { code, message, fields? }`. Codes the UI must handle: `unauthorized` (go to sign in), `forbidden` (show "no access"), `validation` (show field messages), `not_found`, `conflict`, `network` (show Retry), `server`.

## 9. Entity shapes (JSON)

```json
Product      { "id": "", "name": "", "kind": "Software", "status": "draft|published",
               "shortDescription": "", "description": "",
               "thumbnail": {"url":"","publicId":""}, "mainImage": {}, "gallery": [], "video": {},
               "plans": [Plan], "createdAt": 0, "updatedAt": 0 }
Plan         { "id": "", "name": "", "users": 5, "originalPrice": 1999, "sellingPrice": 999, "extraUserPrice": 120 }
Client       { "id": "", "displayName": "", "kind": "individual|organisation", "status": "lead|active|inactive|blocked", "country": "", "preferredCurrency": "INR" }
Business     { "id": "", "clientId": "", "legalName": "", "entityType": "", "isRegistered": true, "gstin": "", "pan": "", "foreignTaxId": "", "country": "", "state": "", "currency": "INR", "billingAddress": {}, "invoiceEmail": "" }
Contact      { "id": "", "clientId": "", "businessId": null, "name": "", "email": "", "phone": "", "portalAccess": false }
Subscription { "id": "", "clientId": "", "businessId": "", "productId": "", "planId": "", "seats": 7, "seatsUsed": 5,
               "months": 12, "startDate": "2026-10-24", "endDate": "2027-10-24",
               "status": "active|expiring|payment_due|expired|suspended", "priceTotal": 0, "paid": true, "licenceKey": "" }
Invoice      { "id": "", "number": "INV-2026-0001", "clientId": "", "businessId": "", "amount": 0, "tax": 0,
               "status": "draft|sent|paid|void", "dueDate": "", "pdfUrl": "" }
Payment      { "id": "", "invoiceId": "", "method": "upi_manual|bank_transfer|card", "utr": "", "proofUrl": "",
               "status": "pending|verified|rejected", "amount": 0 }
Service      { "id": "", "category": "", "name": "", "note": "", "price": 0, "listed": true }
Order        { "id": "", "clientId": "", "businessId": null, "serviceId": "", "stage": "brief|in_progress|review|delivered",
               "paid": false, "dueDate": "", "files": [] }
Quote        { "monthly": 0, "gross": 0, "discountPercent": 0, "total": 0, "startDate": "", "endDate": "", "extraUsers": 0 }
```

Money is stored in rupees as whole numbers in these shapes. Payment gateways use paise, so the server converts. Dates are `YYYY-MM-DD` strings; timestamps are milliseconds.

## 10. Media and uploads

- Images and video upload from the browser to **Cloudinary** with `admin.media.signUpload()` (a signed upload from the server). Until that exists, the unsigned preset in `config.js` is used for testing only.
- Show per-file progress, a preview, and a clear error. Reject wrong type or size before uploading.
- Store only `{url, publicId}` in the product record.
- Show images with a transformed thumbnail URL (for example `c_fill,w_400,h_300,q_auto`) and `loading="lazy"`.

## 11. Security rules for the front end

1. No secret of any kind in front-end files, comments or console logs.
2. Never trust the browser: do not decide prices, access, roles or payment status in JavaScript. Show what the server returns.
3. Escape all text before inserting into HTML (use `textContent`, or the `esc()` helper). Never put user text into `innerHTML` unescaped.
4. Hide screens a role cannot use, but never rely on hiding. The server rejects them anyway.
5. Do not store tokens in `localStorage` if the auth library offers secure storage. Never log tokens.
6. Links to other sites use `rel="noopener noreferrer"`.
7. Uploaded file names and customer text are untrusted data.

## 12. Accessibility and responsiveness

- Every input has a visible label and a stable `id`. Errors are linked with `aria-describedby`.
- Buttons are real `<button>` elements. Modals trap focus and close on Escape.
- Tables get horizontal scroll on small screens. Team portal sidebar becomes a slide-in menu under 860 px.
- Colour is never the only signal (pills have text).
- Test at 390 px, 768 px and 1280 px widths. No horizontal page scroll.
## 13. Existing code to reuse

| File | What it gives |
|---|---|
| `admin/styles.css` | The full design system as CSS |
| `admin/app.js` | Working versions of the dashboard, product list and form (plans repeater, live discount, media slots, upload progress), Media library, settings, integration tests |
| `index.html` | Mobile prototype of subscriptions, products, services and the shop price calculator |
| `admin/firebase-config.js` | Example of one config file. Replace Firebase parts when the backend is ready |

The current code saves straight to Firebase and Cloudinary for the demo. Keep the screens and styles, move the data calls into `api.js`.

## 14. Definition of done for each screen

- Matches the design tokens and works at 390, 768 and 1280 px.
- Loading, error, empty and data states all present.
- All buttons give feedback (disabled while running, toast after).
- Uses only `api.js`. Works with the mock.
- Validation messages shown next to fields and in a summary.
- Keyboard-only use works. Focus is visible.
- No secrets, no `innerHTML` with raw user text, no `alert()`.

## 15. Suggested build order

1. `/common` (tokens, components, format, validate, store, ui) and `api.mock.js`.
2. Team portal shell, router, dashboard, products (list and form).
3. Customers, subscriptions, services and orders.
4. Invoices and payments verification screen.
5. Public shop with quote.
6. Client portal (login, subscriptions, invoices, pay, orders).
7. Swap `api.mock.js` for `api.real.js` once the backend phases are ready.

## 16. Prompt to give an AI

> Read `FRONTEND_ADMIN.md` and `BACKEND_PLAN.md`. Build the team portal exactly as described: plain HTML, CSS and ES modules, no React, one `api.js` data layer with a mock implementation, the folder structure in section 3, the design tokens in section 4, and the screens in section 5. Start with section 15, steps 1 and 2. Follow the security rules in section 11 and the definition of done in section 14. Ask before changing anything in the API function list or entity shapes, because the backend is built to match them.
