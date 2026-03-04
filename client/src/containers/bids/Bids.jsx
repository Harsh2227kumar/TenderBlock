import React, { useState, useEffect } from "react";
import "./bids.css";
import { ActiveHeader } from "../../components";
import { createCollectionSetupInFlow } from "../../Transactions/storebiddingCollection";
import Logo from "../../assets/logo (2).png";
import { BsFillArrowLeftSquareFill } from "react-icons/bs";
import { useNavigate, useLocation } from "react-router-dom";

import { FlowState } from "../../context/FlowProvider";
import * as fcl from "@onflow/fcl";
import useSWR from "swr";
import bidService from "../../services/bidService";
import tenderService from "../../services/tenderService";
import flowService from "../../services/flowService";
import FlowLogo from "../../assets/illustrations/FlowLogo";

const Bids = () => {
  const { user, setTxId, status } = FlowState();
  const navigate = useNavigate();
  const search = useLocation().search;
  const tender_id = new URLSearchParams(search).get("tender_id");

  const [projectData, setProjectData] = useState(null);
  const [onChainStatus, setOnChainStatus] = useState(null);
  const [biddingAmount, SetbiddingAmount] = useState("");
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [bidMessage, setBidMessage] = useState("");
  const [bidStep, setBidStep] = useState(""); // "", "blockchain", "indexing", "done"
  const [lastTxHash, setLastTxHash] = useState(null);

  // Fetch tender data from MySQL (fast reads)
  const fetcher = async () => {
    try {
      const result = await tenderService.getById(tender_id);
      setProjectData(result.data || result.message);
    } catch (e) {
      console.error("Failed to fetch tender:", e);
    }
  };

  const { error, isLoading } = useSWR(
    tender_id ? `tender-${tender_id}` : null,
    fetcher
  );

  // Fetch on-chain auction statuses (blockchain source of truth)
  useEffect(() => {
    const fetchOnChainStatus = async () => {
      try {
        const statuses = await flowService.getProjectStatuses();
        if (statuses && Object.keys(statuses).length > 0) {
          setOnChainStatus(statuses);
        }
      } catch (e) {
        console.warn("Could not fetch on-chain statuses:", e);
      }
    };
    fetchOnChainStatus();
  }, [lastTxHash]); // Re-fetch after new transaction

  const goTo__landing = () => navigate("/");
  const goTo__Projects = () => navigate("/projects");

  const AsyncTxhandle = async () => {
    setBidMessage("");
    try {
      const tx = await createCollectionSetupInFlow();
      setTxId(tx);
      setBidMessage("✅ Collection setup successful!");
    } catch (e) {
      setBidMessage(
        "❌ Collection setup failed: " + (e.message || "Unknown error")
      );
    }
  };

  // ═══════════════════════════════════════════════════════
  // PLACE BID — Blockchain FIRST, then MySQL index
  // ═══════════════════════════════════════════════════════
  const placeBid = async () => {
    if (!biddingAmount || parseFloat(biddingAmount) <= 0) {
      setBidMessage("Please enter a valid bidding amount");
      return;
    }

    // ── Require wallet connection ──
    if (!user?.loggedIn) {
      setBidMessage("⚠️ Please connect your wallet first to place bids on the blockchain");
      return;
    }

    setIsPlacingBid(true);
    setBidMessage("");
    setLastTxHash(null);

    try {
      // ── Step 1: Place bid ON-CHAIN ──
      setBidStep("blockchain");

      // We need the on-chain biddingId. If we have on-chain data, use it.
      // Otherwise, we'll try with a default ID (1) — this maps to the auction
      // For now we pass the amount; the smart contract validates everything
      const biddingId = "1"; // TODO: map tender_id to on-chain biddingId via indexer

      const { txId, explorerUrl } = await flowService.placeBid(
        biddingId,
        biddingAmount
      );
      setLastTxHash(txId);

      // ── Step 2: Index in MySQL ──
      setBidStep("indexing");
      try {
        await bidService.placeBid(tender_id, biddingAmount);
      } catch (indexError) {
        // MySQL index failed but blockchain succeeded — data is ON-CHAIN
        console.warn("MySQL index failed, but bid is on-chain:", indexError);
      }

      // ── Done ──
      setBidStep("done");
      setBidMessage(
        `✅ Bid placed on blockchain! TX: ${txId.slice(0, 10)}...`
      );
    } catch (e) {
      console.error("Bid failed:", e);

      if (bidStep === "blockchain") {
        setBidMessage(
          "❌ Blockchain transaction failed: " +
          (e.message || "Transaction was rejected or timed out. Make sure you have set up your collection first.")
        );
      } else {
        setBidMessage(
          "❌ " + (e.userMessage || e.message || "Failed to place bid")
        );
      }
    } finally {
      setIsPlacingBid(false);
      setBidStep("");
    }
  };

  return (
    <>
      <div className="logo__container ">
        <BsFillArrowLeftSquareFill className="back" onClick={goTo__Projects} />
        <img className="logo" src={Logo} onClick={goTo__landing} />
      </div>

      <div className="bids__container_overlay section__margin section__padding">
        <div className="bid__container_left">
          <div className="bid__container_left_body">
            <div className="bid__left_header_bg">
              <div className="bid__left_header">
                <span className="span_style_header_bid">Bi</span>d{" "}
                <span className="span_style_header_bid">D</span>etails
                <h5>
                  {user.loggedIn
                    ? `🔗 Wallet: ${user?.addr}`
                    : "⚠️ Wallet not connected"}
                </h5>
                {status ? (
                  <h5 style={{ color: "#00B894", fontSize: "11px" }}>
                    Last TX: {status?.status === 4 ? "✅ Sealed" : "⏳ Pending"}
                  </h5>
                ) : null}
              </div>
            </div>

            {isLoading ? (
              <div className="bid__container_description">
                <p>Loading tender details...</p>
              </div>
            ) : projectData ? (
              <div className="bid__container_description">
                <div className="desc__container">
                  <div className="desc__requirement">Title:</div>
                  <div className="desc__value">{projectData?._title}</div>
                </div>
                <div className="desc__container">
                  <div className="desc__requirement">Tender ID:</div>
                  <div className="desc__value">{projectData?.tender_id}</div>
                </div>
                <div className="desc__container">
                  <div className="desc__requirement">IPFS Hash:</div>
                  <div className="desc__value">
                    {projectData?._ipfsHash ? (
                      <a
                        href={`https://ipfs.io/ipfs/${projectData._ipfsHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#6C5CE7", textDecoration: "underline" }}
                      >
                        {projectData._ipfsHash.slice(0, 12)}...
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </div>
                <div className="desc__container">
                  <div className="desc__requirement">Description:</div>
                  <div className="desc__value">
                    {projectData?._description}
                  </div>
                </div>
                <div className="desc__container">
                  <div className="desc__requirement">Min. Exp:</div>
                  <div className="desc__value">{projectData?._minimumExp}</div>
                </div>
                <div className="desc__container">
                  <div className="desc__requirement">Opening Date:</div>
                  <div className="desc__value">
                    {projectData?.opening_date}
                  </div>
                </div>
                <div className="desc__container">
                  <div className="desc__requirement">Duration:</div>
                  <div className="desc__value">
                    {projectData?.biddingLength} seconds
                  </div>
                </div>
                <div className="desc__container">
                  <div className="desc__requirement">Status:</div>
                  <div className="desc__value">
                    {projectData?.isSettled ? (
                      <span style={{ color: "#E17055", fontWeight: "600" }}>
                        🔒 Settled
                      </span>
                    ) : (
                      <span style={{ color: "#00B894", fontWeight: "600" }}>
                        🟢 Active
                      </span>
                    )}
                  </div>
                </div>

                {/* On-chain data indicator */}
                {onChainStatus && Object.keys(onChainStatus).length > 0 && (
                  <div
                    className="desc__container"
                    style={{
                      marginTop: "12px",
                      padding: "8px 12px",
                      background: "rgba(108, 92, 231, 0.1)",
                      borderRadius: "8px",
                      border: "1px solid rgba(108, 92, 231, 0.2)",
                    }}
                  >
                    <div className="desc__requirement" style={{ color: "#A29BFE" }}>
                      ⛓️ On-Chain:
                    </div>
                    <div className="desc__value" style={{ color: "#A29BFE", fontSize: "12px" }}>
                      {Object.keys(onChainStatus).length} auction(s) found on
                      blockchain
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bid__container_description">
                <p>Tender not found</p>
              </div>
            )}
          </div>
        </div>

        <div className="bid__container_right">
          <div className="bid__container_leaderboard">
            <div className="btns_left">
              {user.loggedIn ? (
                <>
                  <div className="btn__wallet_connect_1">
                    <button
                      className="btn__wallet_connect"
                      onClick={() => AsyncTxhandle()}
                    >
                      Collection Setup
                    </button>
                  </div>
                  <div style={{ fontSize: "11px", color: "#00B894", marginTop: "4px" }}>
                    ✅ Wallet: {user?.addr?.slice(0, 6)}...{user?.addr?.slice(-4)}
                  </div>
                </>
              ) : (
                <>
                  <button
                    className="btn__wallet_connect"
                    onClick={() => fcl.logIn()}
                  >
                    🔗 Connect Wallet
                  </button>
                  <br />
                  <button
                    className="btn__wallet_connect"
                    onClick={() => fcl.signUp()}
                  >
                    Create Wallet
                  </button>
                </>
              )}
            </div>

            {/* Bid Progress / Message */}
            {(bidMessage || isPlacingBid) && (
              <div
                style={{
                  padding: "10px",
                  margin: "10px 0",
                  borderRadius: "8px",
                  background: isPlacingBid
                    ? "rgba(108, 92, 231, 0.15)"
                    : bidMessage.includes("✅")
                      ? "rgba(0, 184, 148, 0.2)"
                      : "rgba(225, 112, 85, 0.2)",
                  color: isPlacingBid
                    ? "#A29BFE"
                    : bidMessage.includes("✅")
                      ? "#00B894"
                      : "#E17055",
                  textAlign: "center",
                  fontSize: "13px",
                }}
              >
                {isPlacingBid && (
                  <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                    {bidStep === "blockchain"
                      ? "⛓️ Submitting to Flow blockchain..."
                      : bidStep === "indexing"
                        ? "📦 Indexing in database..."
                        : "Processing..."}
                  </div>
                )}
                {bidMessage}
                {lastTxHash && (
                  <div style={{ marginTop: "6px" }}>
                    <a
                      href={flowService.getExplorerUrl(lastTxHash)}
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

            <div className="btn__wallet_trans_container">
              <button className="btn__wallet_trans">
                <input
                  className="input__wallet_trans"
                  placeholder="0.00001"
                  type="number"
                  min="0"
                  step="0.00001"
                  value={biddingAmount}
                  onChange={(e) => SetbiddingAmount(e.target.value)}
                  disabled={projectData?.isSettled || isPlacingBid}
                />
                Flow
                <FlowLogo style={{ width: 30, marginLeft: 10 }} />
              </button>
            </div>

            <div className="btn__wallet_bid_container">
              <button
                className="btn__wallet_bid"
                onClick={() => placeBid()}
                disabled={isPlacingBid || projectData?.isSettled || !user?.loggedIn}
              >
                {isPlacingBid
                  ? bidStep === "blockchain"
                    ? "⛓️ Waiting for Blockchain..."
                    : "Processing..."
                  : !user?.loggedIn
                    ? "🔗 Connect Wallet to Bid"
                    : projectData?.isSettled
                      ? "🔒 Auction Settled"
                      : "⛓️ Place Bid on Blockchain"}
              </button>
            </div>

            <div className="project__body_header_active"></div>

            <div className="bid__body_list">
              <div className="min_val">
                <span>Lowest Bid</span>
                <span>{projectData?.currentMinDemand || "No bids yet"}</span>
              </div>
              <div className="min_user">
                <span>Leading Bidder</span>
                <span>{projectData?.winner_email || "No bids yet"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Bids;
