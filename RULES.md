# 📏 RULES — Code Standards & Conventions

## TenderFloww v2.0 — Decentralized Tendering System

> **Document Version**: 2.0  
> **Last Updated**: 2026-03-02  
> **Applies to**: All contributors

---

## 1. Golden Rules

> **These rules are NON-NEGOTIABLE. Every contributor must follow them.**

1. **🔐 NEVER hardcode secrets** — No API keys, private keys, passwords, or tokens in source code. Ever.
2. **⛓️ Blockchain is the source of truth** — MySQL is a cache/index. If data conflicts, blockchain wins.
3. **🛡️ Validate everything** — All user input is validated on both frontend AND backend.
4. **🚫 No raw errors to users** — Never expose stack traces, SQL errors, or internal details.
5. **📝 Every admin action must be authenticated** — On-chain role verification for admin routes.
6. **🔗 All state-changing operations go on-chain first** — MySQL updates only after blockchain confirmation.

---

## 2. File & Folder Naming

### 2.1 General Rules

| Type | Convention | Example |
|------|-----------|---------|
| React Components | PascalCase | `TenderCard.jsx`, `BidForm.jsx` |
| Component folders | camelCase | `tenderCard/`, `bidForm/` |
| CSS files | camelCase, match component | `tenderCard.css`, `bidForm.css` |
| JavaScript modules | camelCase | `tenderService.js`, `flowClient.js` |
| Constants files | camelCase | `constants.js`, `config.js` |
| Routes files | camelCase | `tenderRoutes.js`, `bidRoutes.js` |
| Middleware | camelCase | `rateLimiter.js`, `walletAuth.js` |
| Cadence contracts | PascalCase | `BiddingPlatform.cdc`, `Tender.cdc` |
| Cadence scripts/tx | camelCase | `getProjectStatuses.cdc`, `placeBid.cdc` |
| SQL migrations | Numbered prefix | `001_initial_schema.sql` |
| Env files | Uppercase prefix | `.env`, `.env.example` |
| Documentation | UPPER_SNAKE_CASE.md | `DESIGN.md`, `RULES.md` |

### 2.2 Folder Organization

```
✅ DO: Group by feature
  components/tender/TenderCard.jsx
  components/tender/tenderCard.css
  components/bid/BidForm.jsx
  components/bid/bidForm.css

❌ DON'T: Flat file dump
  components/TenderCard.jsx
  components/BidForm.jsx
  components/tenderCard.css
  components/bidForm.css
```

---

## 3. JavaScript / React Code Standards

### 3.1 General JavaScript

```javascript
// ✅ DO: Use const/let, never var
const maxBudget = 1000;
let currentBid = 0;

// ❌ DON'T: Use var
var maxBudget = 1000;

// ✅ DO: Use template literals
const message = `Bid placed: ${amount} FLOW`;

// ❌ DON'T: String concatenation
const message = "Bid placed: " + amount + " FLOW";

// ✅ DO: Use async/await
const fetchTenders = async () => {
  try {
    const response = await axios.get('/api/v1/tenders');
    return response.data;
  } catch (error) {
    throw new AppError('Failed to fetch tenders', 500);
  }
};

// ❌ DON'T: Use .then() chains (unless necessary for parallel)
axios.get('/api/v1/tenders').then(res => { ... }).catch(err => { ... });

// ✅ DO: Use destructuring
const { tender_id, _title, _description } = request.body;

// ✅ DO: Use optional chaining
const title = tender?.metadata?.title;

// ❌ DON'T: Nested ternaries
const x = a ? b ? c : d : e;

// ✅ DO: Use early returns
if (!tender_id) {
  return response.status(400).json({ error: 'Missing tender ID' });
}
// ... continue with logic

// ❌ DON'T: Deep nesting
if (tender_id) {
  if (valid) {
    if (authorized) {
      // ... deeply nested
    }
  }
}
```

### 3.2 React Components

```jsx
// ✅ DO: Functional components with hooks
const TenderCard = ({ tender, onBid }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleBid = async () => {
    setIsLoading(true);
    try {
      await onBid(tender.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tender-card" id={`tender-${tender.id}`}>
      <h3>{tender.title}</h3>
      <button onClick={handleBid} disabled={isLoading}>
        {isLoading ? 'Placing...' : 'Place Bid'}
      </button>
    </div>
  );
};

export default TenderCard;

// ❌ DON'T: Class components (unless wrapping error boundaries)
class TenderCard extends React.Component { ... }

// ❌ DON'T: Anonymous default exports
export default ({ tender }) => { ... };
```

### 3.3 React Best Practices

