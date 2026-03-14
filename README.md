# TenderBlock

A decentralized tendering platform built with React, Node.js, MySQL, and Flow blockchain.

TenderBlock combines on-chain tender operations (creation, bidding, settlement) with an off-chain indexer backend for fast reads, search, and dashboard views.

---

## What This Project Actually Builds

TenderBlock currently includes:

- Wallet-aware frontend with Flow FCL integration
- Blockchain-first tender lifecycle (create, bid, settle)
- Backend API for authentication, tender indexing, and bidder data
- MySQL-backed read model for filtering/searching tenders
- Legacy email/password auth flow (still present, marked as legacy in UI)
- IPFS upload support for tender metadata/documents (Web3.Storage client)

---

## Core Features

### 1) Tender Creation (Admin)
- Admin creates tender from the admin panel
- App first submits transaction on Flow chain
- After successful chain transaction, data is indexed in MySQL
- Transaction hash is stored and explorer link is shown in UI

### 2) Bidding Flow (Bidder)
- Bidder connects wallet and places bid
- Bid is submitted on-chain first
- Backend index call is attempted afterward for read-model sync
- Lowest bid and leading bidder are reflected in tender state

### 3) Settlement Flow
- Settlement is blockchain-first
- UI supports settlement progress states (blockchain/indexing/done)
- Winner experience points are updated in backend during settlement indexing

### 4) Auth + Profile
- Legacy auth: signup/login/logout with JWT in HTTP-only cookie
- Profile APIs available (`/user`, `/data`)
- Profile image upload endpoint with validation
- Wallet auth support via Flow FCL context

### 5) Tender Discovery
- Public tender listing endpoint with:
  - pagination
  - status filters (`active`, `settled`)
  - text search
- Tender detail and bid history endpoints

---

## Tech Stack

<div align="center">

### Frontend

<img src="https://cdn.simpleicons.org/react/61DAFB" alt="React" height="38" />
<img src="https://cdn.simpleicons.org/vite/646CFF" alt="Vite" height="38" />
<img src="https://cdn.simpleicons.org/reactrouter/CA4245" alt="React Router" height="38" />
<img src="https://cdn.simpleicons.org/swr/000000" alt="SWR" height="38" />
<img src="https://cdn.simpleicons.org/axios/5A29E4" alt="Axios" height="38" />

<br />
<br />

