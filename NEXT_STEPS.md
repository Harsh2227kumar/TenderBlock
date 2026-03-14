# ✅ NEXT STEPS — Implementation Roadmap

## TenderBlock v2.0 — Decentralized Tendering System

> **Last Updated**: 2026-03-02  
> **Total Estimated Time**: 6–8 weeks (part-time development)

---

## Phase 0: ⚡ CRITICAL FIXES (Do This FIRST — Day 1)

> **Time Estimate**: 2-4 hours  
> **Goal**: Eliminate all critical security vulnerabilities immediately

### Step 0.1: Remove Hardcoded Secrets ⛔

**Files to fix:**

| File | Issue | Fix |
|------|-------|-----|
| `backend/.env` | JWT_SECRET is `"supersecretkey"` | Generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `client/src/components/modal/util.jsx` | Web3.Storage token hardcoded (line 6) | Move to environment variable `VITE_WEB3_STORAGE_TOKEN` |
| `client/flow.json` | Private key exposed (line 11) | Add `flow.json` to `.gitignore`, use env vars |

**Action Items:**
- [ ] Generate a new 64-character JWT secret and put it in `.env`
- [ ] Replace hardcoded Web3.Storage token with `import.meta.env.VITE_WEB3_STORAGE_TOKEN`
- [ ] Create `client/.env` with `VITE_WEB3_STORAGE_TOKEN=your_token`
- [ ] Add `flow.json` and `.env` to `.gitignore` in **both** `backend/` and `client/`
- [ ] Rotate the exposed private key: generate a new Flow testnet account
- [ ] Rotate the exposed Web3.Storage token: create a new one

### Step 0.2: Fix Authorization Bug ⛔

**File**: `backend/middleware/authorization.js` — Line 7

```javascript
// ❌ CURRENT (creates global variable — race condition!)
authorization = request.cookies.authorization;

// ✅ FIX (add const)
const authorization = request.cookies.authorization;
```

### Step 0.3: Add Auth to Unprotected Admin Routes ⛔

**File**: `backend/routes/tender.js`

Routes that MUST be protected:
- [ ] `POST /tender/create` (line 35) — Add `authorization` middleware
- [ ] `POST /settle` (line 292) — Add `authorization` middleware + admin check
- [ ] `GET /tender/id` (line 23) — Add `authorization` middleware

```javascript
// ✅ Add authorization middleware to these routes:
router.post("/tender/create", authorization, (request, response) => { ... });
router.post("/settle", authorization, (request, response) => { ... });
router.get("/tender/id", authorization, (request, response) => { ... });
```

### Step 0.4: Update .gitignore ⛔

Add to BOTH `backend/.gitignore` and `client/.gitignore`:

```
.env
.env.local
.env.production
flow.json
```

Create `.env.example` files with placeholder values for both backend and client.

---

## Phase 1: 🏗️ Backend Restructuring (Week 1)

> **Time Estimate**: 8-12 hours  
> **Goal**: Clean architecture, connection pooling, better error handling

### Step 1.1: Connection Pooling

**Priority**: 🔴 High  
**Why**: Current code creates a new MySQL connection for every single request → memory leak

- [ ] Create `backend/database/pool.js` using `mysql2/promise` with `createPool()`
- [ ] Replace ALL `mysql.createConnection(db_config)` calls with pool
- [ ] Remove ALL `db.end()` calls (pool manages connections automatically)
- [ ] Test all routes still work

### Step 1.2: Project Structure Refactor

**Priority**: 🟠 High  
**Why**: Flat structure with SQL in routes is unmaintainable

- [ ] Create folder structure:
  ```
  backend/
  ├── config/          # database.js, server.js
  ├── controllers/     # tenderController.js, bidController.js, userController.js
  ├── services/        # tenderService.js, bidService.js, userService.js
  ├── repositories/    # tenderRepository.js, bidRepository.js, userRepository.js
  ├── middleware/      # (existing + new middleware)
  ├── routes/v1/       # API versioned routes
  ├── utils/           # errors.js, logger.js, validators.js
  └── database/        # pool.js, migrations/
  ```
- [ ] Move SQL queries from `queries.js` into repositories
- [ ] Move business logic from routes into services
- [ ] Routes should only: parse request → call controller → send response

### Step 1.3: Global Error Handler

**Priority**: 🟠 High  
**Why**: Raw error objects currently sent to clients

- [ ] Create `utils/errors.js` with `AppError` class
- [ ] Create `middleware/errorHandler.js` — global error handling middleware
- [ ] Add as last middleware in `server.js`: `app.use(errorHandler);`
- [ ] Replace all `response.status(500).json({ message: error })` with `next(error)`

