import React, { useState, useEffect } from "react";
import "./projects.css";
import { ActiveHeader, ListActive } from "../../components";
import { BsFillArrowLeftSquareFill } from "react-icons/bs";
import Logo from "../../assets/logo (2).png";
import { useNavigate } from "react-router-dom";
import tenderService from "../../services/tenderService";
import { useAuth } from "../../context/AuthProvider";

const Projects = () => {
  const navigate = useNavigate();
  const { isWalletConnected, walletAddress, connectWallet, disconnectWallet } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchTenders = async () => {
      setIsLoading(true);
      setError("");
      try {
        const params = {};
        if (filter === "active") params.status = "active";
        if (filter === "settled") params.status = "settled";
        if (searchTerm) params.search = searchTerm;
        const result = await tenderService.getAll(params);
        setProjects(result.data || result.message || []);
      } catch (e) {
        setError(e.userMessage || "Failed to load tenders");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTenders();
  }, [filter]);

  const filteredProjects = searchTerm
    ? projects.filter(
      (p) =>
        p._title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p._description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.tender_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : projects;

  const activeProjects = filteredProjects.filter((p) => !p.isSettled);
  const pastProjects = filteredProjects.filter((p) => p.isSettled);

  const goTo__landing = () => navigate("/");

  return (
    <>
      <div className="logo__container">
        <BsFillArrowLeftSquareFill className="back" onClick={goTo__landing} />
        <img className="logo" src={Logo} onClick={goTo__landing} />
      </div>

      <div className="project__container section__margin">
        <div className="project_container_main section_margin">
          <div className="project__header">
            <div className="project__header_head">
              <h1>
                <span className="span_style_header">Pro</span>jects
              </h1>
            </div>
            <div className="project__button_head" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {isWalletConnected ? (
                <>
                  <div style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background: "rgba(0, 184, 148, 0.15)",
                    border: "1px solid rgba(0, 184, 148, 0.3)",
                    fontSize: "12px",
                    color: "#00B894",
                  }}>
                    🔗 {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
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
                <>
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
                  <button className="project__btn" onClick={() => navigate("/login")}>
                    Legacy Login
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search & Filter */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="🔍 Search tenders by title, description, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: "200px",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: "8px" }}>
              {["all", "active", "settled"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border:
                      filter === f
                        ? "2px solid #6C5CE7"
                        : "1px solid rgba(255,255,255,0.1)",
                    background:
                      filter === f
                        ? "rgba(108, 92, 231, 0.2)"
                        : "rgba(255,255,255,0.05)",
                    color: filter === f ? "#A29BFE" : "#B2B2D8",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    fontSize: "13px",
                    fontWeight: filter === f ? "600" : "400",
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "16px",
                borderRadius: "8px",
                background: "rgba(225, 112, 85, 0.15)",
                color: "#E17055",
                textAlign: "center",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          {isLoading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#B2B2D8" }}>
              Loading tenders...
            </div>
          ) : (
            <>
              {/* Active Tenders */}
              <div className="project__body">
                <h3>Active Projects ({activeProjects.length})</h3>
                <div className="project__body_header_active">
                  <ActiveHeader />
                </div>
                <div className="project__body_list_active">
                  {activeProjects.length > 0 ? (
                    activeProjects.map((project) => (
                      <ListActive data={project} key={project.tender_id} />
                    ))
                  ) : (
                    <p style={{ color: "#6C6C8A", textAlign: "center", padding: "20px" }}>
                      No active tenders found
                    </p>
                  )}
                </div>
              </div>

              {/* Past Tenders */}
              <div className="project__body" style={{ marginTop: "30px" }}>
                <h3>Past Projects ({pastProjects.length})</h3>
                <div className="project__body_header_active">
                  <ActiveHeader />
                </div>
                <div className="project__body_list_active">
                  {pastProjects.length > 0 ? (
                    pastProjects.map((project) => (
                      <ListActive data={project} key={project.tender_id} />
                    ))
                  ) : (
                    <p style={{ color: "#6C6C8A", textAlign: "center", padding: "20px" }}>
                      No past tenders found
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Projects;