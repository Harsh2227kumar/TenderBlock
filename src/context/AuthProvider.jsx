import React, { createContext, useContext, useEffect, useState } from "react";
import * as fcl from "@onflow/fcl";
import { FlowState } from "./FlowProvider";

export const AuthContext = createContext();

// Admin wallet address — used to check if connected user is admin
const ADMIN_ADDRESS = "0xea0627a8b29d7901";

const AuthProvider = ({ children }) => {
    const { user } = FlowState();

    const [authState, setAuthState] = useState({
        walletAddress: null,
        isWalletConnected: false,
        isAdmin: false,
        authMethod: "none", // "wallet" | "jwt" | "none"
    });

    // Watch wallet connection state
    useEffect(() => {
        if (user?.loggedIn && user?.addr) {
            setAuthState({
                walletAddress: user.addr,
                isWalletConnected: true,
                isAdmin: user.addr.toLowerCase() === ADMIN_ADDRESS.toLowerCase(),
                authMethod: "wallet",
            });
        } else {
            setAuthState({
                walletAddress: null,
                isWalletConnected: false,
                isAdmin: false,
                authMethod: "none",
            });
        }
    }, [user]);

    // Connect wallet (Blocto)
    const connectWallet = async () => {
        try {
            await fcl.logIn();
        } catch (error) {
            console.error("Wallet connection failed:", error);
        }
    };

    // Disconnect wallet
    const disconnectWallet = async () => {
        try {
            await fcl.unauthenticate();
            setAuthState({
                walletAddress: null,
                isWalletConnected: false,
                isAdmin: false,
                authMethod: "none",
            });
        } catch (error) {
            console.error("Wallet disconnection failed:", error);
        }
    };

    // Check if user has any form of authentication
    const isAuthenticated = () => {
        return authState.isWalletConnected;
    };

    return (
        <AuthContext.Provider
            value={{
                ...authState,
                connectWallet,
                disconnectWallet,
                isAuthenticated,
                ADMIN_ADDRESS,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

export default AuthProvider;
