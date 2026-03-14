import React, { useState } from "react";
import "../../containers/login/login.css";
import { HiAtSymbol } from "react-icons/hi";
import validate from "email-validator";
import Logo from "../../assets/logo (2).png";
import { BsFillArrowLeftSquareFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import { useAuth } from "../../context/AuthProvider";
import * as fcl from "@onflow/fcl";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const { isWalletConnected, walletAddress, connectWallet } = useAuth();
  const navigate = useNavigate();

  const goTo__landing = () => navigate("/");
  const goTo__register = () => navigate("/signup");

  const validateAndLogin = async () => {
    setErrorMsg("");

    if (!email || !password) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    if (!validate.validate(email)) {
      setErrorMsg("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await authService.login(email, password);
      navigate("/projects");
    } catch (e) {
      setErrorMsg(
        e.userMessage ||
        e.response?.data?.error?.message ||
        "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="logo__container">
        <BsFillArrowLeftSquareFill className="back" onClick={goTo__landing} />
        <img className="logo" src={Logo} onClick={goTo__landing} />
      </div>
      <div className="login__container section__margin">
        <div className="login_container_main section_margin">
          <h1 className="login__main_header">
            Login <HiAtSymbol />
          </h1>

          {/* ═══ WALLET LOGIN — RECOMMENDED ═══ */}
          <div
            style={{
              padding: "20px",
              borderRadius: "14px",
              background:
                "linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(108, 92, 231, 0.05))",
              border: "1px solid rgba(108, 92, 231, 0.3)",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#A29BFE",
                marginBottom: "8px",
              }}
            >
              ⛓️ Recommended: Wallet Login
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "#B2B2D8",
                marginBottom: "14px",
              }}
            >
              Connect your Flow wallet for full blockchain features: on-chain
              bidding, NFT ownership, and transparent transactions.
            </p>

            {isWalletConnected ? (
              <div style={{ color: "#00B894", fontSize: "14px", fontWeight: "600" }}>
                ✅ Wallet Connected: {walletAddress?.slice(0, 6)}...
                {walletAddress?.slice(-4)}
                <div style={{ marginTop: "8px" }}>
                  <button
                    onClick={() => navigate("/projects")}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "10px",
                      border: "none",
                      background: "linear-gradient(135deg, #00B894, #00A885)",
                      color: "#FFFFFF",
                      fontSize: "14px",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Go to Projects →
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                style={{
                  padding: "12px 28px",
                  borderRadius: "12px",
                  border: "none",
                  background: "linear-gradient(135deg, #6C5CE7, #4834D4)",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                  width: "100%",
                  maxWidth: "280px",
                }}
              >
                🔗 Connect Flow Wallet
              </button>
            )}
          </div>

          {/* ═══ LEGACY LOGIN — DEPRECATED ═══ */}
          <div
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              background: "rgba(225, 112, 85, 0.08)",
              border: "1px solid rgba(225, 112, 85, 0.15)",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            <span style={{ color: "#E17055", fontSize: "12px" }}>
              ⚠️ Email/password login is legacy. Use wallet login above for
              blockchain features.
            </span>
          </div>

          {errorMsg && (
            <div
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                background: "rgba(225, 112, 85, 0.15)",
                color: "#E17055",
                marginBottom: "16px",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              {errorMsg}
            </div>
          )}

          <div className="login__main">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input_log"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMsg("");
              }}
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input_log"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMsg("");
              }}
            />
          </div>
          <div className="buttons__login">
            <button
              className="button__sub"
              onClick={() => validateAndLogin()}
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login (Legacy)"}
            </button>
            <button className="button__reg" onClick={goTo__register}>
              Register
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
