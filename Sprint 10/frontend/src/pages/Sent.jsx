import React from "react";
import EmailList from "../components/EmailList";

function Sent(props) {
  return <div className="sent-page"><EmailList {...props} /></div>;
}

export default Sent;
