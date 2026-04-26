// backend/emailRouting.js

const JUNK_SCORE_THRESHOLD = 0.90;
const FLAGGED_SCORE_THRESHOLD = 0.70;

function chooseIncomingFolderFromAI(aiResult) {
  const aiLabel = aiResult?.aiLabel;
  const aiScore =
    typeof aiResult?.aiScore === "number" && Number.isFinite(aiResult.aiScore)
      ? aiResult.aiScore
      : 0;

  // The ML classifier makes the phishing/benign decision.
  // Routing only acts on emails that the ML model classified as phishing.
  if (aiLabel !== "phishing") {
    return {
      folder: "Inbox",
      isFlagged: false,
      isJunk: false,
    };
  }

  // Very high-confidence phishing is moved directly to Junk.
  if (aiScore >= JUNK_SCORE_THRESHOLD) {
    return {
      folder: "Junk",
      isFlagged: false,
      isJunk: true,
    };
  }

  // Medium-confidence phishing is kept visible but marked for review.
  if (aiScore >= FLAGGED_SCORE_THRESHOLD) {
    return {
      folder: "Flagged",
      isFlagged: true,
      isJunk: false,
    };
  }

  // Low-confidence phishing predictions are left in the inbox.
  return {
    folder: "Inbox",
    isFlagged: false,
    isJunk: false,
  };
}

module.exports = {
  chooseIncomingFolderFromAI,
  JUNK_SCORE_THRESHOLD,
  FLAGGED_SCORE_THRESHOLD,
};
