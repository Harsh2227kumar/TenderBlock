// services/tenderService.js — Tender API Service
// Centralized tender-related API calls

import api from "./api";

const tenderService = {
    // Get all tenders (with optional filters)
    getAll: async ({ page = 1, limit = 50, status, search } = {}) => {
        const params = { page, limit };
        if (status) params.status = status;
        if (search) params.search = search;

        const { data } = await api.get("/tender/display", { params });
        return data;
    },

    // Get a single tender by ID
    getById: async (tenderId) => {
        const { data } = await api.get(`/tender/display/${tenderId}`);
        return data;
    },

    // Generate a new tender ID
    generateId: async () => {
        const { data } = await api.get("/tender/id");
        return data;
    },

    // Create a new tender
    create: async (tenderData) => {
        const { data } = await api.post("/tender/create", tenderData);
        return data;
    },

    // Settle a tender auction
    settle: async (tenderId) => {
        const { data } = await api.post("/settle", { tender_id: tenderId });
        return data;
    },

    // Get bids for a tender
    getBids: async (tenderId) => {
        const { data } = await api.get(`/tender/${tenderId}/bids`);
        return data;
    },
};

export default tenderService;
