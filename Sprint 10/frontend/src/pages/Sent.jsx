import React from "react";
import EmailList from "../components/EmailList";
import "./Sent.css";

function Sent(props) {
  return <div className="sent-page"><EmailList {...props} /></div>;
}

export default Sent;
