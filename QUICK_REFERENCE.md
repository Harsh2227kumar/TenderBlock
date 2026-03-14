# 📌 QUICK REFERENCE — Daily Cheat Sheet

## TenderBlock v2.0 — Decentralized Tendering System

> **Keep this open while coding!**

---

## 🏃 Quick Start (Run Project)

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# → http://localhost:5000

# Terminal 2 — Frontend
cd client
npm run dev
# → http://localhost:5173
```

---

## 📁 Key File Locations

### Backend Files You'll Edit Most

| File | What it does |
|------|-------------|
| `backend/server.js` | Express app entry point, middleware chain |
| `backend/routes/bidders.js` | Auth routes: `/signup`, `/login`, `/upload/image`, `/user` |
| `backend/routes/tender.js` | Tender routes: `/tender/create`, `/tender/display`, `/placebid`, `/settle` |
| `backend/middleware/authorization.js` | JWT auth middleware |
| `backend/middleware/validateEmail.js` | Email validation middleware |
| `backend/database/queries.js` | All SQL queries |
| `backend/database/cloudsql.js` | MySQL connection config |
| `backend/utils/utils.js` | Bcrypt helpers, ID generators |
| `backend/.env` | ⚠️ Environment variables (NEVER commit!) |

### Frontend Files You'll Edit Most

| File | What it does |
|------|-------------|
| `client/src/App.jsx` | React Router setup |
| `client/src/main.jsx` | App entry point (providers wrap) |
| `client/src/context/FlowProvider.jsx` | Flow blockchain state |
| `client/src/flow/config.js` | FCL configuration (testnet/mainnet) |
| `client/src/containers/projects/Projects.jsx` | Tender listing page |
| `client/src/containers/bids/Bids.jsx` | Bidding page |
| `client/src/containers/admin/Admin.jsx` | Admin panel |
| `client/src/containers/login/Login.jsx` | Login page |
| `client/src/containers/signup/Signup.jsx` | Signup page |
| `client/src/components/modal/Modal.jsx` | Create tender modal |
| `client/src/components/modal/util.jsx` | ⚠️ IPFS client (Web3.Storage) |
| `client/src/components/tender/Tender.jsx` | Tender card (admin view) |
| `client/src/components/listActive/ListActive.jsx` | Tender row (project list) |

### Smart Contracts

| File | What it does |
|------|-------------|
| `client/src/contracts/Tender.cdc` | NFT for tenders (mint, transfer, metadata) |
| `client/src/contracts/BiddingPlatform.cdc` | Auction engine (create, bid, settle) |
| `client/src/contracts/FlowToken.cdc` | Payment token |
| `client/src/contracts/FungibleToken.cdc` | Token interface (standard) |
| `client/src/contracts/NonfungibleToken.cdc` | NFT interface (standard) |

### Blockchain Transactions & Scripts

| File | What it does |
|------|-------------|
| `client/src/Transactions/startProject.js` | Create tender on-chain (FCL mutate) |
| `client/src/Transactions/storebiddingCollection.js` | Setup bidding collection on-chain |
| `client/src/Scripts/getProjectStatuses.js` | Query all project statuses on-chain |

---

## 🔌 API Endpoints Cheat Sheet

### Public (No Auth)

```
GET  /                           → Health check
GET  /tender/display             → All tenders (array)
GET  /tender/display/:id         → Single tender
GET  /tender/id                  → Generate new tender ID
```

### Authenticated (JWT Cookie)

```
POST /login                      → Login (email, password) → Sets cookie
POST /signup                     → Register (name, email, registration, address, password)
GET  /user                       → Get profile data
GET  /data                       → Get JWT payload
POST /upload/image               → Upload profile image (multipart/form-data)
POST /placebid                   → Place bid (tender_id, biddingAmount)
```

### Admin (Should have auth, currently unprotected ⚠️)

```
POST /tender/create              → Create tender (all fields)
POST /settle                     → Settle auction (tender_id)
```

---

## 🛠️ Common Code Patterns

### Making API Calls (Frontend)

```jsx
// GET request
const { data } = await axios.get('http://localhost:5000/tender/display');
const tenders = data.message;  // Note: data is wrapped in "message" key

