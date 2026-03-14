# 📋 CRD — Comprehensive Requirements Document

## TenderBlock v2.0 — Decentralized Tendering System

> **Document Version**: 2.0  
> **Last Updated**: 2026-03-02  
> **Status**: Active Development  
> **Project Type**: Decentralized Application (DApp) for Government Tendering

---

## 1. Project Vision

Build a **fully decentralized**, transparent, and tamper-proof government tendering system where:
- **All critical operations** (tender creation, bidding, settlement, winner determination) happen **on-chain** (Flow Blockchain)
- **MySQL** serves only as a **read-optimized indexer/cache**, never the source of truth
- **User identity** is wallet-based (Blocto on Flow), eliminating centralized credential management
- **Documents** are stored on IPFS (Filecoin/Web3.Storage), ensuring immutability
- **Audit trails** are fully transparent and verifiable on the blockchain

---

## 2. User Roles & Permissions

### 2.1 Roles

| Role | Description | Authentication |
|------|-------------|----------------|
| **Government Admin** | Creates tenders, monitors bids, settles auctions, manages platform | Blocto Wallet + On-chain admin role verification |
| **Bidder (Contractor)** | Registers, views tenders, places bids, receives NFT on winning | Blocto Wallet + Optional email for notifications |
| **Public Viewer** | Views active/past tenders and results (read-only) | No auth required |
| **Super Admin** | Platform-level config, role assignment, emergency controls | Blocto Wallet + Multi-sig on-chain verification |

### 2.2 Permission Matrix

| Action | Public | Bidder | Gov Admin | Super Admin |
|--------|--------|--------|-----------|-------------|
| View active tenders | ✅ | ✅ | ✅ | ✅ |
| View past tenders & results | ✅ | ✅ | ✅ | ✅ |
| View bid details | ❌ | ✅ (own) | ✅ (all) | ✅ (all) |
| Place bid | ❌ | ✅ | ❌ | ❌ |
| Create tender | ❌ | ❌ | ✅ | ✅ |
| Settle auction | ❌ | ❌ | ✅ | ✅ |
| Manage roles | ❌ | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ✅ (own) | ✅ | ✅ |
| Cancel tender | ❌ | ❌ | ✅ (own created) | ✅ |
| File dispute | ❌ | ✅ | ✅ | ✅ |

---

## 3. Functional Requirements

### 3.1 Authentication & Identity (FR-AUTH)

| ID | Requirement | Priority | Blockchain? |
|----|-------------|----------|-------------|
| FR-AUTH-01 | User authenticates via Blocto wallet (Flow) | P0 | ✅ On-chain |
| FR-AUTH-02 | Wallet address serves as primary user identifier | P0 | ✅ On-chain |
| FR-AUTH-03 | Remove legacy email/password JWT auth system | P0 | N/A (removal) |
| FR-AUTH-04 | Bidder profile linked to wallet address on-chain | P0 | ✅ On-chain |
| FR-AUTH-05 | Optional email for notifications only (stored off-chain) | P2 | ❌ Off-chain |
| FR-AUTH-06 | Admin role verification happens on-chain (not just frontend check) | P0 | ✅ On-chain |
| FR-AUTH-07 | Session persistence via FCL current user subscription | P1 | ✅ On-chain |
| FR-AUTH-08 | Logout clears wallet session and local state | P1 | ✅ On-chain |

### 3.2 Tender Management (FR-TENDER)

