# Backend and security plan

Draft for you to review. Items marked **DECIDE** need your answer before work starts.
Split of work: you (with Antigravity) build the design and the front-end JavaScript. Claude builds the backend, security and server-side logic. The "contract" section below is how the two sides connect.

## 1. Goals

1. Sell software products (inventory, CRM and others) by plan, extra users and duration, with exact start and end dates.
2. Control access: seat limits, expiry, suspension for unpaid or expired customers.
3. List creative services (graphic design, video editing, motion graphics) with orders, payment status and delivery stages.
4. Admin console for the team: products, plans, customers, subscriptions, services, invoices, media.
5. Public shop that shows only published items.
6. Secrets and customer data protected. Nothing sensitive in front-end files.

## 2. Platform choice **DECIDE**

| | Supabase (recommended) | Firebase |
|---|---|---|
| Data | Postgres tables. Good for customers, subscriptions, invoices, reports. | Firestore (documents) or Realtime Database (JSON tree). Weaker for reports and joins. |
| Security | Row Level Security (RLS) policies per table. | Security rules per path. |
| Server code | Edge Functions hold secrets (Cloudinary secret, payment keys). | Cloud Functions (needs Blaze plan). |
| Login | Supabase Auth (email, magic link, Google). | Firebase Auth. |
| Fit | Better for billing and invoices. | Fine for the current simple catalog. |

Recommendation: move to **Supabase**. The current Firebase data is only a few test products and can be re-entered or exported.

## 2b. Two portals (decided)

| | Team portal (ours) | Client portal (customers) |
|---|---|---|
| Who | owner, admin, staff | Customers and their team members |
| Address | for example `admin.yourdomain.com` | for example `app.yourdomain.com` |
| Login | Team accounts, two-step verification for owner and admin | Email code or magic link, no password to leak |
| Can do | Products, plans, customers, subscriptions, services, invoices, media, payments, reports | See own subscriptions (plan, seats, end date), renew, add seats, pay, download invoices, request and track design/video/motion orders, download delivered files |
| Sees | Everything their role allows | Only rows linked to their own customer account |

Rules that keep the two apart:
- Two separate front-end builds on two addresses. The client portal contains no admin code.
- Client users can never call `admin.*` functions. The server checks the role on every call.
- Database rules link each client login to a customer account, so a client can read only their own rows.
- CORS, rate limits and login settings are set separately per portal.
- Optional **DECIDE**: "view as client" for support, always written to the audit log.

## 3. Roles

- **owner**: everything, including adding and removing admins and viewing audit logs.
- **admin**: products, plans, customers, subscriptions, services, invoices, media.
- **staff** (optional) **DECIDE**: read customers and orders, update service stages, cannot delete or see billing totals.
- **client_owner / client_member**: client portal users. Owner can add seats and pay. Member can view. Both see only their own company's data.
- **public**: reads only published products, plans and services.

## 4. Data model (Postgres sketch)

```
profiles(id uuid pk = auth.users.id, role, name, email)
products(id, name, kind, status draft|published, short_desc, description, thumbnail, main_image, gallery jsonb, video, created_at, updated_at)
plans(id, product_id fk, name, users_included, original_price, selling_price, extra_user_price, sort)
duration_discounts(months pk, percent)            -- 1, 3, 12, 48 by default
customers(id, name, email, phone, company, gst_no, address, created_at)
customer_users(customer_id fk, user_id fk -> auth.users, role client_owner|client_member)   -- links client logins to a customer
payments(id, invoice_id fk, provider upi_manual|bank_transfer|razorpay|custom, utr, proof_url, verified_by, verified_at, provider_order_id, provider_payment_id, amount_paise, status created|paid|failed|refunded, raw jsonb, created_at)
subscriptions(id, customer_id fk, product_id fk, plan_id fk, seats int, months int,
              start_date, end_date, status active|expiring|payment_due|expired|suspended,
              price_total, paid bool, licence_key, created_at)
seat_changes(id, subscription_id, delta, price_delta, created_at)
invoices(id, number, customer_id, subscription_id null, order_id null, amount, tax, status draft|sent|paid|void, due_date, paid_at, pdf_url)
services(id, category, name, note, price, listed bool)
orders(id, customer_id, service_id, stage brief|in_progress|review|delivered, paid bool, due_date, files jsonb)
media(id, provider cloudinary, public_id, url, type, bytes, uploaded_by, created_at)
audit_log(id, actor, action, entity, entity_id, at, details jsonb)
```

