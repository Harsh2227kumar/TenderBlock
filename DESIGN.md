# 🏗️ DESIGN — System Architecture & Technical Design

## TenderBlock v2.0 — Decentralized Tendering System

> **Document Version**: 2.0  
> **Last Updated**: 2026-03-02  
> **Architecture Style**: Decentralized DApp with Off-chain Indexer

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                │
│                        React 18 + Vite (Client)                            │
│  ┌──────────┐  ┌────────────┐  ┌───────────────┐  ┌──────────────────┐    │
│  │ Pages/   │  │ Components │  │ Flow Context  │  │ State Management │    │
│  │ Containers│  │            │  │ (FCL Provider)│  │ (React Context)  │    │
│  └──────────┘  └────────────┘  └───────┬───────┘  └──────────────────┘    │
│                                        │                                   │
└────────────────────────────────────────┼───────────────────────────────────┘
                                         │
                 ┌───────────────────────┼──────────────────────┐
                 │                       │                      │
                 ▼                       ▼                      ▼
    ┌────────────────────┐  ┌───────────────────┐  ┌──────────────────────┐
    │   FLOW BLOCKCHAIN  │  │  EXPRESS BACKEND   │  │   IPFS / FILECOIN    │
    │                    │  │  (Indexer + API)    │  │   (Web3.Storage)     │
    │ ┌────────────────┐ │  │                    │  │                      │
    │ │ Tender.cdc     │ │  │ ┌────────────────┐ │  │  Tender Documents    │
    │ │ (NFT Contract) │ │  │ │  Event Listener│ │  │  Agreement Files     │
    │ └────────────────┘ │  │ │  (Blockchain   │ │  │  Supporting Docs     │
    │ ┌────────────────┐ │  │ │   Indexer)     │ │  │                      │
    │ │ BiddingPlatform│ │  │ └───────┬────────┘ │  └──────────────────────┘
    │ │   .cdc         │ │  │         │          │
    │ │ (Auction Logic)│ │  │ ┌───────▼────────┐ │
    │ └────────────────┘ │  │ │    MySQL       │ │
    │ ┌────────────────┐ │  │ │  (Read Index)  │ │
    │ │ FlowToken.cdc  │ │  │ └────────────────┘ │
    │ │ (Payments)     │ │  │                    │
    │ └────────────────┘ │  │ ┌────────────────┐ │
    │ ┌────────────────┐ │  │ │  REST API      │ │
    │ │ FungibleToken  │ │  │ │  (Read-only    │ │
    │ │   .cdc         │ │  │ │   endpoints)   │ │
    │ └────────────────┘ │  │ └────────────────┘ │
    │ ┌────────────────┐ │  │                    │
    │ │ NonFungibleToken│ │  │ ┌────────────────┐ │
    │ │   .cdc         │ │  │ │  WebSocket     │ │
    │ └────────────────┘ │  │ │  (Real-time)   │ │
    │                    │  │ └────────────────┘ │
    │  Blocto Wallet     │  │                    │
    │  (Authentication)  │  │                    │
    └────────────────────┘  └────────────────────┘
```

---

## 2. Data Flow Architecture

### 2.1 Tender Creation Flow

```
Admin (Frontend)
    │
    ├─1─▶ Upload documents to IPFS (Web3.Storage)
    │         └── Returns: IPFS CID (content hash)
    │
    ├─2─▶ FCL.mutate() → Flow Blockchain
    │         ├── Tender.createToken(ipfsHash, metadata) → Mints NFT
    │         ├── BiddingPlatform.createBidding(nft, params) → Creates auction
    │         └── Emits: Created(tokenID, owner, startPrice, startTime)
    │
    └─3─▶ Event Listener (Backend) catches Created event
              └── INSERT into MySQL tenders_index (for fast reads)