| ID | Requirement | Priority | Blockchain? |
|----|-------------|----------|-------------|
| FR-TENDER-01 | Admin creates tender → mints NFT on Flow with metadata | P0 | ✅ On-chain |
| FR-TENDER-02 | Tender metadata includes: title, description, min experience, exp reward, budget, duration | P0 | ✅ On-chain |
| FR-TENDER-03 | Tender documents uploaded to IPFS, hash stored on-chain in NFT | P0 | ✅ On-chain |
| FR-TENDER-04 | `BiddingPlatform.createBidding()` called on-chain to start auction | P0 | ✅ On-chain |
| FR-TENDER-05 | MySQL indexer listens to `Created` event and stores for quick queries | P1 | ❌ Indexer |
| FR-TENDER-06 | Tender has defined start time and duration (on-chain enforced) | P0 | ✅ On-chain |
| FR-TENDER-07 | Tender categories: Infrastructure, IT, Healthcare, Education, Defense, Other | P2 | ✅ On-chain |
| FR-TENDER-08 | Tender status: Draft → Active → Expired → Settled / Cancelled | P0 | ✅ On-chain |
| FR-TENDER-09 | Admin can cancel a tender before any bids are placed | P1 | ✅ On-chain |
| FR-TENDER-10 | Tender list supports pagination (20 per page) | P1 | ❌ Frontend |
| FR-TENDER-11 | Search tenders by title, category, status | P1 | ❌ Frontend + Indexer |
| FR-TENDER-12 | Filter tenders by: Active, Past, My Bids | P1 | ❌ Frontend |

### 3.3 Bidding System (FR-BID)

| ID | Requirement | Priority | Blockchain? |
|----|-------------|----------|-------------|
| FR-BID-01 | Bidder places bid via `BiddingPlatform.placeBid()` on-chain | P0 | ✅ On-chain |
| FR-BID-02 | Reverse auction: lowest bid wins (enforced by smart contract) | P0 | ✅ On-chain |
| FR-BID-03 | Bid must be lower than current minimum demand (on-chain check) | P0 | ✅ On-chain |
| FR-BID-04 | Bidder must meet minimum experience requirement (on-chain check) | P0 | ✅ On-chain |
| FR-BID-05 | Bid must be greater than 0 (on-chain check) | P0 | ✅ On-chain |
| FR-BID-06 | Bidder cannot bid on expired auctions (on-chain time check) | P0 | ✅ On-chain |
| FR-BID-07 | Each bidder can place only one bid per tender (on-chain enforced) | P1 | ✅ On-chain |
| FR-BID-08 | Bid events indexed in MySQL for leaderboard display | P1 | ❌ Indexer |
| FR-BID-09 | Real-time bid updates via WebSocket to connected clients | P2 | ❌ Off-chain |
| FR-BID-10 | Bid security deposit required (escrow on-chain) | P2 | ✅ On-chain |
| FR-BID-11 | Previous bidder's deposit released when outbid | P2 | ✅ On-chain |

### 3.4 Auction Settlement (FR-SETTLE)

| ID | Requirement | Priority | Blockchain? |
|----|-------------|----------|-------------|
| FR-SETTLE-01 | Admin calls `settleBidding()` on-chain after auction expires | P0 | ✅ On-chain |
| FR-SETTLE-02 | Winner receives Tender NFT on-chain (ownership proof) | P0 | ✅ On-chain |
| FR-SETTLE-03 | Winner's experience updated on-chain | P0 | ✅ On-chain |
| FR-SETTLE-04 | Settlement event indexed in MySQL | P1 | ❌ Indexer |
| FR-SETTLE-05 | Auto-settlement when timer expires (cron job triggers on-chain tx) | P2 | ✅ On-chain (triggered) |
| FR-SETTLE-06 | If no bids, NFT returned to admin on-chain | P1 | ✅ On-chain |
| FR-SETTLE-07 | Settlement result publicly verifiable on Flow block explorer | P1 | ✅ On-chain |

### 3.5 NFT & Experience System (FR-NFT)

| ID | Requirement | Priority | Blockchain? |
|----|-------------|----------|-------------|
| FR-NFT-01 | Each tender is represented as an NFT (Tender.NFT) on Flow | P0 | ✅ On-chain |
| FR-NFT-02 | NFT contains: IPFS hash, metadata (title, description, experience) | P0 | ✅ On-chain |
| FR-NFT-03 | Winning bidder receives the tender NFT | P0 | ✅ On-chain |
| FR-NFT-04 | Experience points accumulated from won tenders (on-chain) | P0 | ✅ On-chain |
| FR-NFT-05 | Bidder can view owned NFTs in profile | P1 | ✅ On-chain |
| FR-NFT-06 | NFT serves as immutable proof of tender award | P0 | ✅ On-chain |