// POST request with auth cookie
const { data } = await axios.post(
  'http://localhost:5000/placebid',
  { tender_id, biddingAmount },
  { withCredentials: true }      // ← Required for cookies!
);
```

### Flow Blockchain Interaction (Frontend)

```jsx
import * as fcl from "@onflow/fcl";

// Login with wallet
fcl.logIn();

// Sign up with wallet
fcl.signUp();

// Logout
fcl.unauthenticate();

// Get current user
const user = fcl.currentUser;
user.subscribe(user => console.log(user));

// Execute transaction (write)
const txId = await fcl.mutate({
  cadence: `import Tender from 0xc9a10bbda7c73177 ...`,
  args: (arg, t) => [arg(value, t.String)],
  proposer: fcl.currentUser,
  payer: fcl.currentUser,
  authorizations: [fcl.currentUser],
  limit: 50,
});
const result = await fcl.tx(txId).onceSealed();

// Execute script (read)
const result = await fcl.query({
  cadence: `import BiddingPlatform from 0x01 ...`,
  args: (arg, t) => [arg(address, t.Address)],
});
```

### Database Query (Backend)

```javascript
// Current pattern (will be refactored)
const mysql = require("mysql2");
const db = mysql.createConnection(db_config);
db.query(queryString, [param1, param2], (error, result) => {
  if (error) { response.status(500).json({ message: error }); return; }
  response.status(200).json({ message: result });
  db.end();
});

// Target pattern (with connection pool)
const pool = require('../database/pool');
const [rows] = await pool.execute(queryString, [param1, param2]);
return rows;
```

---

## 📐 Database Schema

### bidders table

```
| Column       | Type         | Notes          |
|-------------|--------------|----------------|
| name        | VARCHAR(64)  |                |
| email       | VARCHAR(128) | UNIQUE         |
| registration| BIGINT       | UNIQUE         |
| exp         | INT          | Default: 0     |
| address     | VARCHAR(256) |                |
| photo       | VARCHAR(256) |                |
| password    | BINARY(60)   | bcrypt hash    |
```

### tenders table

```
| Column          | Type         | Notes          |
|----------------|--------------|----------------|
| _title         | VARCHAR(128) | NOT NULL       |
| tender_id      | VARCHAR(128) | UNIQUE, NOT NULL|
| _ipfsHash      | VARCHAR(128) | NOT NULL       |
| _description   | MEDIUMTEXT   | NOT NULL       |
| _minimumExp    | INT          | NOT NULL       |
| _exp           | INT          | NOT NULL       |
| opening_date   | MEDIUMTEXT   | NOT NULL       |
| biddingLength  | INT          | NOT NULL       |
| startPrice     | INT          | NOT NULL       |
| currentMinDemand| INT         | Nullable       |
| winner_email   | VARCHAR(128) | Nullable       |
| isSettled      | BOOLEAN      | Default: false |
```

### placedBid table

```
| Column        | Type         | Notes            |
|--------------|--------------|------------------|
| placedBid_id | VARCHAR(128) | PRIMARY KEY      |
| tender_id    | VARCHAR(128) | FK → tenders     |
| email        | VARCHAR(128) | FK → bidders     |
| biddingAmount| INT          | NOT NULL         |
```

---

## 🔗 Contract Addresses (Current — Testnet)

```
Flow Account (Admin):  0xea0627a8b29d7901
Contract Deployment:   0xc9a10bbda7c73177

Contracts on 0xc9a10bbda7c73177:
  - FungibleToken
  - NonFungibleToken
  - Tender
  - FlowToken (Flowtoken)

Contracts on 0xea0627a8b29d7901:
  - BiddingPlatform (Biddingplatform)