```jsx
// ✅ DO: Use unique, descriptive IDs for interactive elements
<button id="btn-place-bid" onClick={handleBid}>Place Bid</button>
<input id="input-bid-amount" value={amount} onChange={...} />

// ❌ DON'T: Missing or generic IDs
<button onClick={handleBid}>Place Bid</button>

// ✅ DO: Handle loading and error states
{isLoading ? (
  <Loader />
) : error ? (
  <ErrorMessage message={error} />
) : (
  <TenderList tenders={tenders} />
)}

// ❌ DON'T: Only handle the success case
{tenders?.map(t => <TenderCard key={t.id} tender={t} />)}

// ✅ DO: Use key prop correctly (unique, stable IDs)
{tenders.map(tender => (
  <TenderCard key={tender.tender_id} tender={tender} />
))}

// ❌ DON'T: Use array index as key
{tenders.map((tender, index) => (
  <TenderCard key={index} tender={tender} />  // BAD
))}

// ✅ DO: Wrap navigate in arrow functions for onClick
<div onClick={() => navigate(`/bids?tender_id=${id}`)}>

// ❌ DON'T: Call navigate directly in render (causes immediate navigation)
<div onClick={navigate(`/bids?tender_id=${id}`)}>  // BUG!

// ✅ DO: Show user-facing error messages
alert(error.response?.data?.message || 'An error occurred');

// ❌ DON'T: Only console.log errors
console.log(error);  // User sees nothing!
```

### 3.4 State Management Rules

```jsx
// ✅ DO: Use SWR/React Query for server state
const { data, error, isLoading } = useSWR('/api/v1/tenders', fetcher);

// ✅ DO: Use React Context for global app state (auth, theme)
const { user, isAdmin } = useAuth();

// ✅ DO: Use useState for component-local state
const [modalOpen, setModalOpen] = useState(false);

// ❌ DON'T: Put server-fetched data in React Context
// (Use SWR instead — it handles caching, revalidation, etc.)

// ❌ DON'T: Prop drill more than 2 levels
// If you need data 3+ levels deep, use Context or pass via service
```

---

## 4. CSS Standards

### 4.1 Naming Convention (BEM-inspired)

```css
/* ✅ DO: Use BEM-inspired naming */
.tender-card { }
.tender-card__title { }
.tender-card__description { }
.tender-card--active { }
.tender-card--expired { }

/* ✅ DO: Use CSS custom properties for theming */
.tender-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  transition: transform var(--transition-normal);
}

.tender-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

/* ❌ DON'T: Use inline styles for repeated patterns */
<div style={{ background: '#1A1A3E', padding: '24px' }}>

/* ❌ DON'T: Use magic numbers */
.card { padding: 17px; margin: 13px; }

/* ✅ DO: Use spacing tokens */
.card { padding: var(--spacing-lg); margin: var(--spacing-md); }
```

### 4.2 Responsive Design

```css
/* ✅ DO: Mobile-first approach */
.tender-list {
  display: grid;
  grid-template-columns: 1fr;           /* Mobile: single column */
  gap: var(--spacing-lg);
}

@media (min-width: 768px) {
  .tender-list {
    grid-template-columns: repeat(2, 1fr);  /* Tablet: 2 columns */
  }
}

@media (min-width: 1200px) {
  .tender-list {
    grid-template-columns: repeat(3, 1fr);  /* Desktop: 3 columns */
  }
}

/* ✅ DO: Use relative units */
.heading { font-size: 1.5rem; }

/* ❌ DON'T: Hard-coded pixel widths for layout */
.container { width: 1200px; }  /* Won't work on smaller screens */
```

---

## 5. Backend Code Standards

### 5.1 Controller Pattern

```javascript
// ✅ DO: Thin controllers — delegate to services
// controllers/tenderController.js

const tenderService = require('../services/tenderService');
const { AppError } = require('../utils/errors');

exports.getAllTenders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, category, search } = req.query;
    const result = await tenderService.getAllTenders({ page, limit, status, category, search });

    res.status(200).json({
      success: true,
      data: result.tenders,
      meta: {
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);  // Let error handler middleware deal with it
  }
};

// ❌ DON'T: Fat controllers with business logic and raw SQL
router.get('/tender/display', (req, res) => {
  const db = mysql.createConnection(db_config);  // DON'T create connections
  db.query('SELECT * FROM tenders', ...);         // DON'T put SQL in controllers
});
```

### 5.2 Service Pattern

