// frontend/src/pages/education/data/scenarios.js

export const scenarios = [
  {
    title: "Fake bank warning",
    text: "Claims your account will be blocked unless you verify your password through a link.",
    redFlag: "Banks never ask for passwords or security codes by email or text.",
    action: "Go directly to your bank's official app or website to check your account.",
  },
  {
    title: "Fake HMRC refund",
    text: "Claims you are owed a tax refund but asks for bank details through a link to claim it.",
    redFlag: "HMRC never sends refunds through email links or asks for bank details this way.",
    action: "Check your HMRC account directly at GOV.UK and report the email.",
  },
  {
    title: "Fake delivery payment",
    text: "Asks for a small customs fee to release a parcel you may not be expecting.",
    redFlag: "Unexpected fee requests for deliveries are a common phishing trigger.",
    action: "Check the delivery directly with the courier using the official website or app.",
  },
  {
    title: "Fake university IT message",
    text: "Asks you to confirm your password to keep your student account or email active.",
    redFlag: "IT departments do not ask for passwords by email.",
    action: "Contact IT support directly through the official university portal.",
  },
  {
    title: "Supplier payment change",
    text: "Uses a known supplier name or real invoice reference but provides new bank details.",
    redFlag: "Changed payment details are a major fraud indicator, even in a familiar thread.",
    action: "Call the supplier on a known number — not one provided in the email — to verify.",
  },
  {
    title: "Unexpected MFA approval request",
    text: "Asks you to approve a sign-in request you did not start, often creating urgency.",
    redFlag: "An unexpected MFA prompt likely means someone already has your password.",
    action: "Deny the request, change your password immediately, and report it.",
  },
  {
    title: "Smishing — fake parcel text",
    text: "An SMS claims a parcel is held and asks you to pay a fee or update your address via a link.",
    redFlag: "The link does not go to an official courier domain.",
    action: "Do not click the link. Check the delivery through the courier's official app or website.",
  },
  {
    title: "Vishing — fake IT support call",
    text: "A caller claims to be from your bank or IT team and says your account has been compromised.",
    redFlag: "Genuine organisations do not call you unexpectedly asking for account access.",
    action: "Hang up and call the organisation back using the official number from their website.",
  },
];
