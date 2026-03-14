import React from "react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "80vh",
                padding: "20px",
                textAlign: "center",
            }}
        >
            <h1
                style={{
                    fontSize: "120px",
                    fontWeight: "800",
                    background: "linear-gradient(135deg, #6C5CE7, #A29BFE)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    margin: "0",
                    lineHeight: "1",
                }}
            >
                404
            </h1>
            <h2
                style={{
                    fontSize: "24px",
                    color: "#FFFFFF",
                    margin: "16px 0 8px",
                }}
            >
                Page Not Found
            </h2>
            <p
                style={{
                    fontSize: "16px",
                    color: "#B2B2D8",
                    maxWidth: "400px",
                    marginBottom: "32px",
                }}
            >
                The page you're looking for doesn't exist or has been moved.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
                <button
                    onClick={() => navigate("/")}
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
                    }}
                    onMouseEnter={(e) => (e.target.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
                >
                    Go Home
                </button>
                <button
                    onClick={() => navigate("/projects")}
                    style={{
                        padding: "12px 28px",
                        borderRadius: "12px",
                        border: "1px solid rgba(108, 92, 231, 0.3)",
                        background: "rgba(108, 92, 231, 0.1)",
                        color: "#A29BFE",
                        fontSize: "15px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.target.style.transform = "translateY(-2px)")}
                    onMouseLeave={(e) => (e.target.style.transform = "translateY(0)")}
                >
                    View Projects
                </button>
            </div>
        </div>
    );
};

export default NotFound;