### 3.6 Audit & Transparency (FR-AUDIT)

| ID | Requirement | Priority | Blockchain? |
|----|-------------|----------|-------------|
| FR-AUDIT-01 | All tender/bid/settlement events emitted on-chain | P0 | ✅ On-chain |
| FR-AUDIT-02 | Transaction hashes displayed in UI with block explorer links | P1 | ✅ On-chain |
| FR-AUDIT-03 | Audit log page showing all on-chain events for a tender | P1 | ✅ On-chain |
| FR-AUDIT-04 | Public can verify any tender outcome on block explorer | P0 | ✅ On-chain |
| FR-AUDIT-05 | Immutable bid history (cannot be deleted or modified) | P0 | ✅ On-chain |

### 3.7 Dispute Resolution (FR-DISPUTE)

| ID | Requirement | Priority | Blockchain? |
|----|-------------|----------|-------------|
| FR-DISPUTE-01 | Bidder can file dispute against a tender settlement | P2 | ✅ On-chain |
| FR-DISPUTE-02 | Dispute includes reason and supporting documents (IPFS) | P2 | ✅ On-chain |
| FR-DISPUTE-03 | Super admin can review and resolve disputes | P2 | ✅ On-chain |
| FR-DISPUTE-04 | Dispute resolution recorded on-chain for transparency | P2 | ✅ On-chain |

---

## 4. Non-Functional Requirements

### 4.1 Security (NFR-SEC)

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-SEC-01 | No secrets/keys hardcoded in source code | P0 |
| NFR-SEC-02 | All secrets in `.env` files, never committed to Git | P0 |
| NFR-SEC-03 | Rate limiting on all API endpoints (100 req/min general, 5 req/min auth) | P0 |
| NFR-SEC-04 | Input validation and sanitization on all endpoints | P0 |
| NFR-SEC-05 | HTTPS enforced in production | P0 |
| NFR-SEC-06 | CORS restricted to known origins only | P0 |
| NFR-SEC-07 | CSRF protection on state-changing endpoints | P1 |
| NFR-SEC-08 | SQL injection prevention (parameterized queries only) | P0 |
| NFR-SEC-09 | XSS prevention (sanitize all rendered user content) | P0 |
| NFR-SEC-10 | Helmet.js security headers (already partially implemented) | P0 |
| NFR-SEC-11 | File upload: validate MIME type, not just extension | P1 |
| NFR-SEC-12 | File upload: max 5MB, allowed types: PDF, JPEG, PNG, DOCX | P1 |
| NFR-SEC-13 | Smart contract access control properly enforced | P0 |
| NFR-SEC-14 | Admin actions require on-chain role verification | P0 |

### 4.2 Performance (NFR-PERF)

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-PERF-01 | Page load time < 3 seconds | P1 |
| NFR-PERF-02 | API response time < 500ms for read operations | P1 |
| NFR-PERF-03 | MySQL connection pooling (min 5, max 20 connections) | P0 |
| NFR-PERF-04 | Frontend code splitting and lazy loading | P2 |
| NFR-PERF-05 | Tender list pagination (20 items per page) | P1 |
| NFR-PERF-06 | On-chain transactions confirmed within ~10 seconds (Flow speed) | P1 |

### 4.3 Reliability (NFR-REL)

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-REL-01 | Graceful error handling — no raw error objects sent to client | P0 |
| NFR-REL-02 | Database connection retry logic | P1 |
| NFR-REL-03 | Frontend error boundaries to prevent full-page crashes | P1 |
| NFR-REL-04 | Blockchain transaction retry with exponential backoff | P1 |

### 4.4 Maintainability (NFR-MAIN)

