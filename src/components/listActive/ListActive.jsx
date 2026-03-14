import React from "react";
import "./listActive.css";
import { useNavigate } from "react-router-dom";

const ListActive = ({ data }) => {
  const navigate = useNavigate();

  // Navigate to bid page for this tender
  const handleClick = () => {
    navigate(`/bids?tender_id=${data?.tender_id}`);
  };

  return (
    <>
      <div
        className="list__container section__margin"
        onClick={handleClick}
        style={{ cursor: "pointer" }}
      >
        <div className="list__container_name">{data?._title}</div>
        <div className="list__container_open_bid">{data?.biddingLength}</div>
        <div className="list__container_close_bid">{data?._minimumExp}</div>
        <div className="list__container_status">
          {data?.isSettled ? (
            <span style={{ color: "#E17055" }}>Settled</span>
          ) : (
            <span style={{ color: "#00B894" }}>Active</span>
          )}
        </div>
      </div>
    </>
  );
};

export default ListActive;