```javascript
// ✅ DO: Business logic in services
// services/tenderService.js

const tenderRepo = require('../repositories/tenderRepository');
const { AppError } = require('../utils/errors');

class TenderService {
  async getAllTenders({ page, limit, status, category, search }) {
    const offset = (page - 1) * limit;
    const [tenders, total] = await Promise.all([
      tenderRepo.findAll({ offset, limit, status, category, search }),
      tenderRepo.count({ status, category, search }),
    ]);

    return {
      tenders,
      page: Number(page),
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getTenderById(tenderId) {
    const tender = await tenderRepo.findById(tenderId);
    if (!tender) {
      throw new AppError('Tender not found', 404, 'TENDER_NOT_FOUND');
    }
    return tender;
  }
}

module.exports = new TenderService();
```

### 5.3 Repository Pattern

```javascript
// ✅ DO: Data access isolated in repositories
// repositories/tenderRepository.js

const pool = require('../database/pool');

class TenderRepository {
  async findAll({ offset, limit, status, category, search }) {
    let query = 'SELECT * FROM tenders_index WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);
    return rows;
  }

  async findById(tenderId) {
    const [rows] = await pool.execute(
      'SELECT * FROM tenders_index WHERE tender_id = ?',
      [tenderId]
    );
    return rows[0] || null;
  }

  async count({ status, category, search }) {
    let query = 'SELECT COUNT(*) as total FROM tenders_index WHERE 1=1';
    const params = [];

    if (status) { query += ' AND status = ?'; params.push(status); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [rows] = await pool.execute(query, params);
    return rows[0].total;
  }
}

module.exports = new TenderRepository();
```

### 5.4 Error Handling

```javascript
// ✅ DO: Custom error classes
// utils/errors.js

class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

// ✅ DO: Global error handler middleware
// middleware/errorHandler.js

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  // Log full error internally
  console.error(`[${new Date().toISOString()}] ${err.stack}`);

  // Send safe error to client
  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};

// ❌ DON'T: Send raw error objects
res.status(500).json({ message: error });       // Exposes internals!
res.status(500).json({ message: error.code });  // SQL error codes leaked!
```

### 5.5 Database Rules

```javascript
// ✅ DO: Use connection pooling
const pool = require('../database/pool');
const [rows] = await pool.execute('SELECT * FROM tenders WHERE id = ?', [id]);

// ❌ DON'T: Create connection per request
const db = mysql.createConnection(db_config);  // MEMORY LEAK!

// ✅ DO: Use parameterized queries ALWAYS
await pool.execute('SELECT * FROM tenders WHERE tender_id = ?', [tenderId]);

// ❌ DON'T: String interpolation in SQL
await pool.query(`SELECT * FROM tenders WHERE tender_id = ${tenderId}`);  // SQL INJECTION!

// ✅ DO: Use promise-based mysql2 (mysql2/promise)
const [rows] = await pool.execute(query, params);

// ❌ DON'T: Callback-based queries
db.query(query, params, (error, result) => { ... });  // Callback hell!

// ✅ DO: Run migrations for schema changes
// database/migrations/001_initial_schema.sql

// ❌ DON'T: CREATE TABLE IF NOT EXISTS on every request
db.query(createNewTableBidders, ...);  // Runs DDL every signup!
```

---

## 6. Cadence (Smart Contract) Standards

### 6.1 Naming Conventions

```cadence
// Contracts: PascalCase
pub contract BiddingPlatform { }
pub contract Tender { }

// Resources: PascalCase
pub resource Project { }
pub resource BiddingCollection { }

// Functions: camelCase
pub fun placeBid() { }
pub fun settleBidding() { }
pub fun getAuctionStatus() { }

// Variables: camelCase
pub var totalProjects: UInt64
priv var biddingLength: UFix64

// Events: PascalCase
pub event TokenPurchased(...)
pub event Bid(...)
pub event Settled(...)

// Struct: PascalCase
pub struct ProjectStatus { }
pub struct Metadata { }
```

### 6.2 Security Rules

```cadence
// ✅ DO: Use pre/post conditions for validation
pub fun placeBid(bidTokens: UFix64, ...) {
  pre {
    !self.biddingCompleted : "Auction already settled"
    self.NFT != nil: "NFT does not exist"
    bidTokens > 0.0: "Bid must be positive"
    bidTokens < self.currMinimumDemand: "Bid must be lower than current"
    !self.isBiddingExpired(): "Auction has expired"
  }
}

// ✅ DO: Use access control appropriately
priv var NFT: @Tender.NFT?              // Only this resource
access(contract) fun sendNFT(...)        // Only this contract
access(account) var biddingItems: ...    // Only this account
pub fun getAuctionStatus(): ...          // Anyone

// ✅ DO: Handle resource destruction properly
destroy() {
  if self.NFT != nil {
    self.sendNFT(self.ownerCollectionCap)  // Return NFT
  }
  if let vaultCap = self.recipientVaultCap {
    self.sendBidTokens(vaultCap)           // Return bid tokens
  }
  destroy self.NFT
  destroy self.bidVault
}

// ❌ DON'T: Leave resources without destroy handlers
```

