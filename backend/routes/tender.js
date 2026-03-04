const express = require("express");
const crypto = require("crypto");

const pool = require("../database/pool");
const authorization = require("../middleware/authorization");
const { tenderLimiter } = require("../middleware/rateLimiter");
const {
  validate,
  tenderCreateRules,
  bidRules,
  settleRules,
  tenderIdParam,
} = require("../middleware/validator");
const {
  AppError,
  NotFoundError,
  ConflictError,
  ValidationError,
} = require("../utils/errors");
const { generateUniqueTenderId } = require("../utils/utils");

const router = express.Router();

// ============================================================
// GENERATE TENDER ID — GET /tender/id
// Protected: requires authentication
// ============================================================
router.get("/tender/id", authorization, (request, response) => {
  const tender_id = generateUniqueTenderId(10);
  if (!tender_id) {
    throw new AppError("Unable to generate tender ID", 500);
  }

  response.status(200).json({
    success: true,
    data: { tender_id },
  });
});

// ============================================================
// CREATE TENDER — POST /tender/create
// Protected: requires authentication (admin)
// ============================================================
router.post(
  "/tender/create",
  authorization,              // ← NOW PROTECTED!
  tenderLimiter,
  tenderCreateRules,
  validate,
  async (request, response, next) => {
    const {
      _title,
      tender_id,
      _ipfsHash,
      _description,
      _minimumExp,
      _exp,
      opening_date,
      biddingLength,
      startPrice,
    } = request.body;

    try {
      // Ensure tenders table exists (will be removed after migration runs)
      await pool.execute(`CREATE TABLE IF NOT EXISTS tenders (
        _title VARCHAR(128) NOT NULL,
        tender_id VARCHAR(128) NOT NULL UNIQUE,
        _ipfsHash VARCHAR(256) NOT NULL,
        _description MEDIUMTEXT NOT NULL,
        _minimumExp INT NOT NULL,
        _exp INT NOT NULL,
        opening_date MEDIUMTEXT NOT NULL,
        biddingLength INT NOT NULL,
        startPrice INT NOT NULL,
        currentMinDemand INT,
        winner_email VARCHAR(128),
        isSettled BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`);

      await pool.execute(
        `INSERT INTO tenders (_title, tender_id, _ipfsHash, _description, _minimumExp, _exp, opening_date, biddingLength, startPrice)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [_title, tender_id, _ipfsHash, _description, _minimumExp, _exp, opening_date, biddingLength, startPrice]
      );

      response.status(201).json({
        success: true,
        data: {
          message: "Tender created successfully",
          tender_id,
        },
      });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return next(new ConflictError("Tender with this ID already exists"));
      }
      next(error);
    }
  }
);

// ============================================================
// DISPLAY ALL TENDERS — GET /tender/display
// Public: no auth required
// ============================================================
router.get("/tender/display", async (request, response, next) => {
  try {
    const page = parseInt(request.query.page) || 1;
    const limit = parseInt(request.query.limit) || 50;
    const offset = (page - 1) * limit;
    const status = request.query.status; // 'active' or 'settled'
    const search = request.query.search;

    let query = "SELECT * FROM tenders";
    const params = [];
    const conditions = [];

    if (status === "active") {
      conditions.push("isSettled = false");
    } else if (status === "settled") {
      conditions.push("isSettled = true");
    }

    if (search) {
      conditions.push("(_title LIKE ? OR _description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // Get total count for pagination
    const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as total");
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].total;

    // Add ordering and pagination
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.execute(query, params);

    response.status(200).json({
      success: true,
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// DISPLAY SINGLE TENDER — GET /tender/display/:id
// Public: no auth required
// ============================================================
router.get(
  "/tender/display/:id",
  tenderIdParam,
  validate,
  async (request, response, next) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM tenders WHERE tender_id = ?",
        [request.params.id]
      );

      if (rows.length === 0) {
        return next(new NotFoundError("Tender"));
      }

      response.status(200).json({
        success: true,
        data: rows[0],
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================================
// PLACE BID — POST /placebid
// Protected: requires authentication
// ============================================================
router.post(
  "/placebid",
  authorization,
  bidRules,
  validate,
  async (request, response, next) => {
    const { tender_id, biddingAmount } = request.body;
    const bidderEmail = request.bidder.email;
    const bidderExperience = request.bidder.experience;

    try {
      // Fetch tender data
      const [tenderRows] = await pool.execute(
        "SELECT * FROM tenders WHERE tender_id = ?",
        [tender_id]
      );

      if (tenderRows.length === 0) {
        return next(new NotFoundError("Tender"));
      }

      const tender = tenderRows[0];

      // Check if tender is already settled
      if (tender.isSettled) {
        return next(new AppError("This tender has already been settled", 400, "TENDER_SETTLED"));
      }

      // Check experience requirement
      if (bidderExperience < tender._minimumExp) {
        return next(
          new AppError(
            `You need at least ${tender._minimumExp} experience points to bid. You have ${bidderExperience}.`,
            400,
            "INSUFFICIENT_EXPERIENCE"
          )
        );
      }

      // Check bid amount
      if (parseFloat(biddingAmount) > tender.startPrice) {
        return next(
          new AppError(
            "Bidding amount must be equal to or less than the start price",
            400,
            "BID_TOO_HIGH"
          )
        );
      }

      // Ensure placedBid table exists
      await pool.execute(`CREATE TABLE IF NOT EXISTS placedBid (
        placedBid_id VARCHAR(128) PRIMARY KEY,
        tender_id VARCHAR(128) NOT NULL,
        email VARCHAR(128) NOT NULL,
        biddingAmount INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_bid (tender_id, email)
      )`);

      // Generate bid ID
      const placedBid_id = crypto.randomBytes(15).toString("hex");

      // Place the bid
      await pool.execute(
        "INSERT INTO placedBid (placedBid_id, tender_id, email, biddingAmount) VALUES (?, ?, ?, ?)",
        [placedBid_id, tender_id, bidderEmail, biddingAmount]
      );

      // Update winner if this is the lowest bid
      if (
        tender.currentMinDemand === null ||
        tender.currentMinDemand > parseFloat(biddingAmount)
      ) {
        await pool.execute(
          "UPDATE tenders SET winner_email = ?, currentMinDemand = ? WHERE tender_id = ?",
          [bidderEmail, biddingAmount, tender_id]
        );
      }

      response.status(201).json({
        success: true,
        data: {
          message: "Bid placed successfully",
          bid_id: placedBid_id,
          tender_id,
          amount: biddingAmount,
        },
      });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return next(
          new ConflictError("You have already placed a bid on this tender")
        );
      }
      next(error);
    }
  }
);

// ============================================================
// GET BIDS FOR A TENDER — GET /tender/:id/bids
// Public: shows bid history for transparency
// ============================================================
router.get("/tender/:id/bids", async (request, response, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT pb.placedBid_id, pb.tender_id, pb.email, pb.biddingAmount, pb.created_at
       FROM placedBid pb
       WHERE pb.tender_id = ?
       ORDER BY pb.biddingAmount ASC`,
      [request.params.id]
    );

    response.status(200).json({
      success: true,
      data: rows,
      meta: { total: rows.length },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================
// SETTLE AUCTION — POST /settle
// Protected: requires authentication (admin)
// ============================================================
router.post(
  "/settle",
  authorization,              // ← NOW PROTECTED!
  settleRules,
  validate,
  async (request, response, next) => {
    const { tender_id } = request.body;

    try {
      // Fetch tender
      const [tenderRows] = await pool.execute(
        "SELECT * FROM tenders WHERE tender_id = ?",
        [tender_id]
      );

      if (tenderRows.length === 0) {
        return next(new NotFoundError("Tender"));
      }

      const tender = tenderRows[0];

      if (tender.isSettled) {
        return next(new AppError("This tender has already been settled", 400, "ALREADY_SETTLED"));
      }

      if (!tender.winner_email) {
        return next(new AppError("No bids have been placed on this tender", 400, "NO_BIDS"));
      }

      // Fetch winner's experience
      const [winnerRows] = await pool.execute(
        "SELECT exp, email, name FROM bidders WHERE email = ?",
        [tender.winner_email]
      );

      if (winnerRows.length === 0) {
        return next(new NotFoundError("Winner bidder"));
      }

      const winner = winnerRows[0];
      const updatedExperience = winner.exp + tender._exp;

      // Settle the tender (mark as settled)
      await pool.execute(
        "UPDATE tenders SET isSettled = true WHERE tender_id = ?",
        [tender_id]
      );

      // Update winner's experience
      await pool.execute(
        "UPDATE bidders SET exp = ? WHERE email = ?",
        [updatedExperience, winner.email]
      );

      response.status(200).json({
        success: true,
        data: {
          message: "Tender settled successfully!",
          tender_id,
          winner: {
            email: winner.email,
            name: winner.name,
            experience_gained: tender._exp,
            total_experience: updatedExperience,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