## 5. Business rules (server enforces these, never the browser alone)

- Monthly price = `plan.selling_price + max(0, seats - plan.users_included) * plan.extra_user_price`.
- Term total = `monthly * months * (1 - discount%)`, rounded to whole rupees. The server recalculates from its own prices and ignores any price sent by the browser.
- End date = start date + months (month-end clamped, for example 31 Jan + 1 month = 28 Feb).
- Renewal while active adds months from the **old end date**. Renewal after expiry starts from today.
- Adding a seat mid-term updates the seat limit at once and bills the pro-rated difference **DECIDE** (pro-rate, or charge full month).
- Status is derived from dates and payment: suspended > expired > payment_due > expiring (30 days or less) > active.
- Grace period after expiry before the licence locks **DECIDE** (suggest 3 days).
- Reminders at 30, 7 and 1 day before the end date, and on the day payment is due.
- Licence check: the customer's software calls one endpoint with its licence key and receives allowed seats, end date and status. The server decides, the software obeys.

## 6. Security plan

1. **Login** for every admin. No open rules. Roles stored in `profiles`, never trusted from the browser.
2. **RLS on every table.** Public can read published products, plans, services. Only admin or owner can write. Customers read only their own rows.
3. **Secrets only on the server**: Cloudinary secret, payment keys, email keys, service-role key. Stored as Edge Function secrets. Nothing secret in HTML, JS or the repo.
4. **Uploads**: replace the open unsigned preset with signed uploads (server signs each upload for logged-in admins only). Limit file type and size.
5. **Cloudinary admin actions** (list, delete, usage) run in an Edge Function that checks the caller's role first.
6. **Input checks** on the server for every write. Reject negative prices, selling price above original, bad dates, oversized text.
7. **Audit log** for price changes, deletes, role changes, suspensions and refunds.
8. **Rate limits and CORS** locked to the real site address.
9. **Backups**: daily database backup and a tested restore.
10. **Rotate keys**: regenerate the Cloudinary secret that was shared in chat, and any key that appeared in the repo or screenshots.

## 7. Contract between front end and backend

The front end calls these. Names are proposals. Claude builds them, the front end only uses them.

| Call | Who | Purpose |
|---|---|---|
| `GET products?status=published` (with plans) | public | Shop listing |
| `client.me`, `client.subscriptions.list`, `client.subscription.renew/add_seats` | client | Client portal: own subscriptions |
| `client.invoices.list/download`, `client.pay(invoice_id)` | client | Client portal: invoices and payment |
| `client.orders.list/create`, `client.files.download` | client | Client portal: creative service orders |
| `quote(product_id, plan_id, seats, months)` | public | Server-calculated price and end date |
| `create_checkout(quote, customer)` | public | Start payment, returns payment link |
| `payment_webhook` | payment provider | Mark paid, create subscription, invoice and licence key |
| `admin.products.*`, `admin.plans.*` | admin | Create, edit, delete |
| `admin.subscriptions.list/extend/add_seat/suspend/resume/mark_paid` | admin | Customers screen actions |
| `admin.services.*`, `admin.orders.advance/mark_paid` | admin | Services screen actions |
| `admin.media.sign_upload`, `admin.media.list/delete/usage` | admin | Cloudinary |
| `admin.invoices.create/send/mark_paid/void` | admin | Invoices |
| `licence.check(key)` | customer's software | Seats, end date, status |

Front-end rules to keep it safe: never put secrets or service keys in the front end, never calculate the final price in the browser, never decide access in the browser.

## 8. Payments (Razorpay first, other provider later)

**Razorpay** is the first provider: UPI, cards, net banking. Flow:
1. Client portal or shop asks the server for a checkout. The server recalculates the price, creates a Razorpay **order** (amount in paise) and a `payments` row with status `created`.
2. The browser opens Razorpay Checkout with that order id. The browser never sends or sets the amount.
3. Razorpay calls our **webhook**. The server verifies the signature (HMAC-SHA256 with the webhook secret), then marks the payment paid, activates or renews the subscription, issues the invoice and licence, and emails the customer. Handling is idempotent, so a repeated webhook does nothing twice.
4. Refunds run from the team portal through the server.
5. Build and test in Razorpay **test mode** first. Live keys only after KYC and a full test.

**Other provider ("custom payment provider")**: the server code uses a small payment adapter with the same four functions: `createCheckout`, `verifyWebhook`, `getStatus`, `refund`. Razorpay is the first adapter. Adding another provider means writing one more adapter, with no changes to the portals. To build it I need that provider's name and API documentation (checkout method, webhook signing, refund API, fees).

