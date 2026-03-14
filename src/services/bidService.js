// services/bidService.js — Bid API Service
// Centralized bidding-related API calls

import api from "./api";

const bidService = {
    // Place a bid on a tender
    placeBid: async (tenderId, biddingAmount) => {
        const { data } = await api.post("/placebid", {
            tender_id: tenderId,
            biddingAmount,
        });
        return data;
    },
};

export default bidService;
