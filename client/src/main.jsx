import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import FlowProvider from "./context/FlowProvider";
import AuthProvider from "./context/AuthProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <FlowProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </FlowProvider>
    </BrowserRouter>
  </React.StrictMode>
);
