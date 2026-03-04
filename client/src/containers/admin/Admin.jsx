import React, { useState, useEffect } from "react";
import "../../containers/admin/admin.css";
import { Modal, Tender } from "../../components";
import Logo from "../../assets/logo (2).png";
import { BsFillArrowLeftSquareFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import tenderService from "../../services/tenderService";
import { useAuth } from "../../context/AuthProvider";
import * as fcl from "@onflow/fcl";

const Admin = () => {
  const [openModal, setOpenModal] = useState(false);
  const [tenders, setTenders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const { isWalletConnected, walletAddress, isAdmin, connectWallet, disconnectWallet } = useAuth();
  const navigate = useNavigate();

  // Fetch tenders
  useEffect(() => {
    const fetchTenders = async () => {
      setIsLoading(true);
      setError("");
      try {
        const result = await tenderService.getAll();
        setTenders(result.data || result.message || []);
      } catch (e) {
        setError(e.userMessage || "Failed to load tenders");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTenders();
  }, [openModal]);

  const goTo__Landing = () => navigate("/");
  const goTo__Projects = () => navigate("/projects");

  return (
    <>
      <div className="logo__container">
        <BsFillArrowLeftSquareFill className="back" onClick={goTo__Projects} />
        <img className="logo" src={Logo} onClick={goTo__Landing} />
      </div>

      <div className="admin__container section__margin">
        <div className="admin__container_main section__margin">
          {/* Header with wallet status */}
          <div className="admin__container_header">
            <h1 className="admin__container_header_title">
              <span className="span_style_header">Ad</span>min{" "}
              <span className="span_style_header">Pa</span>nel
            </h1>
            <div className="admin__container_btns" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {isWalletConnected ? (
                <>
                  <div style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: isAdmin
                      ? "rgba(0, 184, 148, 0.15)"
                      : "rgba(225, 112, 85, 0.15)",
                    border: isAdmin
                      ? "1px solid rgba(0, 184, 148, 0.3)"
                      : "1px solid rgba(225, 112, 85, 0.3)",
                    fontSize: "12px",
                    color: isAdmin ? "#00B894" : "#E17055",
                  }}>
                    {isAdmin ? "✅ Admin" : "👤 Bidder"}: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </div>
                  <button
                    onClick={disconnectWallet}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(225, 112, 85, 0.3)",
                      background: "rgba(225, 112, 85, 0.1)",
                      color: "#E17055",
                      fontSize: "12px",
                      cursor: "pointer",
                    }}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={connectWallet}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #6C5CE7, #4834D4)",
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  🔗 Connect Wallet
                </button>
              )}
              <button
                className="admin__btn"
                onClick={() => setOpenModal(!openModal)}
                disabled={!isWalletConnected}
              >
                {openModal ? "Cancel" : "Create Tender"}
              </button>
            </div>
          </div>

          {/* Wallet requirement notice */}
          {!isWalletConnected && (
            <div style={{
              padding: "14px 20px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(108, 92, 231, 0.05))",
              border: "1px solid rgba(108, 92, 231, 0.3)",
              marginBottom: "20px",
              textAlign: "center",
            }}>
              <div style={{ color: "#A29BFE", fontSize: "14px", fontWeight: "600" }}>
                ⛓️ Connect your wallet to manage tenders
              </div>
              <div style={{ color: "#B2B2D8", fontSize: "12px", marginTop: "4px" }}>
                All tender operations are executed on the Flow blockchain
              </div>
            </div>
          )}

          {openModal && <Modal setOpenModal={setOpenModal} />}

          {/* Statistics */}
          <div className="admin__stats" style={{
            display: "flex",
            gap: "16px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}>
            <div style={{
              padding: "16px 24px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(108, 92, 231, 0.2), rgba(108, 92, 231, 0.05))",
              border: "1px solid rgba(108, 92, 231, 0.3)",
              minWidth: "120px",
            }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#A29BFE" }}>
                {tenders.length}
              </div>
              <div style={{ fontSize: "12px", color: "#B2B2D8" }}>Total Tenders</div>
            </div>
            <div style={{
              padding: "16px 24px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(0, 184, 148, 0.2), rgba(0, 184, 148, 0.05))",
              border: "1px solid rgba(0, 184, 148, 0.3)",
              minWidth: "120px",
            }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#00B894" }}>
                {tenders.filter((t) => !t.isSettled).length}
              </div>
              <div style={{ fontSize: "12px", color: "#B2B2D8" }}>Active</div>
            </div>
            <div style={{
              padding: "16px 24px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, rgba(225, 112, 85, 0.2), rgba(225, 112, 85, 0.05))",
              border: "1px solid rgba(225, 112, 85, 0.3)",
              minWidth: "120px",
            }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#E17055" }}>
                {tenders.filter((t) => t.isSettled).length}
              </div>
              <div style={{ fontSize: "12px", color: "#B2B2D8" }}>Settled</div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div style={{
              padding: "16px",
              borderRadius: "8px",
              background: "rgba(225, 112, 85, 0.15)",
              color: "#E17055",
              textAlign: "center",
              marginBottom: "20px",
            }}>
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading ? (
            <div style={{
              textAlign: "center",
              padding: "40px",
              color: "#B2B2D8",
            }}>
              Loading tenders...
            </div>
          ) : (
            <div className="admin__container_tenders">
              {tenders.length > 0 ? (
                tenders.map((tender) => (
                  <Tender data={tender} key={tender.tender_id} />
                ))
              ) : (
                <div style={{
                  textAlign: "center",
                  padding: "40px",
                  color: "#6C6C8A",
                }}>
                  <p>No tenders created yet</p>
                  <p style={{ fontSize: "14px", marginTop: "8px" }}>
                    Connect your wallet and click "Create Tender" to get started
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Admin;
