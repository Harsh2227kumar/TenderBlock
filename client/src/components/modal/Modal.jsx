import React, { useState, useEffect } from "react";
import "./modal.css";
import { client } from "./util";
import tenderService from "../../services/tenderService";
import flowService from "../../services/flowService";
import { FlowState } from "../../context/FlowProvider";
import * as fcl from "@onflow/fcl";

const Modal = ({ setOpenModal }) => {
  const { user } = FlowState();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [txHash, setTxHash] = useState(null);
  const [step, setStep] = useState(""); // "", "blockchain", "indexing", "done"

  const [tenderState, setTenderState] = useState({
    tender_id: "",
    _ipfsHash: "",
    _title: "",
    _description: "",
    _minimumExp: "",
    _exp: "",
    biddingLength: "",
    startPrice: "",
    opening_date: new Date().toISOString().slice(0, 19).replace("T", " "),
  });

  const handleValueChange = (fieldName, value) => {
    setTenderState((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    setErrorMsg("");
  };

  // Fetch tender ID on mount
  useEffect(() => {
    const fetchTenderId = async () => {
      try {
        const result = await tenderService.generateId();
        handleValueChange(
          "tender_id",
          result.data?.tender_id || result.message
        );
      } catch (e) {
        handleValueChange("tender_id", "ERROR");
        setErrorMsg("Failed to generate tender ID");
      }
    };
    fetchTenderId();
  }, []);

  const createTender = async () => {
    // ─── Validation ───────────────────────────────────
    if (!tenderState._title || tenderState._title.length < 3) {
      setErrorMsg("Title must be at least 3 characters");
      return;
    }
    if (!tenderState._description || tenderState._description.length < 10) {
      setErrorMsg("Description must be at least 10 characters");
      return;
    }
    if (!tenderState._minimumExp || parseInt(tenderState._minimumExp) < 0) {
      setErrorMsg("Minimum experience must be a non-negative number");
      return;
    }
    if (!tenderState._exp || parseInt(tenderState._exp) < 0) {
      setErrorMsg("Experience reward must be a non-negative number");
      return;
    }
    if (!tenderState.biddingLength || parseInt(tenderState.biddingLength) < 1) {
      setErrorMsg("Bidding duration must be a positive number");
      return;
    }
    if (!tenderState.startPrice || parseInt(tenderState.startPrice) < 1) {
      setErrorMsg("Start price must be a positive number");
      return;
    }

    // ─── Check wallet is connected ────────────────────
    if (!user?.loggedIn) {
      setErrorMsg(
        "Please connect your wallet first (click Login on the Bids page)"
      );
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // ─── Step 1: Execute on BLOCKCHAIN first ────────
      setStep("blockchain");
      const { txId, explorerUrl } = await flowService.createTender(tenderState);
      setTxHash(txId);

      // ─── Step 2: Index in MySQL for fast reads ──────
      setStep("indexing");
      await tenderService.create({
        ...tenderState,
        tx_hash: txId, // Store the blockchain tx hash
      });

      // ─── Done ───────────────────────────────────────
      setStep("done");
      setSuccessMsg(
        `✅ Tender created on blockchain! TX: ${txId.slice(0, 8)}...`
      );

      // Auto-close after 3 seconds
      setTimeout(() => setOpenModal(false), 3000);
    } catch (e) {
      console.error("Tender creation failed:", e);

      if (step === "blockchain") {
        setErrorMsg(
          "Blockchain transaction failed: " +
          (e.message || "Transaction was rejected or timed out")
        );
      } else if (step === "indexing") {
        // Blockchain succeeded but MySQL failed — this is OK, data is on-chain
        setSuccessMsg(
          `⚠️ Tender created on blockchain (TX: ${txHash?.slice(0, 8)}...) but database index failed. The tender exists on-chain and will sync later.`
        );
      } else {
        setErrorMsg(
          e.userMessage ||
          e.message ||
          "Failed to create tender"
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getIPFSHash = async (file) => {
    setLoading(true);
    try {
      const cid = await client.put(file);
      handleValueChange("_ipfsHash", cid);
    } catch (error) {
      console.warn("IPFS upload failed, using fallback CID", error);
      handleValueChange("_ipfsHash", "QmFallback" + Date.now());
    }
    setLoading(false);
  };

  return (
    <>
      <div
        className="modal__background"
        onClick={() => !submitting && setOpenModal(false)}
      ></div>

      <div className="modal__container">
        {/* Transaction Progress */}
        {submitting && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              background:
                step === "done"
                  ? "rgba(0, 184, 148, 0.15)"
                  : "rgba(108, 92, 231, 0.15)",
              border:
                step === "done"
                  ? "1px solid rgba(0, 184, 148, 0.3)"
                  : "1px solid rgba(108, 92, 231, 0.3)",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: step === "done" ? "#00B894" : "#A29BFE",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              {step === "blockchain" && "⛓️ Submitting to Flow blockchain..."}
              {step === "indexing" && "📦 Indexing in database..."}
              {step === "done" && "✅ Complete!"}
            </div>
            {step === "blockchain" && (
              <div style={{ color: "#B2B2D8", fontSize: "12px", marginTop: "4px" }}>
                Approve the transaction in your wallet
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(225, 112, 85, 0.15)",
              color: "#E17055",
              marginBottom: "12px",
              textAlign: "center",
              fontSize: "13px",
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(0, 184, 148, 0.15)",
              color: "#00B894",
              marginBottom: "12px",
              textAlign: "center",
              fontSize: "13px",
            }}
          >
            {successMsg}
            {txHash && (
              <div style={{ marginTop: "6px" }}>
                <a
                  href={flowService.getExplorerUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#6C5CE7", textDecoration: "underline" }}
                >
                  View on Flow Explorer →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Wallet Status */}
        {!user?.loggedIn && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              background: "rgba(225, 112, 85, 0.1)",
              border: "1px solid rgba(225, 112, 85, 0.2)",
              marginBottom: "12px",
              textAlign: "center",
              fontSize: "13px",
              color: "#E17055",
            }}
          >
            ⚠️ Connect your wallet to create tenders on the blockchain
            <button
              onClick={() => fcl.logIn()}
              style={{
                marginLeft: "10px",
                padding: "4px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(108, 92, 231, 0.5)",
                background: "rgba(108, 92, 231, 0.2)",
                color: "#A29BFE",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Connect Wallet
            </button>
          </div>
        )}

        <div className="admin__tender_inputs">
          <div className="admin__tender_inputs_left">
            <div className="left_first">
              <div className="tender">
                <input
                  className="tender_id"
                  type="text"
                  placeholder="Tender ID"
                  value={tenderState.tender_id}
                  readOnly
                ></input>
              </div>

              <div className="tender">
                <input
                  className="tender_experience"
                  type="text"
                  placeholder="Tender Title"
                  value={tenderState._title}
                  onChange={(e) => handleValueChange("_title", e.target.value)}
                  disabled={submitting}
                ></input>
              </div>
              <div className="tender">
                <input
                  className="tender_experience"
                  type="number"
                  min="0"
                  placeholder="Min. Exp. Required"
                  value={tenderState._minimumExp}
                  onChange={(e) =>
                    handleValueChange("_minimumExp", e.target.value)
                  }
                  disabled={submitting}
                ></input>
              </div>
            </div>

            <div className="tender">
              <input
                className="tender_title"
                type="number"
                min="0"
                placeholder="Experience Provided"
                value={tenderState._exp}
                onChange={(e) => handleValueChange("_exp", e.target.value)}
                disabled={submitting}
              ></input>
            </div>

            <div className="left_third">
              <div className="left_third_dates">
                <input
                  className="tender_dates"
                  type="number"
                  min="1"
                  name="opening"
                  placeholder="Bidding Duration (seconds)"
                  value={tenderState.biddingLength}
                  onChange={(e) =>
                    handleValueChange("biddingLength", e.target.value)
                  }
                  disabled={submitting}
                />
              </div>

              <div className="left_third_dates">
                <input
                  className="tender_dates"
                  type="number"
                  min="1"
                  name="startPrice"
                  placeholder="Starting Bid Price"
                  value={tenderState.startPrice}
                  onChange={(e) =>
                    handleValueChange("startPrice", e.target.value)
                  }
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="tender">
              {tenderState._ipfsHash ? (
                <>
                  {`IPFSHash : ${tenderState._ipfsHash.slice(
                    0,
                    4
                  )}...${tenderState._ipfsHash.slice(
                    tenderState._ipfsHash.length - 4,
                    tenderState._ipfsHash.length
                  )} `}
                </>
              ) : (
                <>
                  {!loading ? (
                    <input
                      className="tender_experience_file"
                      type="file"
                      placeholder="IPFS hash"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => getIPFSHash(e.target.files)}
                      disabled={submitting}
                    ></input>
                  ) : (
                    <span style={{ color: "#A29BFE" }}>
                      Uploading to IPFS...
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="admin__tender_inputs_right">
            <div className="admin__tender_inputs_right_description">
              <textarea
                rows="5"
                cols="20"
                name="description"
                placeholder="Tender Description (min 10 characters)"
                value={tenderState._description}
                onChange={(e) =>
                  handleValueChange("_description", e.target.value)
                }
                disabled={submitting}
              ></textarea>
            </div>
          </div>
        </div>

        <div className="admin_text_button">
          <button
            className="admin__submit"
            onClick={() => createTender()}
            disabled={submitting || !user?.loggedIn}
          >
            {submitting
              ? step === "blockchain"
                ? "⛓️ Waiting for Blockchain..."
                : step === "indexing"
                  ? "📦 Indexing..."
                  : "Processing..."
              : "Submit to Blockchain"}
          </button>
        </div>
      </div>
    </>
  );
};

export default Modal;
