# Apple Order Lookup → Subscription Status

A Node.js utility for investigating an Apple App Store subscription when you have the user's **Apple Order Number**.

The project follows a simple investigation flow:

```text
                    USER
                     │
                     │ Apple Order Number
                     ▼
              ┌───────────────┐
              │    check.js   │
              └───────┬───────┘
                      │
                      │ Apple Order Lookup API
                      ▼
              ┌───────────────┐
              │ signedTransactions
              └───────┬───────┘
                      │
                      │ Decode JWS
                      ▼
              ┌─────────────────────┐
              │ Transaction Details │
              └──────────┬──────────┘
                         │
                         │ originalTransactionId
                         ▼
             ┌────────────────────────┐
             │ subscription-status.js │
             └────────────┬───────────┘
                          │
                          │ Apple Subscription Status API
                          ▼
                Subscription Status
                Renewal Information
                Expiration Information
```

---

# What Do You Need to Start?

The investigation starts with **only one important piece of information from the user**:

```text
Apple Order Number
```

For example:

```text
YOUR_ORDER_NUMBER
```

You do **not** initially need the transaction ID.

You do **not** initially need the original transaction ID.

The Order Number is what we use to begin the lookup.

---

# Step 1 — Install Node.js

This project runs using Node.js.

Verify that Node.js is installed:

```bash
node --version
```

Also verify npm:

```bash
npm --version
```

Example:

```text
node --version
vXX.X.X

npm --version
XX.X.X
```

If Node.js is not installed, install a current LTS version from the official Node.js website.

---

# Step 2 — Clone the Repository

Clone the repository:

```bash
git clone https://github.com/kundaniosdev/apple-order-check.git
```

Move into the project:

```bash
cd apple-order-check
```

---

# Step 3 — Install Dependencies

Install the Node.js dependencies:

```bash
npm install
```

The project uses packages such as:

```text
jsonwebtoken
dotenv
```

`jsonwebtoken` is used to create the JWT required for Apple API authentication.

`dotenv` is used to load local environment variables.

---

# Step 4 — Apple API Credentials

To communicate with Apple's App Store Server API, you need your own App Store Connect API credentials.

You need:

```text
Issuer ID
Key ID
Private Key (.p8)
```

These credentials must belong to an Apple Developer/App Store Connect account that has access to the application being investigated.

### Important

The `.p8` private key is a secret.

Never upload it to GitHub.

Store it locally.

For example:

```text
apple-order-check/
├── AuthKeys.p8
├── .env
├── check.js
├── subscription-status.js
└── package.json
```

---

# Step 5 — Create `.env`

Create a `.env` file in the project root:

```bash
touch .env
```

Add your credentials:

```env
APPLE_ISSUER_ID=YOUR_ISSUER_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_BUNDLE_ID=YOUR_BUNDLE_ID
APPLE_ORDER_ID=YOUR_ORDER_NUMBER
APPLE_ORIGINAL_TRANSACTION_ID=USER_ORIGINAL_TRANSACTION_ID
```

The real values must remain local.

The repository contains a `.env.example` file so another developer knows which variables are required without exposing the real values.

---

# Step 6 — Add the Private Key

Place your Apple App Store Connect API private key locally.

Example:

```text
AuthKeys.p8
```

The scripts use this private key to authenticate requests to Apple.

Make sure `.gitignore` contains:

```gitignore
.env
AuthKeys.p8
node_modules/
.DS_Store
```

Verify that the secret files are ignored:

```bash
git status --ignored
```

---

# Step 7 — Start With the Apple Order Number

This is where the actual investigation begins.

Suppose a user says:

> "I purchased the subscription, but my premium content is still locked."

The user provides their:

```text
Apple Order Number
```

Add that order number to your local `.env`:

```env
APPLE_ORDER_ID=YOUR_ORDER_NUMBER
```

You now have enough information to start the first API lookup.

---

# Step 8 — Run `check.js`

Run:

```bash
node check.js
```

The script:

1. Loads the Apple credentials.
2. Creates a JWT.
3. Authenticates with Apple's App Store Server API.
4. Sends the Order Number to Apple's Order Lookup API.
5. Receives Apple's response.
6. Extracts the `signedTransactions`.
7. Decodes the JWS payload.
8. Prints the transaction information.

A successful request should return:

```text
HTTP Status: 200
```

---

# Step 9 — Get `signedTransactions`

Apple's response contains signed transaction information.

Conceptually:

```text
signedTransactions
        │
        ├── Transaction 1
        ├── Transaction 2
        └── Transaction 3
```

Each transaction is a JWS:

```text
HEADER.PAYLOAD.SIGNATURE
```

The payload contains transaction information.

The script decodes the payload so that we can inspect fields such as:

```text
Transaction ID
Original Transaction ID
Product ID
Purchase Date
Expires Date
Environment
Type
Revocation Date
```

---

# Step 10 — Find the Original Transaction ID

One of the most important values returned by `check.js` is:

```text
Original Transaction ID
```

For example:

```text
Original Transaction ID:
42000XXXXXXXXXXXX
```

This ID is important for the next step.

At this point our investigation has changed from:

```text
Order Number
```

to:

```text
Original Transaction ID
```

---

# Step 11 — Run `subscription-status.js`

Now we use the original transaction ID to query Apple's subscription status information.

Set:

```env
APPLE_ORIGINAL_TRANSACTION_ID=YOUR_ORIGINAL_TRANSACTION_ID
```

Then run:

```bash
node subscription-status.js
```

This makes the second Apple API request.

---

# Step 12 — Get Subscription Status

The subscription-status response can provide information such as:

```text
Subscription Status
Original Transaction ID
Product ID
Auto Renew Status
Renewal Date
Expiration Date
Revocation Information
```

Example:

```text
SUBSCRIPTION #1

Status: 1
Original Transaction ID: 42000XXXXXXXX

---------- TRANSACTION ----------

Transaction ID: 42000XXXXXXXX
Product ID: Naa_XXXX
Type: Auto-Renewable Subscription
Environment: Production
Purchase Date: 2026-08-09T08:57:21.000Z
Expires Date: 2026-09-09T08:57:21.000Z
Revocation Date: Not revoked

---------- RENEWAL INFO ----------

Product ID: Naa_PXXXX
Auto Renew Status: 1
Renewal Date: 2026-09-09T08:57:21.000Z
```

The values above are examples and should not be treated as real customer data.

---

# Complete Investigation Flow

The complete process we built is:

### Input

```text
Apple Order Number
```

↓

### `check.js`

```text
Order Number
     ↓
Apple Order Lookup API
     ↓
signedTransactions
     ↓
JWS decoding
```

↓

### Extract

```text
Transaction ID
Original Transaction ID
Product ID
Purchase Date
Expires Date
Revocation Date
Environment
```

↓

### `subscription-status.js`

```text
Original Transaction ID
     ↓
Apple Subscription Status API
     ↓
Subscription Status
Renewal Information
```

↓

### Final Investigation

We can now determine information such as:

```text
Was the transaction found?
Which product was purchased?
When was it purchased?
When does the current period expire?
Was the transaction revoked?
Is auto-renew enabled?
When is the next renewal expected?
```

---

# Why Two Scripts?

The two scripts have different responsibilities.

## `check.js`

Responsible for starting from:

```text
Order Number
```

and finding:

```text
Transaction Information
Original Transaction ID
```

Think of it as:

```text
Order Number → Transaction
```

---

## `subscription-status.js`

Responsible for starting from:

```text
Original Transaction ID
```

and finding:

```text
Subscription Status
Renewal Information
```

Think of it as:

```text
Original Transaction ID → Subscription State
```

---

# Important: Order Number vs Transaction ID

These values are different.

### Order Number

The starting point provided for the investigation.

```text
Order Number
```

### Transaction ID

Identifies a specific App Store transaction.

```text
Transaction ID
```

### Original Transaction ID

Identifies the original transaction associated with the subscription lifecycle.

```text
Original Transaction ID
```

The investigation therefore moves through these identifiers:

```text
Order Number
     ↓
Transaction ID
     ↓
Original Transaction ID
     ↓
Subscription Status
```

---

# Security

Never commit real Apple credentials.

Never commit:

```text
.env
AuthKeys.p8
```

Never put real customer transaction information into:

```text
README.md
GitHub Issues
GitHub Discussions
Screenshots
Public logs
```

Use placeholders:

```text
YOUR_ISSUER_ID
YOUR_KEY_ID
YOUR_BUNDLE_ID
YOUR_ORDER_NUMBER
YOUR_ORIGINAL_TRANSACTION_ID
```

Before pushing to GitHub:

```bash
git status
```

Verify that `.env` and `AuthKeys.p8` are ignored.

You can also check:

```bash
git ls-files | grep -E '\.env|AuthKeys|\.p8'
```

This should return no output.

---

# Troubleshooting

## HTTP 401 — Unauthenticated

Usually check:

* Issuer ID
* Key ID
* `.p8` private key
* JWT generation
* JWT expiration
* JWT audience
* API endpoint

---

## HTTP 403 — Forbidden

Check:

* App Store Connect permissions
* API key access
* Application access
* Correct Apple account

---

## HTTP 404 — Not Found

Check:

* Order Number
* Bundle ID
* Original Transaction ID
* Application/environment

---

## HTTP 200

A successful HTTP `200` means Apple accepted the API request and returned data.

It does **not by itself mean that the subscription is currently active**.

The returned transaction and subscription information must be inspected.

---

# Quick Start

If everything is already configured:

```bash
npm install
```

Add your Order Number to `.env`:

```env
APPLE_ORDER_ID=YOUR_ORDER_NUMBER
```

Run:

```bash
node check.js
```

Copy the resulting:

```text
Original Transaction ID
```

Add it to `.env`:

```env
APPLE_ORIGINAL_TRANSACTION_ID=YOUR_ORIGINAL_TRANSACTION_ID
```

Then run:

```bash
node subscription-status.js
```

That's the complete workflow:

```text
Order Number
      ↓
check.js
      ↓
signedTransactions
      ↓
Original Transaction ID
      ↓
subscription-status.js
      ↓
Subscription Status
      ↓
Renewal / Expiration / Revocation Information
```

---

# Production Note

This project is primarily a **debugging/investigation utility**.

For a production subscription architecture, the backend should maintain subscription state and integrate Apple's App Store Server API together with App Store Server Notifications.

The important idea is that subscription access should not depend solely on what the iOS client claims locally.

Always consult Apple's current App Store Server API documentation before using this utility as part of a production payment/subscription system.
