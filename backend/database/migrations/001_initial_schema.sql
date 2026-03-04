-- TenderFloww Database Schema
-- Run this ONCE to set up all tables
-- Usage: mysql -u root -p tenderflowdb < 001_initial_schema.sql

-- Bidders table
CREATE TABLE IF NOT EXISTS bidders (
    name VARCHAR(64) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    registration BIGINT UNIQUE NOT NULL,
    exp INT DEFAULT 0,
    address VARCHAR(256) NOT NULL,
    photo VARCHAR(256),
    password VARCHAR(72) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_registration (registration)
);

-- Tenders table
CREATE TABLE IF NOT EXISTS tenders (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_settled (isSettled),
    INDEX idx_winner (winner_email)
);

-- Placed bids table
CREATE TABLE IF NOT EXISTS placedBid (
    placedBid_id VARCHAR(128) PRIMARY KEY,
    tender_id VARCHAR(128) NOT NULL,
    email VARCHAR(128) NOT NULL,
    biddingAmount INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_bid (tender_id, email),
    INDEX idx_tender_id (tender_id),
    INDEX idx_email (email)
);

-- Audit log table (NEW)
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM('signup', 'login', 'tender_created', 'bid_placed', 'auction_settled', 'profile_updated') NOT NULL,
    actor_email VARCHAR(128),
    tender_id VARCHAR(128),
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_actor (actor_email),
    INDEX idx_tender (tender_id)
);
