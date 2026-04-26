export const warningSigns = [
  {
    title: "Urgency",
    example: "Your account will be locked today.",
    explanation:
      "Attackers create pressure so users act before checking the message.",
  },
  {
    title: "Password or code request",
    example: "Confirm your password or MFA code.",
    explanation:
      "Genuine organisations should not ask for passwords or authentication codes by email.",
  },
  {
    title: "Suspicious link",
    example: "The text says PayPal, but the link goes somewhere else.",
    explanation:
      "The visible link text can be fake. The real destination is what matters.",
  },
  {
    title: "Sender mismatch",
    example: "Microsoft Security <alerts@unknown-domain.example>",
    explanation:
      "Display names can be faked. Check the real sender address and domain.",
  },
  {
    title: "Unexpected attachment",
    example: "Urgent invoice attached from an unknown sender.",
    explanation:
      "Attachments can contain malware or lead to credential theft.",
  },
  {
    title: "Payment change",
    example: "Our bank details have changed. Pay this account today.",
    explanation:
      "Payment changes should always be confirmed through a trusted channel.",
  },
];
