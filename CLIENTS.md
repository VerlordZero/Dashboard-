# Clients module

Plan for the **Clients** tab in the team portal, and the data behind it. It replaces the simple "customers" idea in the other files.

## 1. The situation to cover

- Clients in India and in other countries.
- Some clients have **several businesses or companies**. Some are **one person with no business**.
- Some are **registered** (GST, company registration). Some are not.
- One client can buy software, creative services, or both, and may want invoices to go to different businesses.

## 2. Core idea: three layers

```
CLIENT   the relationship. Who you deal with. One row per client.
 ├─ BUSINESSES   the bill-to entities (0, 1 or many). Each has its own tax details and currency.
 └─ CONTACTS     the people (1 or many). Some can log in to the client portal.
```

- **Client** is the account in your list. It can be an *individual* or an *organisation*.
- **Business** is who gets the invoice. A client with three companies has three businesses. A person with no business has **one "personal" bill-to** (name and address only, no tax id).
- **Contact** is a human: email, phone, role. A contact can belong to the client as a whole or to one business.
- Subscriptions, orders, invoices and payments always point to a **client and the business they are billed to**. That way one client can buy for Company A and Company B separately.

## 3. Fields

### Client
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

### Business (bill-to)
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

### Contact
`id`, `client_id`, `business_id` (optional), `name`, `role`, `email`, `phone` with country code, `whatsapp`, `is_primary`, `portal_access` (can log in), `portal_role` (`client_owner` or `client_member`).

### Documents and notes
Agreements, GST certificate, registration certificate, ID proof, work-order. Stored privately, shown only to the team (and optionally the client). Notes and activity log per client.

## 4. Tax and registration cases

| Case | What we store | Invoice type |
|---|---|---|
| India, GST registered | GSTIN, state, PAN | Tax invoice with GST (CGST plus SGST in the same state, IGST across states) |
| India, not registered | Name and address (PAN if available) | Invoice without GSTIN, treated as sale to an unregistered buyer |
| India, individual with no business | Personal bill-to: name, address, state | Simple invoice to an individual |
| International business | Country, foreign tax id (if any), currency | Export invoice. Tax treatment depends on your registration (often zero-rated under an LUT) |
| International individual | Name, country, address | Export invoice to an individual |

The software stores these facts and picks the right invoice type from them. **Your accountant must confirm the exact tax rules** (GST on exports, LUT, TDS, foreign remittance records). I am not giving tax advice here.

Checks the server runs: GSTIN format and checksum, PAN format, state-code match with GSTIN, duplicate warning on same email or same tax id.

## 5. International clients

- Each business has its own **currency**. Price lists stay in INR. For a foreign client we either show a fixed price in their currency or convert at an exchange rate stored on the invoice. **Decision needed.**
- UPI does not work for foreign clients. They pay by **bank wire (SWIFT)** or through an international payment option. The payment adapter in `BACKEND_PLAN.md` covers this.
- Record the **exchange rate** and the date on each invoice and payment for accounts.
- Phone numbers are stored in international format. Addresses have a country field and flexible lines (no India-only pin code rule).
- Time zone per client for due dates and reminders.

## 6. Screens (team portal, route `#/clients`)

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

## 7. Client portal impact

- A client login belongs to one **client** and sees all that client's businesses, with a switcher. A contact limited to one business sees only that business.
- Invoices show the business name and tax details. The client can request a change of billing details, which the team approves.
- `client_owner` can add users, add seats and pay. `client_member` can view.

## 8. Data model (Postgres sketch)

```
clients(id, display_name, kind individual|organisation, status, country, city, preferred_currency,
        account_manager, source, tags text[], notes, created_at, updated_at)
businesses(id, client_id fk, legal_name, trade_name, entity_type, is_registered bool, registration_no,
           country, state, tax_regime, gstin, pan, foreign_tax_id, foreign_tax_label,
           billing_address jsonb, shipping_address jsonb, currency, payment_terms_days,
           invoice_email, tds_applicable bool, is_default bool, status)
contacts(id, client_id fk, business_id fk null, name, role, email, phone, whatsapp,
         is_primary bool, portal_access bool, portal_role, auth_user_id null)
client_documents(id, client_id fk, business_id null, type, file_path, uploaded_by, created_at)
client_notes(id, client_id fk, author, body, created_at)
-- link other tables to the pair (client_id, business_id):
subscriptions(client_id, business_id, ...)   invoices(client_id, business_id, currency, exchange_rate, ...)
orders(client_id, business_id null, ...)     payments(invoice_id, ...)
```

Rules enforced by the database: `businesses.client_id` and `contacts.client_id` must match; a subscription's business must belong to the same client; GSTIN unique per active business (warning, not block, if the same GSTIN appears twice); an individual client always has exactly one `personal` business.

Security: team roles see all clients. Staff see clients without billing totals (if you keep that role). Client logins see only their own client's rows. Documents are private and served by short-lived links.

## 9. Open questions for you

1. **International pricing:** should foreign clients see fixed prices in USD or EUR, or INR converted at that day's rate?
2. **Exports:** do you issue export invoices under an LUT, and do you register for GST? (Your accountant can answer.)
3. **Several businesses per client:** can one client want a **single** invoice covering two of their businesses? Default: no, one invoice per business.
4. **Individuals:** do they need proper invoices, or only receipts?
5. **Groups:** do you have a parent company with subsidiaries that should be linked? Default: no, flat list of businesses per client.
6. **Documents:** which files do you want stored per client (agreement, GST certificate, ID)? Should clients see them?
7. **Import:** do you have an existing client list (spreadsheet) to import?
