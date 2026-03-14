import { React } from "react";
import "./app.css";
import { Route, Routes } from "react-router-dom";
import {
  Landing,
  Projects,
  Bids,
  Login,
  Signup,
  Admin,
} from "./containers/index.js";
import NotFound from "./containers/notFound/NotFound.jsx";

const App = () => {
  return (
    <div className="App gradient__bg">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/bids" element={<Bids />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<Admin />} />
        {/* Catch-all 404 page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

export default App;