| ID | Requirement | Priority |
|----|-------------|----------|
| NFR-MAIN-01 | Backend follows Controller → Service → Repository pattern | P1 |
| NFR-MAIN-02 | All environment-specific values in config/env files | P0 |
| NFR-MAIN-03 | No hardcoded URLs in frontend components | P0 |
| NFR-MAIN-04 | ESLint + Prettier enforced on all code | P1 |
| NFR-MAIN-05 | Meaningful commit messages following Conventional Commits | P2 |

---

## 5. Data Models

### 5.1 On-Chain Data (Source of Truth)

```
Tender.NFT {
    id: UInt64                    // Auto-incremented NFT ID
    ipfsHash: String              // IPFS CID of tender documents
    metadata: Metadata {
        title: String
        description: String
        minimumExp: UInt64        // Min experience to participate
        exp: UInt64               // Experience awarded to winner
        category: String          // NEW: Tender category
    }
}

BiddingPlatform.Project {
    biddingID: UInt64
    NFT: Tender.NFT               // The tender NFT being auctioned
    minimumExp: UInt64
    maximumBudget: UFix64         // Max budget for the project
    currMinimumDemand: UFix64     // Current lowest bid
    biddingStartTime: UFix64
    biddingLength: UFix64         // Duration in seconds
    biddingCompleted: Bool
    currentPrice: UFix64
    recipientCollectionCap        // Winner's NFT collection
    recipientVaultCap             // Winner's token vault
    ownerCollectionCap            // Admin's NFT collection
    ownerVaultCap                 // Admin's token vault
}

BiddingPlatform.ProjectStatus {
    id: UInt64
    minExp: UInt64
    maximumBudget: UFix64
    currMinimumDemand: UFix64
    active: Bool
    timeRemaining: Fix64
    endTime: Fix64
    startTime: Fix64
    metadata: Tender.Metadata
    tenderId: UInt64?
    owner: Address
    leader: Address?              // Current lowest bidder
    completed: Bool
    expired: Bool
}
```

### 5.2 Off-Chain Data (MySQL Indexer / Cache)

```sql
-- Indexed from on-chain events (READ-ONLY cache)
CREATE TABLE tenders_index (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tender_id VARCHAR(128) UNIQUE NOT NULL,
    on_chain_id BIGINT NOT NULL,              -- Flow NFT ID
    title VARCHAR(256) NOT NULL,
    description MEDIUMTEXT NOT NULL,
    ipfs_hash VARCHAR(256) NOT NULL,
    category ENUM('infrastructure','it','healthcare','education','defense','other') DEFAULT 'other',
    minimum_exp INT NOT NULL,
    exp_reward INT NOT NULL,
    maximum_budget DECIMAL(18,8) NOT NULL,
    start_time DATETIME NOT NULL,
    bidding_length INT NOT NULL,              -- seconds
    start_price DECIMAL(18,8) NOT NULL,
    current_min_demand DECIMAL(18,8),
    leader_address VARCHAR(64),               -- Flow address of current lowest bidder
    owner_address VARCHAR(64) NOT NULL,       -- Admin's Flow address
    status ENUM('active','expired','settled','cancelled') DEFAULT 'active',
    winner_address VARCHAR(64),
    settlement_tx_hash VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_owner (owner_address)
);

-- Indexed from on-chain bid events
CREATE TABLE bids_index (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tender_id VARCHAR(128) NOT NULL,
    bidder_address VARCHAR(64) NOT NULL,      -- Flow wallet address
    bid_amount DECIMAL(18,8) NOT NULL,
    tx_hash VARCHAR(128) NOT NULL,            -- Flow transaction hash
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_bid (tender_id, bidder_address),
    INDEX idx_tender (tender_id),
    INDEX idx_bidder (bidder_address),
    FOREIGN KEY (tender_id) REFERENCES tenders_index(tender_id)
);

-- Optional: for notification emails
CREATE TABLE user_profiles (
    wallet_address VARCHAR(64) PRIMARY KEY,   -- Flow wallet address
    display_name VARCHAR(128),
    email VARCHAR(256),                        -- Optional, for notifications only
    notification_prefs JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log indexed from on-chain events
CREATE TABLE audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM('tender_created','bid_placed','bid_outbid','auction_settled','auction_cancelled','dispute_filed','dispute_resolved'),
    tender_id VARCHAR(128),
    actor_address VARCHAR(64),
    details JSON,
    tx_hash VARCHAR(128),
    block_height BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tender (tender_id),
    INDEX idx_event (event_type),
    INDEX idx_actor (actor_address)
);
```