```

### 2.2 Bidding Flow

```
Bidder (Frontend)
    │
    ├─1─▶ Verify eligibility (check experience on-chain via script)
    │
    ├─2─▶ FCL.mutate() → Flow Blockchain
    │         ├── BiddingPlatform.placeBid(bidTokens, vaultCap, collectionCap)
    │         ├── Smart contract enforces:
    │         │     ├── Auction not completed
    │         │     ├── NFT exists
    │         │     ├── bidTokens > 0
    │         │     ├── bidTokens < currMinimumDemand (reverse auction)
    │         │     └── Bidder meets minimum experience
    │         └── Emits: Bid(tokenID, bidderAddress, bidPrice)
    │
    └─3─▶ Event Listener (Backend) catches Bid event
              ├── INSERT into MySQL bids_index
              ├── UPDATE tenders_index.current_min_demand
              └── WebSocket broadcast to connected clients
```

### 2.3 Settlement Flow

```
Admin (Frontend)
    │
    ├─1─▶ Verify auction expired (on-chain time check)
    │
    ├─2─▶ FCL.mutate() → Flow Blockchain
    │         ├── BiddingPlatform.settleBidding(id)
    │         ├── Smart contract enforces:
    │         │     ├── Auction not already settled
    │         │     ├── NFT exists
    │         │     └── Auction time has expired
    │         ├── Winner receives Tender NFT
    │         ├── Payment tokens sent to owner
    │         └── Emits: Settled(tokenID, price)
    │
    └─3─▶ Event Listener (Backend) catches Settled event
              ├── UPDATE tenders_index (status=settled, winner_address)
              ├── INSERT into audit_log
              └── Send notification email to winner (optional)
```

### 2.4 Read Operations Flow

```
Any User (Frontend)
    │
    ├── Quick reads (list, search, filter) ──▶ Express API ──▶ MySQL Index
    │
    └── Verification reads (prove on-chain) ──▶ FCL.query() ──▶ Flow Blockchain
            └── getProjectStatuses(), borrowNFT(), etc.
