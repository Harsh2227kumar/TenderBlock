import React, { createContext, useContext, useEffect, useState } from "react";
import * as fcl from "@onflow/fcl";
import "../flow/config";

export const FlowContext = createContext();

const FlowProvider = ({ children }) => {
  const [user, setUser] = useState({ loggedIn: null });
  const [txId, setTxId] = useState(null);
  const [status, setStatus] = useState(null);
  const [txInProgress, setTxInProgress] = useState(false);
  const [txError, setTxError] = useState(null);

  // Subscribe to wallet auth state
  useEffect(() => {
    fcl.currentUser.subscribe((curruser) => {
      setUser(curruser);
    });
  }, []);

  // Watch transaction status when txId changes
  useEffect(() => {
    if (!txId) return; // Don't run if no txId

    const fetchStatus = async () => {
      setTxInProgress(true);
      setTxError(null);
      try {
        const transactionStatus = await fcl.tx(txId).onceSealed();
        setStatus(transactionStatus);
      } catch (error) {
        console.error("Transaction failed:", error);
        setTxError(error.message || "Transaction failed");
        setStatus(null);
      } finally {
        setTxInProgress(false);
      }
    };

    fetchStatus();
  }, [txId]);

  // Helper to clear transaction state
  const clearTx = () => {
    setTxId(null);
    setStatus(null);
    setTxError(null);
    setTxInProgress(false);
  };

  return (
    <FlowContext.Provider
      value={{
        user,
        setTxId,
        txId,
        status,
        txInProgress,
        txError,
        clearTx,
      }}
    >
      {children}
    </FlowContext.Provider>
  );
};

export const FlowState = () => {
  return useContext(FlowContext);
};

export default FlowProvider;
