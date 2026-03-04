const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Generate UNIQUE ID (cryptographically secure)
const generateUniqueId = (length = 10) => {
  return crypto.randomBytes(length).toString("hex");
};

// Generate UNIQUE Tender ID (cryptographically secure)
const generateUniqueTenderId = (length = 10) => {
  return "TF-" + crypto.randomBytes(length).toString("hex").toUpperCase().slice(0, length);
};

// Encrypt Password using bcrypt package
const generateHashpassword = async (originalPassword) => {
  try {
    const hashPassword = await bcrypt.hash(originalPassword, 12); // Increased from 10 to 12 rounds
    return hashPassword;
  } catch (err) {
    console.error("Password hashing failed:", err);
    return "";
  }
};

// Validate hash password
const validateHashpassword = async (originalPassword, hashPassword) => {
  try {
    const isValid = await bcrypt.compare(originalPassword, hashPassword);
    return isValid;
  } catch (err) {
    console.error("Password validation failed:", err);
    return false;
  }
};

module.exports = {
  generateUniqueId,
  generateUniqueTenderId,
  generateHashpassword,
  validateHashpassword,
};