Open choice **DECIDE**: one-off term payments only, or auto-renewing subscriptions (Razorpay Subscriptions API)? Start with one-off and renewal reminders unless you want auto-renew.

Secrets (Razorpay key secret, webhook secret) live only in server secrets, never in either portal.

### 8b. Avoiding the gateway fee (about 2%)

Building our own card processor is not possible. Moving card money needs a licence from the RBI (Payment Aggregator) and card-industry security certification, which costs far more than 2%. What we can do is **avoid the gateway for most payments** and keep one only as a backup. All options plug into the same payment adapter, so the portals do not change.

| Option | Fee | How it confirms | Notes |
|---|---|---|---|
| **Direct UPI to the company bank account** (QR and `upi://` link with exact amount and invoice number) | Normally none | Client enters the UTR (bank reference) and optionally uploads a screenshot. The team checks the bank statement and clicks **Verify** in the team portal. | Easy to build. Needs a person to verify. Screenshots can be faked, so the bank statement is the proof. |
| **Bank transfer (NEFT / IMPS / RTGS)** with the company account details on the invoice | Normally none | Same as above, or automatic if the bank offers a **virtual account per client** with a webhook. | Virtual accounts or bank API banking usually carry a small flat fee and need a current account. Ask your bank. |
| **Razorpay or another gateway** | About 2% | Automatic by webhook. | Keep for cards and international clients, or hide it behind a "Pay by card" button. Optionally pass the fee to the client or give a small discount for UPI and bank transfer. |

Recommended path:
1. Phase A: manual UPI and bank transfer with a **Verify payment** screen. Zero fees, no outside dependency.
2. Phase B: ask your bank about virtual accounts or UPI collection APIs to automate the checking.
3. Phase C: add Razorpay or the other provider only for cards, if clients ask for it.

Things to confirm before launch (I cannot verify current pricing from here): the actual fee on UPI at each provider, your bank's virtual-account pricing, and GST treatment of the invoices.

Safety rules for the manual flow: the amount and invoice number come from the server, a UTR can be used once, only an admin or owner can verify, every verification is written to the audit log, and a subscription activates only after verification.

## 9. Invoices and tax **DECIDE**

- GST invoices (GSTIN, HSN or SAC code, tax breakup)? Or simple invoices?
- Invoice number format, for example `INV-2026-0001`.
- PDF generation on the server and email to the customer.
- Credit notes for refunds.

## 10. Email and reminders **DECIDE**

Provider (Resend, Brevo or Amazon SES). Daily scheduled job checks end dates and sends reminders, updates statuses, locks expired licences.

## 11. Phases

1. **Foundation**: Supabase project, tables, RLS, login, roles, owner account. Move products and plans over.
2. **Secure media**: Edge Function for Cloudinary (signed uploads, list, delete, usage). Remove demo keys from the repo and rotate them.
3. **Subscriptions engine**: quote, create subscription, extend, seats, suspend, status job, licence check.
4. **Payments and invoices**: UPI and bank-transfer flow with the Verify screen, invoice PDF, email. Card gateway later as an extra adapter.
5. **Services and orders**: stages, files, payment, delivery notifications.
6. **Client portal and public shop**: client login, own subscriptions, invoices, payments, orders.
7. **Hardening**: audit log review, backups and restore test, rate limits, security review, load check.

## 12. Questions for you

1. Supabase or stay on Firebase?
2. Roles: owner, admin only, or also staff?
3. Start with manual UPI and bank transfer? Do you want a card option later (Razorpay or the other provider, name and docs link)? One-off or auto-renew?
4. GST invoices needed?
5. Seat added mid-term: pro-rate or full month? Grace days after expiry?
6. Client portal: can a customer invite their own team members? Do you want "view as client" for support?
7. Email provider preference?
8. Where will the final site be hosted (Netlify, Vercel, other) and what domain?
9. Is there any customer data you must keep in India (data residency)?
10. Who are the first admin accounts?

## 13. What Claude needs from you to start phase 1

- Your answers to section 12 (even partial).
- A new Supabase project (free tier is fine to start) and the project URL plus the `anon` key. The `service_role` key goes only into Edge Function secrets, never into chat, files or the front end.
- The list of admin email addresses.
- Razorpay test-mode key id (the key secret and webhook secret go only into server secrets) and the name and docs of the other payment provider, if used.
- Your two portal addresses (or placeholders for now).
