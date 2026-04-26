import React from "react";
import EmailList from "../components/EmailList";
import "./Flagged.css";

function Flagged(props) {
  return <div className="flagged-page"><EmailList {...props} /></div>;
}

export default Flagged;