---

## 7. API Response Standards

### 7.1 Success Responses

```json
// Single item
{
  "success": true,
  "data": {
    "tender_id": "abc123",
    "title": "Highway Construction",
    "status": "active"
  }
}

// List with pagination
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 7.2 Error Responses

```json
// Validation error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "biddingAmount", "message": "Must be a positive number" }
    ]
  }
}

// Not found
{
  "success": false,
  "error": {
    "code": "TENDER_NOT_FOUND",
    "message": "No tender found with this ID"
  }
}

// Unauthorized
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Wallet authentication required"
  }
}
```

### 7.3 HTTP Status Code Usage

| Code | Usage |
|------|-------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (not authorized for this action) |
| 404 | Not Found |
| 409 | Conflict (duplicate bid, etc.) |
| 415 | Unsupported Media Type (wrong file type) |
| 422 | Unprocessable Entity (business logic error) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## 8. Security Checklist (Per Feature)

Before merging any feature, verify:

- [ ] No secrets hardcoded anywhere
- [ ] All user inputs validated and sanitized
- [ ] API endpoint has appropriate auth middleware
- [ ] Error responses don't expose internals
- [ ] Database queries use parameterized statements
- [ ] File uploads validate MIME type + extension + size
- [ ] State-changing operations go through blockchain first
- [ ] On-chain admin verification for admin routes
- [ ] Rate limiting applied
- [ ] CORS and security headers configured

---

## 9. Git & Version Control

### 9.1 Branch Naming

```
main              # Production-ready code
develop           # Integration branch
feature/FR-TENDER-01-create  # Feature branches
bugfix/fix-bid-validation    # Bug fixes
hotfix/security-patch        # Urgent fixes
```

### 9.2 Commit Messages (Conventional Commits)

```
feat: add bid placement through blockchain
fix: resolve race condition in authorization middleware
docs: update DESIGN.md with event listener architecture
refactor: move SQL queries to repository layer
security: remove hardcoded API keys from source
chore: update dependencies
test: add unit tests for tender service
```

### 9.3 .gitignore Must Include

```
node_modules/
.env
.env.local
.env.production
*.log
dist/
uploads/
cloud-sql-proxy
flow.json  # If it contains private keys — use flow.json.example instead
```

---

## 10. Environment Variables

### 10.1 Required Variables

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=tenderflowdb
MYSQL_CONNECTION_LIMIT=20

# JWT (if kept temporarily during migration)
JWT_SECRET=generate-a-64-char-random-string-here

# Flow Blockchain
FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
FLOW_ACCOUNT_ADDRESS=0xYourAddress
FLOW_PRIVATE_KEY=your-private-key-here
FLOW_NETWORK=testnet

# IPFS / Web3.Storage
WEB3_STORAGE_TOKEN=your-token-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

### 10.2 Never Commit These

```
✅ Commit: .env.example (with placeholder values)
❌ Never:  .env (with real values)
❌ Never:  flow.json with private keys
❌ Never:  API tokens inline in code
```

---

## 11. URL & API Standards

### 11.1 No Hardcoded URLs

```javascript
// ✅ DO: Use environment variables or config
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
});

export default api;

// ✅ DO: Use the configured instance
import api from '../services/api';
const { data } = await api.get('/api/v1/tenders');

// ❌ DON'T: Hardcode URLs in components
const { data } = await axios.get('http://localhost:5000/tender/display');
```

### 11.2 API Versioning

```
/api/v1/tenders          ✅ Versioned
/api/v1/tenders/:id      ✅ Versioned
/tender/display           ❌ No version, legacy
```

---

## 12. Testing Standards

### 12.1 Required Tests

| Type | Tool | Coverage Target |
|------|------|----------------|
| Unit tests (services, utils) | Jest | 80% |
| API integration tests | Supertest + Jest | All endpoints |
| Smart contract tests | Flow testing framework | All functions |
| Frontend component tests | React Testing Library | Critical components |
| E2E tests (future) | Cypress/Playwright | Happy paths |

### 12.2 Test File Naming

```
utils.js          → utils.test.js
tenderService.js  → tenderService.test.js
TenderCard.jsx    → TenderCard.test.jsx
```