![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-7-1B1B1F?style=for-the-badge&logo=vite&logoColor=646CFF)
![React Router](https://img.shields.io/badge/React_Router-6-1B1B1F?style=for-the-badge&logo=reactrouter&logoColor=CA4245)
![SWR](https://img.shields.io/badge/SWR-Data_Fetching-111111?style=for-the-badge)
![Axios](https://img.shields.io/badge/Axios-HTTP_Client-1B1B1F?style=for-the-badge&logo=axios&logoColor=5A29E4)

---

### Backend

<img src="https://cdn.simpleicons.org/nodedotjs/5FA04E" alt="Node.js" height="38" />
<img src="https://cdn.simpleicons.org/express/000000" alt="Express" height="38" />
<img src="https://cdn.simpleicons.org/mysql/4479A1" alt="MySQL" height="38" />
<img src="https://cdn.simpleicons.org/jsonwebtokens/000000" alt="JWT" height="38" />

<br />
<br />

![Node.js](https://img.shields.io/badge/Node.js-Runtime-1B1B1F?style=for-the-badge&logo=nodedotjs&logoColor=5FA04E)
![Express](https://img.shields.io/badge/Express-API-1B1B1F?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-mysql2-1B1B1F?style=for-the-badge&logo=mysql&logoColor=4479A1)
![JWT](https://img.shields.io/badge/JWT-Cookie_Auth-1B1B1F?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Multer](https://img.shields.io/badge/Multer-File_Upload-1B1B1F?style=for-the-badge)
![Helmet](https://img.shields.io/badge/Helmet-Security-1B1B1F?style=for-the-badge)
![CORS](https://img.shields.io/badge/CORS-Enabled-1B1B1F?style=for-the-badge)
![Rate Limit](https://img.shields.io/badge/Rate_Limit-Protected-1B1B1F?style=for-the-badge)

---

### Web3 + Storage

<img src="https://cdn.simpleicons.org/flow/00EF8B" alt="Flow" height="38" />
<img src="https://cdn.simpleicons.org/ipfs/65C2CB" alt="IPFS" height="38" />

<br />
<br />

![Flow](https://img.shields.io/badge/Flow-Testnet-1B1B1F?style=for-the-badge&logo=flow&logoColor=00EF8B)
![FCL](https://img.shields.io/badge/FCL-Wallet_Integration-1B1B1F?style=for-the-badge)
![IPFS](https://img.shields.io/badge/IPFS-Document_Storage-1B1B1F?style=for-the-badge&logo=ipfs&logoColor=65C2CB)
![Web3.Storage](https://img.shields.io/badge/Web3.Storage-Client_Integrated-1B1B1F?style=for-the-badge)

</div>

---

## Architecture (Current)

1. Frontend triggers action (create/bid/settle)
2. Blockchain transaction executes first (Flow)
3. Backend API indexes/updates MySQL for query performance
4. UI reads mostly from MySQL + optionally queries chain status

This gives transparency from blockchain while keeping app UX fast.

---

## Project Structure

```text
TenderBlock/
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── bidders.js
│   │   └── tender.js
│   ├── middleware/
│   ├── database/
│   │   ├── pool.js
│   │   └── migrations/
│   └── uploads/
├── client/
│   ├── src/
│   │   ├── containers/
│   │   ├── components/
│   │   ├── services/
│   │   ├── context/
│   │   ├── Transactions/
│   │   ├── Scripts/
│   │   └── flow/
│   └── package.json
└── README.md
```

---

## API Overview

### Auth / Bidder
- `POST /signup`
- `POST /login`
- `POST /logout`
- `GET /user`
- `GET /data`
- `POST /upload/image`

### Tender
- `GET /tender/id`
- `POST /tender/create`
- `GET /tender/display`
- `GET /tender/display/:id`
- `POST /placebid`
- `GET /tender/:id/bids`
- `POST /settle`

### Health
- `GET /`
- `GET /health`

---

## Setup & Run

## 1) Clone

```bash
git clone https://github.com/Harsh2227kumar/TenderBlock.git
cd TenderBlock
```

## 2) Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` (example values):

```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_mysql_user
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=tenderblockdb
MYSQL_CONNECTION_LIMIT=20

JWT_SECRET=REPLACE_WITH_64_CHAR_RANDOM_STRING

FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
FLOW_ACCOUNT_ADDRESS=0xYourFlowAddress
FLOW_PRIVATE_KEY=your_flow_private_key
FLOW_NETWORK=testnet

WEB3_STORAGE_TOKEN=your_web3_storage_token

RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

Run backend:

```bash
npm run dev
```

## 3) Frontend Setup

```bash
cd ../client
npm install
```

Optional frontend env (`client/.env`):

```env
VITE_API_URL=http://localhost:5000
VITE_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
VITE_FLOW_DISCOVERY_WALLET=https://fcl-discovery.onflow.org/testnet/authn
```

Run frontend:

```bash
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:5000`

---

## Current Product Notes (Important)

- Wallet flow is the primary recommended path in UI.
- Legacy email/password flow is still available and marked as legacy.
- Some blockchain mapping is currently simplified:
  - `biddingId` is currently hardcoded in bid/settle flow (`"1"`) and should be mapped to actual tender IDs via indexer logic.

---

## Problems Faced During Development (Updated)

These are the real issues encountered while building this codebase:

1. **On-chain vs off-chain consistency**  
   Keeping blockchain-first operations and MySQL indexes in sync required explicit fallback handling (chain success + DB index failure cases).

2. **Wallet UX + transaction lifecycle**  
   Handling pending/sealed/failure transaction states clearly in UI took multiple iterations (especially across create/bid/settle screens).

3. **Flow integration complexity**  
   Type formatting (`UInt64`, `UFix64`) and FCL transaction wiring caused frequent runtime issues during early implementation.

4. **Auth migration challenge**  
   Supporting both wallet-based auth and legacy JWT auth in the same product created edge cases around role checks and route behavior.

5. **Bid-to-auction mapping gap**  
   Mapping app tender IDs to on-chain auction IDs cleanly is still an active improvement area.

6. **Environment + dependency mismatch**  
   Keeping backend, frontend, Flow config, and storage tokens aligned across local setups was error-prone without clear env templates.

---

## Roadmap (Near-Term)

- Replace hardcoded on-chain `biddingId` with deterministic mapping/indexing
- Add dedicated admin authorization middleware for sensitive routes
- Improve automated sync/retry when DB indexing fails after chain success
- Add test coverage for blockchain + backend integration scenarios
- Improve API docs with concrete request/response examples

---

## Contributing

If you want to contribute:

1. Fork the repo
2. Create a branch (`feature/your-feature`)
3. Commit clean changes
4. Open a pull request

---

## License

MIT License