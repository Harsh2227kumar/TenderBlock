import { Web3Storage } from "web3.storage";

// Use environment variable instead of hardcoded token
const token = import.meta.env.VITE_WEB3_STORAGE_TOKEN;

if (!token) {
  console.warn("VITE_WEB3_STORAGE_TOKEN not set in .env — IPFS uploads will fail");
}

export const client = new Web3Storage({ token: token || "" });
