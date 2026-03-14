// services/api.js — Configured Axios Instance
// All API calls should use this instead of hardcoded URLs

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Required for cookies (JWT auth)
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 15000, // 15 second timeout
});

// Response interceptor for consistent error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error
            const message =
                error.response.data?.error?.message ||
                error.response.data?.message ||
                "An error occurred";
            error.userMessage = message;
        } else if (error.request) {
            // No response received
            error.userMessage = "Unable to connect to server. Please check your connection.";
        } else {
            error.userMessage = "An unexpected error occurred";
        }
        return Promise.reject(error);
    }
);

export default api;
export { API_BASE_URL };
