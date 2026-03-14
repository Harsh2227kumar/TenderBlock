// services/authService.js — Auth API Service
// Centralized authentication-related API calls

import api from "./api";

const authService = {
    // Login with email and password
    login: async (email, password) => {
        const { data } = await api.post("/login", { email, password });
        return data;
    },

    // Signup with user details
    signup: async (userData) => {
        const { data } = await api.post("/signup", userData);
        return data;
    },

    // Logout (clear cookie)
    logout: async () => {
        const { data } = await api.post("/logout");
        return data;
    },

    // Get current user profile
    getProfile: async () => {
        const { data } = await api.get("/user");
        return data;
    },

    // Get JWT payload data
    getData: async () => {
        const { data } = await api.get("/data");
        return data;
    },

    // Upload profile image
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await api.post("/upload/image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
    },
};

export default authService;