---

## 6. API Endpoints (Backend v2.0)

### 6.1 Public Endpoints (No Auth)

| Method | Endpoint | Description | Source |
|--------|----------|-------------|--------|
| GET | `/api/v1/tenders` | List all tenders (paginated, filterable) | MySQL Index |
| GET | `/api/v1/tenders/:id` | Get single tender details | MySQL Index |
| GET | `/api/v1/tenders/:id/bids` | Get bid history for a tender | MySQL Index |
| GET | `/api/v1/tenders/:id/audit` | Get audit trail for a tender | MySQL Index |
| GET | `/api/v1/health` | Health check | Server |

### 6.2 Authenticated Endpoints (Wallet Verified)

| Method | Endpoint | Description | Source |
|--------|----------|-------------|--------|
| GET | `/api/v1/user/profile` | Get user profile | MySQL + On-chain |
| PUT | `/api/v1/user/profile` | Update notification email | MySQL |
| GET | `/api/v1/user/bids` | Get user's bid history | MySQL Index |
| GET | `/api/v1/user/nfts` | Get user's won tender NFTs | On-chain |
| POST | `/api/v1/upload/ipfs` | Upload file to IPFS | Web3.Storage |

### 6.3 Admin Endpoints (Admin Role Verified On-Chain)

| Method | Endpoint | Description | Source |
|--------|----------|-------------|--------|
| GET | `/api/v1/admin/tenders` | List all tenders with admin details | MySQL Index |
| GET | `/api/v1/admin/dashboard` | Dashboard stats | MySQL Index |
| POST | `/api/v1/admin/tenders/sync` | Force re-sync from blockchain | On-chain → MySQL |

> **Note**: Tender creation, bidding, and settlement happen **directly on-chain** via FCL from the frontend. The backend only serves as an indexer.

---

## 7. Smart Contract Events to Index

| Event | Data | MySQL Action |
|-------|------|-------------|
| `Biddingplatform.Created` | tokenID, owner, startPrice, startTime | INSERT into `tenders_index` |
| `Biddingplatform.Bid` | tokenID, bidderAddress, bidPrice | INSERT into `bids_index`, UPDATE `tenders_index.current_min_demand` |
| `Biddingplatform.Settled` | tokenID, price | UPDATE `tenders_index` status, winner |
| `Biddingplatform.Canceled` | tokenID | UPDATE `tenders_index` status |
| `Tender.Deposit` | id, to | Log NFT transfer |
| `Tender.Withdraw` | id, from | Log NFT transfer |

---

## 8. Priority Legend

| Priority | Meaning | Timeline |
|----------|---------|----------|
| **P0** | Must have — project is broken without it | Sprint 1-2 (Week 1-2) |
| **P1** | Should have — important for quality | Sprint 3-4 (Week 3-4) |
| **P2** | Nice to have — enhances user experience | Sprint 5+ (Week 5+) |

---

## 9. Success Criteria

- [ ] All critical operations (tender create, bid, settle) go through Flow blockchain
- [ ] MySQL is only a read cache, never the source of truth
- [ ] No secrets in source code
- [ ] All admin routes protected with on-chain role verification
- [ ] Bidding enforces experience requirements on-chain
- [ ] Winner receives NFT on-chain
- [ ] All events verifiable on Flow block explorer
- [ ] Rate limiting on all API endpoints
- [ ] Input validation on all user inputs
- [ ] Real-time bid updates in UI
