# Front-end brief: Client portal and public shop

Give this file to any AI or developer who will design and build what **customers** see: the **client portal** and the **public shop**.
Shared rules (tech stack, folder structure, design tokens, `api.js` data layer, entity shapes, security, accessibility, definition of done) are in `FRONTEND_ADMIN.md`. Read its sections 2, 3, 4, 7, 8, 9, 11, 12 and 14 first. This file adds only what is specific to customers.
Backend and security: `BACKEND_PLAN.md`.

## 1. Who uses it

| Surface | Users | Address (example) |
|---|---|---|
| **Client portal** | Customers and their team members, signed in | `app.yourdomain.com` |
| **Public shop** | Anyone | `yourdomain.com/shop` |

- Mobile first. Most customers will open it on a phone. Works well from 360 px up.
- **No admin code** in this build. Do not import anything from the team portal except the plain shared files in `/common` (tokens, components, format, validate, store, ui, api).
- Customers can be Indian or international, an individual or a company, with one business or several. The portal must work for all of them.

## 1b. Look and feel

Same visual language as the team portal: follow **section 4 of `FRONTEND_ADMIN.md`** and the picture `design/reference-dashboard.png` (rounded cards, soft shadows, pill tabs, gradient accents, avatar stacks). Same tokens, same blue gradient default, **light and dark modes** with the theme switch.

Differences for customers:
- **Desktop:** a rail plus panel like the team portal, with a simpler menu (Overview, Subscriptions, Invoices, Orders, Account).
- **Phone (most customers):** no side panel. A **bottom tab bar** with the same five items and the brand gradient on the active tab. Cards stack in one column. The business switcher is a chip row at the top.
- No search command palette needed at first. No "upgrade" or promotional cards.
- The public shop uses the same tokens with a lighter, more spacious layout and a header instead of a sidebar.

## 2. Customer types the portal must handle

- **Individual, no business**: sees their name and one personal billing profile.
- **Organisation with one business**: normal case.
- **Organisation with several businesses**: a **business switcher** at the top of the portal ("All businesses", or one). Subscriptions, invoices and orders show which business they belong to.
- **Not registered / no GST**: invoices show no GSTIN. Do not show GST fields to them unless the company is in GST mode (see section 5).
- **International**: amounts in their currency, bank wire details instead of UPI, international phone and address formats, dates shown in their time zone.
- **Roles**: `client_owner` can pay, renew, add seats and invite people. `client_member` can only view and download.

### Client portal screens

| Route | Screen | Must have |
|---|---|---|
| `#/login` | Sign in | Email, one-time code or magic link. No password field |
| `#/home` | Overview | Subscriptions with status, end date and days left, unpaid invoices banner, open orders |
| `#/subscriptions/:id` | Subscription | Plan, seats used / allowed, start and end date, price, **Renew** (choose months, see price and new end date), **Add seats** (see price change before confirming), licence key with copy button |
| `#/invoices` | Invoices | List, status, download PDF, **Pay** |
| `#/pay/:invoiceId` | Pay | Amount, UPI QR and pay link, bank details with copy buttons, form for UTR and screenshot upload, status "waiting for verification". Card button only if enabled |
| `#/orders` | Service orders | New request (pick service, brief, files), stage tracker, delivered files to download |
| `#/account` | Account | Company details, team members (client owner only), sign out |

### Public shop screens

| Route | Screen | Must have |
|---|---|---|
| `#/shop` | Catalog | Published products and services in cards with thumbnail, name, short text, "from ₹X" |
| `#/shop/:productId` | Product | Image gallery, video, description, **plan picker**, **users stepper** (extra users priced), **duration picker** (1, 3, 12, 48 months with saving shown), price summary, "valid until" date, buy button |
| `#/shop/checkout` | Checkout | Business name, email, phone, GSTIN (optional), summary, continue to payment |

## 3. Screen details that go beyond the table

**Overview (`#/home`)**: status cards per subscription (plan, seats used of allowed, end date, days left, status pill). A red banner when an invoice is unpaid or a subscription expires within 30 days, with a single button to fix it. Open orders with their stage.

**Subscription (`#/subscriptions/:id`)**:
- *Renew*: choose months (1, 3, 12, 48), see the new end date and total (from the server `quote`), then continue to pay. Renewing before expiry adds time from the old end date.
- *Add seats*: stepper, shows the price difference and the new seat limit before confirming.
- *Licence key*: copy button. Hide the key behind a "Show" button.

