# 🚀 GETTING STARTED — Setup & Run Guide

## TenderBlock v2.0 — Decentralized Tendering System

> **Last Updated**: 2026-03-02  
> **OS Support**: Windows, macOS, Linux

---

## 1. Prerequisites

Install the following before proceeding:

| Tool | Version | Install Link | Purpose |
|------|---------|-------------|---------|
| **Node.js** | v18+ LTS | [nodejs.org](https://nodejs.org/) | Runtime for frontend & backend |
| **npm** | v9+ (comes with Node) | Included with Node.js | Package manager |
| **MySQL** | v8.0+ | [dev.mysql.com](https://dev.mysql.com/downloads/) | Database (or use Docker) |
| **Docker** (optional) | Latest | [docker.com](https://docs.docker.com/engine/install/) | Containerized MySQL |
| **Flow CLI** | Latest | [flow.com](https://developers.flow.com/tooling/flow-cli/install) | Blockchain CLI tool |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) | Version control |

### Verify Installation

```bash
node --version        # Should be v18+
npm --version         # Should be v9+
mysql --version       # Should be v8+
flow version          # Should output Flow CLI version
docker --version      # Optional: Should output Docker version
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/Harsh2227kumar/TenderBlock.git
cd TenderBlock
```

---

## 3. Database Setup

### Option A: MySQL Locally (Recommended for beginners)

1. **Start MySQL service** (if not already running)

   ```bash
   # Windows (if installed as a service)
   net start mysql

   # macOS (Homebrew)
   brew services start mysql

   # Linux
   sudo systemctl start mysql
   ```

2. **Create the database**

   ```bash
   mysql -u root -p
   ```

   ```sql
  CREATE DATABASE tenderblockdb;
  CREATE USER 'tenderblock_user'@'localhost' IDENTIFIED BY 'your_secure_password';
  GRANT ALL PRIVILEGES ON tenderblockdb.* TO 'tenderblock_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

### Option B: MySQL via Docker

```bash
cd backend
docker-compose up -d
```

This will start MySQL on port `3306` with the settings in `docker-compose.yaml`.

> **Note**: If using Docker, ensure the credentials in `.env` match the Docker config.

---

## 4. Backend Setup

### 4.1 Navigate to Backend

```bash
cd backend
```

### 4.2 Install Dependencies

```bash
npm install
```

### 4.3 Configure Environment Variables

1. **Create `.env` file** (if it doesn't exist):

   ```bash
   # Windows (PowerShell)
   Copy-Item .env.example .env

   # macOS/Linux
   cp .env.example .env
   ```

2. **If `.env.example` doesn't exist**, create `.env` with these values:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CLIENT_ORIGIN=http://localhost:5173

   # MySQL Database
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
  MYSQL_USER=tenderblock_user
   MYSQL_PASSWORD=your_secure_password
  MYSQL_DATABASE=tenderblockdb
   MYSQL_CONNECTION_LIMIT=20

   # JWT Secret (generate a strong random string)
   # Use: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   JWT_SECRET=REPLACE_WITH_64_CHAR_RANDOM_STRING

   # Flow Blockchain (Testnet)
   FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
   FLOW_ACCOUNT_ADDRESS=0xYourFlowAddress
   FLOW_PRIVATE_KEY=your_flow_private_key
   FLOW_NETWORK=testnet

   # Web3.Storage (IPFS)
   WEB3_STORAGE_TOKEN=your_web3_storage_token

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Generate a secure JWT secret**:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

   Copy the output and paste it as `JWT_SECRET` in your `.env`.

### 4.4 Create the Uploads Directory

```bash
# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path uploads

# macOS/Linux
mkdir -p uploads
```

### 4.5 Start the Backend

```bash
# Development mode (with auto-restart on changes)
npm run dev

# Production mode
npm start
```

You should see:
```
Server is running at : http://localhost:5000
```

### 4.6 Verify Backend is Running

Open a browser or use curl:

```bash
curl http://localhost:5000/
```

Expected response:
```json
{
  "name": "tenderblock",
  "type": "nodejs-server",
  "status": "running"
}
```

---

## 5. Frontend Setup

### 5.1 Navigate to Client

```bash
# From project root
cd client
```

### 5.2 Install Dependencies

```bash
npm install
```

### 5.3 Flow Blockchain Configuration

The Flow config is in `src/flow/config.js`. By default, it points to **Flow Testnet**:

```javascript
// src/flow/config.js
import { config } from "@onflow/fcl";

config({
  "accessNode.api": "https://rest-testnet.onflow.org",
  "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
});
```

> ⚠️ **Important**: The `flow.json` file in the `client/` directory currently contains a **private key**. For security:
> 1. Do NOT share this file publicly
> 2. Generate your own Flow testnet account (see Section 7)
> 3. Add `flow.json` to `.gitignore` if it contains private keys

### 5.4 Start the Frontend

```bash
npm run dev
```

You should see:
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

### 5.5 Open in Browser

Navigate to: **http://localhost:5173/**

---

## 6. Running Both Together

### Option 1: Two Terminal Windows

```
Terminal 1 (Backend):
  cd backend
  npm run dev

Terminal 2 (Frontend):
  cd client
  npm run dev
```

### Option 2: Concurrently (Recommended)

Install `concurrently` in the project root:

```bash
# From project root
npm init -y
npm install concurrently --save-dev
```

Add to root `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"cd backend && npm run dev\" \"cd client && npm run dev\"",
    "install:all": "cd backend && npm install && cd ../client && npm install"
  }
}
```

Then run:

```bash
npm run dev
```

---

## 7. Flow Blockchain Setup (Testnet Account)

### 7.1 Create a Flow Testnet Account

1. **Generate a key pair**:
   ```bash
   flow keys generate
   ```
   This outputs a **public key** and **private key**. Save both securely.

2. **Create an account on testnet**:
   - Go to [Flow Faucet](https://testnet-faucet.onflow.org/)
   - Paste your **public key**
   - Click "Create Account"
   - You'll receive a testnet address (e.g., `0xabcdef1234567890`)

3. **Update `flow.json`** with your new account:
   ```json
   {
     "networks": {
       "testnet": "access.devnet.nodes.onflow.org:9000"
     },
     "accounts": {
       "my-testnet-account": {
         "address": "0xYOUR_NEW_ADDRESS",
         "key": "YOUR_PRIVATE_KEY"
       }
     },
     "contracts": {
       "FungibleToken": "./src/contracts/FungibleToken.cdc",
       "NonFungibleToken": "./src/contracts/NonfungibleToken.cdc",
       "Tender": "./src/contracts/Tender.cdc",
       "Flowtoken": "./src/contracts/FlowToken.cdc",
       "Biddingplatform": "./src/contracts/BiddingPlatform.cdc"
     },
     "deployments": {
       "testnet": {
         "my-testnet-account": [
           "FungibleToken",
           "NonFungibleToken",
           "Tender",
           "Flowtoken",
           "Biddingplatform"
         ]
       }
     }
   }
   ```

### 7.2 Deploy Smart Contracts

```bash
cd client
flow project deploy --network=testnet
```

You should see each contract being deployed with a transaction ID.

### 7.3 Update Contract Addresses

After deployment, update the contract import addresses in:
- `src/contracts/BiddingPlatform.cdc` — lines 2-5
- `src/contracts/Tender.cdc` — line 2
- `src/contracts/FlowToken.cdc` — line 2
- `src/Transactions/startProject.js` — lines 14-17
- `src/Transactions/storebiddingCollection.js` — lines 7-10

Replace the existing addresses with **your newly deployed contract addresses**.

---

## 8. IPFS / Web3.Storage Setup

### 8.1 Get a Web3.Storage Token

1. Go to [web3.storage](https://web3.storage/)
2. Sign up for a free account
3. Create an API token
4. Add it to your backend `.env`:
   ```env
   WEB3_STORAGE_TOKEN=your_token_here
   ```

### 8.2 Update Frontend IPFS Client

Replace the hardcoded token in `client/src/components/modal/util.jsx`:

```javascript
import { Web3Storage } from "web3.storage";

export const client = new Web3Storage({
  token: import.meta.env.VITE_WEB3_STORAGE_TOKEN,
});
```

Add to the client's `.env` file (create if needed):
```env
VITE_API_URL=http://localhost:5000
VITE_WEB3_STORAGE_TOKEN=your_web3_storage_token_here
```

---

## 9. Application Pages (Route Map)

| URL | Page | Description |
|-----|------|-------------|
| `/` | Landing | Hero page with "Get Started" button |
| `/projects` | Projects | List of active & past tenders |
| `/bids?tender_id=XXX` | Bids | Bidding portal for a specific tender |
| `/login` | Login | Bidder login (email/password — legacy) |
| `/signup` | Signup | Bidder registration (email/password — legacy) |
| `/admin` | Admin | Admin panel — create tenders, settle auctions |

---

## 10. Common Issues & Troubleshooting

### ❌ MySQL Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Fix**: Ensure MySQL is running:
```bash
# Windows
net start mysql

# Check if port 3306 is in use
netstat -an | findstr 3306
```

### ❌ CORS Error on Frontend

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Fix**: Ensure `CLIENT_ORIGIN` in backend `.env` matches your frontend URL:
```env
CLIENT_ORIGIN=http://localhost:5173
```

### ❌ Flow CLI Errors

```
Failed to deploy contract
```

**Fix**:
1. Check your testnet account has FLOW tokens (use the faucet)
2. Ensure `flow.json` has the correct account address and key
3. Try: `flow accounts get YOUR_ADDRESS --network=testnet`

### ❌ npm Install Fails

```
npm ERR! peer dependency conflict
```

**Fix**:
```bash
npm install --legacy-peer-deps
```

### ❌ Vite Port Already in Use

```
Error: Port 5173 is already in use
```

**Fix**: Kill the process or use a different port:
```bash
# Windows
netstat -ano | findstr 5173
taskkill /PID <PID> /F

# Or change port in vite.config.js
export default defineConfig({
  server: { port: 3000 }
})
```

---

## 11. Useful Commands Reference

| Command | Location | Description |
|---------|----------|-------------|
| `npm run dev` | `backend/` | Start backend in dev mode |
| `npm start` | `backend/` | Start backend in production mode |
| `npm run dev` | `client/` | Start frontend dev server |
| `npm run build` | `client/` | Build frontend for production |
| `npm run preview` | `client/` | Preview production build |
| `npm run lint` | `client/` | Run ESLint |
| `flow project deploy` | `client/` | Deploy contracts to testnet |
| `flow accounts get <addr>` | anywhere | Check Flow account info |
| `docker-compose up -d` | `backend/` | Start MySQL in Docker |
| `docker-compose down` | `backend/` | Stop MySQL Docker container |

---

## 12. Project Structure Quick Overview

```
TenderBlock/
├── backend/
│   ├── server.js              # Express server entry point
│   ├── routes/
│   │   ├── bidders.js         # Auth & profile routes
│   │   └── tender.js          # Tender & bidding routes
│   ├── middleware/
│   │   ├── authorization.js   # JWT auth middleware
│   │   └── validateEmail.js   # Email validation
│   ├── database/
│   │   ├── cloudsql.js        # MySQL config
│   │   └── queries.js         # SQL queries
│   ├── utils/
│   │   └── utils.js           # Helpers (bcrypt, ID gen)
│   ├── .env                   # Environment variables (DON'T COMMIT)
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── App.jsx            # Main app with routes
│   │   ├── main.jsx           # Entry point
│   │   ├── contracts/         # Cadence smart contracts (5 files)
│   │   ├── Transactions/      # Cadence transaction scripts
│   │   ├── Scripts/           # Cadence query scripts
│   │   ├── flow/config.js     # FCL configuration
│   │   ├── context/           # React context (FlowProvider)
│   │   ├── components/        # UI components (10 folders)
│   │   ├── containers/        # Page components (6 folders)
│   │   └── assets/            # Images, videos
│   ├── flow.json              # Flow project config (DON'T COMMIT if has keys)
│   └── package.json
│
├── CRD.md                     # Requirements document
├── DESIGN.md                  # Architecture document
├── RULES.md                   # Code standards
├── GETTING_STARTED.md         # This file
├── NEXT_STEPS.md              # Implementation roadmap
├── QUICK_REFERENCE.md         # Daily cheat sheet
└── README.md                  # Project overview
```
