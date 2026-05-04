import React from "react";
import EmailList from "../components/EmailList";

function Inbox(props) {
  return <div className="inbox-page"><EmailList {...props} /></div>;
}

export default Inbox;
