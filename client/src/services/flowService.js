// services/flowService.js — Centralized Blockchain Interaction Layer
// ALL blockchain operations go through this service.
// Pattern: flowService → FCL transaction → on-chain → return tx hash

import { CreateTenderInFlow } from "../Transactions/startProject";
import { placeBidOnChain } from "../Transactions/placeBid";
import { settleBiddingOnChain } from "../Transactions/settleBidding";
import {
    getProjectStatuses as queryProjectStatuses,
    getProjectStatus as queryProjectStatus,
} from "../Scripts/getProjectStatuses";

// Admin account address (owns the BiddingCollection & deployed contracts)
const ADMIN_ADDRESS = "0xea0627a8b29d7901";
const CONTRACT_ADDRESS = "0xc9a10bbda7c73177";

// Flow block explorer base URL (for linking tx hashes)
const FLOW_EXPLORER_URL = "https://testnet.flowdiver.io/tx/";

const flowService = {
    /**
     * Create a tender on-chain.
     * Mints an NFT and creates an auction in the BiddingCollection.
     *
     * @param {Object} tenderData - { _ipfsHash, _title, _description, _minimumExp, _exp, biddingLength, startPrice }
     * @returns {Object} { txId, explorerUrl }
     */
    createTender: async (tenderData) => {
        const {
            _ipfsHash,
            _title,
            _description,
            _minimumExp,
            _exp,
            biddingLength,
            startPrice,
        } = tenderData;

        // Convert numeric values to proper Flow types
        const txId = await CreateTenderInFlow(
            _ipfsHash,
            _title,
            _description,
            String(_minimumExp),      // UInt64
            String(_exp),             // UInt64
            parseFloat(biddingLength).toFixed(1),  // UFix64
            parseFloat(startPrice).toFixed(1)      // UFix64
        );

        return {
            txId,
            explorerUrl: `${FLOW_EXPLORER_URL}${txId}`,
        };
    },

    /**
     * Place a bid on-chain.
     * Calls BiddingCollection.placeBid() which validates and records the bid on the blockchain.
     *
     * @param {number|string} biddingId - The on-chain auction ID
     * @param {number|string} bidAmount - The bid amount
     * @returns {Object} { txId, explorerUrl }
     */
    placeBid: async (biddingId, bidAmount) => {
        // Convert to UFix64 format (must have decimal point)
        const formattedAmount = parseFloat(bidAmount).toFixed(8);

        const txId = await placeBidOnChain(
            ADMIN_ADDRESS,
            biddingId,
            formattedAmount
        );

        return {
            txId,
            explorerUrl: `${FLOW_EXPLORER_URL}${txId}`,
        };
    },

    /**
     * Settle an expired auction on-chain.
     * Transfers NFT to winner, settles tokens, and emits Settled event.
     *
     * @param {number|string} biddingId - The on-chain auction ID
     * @returns {Object} { txId, explorerUrl }
     */
    settleBidding: async (biddingId) => {
        const txId = await settleBiddingOnChain(biddingId);

        return {
            txId,
            explorerUrl: `${FLOW_EXPLORER_URL}${txId}`,
        };
    },

    /**
     * Query all auction statuses from the admin's BiddingCollection.
     * This is a READ-ONLY operation (no gas, no wallet popup).
     *
     * @returns {Object} Dictionary of { [auctionId]: ProjectStatus }
     */
    getProjectStatuses: async () => {
        try {
            const statuses = await queryProjectStatuses(ADMIN_ADDRESS);
            return statuses;
        } catch (error) {
            console.warn("Failed to fetch on-chain statuses:", error);
            return {};
        }
    },

    /**
     * Query a single auction status.
     *
     * @param {number|string} biddingId - The auction ID
     * @returns {Object|null} ProjectStatus or null if not found
     */
    getProjectStatus: async (biddingId) => {
        try {
            const status = await queryProjectStatus(ADMIN_ADDRESS, biddingId);
            return status;
        } catch (error) {
            console.warn(`Failed to fetch on-chain status for auction ${biddingId}:`, error);
            return null;
        }
    },

    /**
     * Get the Flow block explorer URL for a transaction.
     *
     * @param {string} txId - Transaction hash
     * @returns {string} Full explorer URL
     */
    getExplorerUrl: (txId) => {
        return `${FLOW_EXPLORER_URL}${txId}`;
    },

    /**
     * Constants for external use
     */
    ADMIN_ADDRESS,
    CONTRACT_ADDRESS,
    FLOW_EXPLORER_URL,
};

export default flowService;
