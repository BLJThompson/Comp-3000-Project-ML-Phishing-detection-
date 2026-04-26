export const quizQuestionBank = [
  {
    difficulty: "easy",
    question:
      "You receive a suspicious email in the UK. Where can it be forwarded for reporting?",
    options: [
      {
        text: "report@phishing.gov.uk",
        feedback:
          "Correct. Suspicious emails in the UK can be forwarded to report@phishing.gov.uk so they can be investigated.",
      },
      {
        text: "support@police.uk",
        feedback:
          "This is not the standard UK reporting address for suspicious emails. Use report@phishing.gov.uk.",
      },
      {
        text: "spam@internet.gov.uk",
        feedback:
          "This is not the UK reporting address for phishing emails. Use report@phishing.gov.uk instead.",
      },
    ],
    answer: 0,
  },
  {
    difficulty: "easy",
    question:
      "You receive a suspicious text message in the UK. Where can it be forwarded?",
    options: [
      {
        text: "999",
        feedback:
          "999 is for emergencies. Suspicious text messages should be forwarded to 7726 instead.",
      },
      {
        text: "7726",
        feedback:
          "Correct. Suspicious texts in the UK can be forwarded to 7726.",
      },
      {
        text: "1010",
        feedback:
          "This is not the UK reporting number for suspicious texts. Use 7726.",
      },
    ],
    answer: 1,
  },
  {
    difficulty: "easy",
    question:
      "An email says your bank account will be locked unless you confirm your password through a link. What should you do?",
    options: [
      {
        text: "Click the link quickly before the account is locked.",
        feedback:
          "This is unsafe. Phishing emails often use urgency to pressure people into clicking.",
      },
      {
        text: "Reply to the email with your password.",
        feedback:
          "This is unsafe. Banks and genuine organisations should not ask for your password by email.",
      },
      {
        text: "Go directly to the bank’s official website or app instead.",
        feedback:
          "Correct. Avoid the email link and check your account through a trusted route.",
      },
    ],
    answer: 2,
  },
  {
    difficulty: "easy",
    question:
      "An email asks you to download an attachment from an unknown sender. What is the safest response?",
    options: [
      {
        text: "Open it if the subject line sounds important.",
        feedback:
          "This is unsafe. Attackers often use important-sounding subjects such as invoices or warnings.",
      },
      {
        text: "Do not open it unless you can verify the sender and purpose.",
        feedback:
          "Correct. Unexpected attachments can be risky. Verify the sender first.",
      },
      {
        text: "Download it first and decide later.",
        feedback:
          "This is risky. Downloading unexpected attachments may expose your device.",
      },
    ],
    answer: 1,
  },
  {
    difficulty: "easy",
    question:
      "Which of these is the clearest warning sign of a phishing email?",
    options: [
      {
        text: "The email asks for a password, payment details, or personal information.",
        feedback:
          "Correct. Requests for sensitive information are a major phishing warning sign.",
      },
      {
        text: "The email is short.",
        feedback:
          "A short email is not automatically phishing. Check the sender, links, attachments, and request.",
      },
      {
        text: "The email arrives in the morning.",
        feedback:
          "The time of day is not a reliable phishing indicator.",
      },
    ],
    answer: 0,
  },
  {
    difficulty: "hard",
    question:
      "An email looks like it is from HMRC and says you are due a tax refund, but it asks for your bank details. What should you do?",
    options: [
      {
        text: "Enter the details because HMRC handles tax refunds.",
        feedback:
          "This is unsafe. HMRC-style refund scams often try to collect financial details through fake links.",
      },
      {
        text: "Go directly to GOV.UK or your official HMRC account and report the email if suspicious.",
        feedback:
          "Correct. Do not use the email link or provide bank details through the message.",
      },
      {
        text: "Forward it to friends to ask whether they received it too.",
        feedback:
          "This can spread harmful links. Report the message instead.",
      },
    ],
    answer: 1,
  },
  {
    difficulty: "hard",
    question:
      "A message says 'PayPal', but the actual link points to an unfamiliar domain. What is the main warning sign?",
    options: [
      {
        text: "The visible text says PayPal.",
        feedback:
          "A trusted brand name in the visible text does not prove the link is genuine.",
      },
      {
        text: "The real link destination does not match the organisation being claimed.",
        feedback:
          "Correct. The actual destination matters more than the visible link text.",
      },
      {
        text: "The email contains a link.",
        feedback:
          "Not every link is dangerous. The warning sign is the mismatch between the claim and the real domain.",
      },
    ],
    answer: 1,
  },
  {
    difficulty: "hard",
    question:
      "A phishing email has correct spelling, professional branding, and a company logo. Does that mean it is safe?",
    options: [
      {
        text: "Yes, phishing emails usually look badly written.",
        feedback:
          "This is unsafe thinking. Modern phishing emails can be polished and professional.",
      },
      {
        text: "No, modern phishing emails can look professional and convincing.",
        feedback:
          "Correct. Branding can be copied, so check the sender, link, request, and context.",
      },
      {
        text: "Yes, if the logo looks real.",
        feedback:
          "A logo is not proof. Attackers can copy logos from real organisations.",
      },
    ],
    answer: 1,
  },
  {
    difficulty: "hard",
    question:
      "You clicked a suspicious link and entered your password. What should you do first?",
    options: [
      {
        text: "Change the password immediately and enable MFA if available.",
        feedback:
          "Correct. If credentials were entered, change the password quickly and secure the account.",
      },
      {
        text: "Wait to see if anything happens.",
        feedback:
          "This is unsafe. Attackers may use stolen credentials quickly.",
      },
      {
        text: "Reply to the email asking them to delete your password.",
        feedback:
          "This confirms engagement with the attacker and does not secure the account.",
      },
    ],
    answer: 0,
  },
  {
    difficulty: "hard",
    question:
      "A suspicious email includes a phone number and asks you to call urgently. What is the safest approach?",
    options: [
      {
        text: "Call the number in the email because phone calls are safer than links.",
        feedback:
          "This is risky. Attackers can include fake phone numbers and impersonate support staff.",
      },
      {
        text: "Find the organisation’s official number independently and use that.",
        feedback:
          "Correct. Do not rely on contact details supplied in a suspicious message.",
      },
      {
        text: "Reply first to ask whether the number is genuine.",
        feedback:
          "This is unsafe because you may still be communicating with the attacker.",
      },
    ],
    answer: 1,
  },
{
  difficulty: "expert",
  question:
    "An email appears to come from a supplier you recognise, and it references a real invoice. However, the bank details are different from previous payments. What is the safest action?",
  options: [
    {
      text: "Pause the payment and verify the bank detail change using a known phone number or trusted contact route already held on file.",
      feedback:
        "Correct. Changed payment details should be verified using a trusted route separate from the email, especially when money is involved.",
    },
    {
      text: "Reply within the email thread asking the supplier to confirm the new bank details before paying.",
      feedback:
        "This is risky. If the supplier mailbox or thread has been compromised, replying in the same thread may still reach the attacker.",
    },
    {
      text: "Pay a small test amount first because the supplier name, invoice number, and email thread all look familiar.",
      feedback:
        "This is unsafe. A convincing supplier name, invoice reference, or existing thread does not prove the bank details are genuine.",
    },
  ],
  answer: 0,
},
{
  difficulty: "expert",
  question:
    "A login page opened from an email uses HTTPS and shows a padlock icon. Which conclusion is most accurate?",
  options: [
    {
      text: "The connection is encrypted, but the domain and context still need to be checked before entering credentials.",
      feedback:
        "Correct. HTTPS protects the connection, but it does not prove the website belongs to the organisation being impersonated.",
    },
    {
      text: "The page is likely safe if the padlock is shown and the design matches the organisation’s normal login page.",
      feedback:
        "This is risky. Phishing pages can use HTTPS and copy the appearance of real login pages.",
    },
    {
      text: "The padlock confirms the email came from the real organisation, but the link should still be checked.",
      feedback:
        "This is incorrect. The padlock relates to the webpage connection, not the authenticity of the email sender.",
    },
  ],
  answer: 0,
},
{
  difficulty: "expert",
  question:
    "You receive an unexpected multi-factor authentication approval request shortly after a suspicious email. What should you do?",
  options: [
    {
      text: "Deny the request, change your password, and report it to IT or the organisation through an official route.",
      feedback:
        "Correct. An unexpected MFA prompt may mean someone already has your password and is trying to complete the login.",
    },
    {
      text: "Ignore the request because it will expire automatically and MFA has stopped the attacker for now.",
      feedback:
        "This is not enough. The prompt may suggest your password is already known, so the account should be secured.",
    },
    {
      text: "Approve the request only if you recognise the service name shown in the MFA prompt.",
      feedback:
        "This is unsafe. Recognising the service name does not prove you started the login attempt.",
    },
  ],
  answer: 0,
},
{
  difficulty: "expert",
  question:
    "You receive an email inside an existing conversation thread asking for a payment change. Why should this still be treated carefully?",
  options: [
    {
      text: "A genuine-looking thread can still be risky if an account has been compromised and used to send a new financial request.",
      feedback:
        "Correct. Attackers can use compromised mailboxes or real threads to make payment fraud look more believable.",
    },
    {
      text: "It is safer than a new email because previous messages in the thread prove the latest request is genuine.",
      feedback:
        "This is risky. Previous genuine messages do not prove that the newest message is safe.",
    },
    {
      text: "It only needs extra checking if the new message contains spelling mistakes, attachments, or an unfamiliar greeting.",
      feedback:
        "This is incorrect. Business email compromise can be well written and may not contain obvious errors.",
    },
  ],
  answer: 0,
},
  {
    difficulty: "expert",
    question:
      "A suspicious email appears to come from a real organisation. The sender address looks plausible, but the reply-to address is different. What does this most likely suggest?",
    options: [
      {
        text: "Replies may be routed to a different mailbox, so the message should be verified through an official channel.",
        feedback:
          "Correct. A different reply-to address does not automatically prove phishing, but it can be used to redirect replies to an attacker-controlled mailbox. Verify the request independently before responding.",
      },
      {
        text: "The organisation is using a separate support mailbox, so it is safe to reply if the branding looks genuine.",
        feedback:
          "This is risky. Some organisations do use separate mailboxes, but branding alone does not prove the message is genuine. The reply-to mismatch should still be checked.",
      },
      {
        text: "The sender address is the only address that matters, so the reply-to field can be ignored.",
        feedback:
          "This is incorrect. The reply-to field controls where responses may go, so it can be important when assessing suspicious emails.",
      },
  ],
  answer: 0,
},
];

const QUIZ_DIFFICULTY_ORDER = ["easy", "hard", "expert"];

function getRandomQuestionByDifficulty(difficulty, usedQuestions = []) {
  const availableQuestions = quizQuestionBank.filter(
    (question) =>
      question.difficulty === difficulty &&
      !usedQuestions.some((used) => used.question === question.question)
  );

  if (availableQuestions.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  return availableQuestions[randomIndex];
}

export function getRandomQuestions() {
  const selectedQuestions = [];

  QUIZ_DIFFICULTY_ORDER.forEach((difficulty) => {
    const question = getRandomQuestionByDifficulty(difficulty, selectedQuestions);
    if (question) selectedQuestions.push(question);
  });

  return selectedQuestions;
}