### Step 1.4: Rate Limiting

**Priority**: 🟠 High  
**Why**: No protection against brute force or DoS

- [ ] Install `express-rate-limit`: `npm install express-rate-limit`
- [ ] Create `middleware/rateLimiter.js`
- [ ] Apply general limiter (100 req/min) to all routes
- [ ] Apply strict limiter (5 req/min) to auth routes (`/login`, `/signup`)

### Step 1.5: Input Validation

**Priority**: 🟠 High  
**Why**: No server-side validation beyond basic null checks

- [ ] Install `express-validator`: `npm install express-validator`
- [ ] Create validation schemas for each route
- [ ] Validate: tender fields, bid amounts, registration data
- [ ] Sanitize all string inputs to prevent XSS

### Step 1.6: Remove Table-Creation-On-Every-Request

**Priority**: 🟡 Medium  
**Why**: `CREATE TABLE IF NOT EXISTS` runs on every signup/tender create request

- [ ] Create `database/migrations/001_initial_schema.sql`
- [ ] Move all `CREATE TABLE` queries to migration file
- [ ] Add a setup script: `npm run db:setup` to run migrations
- [ ] Remove `createNewTableBidders` and `createNewTableTenders` from route handlers

---

## Phase 2: 🔗 Blockchain Integration (Week 2-3)

> **Time Estimate**: 15-20 hours  
> **Goal**: Make blockchain the actual source of truth, not just decorative

### Step 2.1: Route Bids Through Blockchain

**Priority**: 🔴 Critical  
**Why**: Current bids go directly to MySQL, bypassing the smart contract

**Current flow** (broken):
```
Frontend → POST /placebid → MySQL (no blockchain!)
```

**Target flow**:
```
Frontend → FCL.mutate(placeBid) → Flow Blockchain →
  Event Listener → MySQL (index only)
```

- [ ] Create a new Cadence transaction `cadence/transactions/placeBid.cdc`
- [ ] Create frontend service `services/flowService.js` with `placeBid()` function
- [ ] Update `Bids.jsx` to call FCL transaction instead of REST API
- [ ] Wait for on-chain confirmation before showing success
- [ ] Display transaction hash in UI

### Step 2.2: Route Settlement Through Blockchain

**Priority**: 🔴 Critical  
**Why**: Settlement currently only updates MySQL

- [ ] Create a new Cadence transaction `cadence/transactions/settleBidding.cdc`
- [ ] Update `Tender.jsx` to call FCL transaction for settlement
- [ ] Verify on-chain that auction has expired before settling
- [ ] Display settlement transaction hash
- [ ] Update MySQL index after on-chain confirmation

### Step 2.3: Connect Tender Creation to Blockchain

**Priority**: 🔴 Critical  
**Why**: Tender creation exists on-chain (startProject.js) but NOT connected to the Modal/API

- [ ] Update `Modal.jsx` to call BOTH:
  1. `CreateTenderInFlow()` → on-chain NFT mint + auction creation
  2. THEN `POST /api/v1/tenders/index` → MySQL indexing (for fast reads)
- [ ] Fix missing params in `startProject.js` (`maximumBudget`, `currMinimumDemand` not passed)
- [ ] Show transaction confirmation in UI

### Step 2.4: Build Event Listener / Indexer

**Priority**: 🟠 High  
**Why**: MySQL should be populated from blockchain events, not direct writes

- [ ] Create `backend/blockchain/eventListener.js`
- [ ] Poll Flow blockchain for events every 5-10 seconds
- [ ] Parse events: `Created`, `Bid`, `Settled`, `Canceled`
- [ ] Write parsed events to MySQL `tenders_index`, `bids_index`, `audit_log`
- [ ] WebSocket broadcast to connected clients on new events

### Step 2.5: Smart Contract Updates