```

---

## 3. Frontend Architecture

### 3.1 Folder Structure (Target)

```
client/src/
├── assets/                      # Static assets (images, videos, fonts)
│   ├── images/
│   ├── illustrations/
│   └── videos/
│
├── components/                  # Reusable UI components
│   ├── common/                  # Shared components
│   │   ├── Navbar/
│   │   │   ├── Navbar.jsx
│   │   │   └── navbar.css
│   │   ├── Footer/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Modal/
│   │   ├── Toast/               # NEW: Notification toasts
│   │   ├── Loader/              # NEW: Loading spinners
│   │   ├── ErrorBoundary/       # NEW: Error boundary wrapper
│   │   └── Pagination/          # NEW: Pagination component
│   │
│   ├── tender/                  # Tender-specific components
│   │   ├── TenderCard/
│   │   ├── TenderDetail/
│   │   ├── TenderForm/          # Admin tender creation
│   │   └── TenderFilters/       # NEW: Search/filter bar
│   │
│   ├── bid/                     # Bid-specific components
│   │   ├── BidForm/
│   │   ├── BidHistory/          # NEW: Bid history list
│   │   └── BidLeaderboard/      # NEW: Real-time leaderboard
│   │
│   └── audit/                   # NEW: Audit trail components
│       ├── AuditLog/
│       └── TransactionLink/
│
├── containers/                  # Page-level components
│   ├── Landing/
│   ├── Projects/                # Tender listing page
│   ├── TenderDetail/            # NEW: Dedicated tender detail page
│   ├── Bids/                    # Bidding page
│   ├── Admin/
│   │   ├── Dashboard/           # NEW: Admin dashboard
│   │   ├── TenderManager/
│   │   └── AuditViewer/         # NEW: Audit log viewer
│   ├── Profile/                 # NEW: User profile page
│   ├── NotFound/                # NEW: 404 page
│   └── index.js
│
├── context/
│   ├── FlowProvider.jsx         # Flow blockchain context
│   ├── AuthProvider.jsx         # NEW: Auth state management
│   └── ThemeProvider.jsx        # NEW: Theme (dark/light) context
│
├── hooks/                       # NEW: Custom React hooks
│   ├── useFlowTransaction.js    # Wrapper for FCL transactions
│   ├── useFlowScript.js         # Wrapper for FCL queries
│   ├── useAuth.js               # Auth state hook
│   ├── useWallet.js             # Wallet connection hook
│   └── useTenders.js            # Tender data fetching hook
│
├── services/                    # NEW: API & blockchain service layer
│   ├── api.js                   # Axios instance with base URL config
│   ├── tenderService.js         # Tender API calls
│   ├── bidService.js            # Bid API calls
│   ├── flowService.js           # Flow blockchain interactions
│   └── ipfsService.js           # IPFS upload service
│
├── contracts/                   # Cadence smart contracts (.cdc)
│   ├── BiddingPlatform.cdc
│   ├── Tender.cdc
│   ├── FlowToken.cdc
│   ├── FungibleToken.cdc
│   └── NonfungibleToken.cdc
│
├── cadence/                     # NEW: Organized Cadence code
│   ├── transactions/
│   │   ├── createBiddingCollection.cdc
│   │   ├── startProject.cdc
│   │   ├── placeBid.cdc
│   │   └── settleBidding.cdc
│   ├── scripts/
│   │   ├── getProjectStatuses.cdc
│   │   ├── getProjectStatus.cdc
│   │   ├── getUserNFTs.cdc
│   │   └── getUserExperience.cdc
│   └── index.js                 # Export all cadence code as JS strings
│
├── flow/
│   └── config.js                # FCL configuration
│
├── utils/                       # NEW: Utility functions
│   ├── constants.js             # App constants, contract addresses
│   ├── formatters.js            # Date, number, address formatters
│   └── validators.js            # Input validation functions
│
├── styles/                      # NEW: Global styles
│   ├── variables.css            # CSS custom properties (design tokens)
│   ├── reset.css                # CSS reset
│   ├── typography.css           # Font imports and text styles
│   └── animations.css           # Shared animations
│
├── App.jsx
├── app.css
└── main.jsx
```

### 3.2 Component Architecture

```
<React.StrictMode>
  <ThemeProvider>                      # NEW: Dark/Light theme
    <FlowProvider>                     # Flow blockchain state
      <AuthProvider>                   # NEW: Centralized auth state
        <BrowserRouter>
          <Navbar />                   # NEW: Persistent navigation
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tender/:id" element={<TenderDetail />} />
            <Route path="/bids" element={<Bids />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin/*" element={<AdminRoute><AdminLayout /></AdminRoute>} />
            <Route path="/login" element={<Login />} />          # DEPRECATED (wallet-based)
            <Route path="/signup" element={<Signup />} />         # DEPRECATED (wallet-based)
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />                   # NEW: Persistent footer
          <ToastContainer />           # NEW: Global toast notifications
        </BrowserRouter>
      </AuthProvider>
    </FlowProvider>
  </ThemeProvider>
</React.StrictMode>
```

### 3.3 State Management Strategy

```
┌─────────────────────────────────────────────────────┐
│                    React Context                     │
│                                                     │
│  FlowContext {                                      │
│    user: { loggedIn, addr, ... }   // FCL state     │
│    txId: string                    // Last tx ID    │
│    status: TransactionStatus       // Tx status     │
│  }                                                  │
│                                                     │
│  AuthContext {                     // NEW            │
│    isWalletConnected: boolean                       │
│    walletAddress: string                            │
│    isAdmin: boolean               // On-chain check │
│    userProfile: { name, email }                     │
│    experience: number             // On-chain       │
│    ownedNFTs: NFT[]              // On-chain        │
│  }                                                  │
│                                                     │
│  ThemeContext {                    // NEW            │
│    theme: 'dark' | 'light'                          │
│    toggleTheme: Function                            │
│  }                                                  │
│                                                     │
│  Per-Page State via useState/useReducer             │
│    - Tender list data (from SWR/API)                │
│    - Form states                                    │
│    - UI toggles                                     │
│                                                     │
│  SWR for data fetching (already used)               │
│    - Auto revalidation                              │
│    - Cache management                               │
│    - Error/loading states                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 4. Backend Architecture

### 4.1 Folder Structure (Target)

```
backend/
├── config/                      # NEW: Configuration management
│   ├── database.js              # MySQL config from env
│   ├── server.js                # Server config (port, cors origins)
│   └── flow.js                  # Flow blockchain config
│
├── controllers/                 # NEW: Request handlers (thin layer)
│   ├── tenderController.js
│   ├── bidController.js
│   ├── userController.js
│   ├── adminController.js
│   └── healthController.js
│
├── services/                    # NEW: Business logic layer
│   ├── tenderService.js         # Tender-related business logic
│   ├── bidService.js            # Bid-related business logic
│   ├── userService.js           # User profile management
│   ├── indexerService.js        # NEW: Blockchain event indexer
│   └── ipfsService.js           # IPFS interaction
│
├── repositories/                # NEW: Data access layer
│   ├── tenderRepository.js      # MySQL queries for tenders
│   ├── bidRepository.js         # MySQL queries for bids
│   ├── userRepository.js        # MySQL queries for users
│   └── auditRepository.js       # MySQL queries for audit logs
│
├── middleware/
│   ├── walletAuth.js            # NEW: Verify Flow wallet signature
│   ├── adminAuth.js             # NEW: Verify admin role on-chain
│   ├── rateLimiter.js           # NEW: Rate limiting middleware
│   ├── validator.js             # NEW: Input validation middleware
│   ├── errorHandler.js          # NEW: Global error handler
│   ├── requestLogger.js         # NEW: Request logging
│   └── cors.js                  # NEW: CORS configuration
│
├── database/
│   ├── pool.js                  # NEW: Connection pool (replacing per-request connections)
│   ├── migrations/              # NEW: Database migration scripts
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_indexes.sql
│   │   └── 003_add_audit_log.sql
│   └── seeds/                   # NEW: Seed data for development
│       └── dev_seed.sql
│
├── blockchain/                  # NEW: Blockchain interaction layer
│   ├── eventListener.js         # Listen to Flow events
│   ├── flowClient.js            # Flow SDK client setup
│   └── scripts/                 # Cadence scripts for backend use
│       └── verifyAdmin.cdc
│
├── routes/
│   ├── v1/                      # NEW: API versioning
│   │   ├── tenderRoutes.js
│   │   ├── bidRoutes.js
│   │   ├── userRoutes.js
│   │   ├── adminRoutes.js
│   │   └── healthRoutes.js
│   └── index.js                 # Route aggregator
│
├── utils/
│   ├── logger.js                # NEW: Structured logging (Winston/Pino)
│   ├── errors.js                # NEW: Custom error classes
│   └── validators.js            # Validation helper functions
│
├── websocket/                   # NEW: Real-time communication
│   ├── wsServer.js              # WebSocket server setup
│   └── handlers.js              # WS event handlers
│
├── .env.example                 # NEW: Example env file (no secrets)
├── .gitignore
├── docker-compose.yaml
├── dockerfile
├── package.json
└── server.js                    # Entry point (slim)
```

### 4.2 Backend Layered Architecture

```
                    HTTP Request
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                   MIDDLEWARE LAYER                    │
│  rateLimiter → cors → helmet → walletAuth → validator│
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                  CONTROLLER LAYER                    │
│  Parse request → Call service → Format response      │
│  (Thin: no business logic here)                      │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                   SERVICE LAYER                      │
│  Business logic, orchestration, validation           │
│  Calls repositories and/or blockchain client         │
└───────────┬───────────────────────┬─────────────────┘
            │                       │
            ▼                       ▼
┌────────────────────┐  ┌────────────────────────────┐
│  REPOSITORY LAYER  │  │  BLOCKCHAIN LAYER          │
│  MySQL queries     │  │  Flow SDK / Event Listener │
│  (Read-only index) │  │  (Source of truth)         │
└────────────────────┘  └────────────────────────────┘
```

### 4.3 Database Connection Pool

```javascript
// database/pool.js — REPLACES per-request createConnection()
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: process.env.MYSQL_PORT,
  waitForConnections: true,
  connectionLimit: 20,        // Max connections
  queueLimit: 0,              // Unlimited queue
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

module.exports = pool;
```

### 4.4 Event Listener / Indexer Service

```
┌──────────────────────────────────────────────────────────────┐
│                  BLOCKCHAIN EVENT INDEXER                      │
│                                                               │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐  │
│  │ Flow Access  │────▶│ Event Parser │────▶│ MySQL Write  │  │
│  │    Node      │     │              │     │              │  │
│  │ (gRPC/REST)  │     │ Created  ────▶────▶│ tenders_index│  │
│  │              │     │ Bid      ────▶────▶│ bids_index   │  │
│  │  Poll every  │     │ Settled  ────▶────▶│ tenders_index│  │
│  │  5 seconds   │     │ Canceled ────▶────▶│ tenders_index│  │
│  │              │     │ All      ────▶────▶│ audit_log    │  │
│  └─────────────┘     └──────────────┘     └──────────────┘  │
│                              │                                │
│                              ▼                                │
│                    ┌──────────────────┐                       │
│                    │ WebSocket Server │                       │
│                    │ (Broadcast to    │                       │
│                    │  connected UIs)  │                       │
│                    └──────────────────┘                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Smart Contract Architecture

### 5.1 Contract Dependency Graph

```
┌───────────────────┐     ┌────────────────────┐
│  FungibleToken    │     │  NonFungibleToken   │
│  (Interface)      │     │  (Interface)        │
└────────┬──────────┘     └──────────┬──────────┘
         │                           │
         ▼                           ▼
┌───────────────────┐     ┌────────────────────┐
│   FlowToken       │     │     Tender          │
│  (FT implentation)│     │  (NFT for tenders)  │
│                   │     │                      │
│  - Vault          │     │  - NFT resource      │
│  - Minter         │     │  - Collection        │
│  - Burner         │     │  - Metadata struct   │
│  - Administrator  │     │  - createToken()     │
└────────┬──────────┘     └──────────┬──────────┘
         │                           │
         └───────────┬───────────────┘
                     │
                     ▼
          ┌────────────────────┐
          │  BiddingPlatform   │
          │  (Auction engine)  │
          │                    │
          │  - Project resource│
          │  - BiddingCollection│
          │  - ProjectStatus   │
          │                    │
          │  Key Functions:    │
          │  - createBidding() │
          │  - placeBid()      │
          │  - settleBidding() │
          │  - getStatus()     │
          └────────────────────┘
```

### 5.2 Smart Contract Upgrades Needed

```cadence
// NEW: Add to BiddingPlatform.cdc

// 1. Role-based access control
pub resource Admin {
    pub fun isAdmin(): Bool { return true }
}

// 2. Tender categories
pub enum TenderCategory: UInt8 {
    pub case infrastructure
    pub case it
    pub case healthcare
    pub case education
    pub case defense
    pub case other
}

// 3. Enhanced metadata in Tender.cdc
pub struct Metadata {
    pub var title: String
    pub var description: String
    pub var minimumExp: UInt64
    pub var exp: UInt64
    pub var category: TenderCategory    // NEW
    pub var createdAt: UFix64           // NEW
}

// 4. Dispute mechanism
pub resource Dispute {
    pub let tenderId: UInt64
    pub let filer: Address
    pub let reason: String
    pub let ipfsEvidence: String
    pub var resolved: Bool
    pub var resolution: String?
}

// 5. Experience tracking per user
pub resource UserProfile {
    pub var totalExperience: UInt64
    pub var completedTenders: [UInt64]
    pub var activeBids: [UInt64]
}
```

---

## 6. Authentication Architecture

### 6.1 Current (v1) — REMOVE

```
Frontend → POST /login (email, password)
  → Backend validates against MySQL
  → Returns JWT in httpOnly cookie
  → Subsequent requests carry cookie
```

### 6.2 Target (v2) — IMPLEMENT

```
Frontend → FCL.logIn() → Blocto Wallet
  → User approves in wallet
  → FCL returns user object { addr, loggedIn: true }
  → Frontend sends signed message for API calls
  → Backend verifies signature against Flow address
  → On-chain script checks if address has Admin resource
```

```
┌─────────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
│  Frontend   │───▶│  Blocto  │───▶│ Flow Network │───▶│ Frontend │
│  fcl.logIn()│    │  Wallet  │    │ (Verify sig) │    │ (Authed) │
└─────────────┘    └──────────┘    └──────────────┘    └──────────┘
                                                              │
                                                              ▼
                                                    ┌──────────────┐
                                                    │ API Request  │
                                                    │ + Signed Msg │
                                                    └──────┬───────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │   Backend    │
                                                    │ Verify sig   │
                                                    │ Check admin  │
                                                    │ role on-chain│
                                                    └──────────────┘
```

---

## 7. Security Architecture

### 7.1 Defense in Depth

```
Layer 1: Network
├── HTTPS/TLS encryption
├── CORS restricted to known origins
├── Helmet.js security headers
└── Rate limiting (express-rate-limit)

Layer 2: Application
├── Input validation (express-validator)
├── Output sanitization (DOMPurify)
├── CSRF protection
├── File upload validation (MIME + extension + size)
└── SQL parameterized queries

Layer 3: Authentication
├── Wallet-based identity (no passwords to steal)
├── Cryptographic signature verification
├── On-chain role verification for admin actions
└── Session management via FCL

Layer 4: Data
├── Blockchain immutability (source of truth)
├── MySQL as read-only index (no sensitive data)
├── Secrets in environment variables only
├── .env never committed to Git
└── API keys rotated regularly

Layer 5: Smart Contract
├── Access control on all mutating functions
├── Pre/post conditions (Cadence built-in)
├── Resource-oriented security model
├── Auction state machine (prevents invalid transitions)
└── Time-based expiry checks
```

### 7.2 Secrets Management

```
NEVER in code:
├── Flow private keys
├── Web3.Storage API tokens
├── JWT secrets (if used)
├── MySQL credentials
└── Any API keys

WHERE to store:
├── Development: .env file (gitignored)
├── Staging: Environment variables in CI/CD
├── Production: GCP Secret Manager / Vault
└── flow.json: Use environment variables for keys
```

---

## 8. Deployment Architecture

### 8.1 Development

```
┌──────────────────────────────────────────────────────┐
│                    LOCAL MACHINE                      │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Vite Dev    │  │ Express Dev │  │ MySQL       │ │
│  │ Server      │  │ Server      │  │ (Docker)    │ │
│  │ :5173       │  │ :5000       │  │ :3306       │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                      │
│  Flow Testnet (remote) ── access.devnet.nodes.onflow │
│  IPFS (remote) ── Web3.Storage API                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 8.2 Production (Target)

```
┌──────────────────────────────────────────────────────┐
│                   GOOGLE CLOUD PLATFORM               │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Cloud Run   │  │ Cloud Run   │  │ Cloud SQL   │ │
│  │ (Frontend)  │  │ (Backend)   │  │ (MySQL)     │ │
│  │ + CDN       │  │ + Indexer   │  │             │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                      │
│  ┌─────────────┐  ┌─────────────┐                   │
│  │ Secret      │  │ Cloud       │                   │
│  │ Manager     │  │ Monitoring  │                   │
│  └─────────────┘  └─────────────┘                   │
│                                                      │
│  External:                                           │
│  ├── Flow Mainnet (blockchain)                       │
│  ├── IPFS / Filecoin (file storage)                  │
│  └── Blocto (wallet provider)                        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 9. Design Tokens (CSS)

```css
/* styles/variables.css */

:root {
  /* Primary Colors */
  --color-primary: #6C5CE7;           /* Purple - brand color */
  --color-primary-light: #A29BFE;
  --color-primary-dark: #4834D4;

  /* Secondary Colors */
  --color-secondary: #00CEC9;         /* Teal - accent */
  --color-secondary-light: #81ECEC;
  --color-secondary-dark: #00B894;

  /* Status Colors */
  --color-success: #00B894;
  --color-warning: #FDCB6E;
  --color-error: #E17055;
  --color-info: #74B9FF;

  /* Neutral Colors */
  --color-bg-primary: #0A0A1A;        /* Dark background */
  --color-bg-secondary: #12122A;
  --color-bg-card: #1A1A3E;
  --color-bg-input: #22224A;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #B2B2D8;
  --color-text-muted: #6C6C8A;
  --color-border: #2D2D5E;

  /* Typography */
  --font-primary: 'Inter', -apple-system, sans-serif;
  --font-heading: 'Outfit', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 50%;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.2);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 20px rgba(108, 92, 231, 0.3);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;

  /* Z-index */
  --z-dropdown: 100;
  --z-modal-backdrop: 200;
  --z-modal: 300;
  --z-toast: 400;
  --z-tooltip: 500;
}

