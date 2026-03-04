import React, { useState } from "react";
import "../../containers/signup/signup.css";
import { HiAtSymbol } from "react-icons/hi";
import Logo from "../../assets/logo (2).png";
import { BsFillArrowLeftSquareFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import validate from "email-validator";
import authService from "../../services/authService";
import { useAuth } from "../../context/AuthProvider";

const Signup = () => {
  const [inputs, setInputs] = useState({
    name: "",
    email: "",
    registration: "",
    address: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { isWalletConnected, walletAddress, connectWallet } = useAuth();
  const navigate = useNavigate();

  const goTo__landing = () => navigate("/");
  const goTo__login = () => navigate("/login");

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
    setErrorMsg("");
  };

  const validateAndRegister = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (
      !inputs.name ||
      !inputs.email ||
      !inputs.registration ||
      !inputs.address ||
      !inputs.password
    ) {
      setErrorMsg("Please fill in all fields");
      return;
    }

    if (!validate.validate(inputs.email)) {
      setErrorMsg("Please enter a valid email address");
      return;
    }

    if (inputs.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(inputs.password)) {
      setErrorMsg("Password must contain uppercase, lowercase, and a number");
      return;
    }

    setIsLoading(true);
    try {
      await authService.signup(inputs);
      setSuccessMsg("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (e) {
      setErrorMsg(
        e.userMessage ||
        e.response?.data?.error?.message ||
        "Registration failed. Please try again."
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

      <div className="signup__container section__margin">
        <div className="signup_container_main section__margin">
          <h1 className="signup__main_header">
            Signup <HiAtSymbol />
          </h1>

          {/* ═══ WALLET SIGNUP — RECOMMENDED ═══ */}
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
              ⛓️ Recommended: Wallet Signup
            </div>
            <p
              style={{
                fontSize: "13px",
                color: "#B2B2D8",
                marginBottom: "14px",
              }}
            >
              Create a Flow wallet for full blockchain features. Your wallet
              address becomes your identity — no email or password needed.
            </p>

            {isWalletConnected ? (
              <div
                style={{
                  color: "#00B894",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
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
                    Start Browsing Projects →
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
                  width: "100%",
                  maxWidth: "280px",
                }}
              >
                🔗 Create / Connect Flow Wallet
              </button>
            )}
          </div>

          {/* ═══ LEGACY SIGNUP — DEPRECATED ═══ */}
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
              ⚠️ Email/password signup is legacy. Wallet signup above gives you
              full blockchain functionality.
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

          {successMsg && (
            <div
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                background: "rgba(0, 184, 148, 0.15)",
                color: "#00B894",
                marginBottom: "16px",
                textAlign: "center",
                fontSize: "14px",
              }}
            >
              {successMsg}
            </div>
          )}

          <div className="signup__main">
            <label htmlFor="name">Organization Name</label>
            <input
              id="name"
              name="name"
              type="text"
              className="input_log"
              placeholder="Your organization name"
              value={inputs.name}
              onChange={handleChange}
            />
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input_log"
              placeholder="email@example.com"
              value={inputs.email}
              onChange={handleChange}
            />
            <label htmlFor="registration">Registration ID</label>
            <input
              id="registration"
              name="registration"
              type="number"
              className="input_log"
              placeholder="Registration number"
              value={inputs.registration}
              onChange={handleChange}
            />
            <label htmlFor="address">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              className="input_log"
              placeholder="Organization address"
              value={inputs.address}
              onChange={handleChange}
            />
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input_log"
              placeholder="Min 8 chars, uppercase, lowercase, number"
              value={inputs.password}
              onChange={handleChange}
            />
          </div>
          <div className="buttons__login">
            <button
              className="button__sub"
              onClick={() => validateAndRegister()}
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register (Legacy)"}
            </button>
            <button className="button__reg" onClick={goTo__login}>
              Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
