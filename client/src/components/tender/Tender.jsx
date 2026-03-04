import React, { useState } from "react";
import "./tender.css";
import tenderService from "../../services/tenderService";
import flowService from "../../services/flowService";
import { FlowState } from "../../context/FlowProvider";
import * as fcl from "@onflow/fcl";

const Tender = ({ data }) => {
  const { user } = FlowState();
  const [isSettling, setIsSettling] = useState(false);
  const [message, setMessage] = useState("");
  const [settleStep, setSettleStep] = useState(""); // "", "blockchain", "indexing", "done"
  const [txHash, setTxHash] = useState(null);

  // ═══════════════════════════════════════════════════════
  // SETTLE AUCTION — Blockchain FIRST, then MySQL index
  // ═══════════════════════════════════════════════════════
  const settleBid = async (tender_id) => {
    if (data?.isSettled) {
      setMessage("This tender has already been settled");
      return;
    }

    // Require wallet connection
    if (!user?.loggedIn) {
      setMessage("⚠️ Connect your wallet to settle auctions on the blockchain");
      return;
    }

    setIsSettling(true);
    setMessage("");
    setTxHash(null);

    try {
      // ── Step 1: Settle ON-CHAIN ──
      setSettleStep("blockchain");

      // TODO: map tender_id to on-chain biddingId via indexer
      const biddingId = "1"; // Default — maps to first auction

      const { txId, explorerUrl } = await flowService.settleBidding(biddingId);
      setTxHash(txId);

      // ── Step 2: Update MySQL index ──
      setSettleStep("indexing");
      try {
        await tenderService.settle(tender_id);
      } catch (indexError) {
        // MySQL update failed but blockchain settled — data is ON-CHAIN
        console.warn("MySQL index failed, but settlement is on-chain:", indexError);
      }

      // ── Done ──
      setSettleStep("done");
      setMessage(
        `✅ Auction settled on blockchain! NFT transferred to winner. TX: ${txId.slice(0, 10)}...`
      );
    } catch (e) {
      console.error("Settlement failed:", e);

      if (settleStep === "blockchain") {
        setMessage(
          "❌ Blockchain settlement failed: " +
          (e.message || "Make sure the auction has expired and there are bids.")
        );
      } else {
        setMessage(
          "❌ " + (e.userMessage || e.message || "Failed to settle tender")
        );
      }
    } finally {
      setIsSettling(false);
      setSettleStep("");
    }
  };

  return (
    <div className="tender__container">
      <div className="tender__container_header">
        <div className="tender_title">{data?._title}</div>
        <div
          className={`tender_status ${data?.isSettled ? "settled" : "active"}`}
        >
          {data?.isSettled ? "🔒 Settled" : "🟢 Active"}
        </div>
      </div>

      <div className="tender__body">
        <div className="tender__body_row">
          <span className="tender__label">Tender ID:</span>
          <span className="tender__value">{data?.tender_id}</span>
        </div>
        <div className="tender__body_row">
          <span className="tender__label">Description:</span>
          <span className="tender__value">{data?._description}</span>
        </div>
        <div className="tender__body_row">
          <span className="tender__label">Min Experience:</span>
          <span className="tender__value">{data?._minimumExp}</span>
        </div>
        <div className="tender__body_row">
          <span className="tender__label">Exp Reward:</span>
          <span className="tender__value">{data?._exp}</span>
        </div>
        <div className="tender__body_row">
          <span className="tender__label">Opening Date:</span>
          <span className="tender__value">{data?.opening_date}</span>
        </div>
        <div className="tender__body_row">
          <span className="tender__label">Duration:</span>
          <span className="tender__value">{data?.biddingLength} sec</span>
        </div>
        <div className="tender__body_row">
          <span className="tender__label">Start Price:</span>
          <span className="tender__value">{data?.startPrice}</span>
        </div>
        {data?.currentMinDemand && (
          <div className="tender__body_row">
            <span className="tender__label">Current Min Demand:</span>
            <span className="tender__value" style={{ color: "#00B894" }}>
              {data.currentMinDemand}
            </span>
          </div>
        )}
        {data?.winner_email && (
          <div className="tender__body_row">
            <span className="tender__label">Leading Bidder:</span>
            <span className="tender__value" style={{ color: "#6C5CE7" }}>
              {data.winner_email}
            </span>
          </div>
        )}
      </div>

      {/* Settlement Progress / Message */}
      {(message || isSettling) && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            background: isSettling
              ? "rgba(108, 92, 231, 0.15)"
              : message.includes("✅")
                ? "rgba(0, 184, 148, 0.15)"
                : "rgba(225, 112, 85, 0.15)",
            color: isSettling
              ? "#A29BFE"
              : message.includes("✅")
                ? "#00B894"
                : "#E17055",
            textAlign: "center",
            fontSize: "13px",
            margin: "10px 0",
          }}
        >
          {isSettling && (
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>
              {settleStep === "blockchain"
                ? "⛓️ Settling on Flow blockchain..."
                : settleStep === "indexing"
                  ? "📦 Updating database..."
                  : "Processing..."}
            </div>
          )}
          {message}
          {txHash && (
            <div style={{ marginTop: "6px" }}>
              <a
                href={flowService.getExplorerUrl(txHash)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#6C5CE7",
                  textDecoration: "underline",
                  fontSize: "12px",
                }}
              >
                View on Flow Explorer →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Wallet warning */}
      {!user?.loggedIn && !data?.isSettled && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            background: "rgba(225, 112, 85, 0.1)",
            border: "1px solid rgba(225, 112, 85, 0.2)",
            textAlign: "center",
            fontSize: "12px",
            color: "#E17055",
            margin: "8px 0",
          }}
        >
          ⚠️ Connect wallet to settle
          <button
            onClick={() => fcl.logIn()}
            style={{
              marginLeft: "8px",
              padding: "3px 10px",
              borderRadius: "6px",
              border: "1px solid rgba(108, 92, 231, 0.5)",
              background: "rgba(108, 92, 231, 0.2)",
              color: "#A29BFE",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            Connect
          </button>
        </div>
      )}

      <button
        className={`tender__settle_btn ${data?.isSettled ? "disabled" : ""}`}
        onClick={() => settleBid(data?.tender_id)}
        disabled={isSettling || data?.isSettled || !user?.loggedIn}
      >
        {isSettling
          ? settleStep === "blockchain"
            ? "⛓️ Settling on Blockchain..."
            : "Processing..."
          : data?.isSettled
            ? "✓ Settled on Blockchain"
            : "⛓️ Settle on Blockchain"}
      </button>
    </div>
  );
};

export default Tender;