**Pay (`#/pay/:invoiceId`)** (see section 4).

**Orders (`#/orders`)**: request form (service, brief text, file upload up to the limits in the admin file), stage tracker (Brief, In progress, Review, Delivered), comments with the team, download delivered files, approve or request changes at Review.

**Account (`#/account`)**: business details (view, and "request change" which the team approves), people list, invite (client owner only), sign out.

**Public shop**: product cards, product page with plan picker, users stepper, duration picker, live price from the server `quote`, "valid until" date. Checkout asks for business name or personal name, email, phone, country, and GSTIN only when the company is in GST mode.

## 4. Paying (no gateway fee by default)

The company avoids card-gateway fees. Default methods:

1. **UPI** (India): show a QR code and a pay link with the **exact amount and invoice number**, plus the UPI id with a copy button.
2. **Bank transfer** (India and international): show account name, number, IFSC (and SWIFT for foreign clients), with copy buttons and the invoice number as the payment reference.
3. **Card** (optional, only if enabled by the team): a button that opens the gateway checkout.

After paying by UPI or bank transfer the client enters the **UTR or bank reference** and may upload a screenshot. The screen then shows **"Waiting for verification"**. The team verifies in the admin portal. Only then does the subscription activate. The portal never marks anything paid by itself. Status steps shown to the client: Awaiting payment, Proof submitted, Verified (or Rejected with the team's reason and a way to resubmit).

Rules: the amount always comes from the server. A UTR can be submitted once. Show a clear error if it was already used.

## 5. Tax display (starts with no GST)

The company has no GST number today and may register later. The portal reads the company `tax_mode` from the server:

- `none`: invoice titled **"Invoice"**, one total, no tax lines, no GSTIN fields anywhere.
- `gst`: invoice titled **"Tax invoice"**, shows the company GSTIN, the client's GSTIN (if given), HSN or SAC code and the tax split. The client business form shows an optional GSTIN field.
- Invoices are PDFs generated by the server. The portal only lists and downloads them. Old invoices never change when the mode changes.

## 6. API calls this build uses

From `api.js` (full list in `FRONTEND_ADMIN.md`, section 8): `auth.*`, `shop.listProducts/getProduct/quote/checkout`, `client.me`, `client.subscriptions.list/get/renew/addSeats`, `client.invoices.list/pay`, `client.payments.submitProof`, `client.orders.list/create`, `client.files.download`, `client.account.requestChange/inviteUser`.
Build and test everything against the mock first. Do not add calls that are not in the list without asking, because the backend is built to match it.

## 7. Customer-side security rules

- Sign in with an emailed one-time code or magic link. No password field.
- Never show another client's data. The server enforces it, the screen only shows what the server returns.
- Do not decide prices, status, access or payment results in the browser.
- Escape all text from users and files. Use `textContent` or the `esc()` helper.
- File uploads: check type and size before sending. Show progress and a clear error.
- Never log tokens, licence keys or bank details to the console.
- Sign the user out after a period of inactivity and on "Sign out".

## 8. Definition of done

Same checklist as `FRONTEND_ADMIN.md` section 14, plus:
- Works at 360, 390, 768 and 1280 px and with the business switcher on 0, 1 and 3 businesses.
- Looks right for an Indian individual, an Indian company without GST, and an international company.
- Every money amount shows the right currency symbol and grouping.
- Payment screen shows the three states (awaiting, proof submitted, verified or rejected).

## 9. Suggested build order

1. Shared `/common` files and the mock API (from `FRONTEND_ADMIN.md`).
2. Public shop: catalog, product page, quote, checkout.
3. Client sign in, overview and subscription screen.
4. Invoices and the pay screen with proof upload.
5. Orders and delivered files.
6. Account, team invites, business switcher.
7. Replace the mock with the real API when the backend phases are ready.

## 10. Prompt to give an AI

> Read `FRONTEND_CLIENT.md`, then the shared sections of `FRONTEND_ADMIN.md` and `BACKEND_PLAN.md`. Build the client portal and the public shop as described: plain HTML, CSS and ES modules, no React, mobile first, using only the shared `/common` files and the mock `api.js`. Follow sections 4, 5 and 7 exactly. Ask before adding any API call or changing any data shape.