**Priority**: 🟡 Medium (may require redeployment)  
- [ ] Add `category` field to `Tender.Metadata`
- [ ] Add admin role resource for on-chain access control
- [ ] Add experience requirement check back to `placeBid()` (using bidder's on-chain experience)
- [ ] Deploy updated contracts to testnet

---

## Phase 3: 🔐 Authentication Overhaul (Week 3-4)

> **Time Estimate**: 8-12 hours  
> **Goal**: Wallet-first authentication, remove centralized auth

### Step 3.1: Enhance Wallet Auth on Frontend

**Priority**: 🟠 High  

- [ ] Create `context/AuthProvider.jsx` wrapping FlowProvider
- [ ] Track: `walletAddress`, `isLoggedIn`, `isAdmin`, `experience`, `ownedNFTs`
- [ ] Create `hooks/useAuth.js` for easy access to auth state
- [ ] Check admin status on-chain when wallet connects

### Step 3.2: Backend Wallet Verification

**Priority**: 🟠 High  

- [ ] Create `middleware/walletAuth.js` — verifies signed message from FCL
- [ ] Create `middleware/adminAuth.js` — checks admin role on blockchain
- [ ] Replace `authorization` middleware on admin routes with `walletAuth + adminAuth`
- [ ] Remove JWT-based auth from admin/tender routes

### Step 3.3: Deprecate (But Keep) Legacy JWT Auth

**Priority**: 🟡 Medium  

- [ ] Mark `/login` and `/signup` as deprecated in API docs
- [ ] Keep them working for backward compatibility
- [ ] Add warning banner on Login/Signup pages: "Use wallet login instead"
- [ ] Plan full removal in v3.0

### Step 3.4: Add Logout Functionality

**Priority**: 🟠 High  

- [ ] Add "Disconnect Wallet" button in Navbar
- [ ] Call `fcl.unauthenticate()` on click
- [ ] Clear all local state
- [ ] Redirect to landing page

---

## Phase 4: 🎨 Frontend Improvements (Week 4-5)

> **Time Estimate**: 12-16 hours  
> **Goal**: Better UX, real-time updates, proper error handling

### Step 4.1: Fix Existing Bugs

**Priority**: 🔴 Critical  

- [ ] `ListActive.jsx` line 12: `onClick={navigate(...)}` → `onClick={() => navigate(...)}`
- [ ] `Bids.jsx` line 34: `tendersData` → `projectData` (undefined variable reference)
- [ ] `getProjectStatuses.js`: Fix top-level await + wrong contract address (`0x01`)
- [ ] Remove all hardcoded `http://localhost:5000` URLs → use configured API service

### Step 4.2: Create API Service Layer

**Priority**: 🔴 Critical  

- [ ] Create `client/src/services/api.js` — configured Axios instance
- [ ] Create `client/src/services/tenderService.js` — tender API methods
- [ ] Create `client/src/services/bidService.js` — bid API methods
- [ ] Replace all inline `axios.get("http://localhost:5000/...")` calls

### Step 4.3: Add Navbar Component

**Priority**: 🟠 High  

- [ ] Create `components/common/Navbar/Navbar.jsx`
- [ ] Include: Logo, Navigation links, Wallet connect/disconnect button, Theme toggle
- [ ] Show wallet address when connected
- [ ] Highlight active page
- [ ] Responsive hamburger menu for mobile

### Step 4.4: Add Toast Notifications

**Priority**: 🟠 High  

- [ ] Create `components/common/Toast/Toast.jsx` — toast notification system
- [ ] Replace all `alert()` calls with toast notifications
- [ ] Replace all `console.log()` error handling with user-visible toasts
- [ ] Types: success (green), error (red), warning (yellow), info (blue)

### Step 4.5: Add Loading States

**Priority**: 🟠 High  

- [ ] Create `components/common/Loader/Loader.jsx` — spinner/skeleton loader
- [ ] Add loading states to all data-fetching components
- [ ] Show skeleton cards while tenders are loading
- [ ] Show transaction pending state during blockchain operations

### Step 4.6: Add Error Boundary

**Priority**: 🟡 Medium  

- [ ] Create `components/common/ErrorBoundary/ErrorBoundary.jsx`
- [ ] Wrap all route components with error boundary
- [ ] Show friendly error page with retry button

### Step 4.7: Add 404 Page

**Priority**: 🟡 Medium  

- [ ] Create `containers/NotFound/NotFound.jsx`
- [ ] Add catch-all route: `<Route path="*" element={<NotFound />} />`

### Step 4.8: Implement Working Search & Filters

**Priority**: 🟡 Medium  

- [ ] Make search bar functional on Projects page
- [ ] Add filter by: Status (Active/Past), Category
- [ ] Add sort by: Date, Budget, Experience Required

### Step 4.9: Add Pagination

**Priority**: 🟡 Medium  

- [ ] Create `components/common/Pagination/Pagination.jsx`
- [ ] Add to Projects page (20 tenders per page)
- [ ] Handle page state in URL query params

---

## Phase 5: 📊 Admin Dashboard & Audit Trail (Week 5-6)

> **Time Estimate**: 10-14 hours  
> **Goal**: Admin dashboard with analytics, public audit trail

### Step 5.1: Admin Dashboard

- [ ] Create `containers/Admin/Dashboard/Dashboard.jsx`
- [ ] Show key metrics:
  - Total active tenders
  - Total settled tenders  
  - Total bids placed
  - Average bid value
  - Most active bidders
- [ ] Line chart: Bids over time
- [ ] Bar chart: Tenders by category

### Step 5.2: Audit Trail Page

- [ ] Create `containers/Audit/Audit.jsx`
- [ ] Display all on-chain events for a tender
- [ ] Each entry shows: Event type, Actor address, Timestamp, TX hash
- [ ] TX hash links to Flow block explorer

### Step 5.3: Transaction Verification Links

- [ ] On Bids page: Show "View on Explorer" link for last bid transaction
- [ ] On Tender card: Show link to creation transaction
- [ ] On Settlement: Show winner announcement with TX proof

---

## Phase 6: 🚀 Advanced Features (Week 6-8)

> **Time Estimate**: 15-20 hours  
> **Goal**: Production-ready features

### Step 6.1: Real-Time Bid Updates (WebSocket)

- [ ] Install `ws` or `socket.io` on backend
- [ ] When indexer detects new Bid event → broadcast to WebSocket clients
- [ ] Frontend: Update bid leaderboard in real-time without page refresh

### Step 6.2: Email Notifications (Optional)

- [ ] Allow users to optionally add email in profile
- [ ] Send email on: Bid placed, Outbid, Winner announcement
- [ ] Use: Nodemailer with SMTP or SendGrid

### Step 6.3: Tender Categories

- [ ] Add category field to tender creation form
- [ ] Update smart contract metadata to include category
- [ ] Add category-based filtering on Projects page

### Step 6.4: Auto-Settlement (Cron Job)

- [ ] Create a cron job / scheduler that checks for expired auctions
- [ ] Auto-trigger settlement transaction on-chain when timer expires
- [ ] Use: `node-cron` or simple `setInterval`

### Step 6.5: Multi-Criteria Evaluation

- [ ] Instead of just lowest bid, add scoring:
  - Bid amount: 50% weight
  - Experience: 30% weight
  - Past performance: 20% weight
- [ ] Display score breakdown in bid results

### Step 6.6: Profile Page

- [ ] Create `containers/Profile/Profile.jsx`
- [ ] Show: Wallet address, Experience points, Won NFTs, Bid history
- [ ] Upload profile picture (already partially exists)

### Step 6.7: Responsive Design

- [ ] Make all pages mobile-friendly
- [ ] Test on: Mobile (375px), Tablet (768px), Desktop (1200px)
- [ ] Use CSS Grid and Flexbox for layouts

### Step 6.8: Dark/Light Theme Toggle

- [ ] Create `context/ThemeProvider.jsx`
- [ ] Use CSS custom properties (already defined in DESIGN.md)
- [ ] Persist theme preference in localStorage

---

## Summary Timeline

```
Week 1: ██████████  Phase 0 (Security) + Phase 1 (Backend Structure)
Week 2: ██████████  Phase 2 (Blockchain Integration — Part 1)
Week 3: ██████████  Phase 2 (Blockchain Integration — Part 2)
Week 4: ██████████  Phase 3 (Auth) + Phase 4 (Frontend — Part 1)
Week 5: ██████████  Phase 4 (Frontend — Part 2) + Phase 5 (Dashboard)
Week 6: ██████████  Phase 5 (Audit) + Phase 6 (Advanced Features — Part 1)
Week 7: ██████████  Phase 6 (Advanced Features — Part 2)
Week 8: ██████████  Testing, Polish, Documentation
```

---

## ✅ Completion Checklist

### Security (Must be 100%)
- [ ] No hardcoded secrets in code
- [ ] All admin routes protected
- [ ] Rate limiting on all endpoints
- [ ] Input validation on all endpoints
- [ ] Global error handler (no raw errors)
- [ ] Connection pooling (no per-request connections)

### Blockchain (Must be 100%)
- [ ] Bids placed on-chain via smart contract
- [ ] Settlements executed on-chain
- [ ] Winner receives NFT on-chain
- [ ] MySQL is read-only index (not source of truth)
- [ ] Transaction hashes visible in UI

### Frontend (Target 80%)
- [ ] No hardcoded URLs
- [ ] Toast notifications (no console.log)
- [ ] Loading states
- [ ] Error boundaries
- [ ] Working search & filters
- [ ] Pagination
- [ ] Navbar with wallet connect
- [ ] 404 page

### Code Quality (Target 80%)  
- [ ] Controller → Service → Repository pattern
- [ ] Consistent error response format
- [ ] ESLint clean
- [ ] .env.example files
- [ ] README updated