```

---

## ⚠️ Known Bugs (Fix These!)

| Bug | File | Line | Fix |
|-----|------|------|-----|
| `navigate()` called on render | `ListActive.jsx` | 12 | Wrap in arrow function: `onClick={() => navigate(...)}` |
| Undefined `tendersData` | `Bids.jsx` | 34 | Change to `projectData` |
| Global variable leak | `authorization.js` | 7 | Add `const` keyword |
| Wrong contract address | `getProjectStatuses.js` | 5 | Change `0x01` to actual deployed address |
| No admin auth | `tender.js` | 35, 292 | Add `authorization` middleware |
| Hardcoded secret | `.env` | 7 | Generate random JWT secret |
| Hardcoded API token | `util.jsx` | 6 | Move to env variable |
| Private key in repo | `flow.json` | 11 | Add to `.gitignore`, rotate key |

---

## 🎨 Route Map

```
/                    → Landing page (hero, CTA)
/projects            → All tenders (active/past, search, filter)
/bids?tender_id=XXX  → Bid on specific tender
/login               → Login form (legacy)
/signup              → Registration form (legacy)
/admin               → Admin panel (create tenders, settle)
```

---

## 📦 Key Dependencies

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18 | Web framework |
| mysql2 | ^3.17 | MySQL driver |
| jsonwebtoken | ^9.0 | JWT auth |
| bcryptjs | ^2.4 | Password hashing |
| cors | ^2.8 | CORS middleware |
| helmet | ^7.0 | Security headers |
| multer | ^1.4 | File uploads |
| dotenv | ^16.3 | Env variable loading |
| cookie-parser | ^1.4 | Cookie parsing |
| body-parser | ^1.20 | Request body parsing |

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2 | UI framework |
| react-router-dom | ^6.14 | Routing |
| @onflow/fcl | ^1.4 | Flow Client Library |
| @onflow/types | ^1.1 | Flow type definitions |
| axios | ^1.4 | HTTP client |
| swr | ^2.2 | Data fetching & caching |
| web3.storage | ^4.5 | IPFS client |
| react-icons | ^4.10 | Icon library |
| email-validator | ^2.0 | Email validation |

---

## 🔧 Useful Commands

```bash
# Generate secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate random ID (for testing)
node -e "console.log(require('crypto').randomBytes(15).toString('hex'))"

# Check Flow account
flow accounts get 0xea0627a8b29d7901 --network=testnet

# Deploy contracts
cd client && flow project deploy --network=testnet

# Build frontend for production
cd client && npm run build

# Run ESLint
cd client && npm run lint

# Check MySQL connection
mysql -u root -p -e "SHOW DATABASES;"
```

---

## 📝 Response Format Reference

### Current API Response Format (v1)

```json
// Success
{ "message": <data> }          // Data inside "message" key 😬

// Error
{ "message": <error_string> }  // Same key for both! 😬
```

### Target API Response Format (v2)

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "total": 50 }
}

// Error
{
  "success": false,
  "error": {
    "code": "TENDER_NOT_FOUND",
    "message": "No tender found with this ID"
  }
}
```

---

## 🧭 Where Am I? (Architecture Layer Guide)

```
If you're editing...          You're in the...           Rules:
──────────────────────────────────────────────────────────────
containers/*.jsx              → Page Layer               Connect to services, manage page state
components/*.jsx              → UI Layer                 Pure presentation, receive props
services/*.js (frontend)      → API Service Layer        Axios calls, Flow transactions
context/*.jsx                 → State Layer              Global state (auth, theme, flow)

routes/*.js                   → Route Layer (backend)    Only parse request, call controller
controllers/*.js              → Controller Layer         Thin, call services
services/*.js (backend)       → Business Logic Layer     All validation & logic here
repositories/*.js             → Data Access Layer        SQL queries only
middleware/*.js                → Middleware Layer         Auth, validation, rate limiting

contracts/*.cdc               → Smart Contract Layer     On-chain logic (source of truth)
Transactions/*.js             → Blockchain TX Layer      FCL mutate wrappers
Scripts/*.js                  → Blockchain Query Layer   FCL query wrappers
```
