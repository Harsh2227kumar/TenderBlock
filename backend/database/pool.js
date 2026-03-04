// database/pool.js — MySQL Connection Pool
// Replaces per-request mysql.createConnection() calls
// Connections are automatically managed and reused

const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "localhost",
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "root",
    database: process.env.MYSQL_DATABASE || "tenderflowdb",
    waitForConnections: true,
    connectionLimit: parseInt(process.env.MYSQL_CONNECTION_LIMIT) || 20,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

// Test connection on startup
pool
    .getConnection()
    .then((conn) => {
        console.log("✅ MySQL connection pool established");
        conn.release();
    })
    .catch((err) => {
        console.error("❌ MySQL connection pool failed:", err.message);
    });

module.exports = pool;