/* Light theme overrides */
[data-theme="light"] {
  --color-bg-primary: #F8F9FA;
  --color-bg-secondary: #FFFFFF;
  --color-bg-card: #FFFFFF;
  --color-bg-input: #F1F3F5;
  --color-text-primary: #1A1A2E;
  --color-text-secondary: #495057;
  --color-text-muted: #868E96;
  --color-border: #DEE2E6;
}
```

---

## 10. Error Handling Strategy

```
┌──────────────────────────────────────────────────────┐
│                ERROR HANDLING FLOW                     │
│                                                      │
│  Frontend:                                           │
│  ├── API errors → Toast notifications (user-friendly)│
│  ├── React errors → ErrorBoundary (fallback UI)      │
│  ├── Network errors → Retry with exponential backoff │
│  └── Blockchain tx errors → Display tx hash + reason │
│                                                      │
│  Backend:                                            │
│  ├── Validation errors → 400 { error, details }     │
│  ├── Auth errors → 401 { error: "Unauthorized" }    │
│  ├── Not found → 404 { error: "Not found" }         │
│  ├── Business logic → 409/422 { error, details }    │
│  ├── Server errors → 500 { error: "Internal" }      │
│  └── NEVER expose stack traces or raw SQL errors     │
│                                                      │
│  Error Response Format:                              │
│  {                                                   │
│    "success": false,                                 │
│    "error": {                                        │
│      "code": "TENDER_NOT_FOUND",                     │
│      "message": "No tender found with this ID",     │
│      "details": {}  // Optional                      │
│    }                                                 │
│  }                                                   │
│                                                      │
│  Success Response Format:                            │
│  {                                                   │
│    "success": true,                                  │
│    "data": { ... },                                  │
│    "meta": { page, total, ... }  // For paginated    │
│  }                                                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 11. Technology Decisions & Rationale

| Decision | Chosen | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Blockchain | Flow | Ethereum, Solana, Polygon | Resource-oriented programming (Cadence), low fees, built for apps |
| Smart Contract Language | Cadence | Solidity, Rust | Type-safe, resource-oriented, prevents common vulnerabilities |
| Frontend | React + Vite | Next.js, Vue | Already in use, Vite is fast, SPA is sufficient |
| Backend | Express.js | Fastify, NestJS | Simple, already in use, sufficient for indexer role |
| Database | MySQL | PostgreSQL, MongoDB | Already in use on GCP Cloud SQL |
| Wallet | Blocto | Metamask, Phantom | Native Flow wallet, best UX for Flow DApps |
| IPFS Client | Web3.Storage | Pinata, Infura | Free tier, Filecoin-backed persistence |
| Data Fetching | SWR | React Query | Already in use, lightweight |
| Real-time | WebSocket | SSE, Polling | Bi-directional, efficient for bid updates |
| Auth | Wallet-based | JWT, OAuth | Decentralized, no password management needed |
