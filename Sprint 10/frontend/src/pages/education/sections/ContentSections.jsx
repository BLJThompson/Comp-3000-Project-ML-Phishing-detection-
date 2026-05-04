// frontend/src/pages/education/sections/ContentSections.jsx
// Contains: Types (1), Scenarios (6), Protection (7), Myths (13), Quiz (14), Limitations (15), Resources (16)

import React from "react";
import Section from "../components/Section.jsx";
import QuizLauncher from "../components/QuizLauncher.jsx";
import { scenarios } from "../data/scenarios.js";
import { myths } from "../data/myths.js";

const PHISHING_TYPES = [
  {
    type: "Email phishing",
    description:
      "The most common form. Malicious links or attachments arrive in an email impersonating a trusted organisation.",
    example: "A fake bank security alert asking you to verify your login.",
  },
  {
    type: "Smishing",
    description:
      "Phishing over SMS or messaging apps. Often impersonates delivery services, banks, or HMRC.",
    example: "A text claiming your parcel is held and asking for a customs fee.",
  },
  {
    type: "Vishing",
    description:
      "Voice call phishing. A caller impersonates IT support, your bank, or HMRC. AI voice cloning makes this harder to detect.",
    example: "A caller claiming your account has been compromised and asking you to confirm your password.",
  },
  {
    type: "Quishing",
    description:
      "Phishing via QR codes. A malicious QR code in an email or on a physical item leads to a fake login or payment page.",
    example: "A QR code on a parking meter or in an email that leads to a credential-harvesting site.",
  },
  {
    type: "Spear phishing",
    description:
      "A targeted attack using personal information about the victim — often gathered from social media, LinkedIn, or company websites.",
    example: "An email referencing your job role, your manager's name, and a recent project to make a fraudulent request seem credible.",
  },
  {
    type: "AI-generated phishing",
    description:
      "Uses AI to produce flawless, personalised messages at scale. Over 80% of phishing emails analysed in 2025 contained AI-generated content. Spelling errors are no longer a reliable warning sign.",
    example: "A perfectly written email that references your name, employer, and recent activity scraped from public sources.",
  },
];

const RESOURCES = [
  {
    href: "https://www.ncsc.gov.uk/collection/phishing-scams",
    label: "NCSC — phishing guidance",
  },
  {
    href: "https://www.gov.uk/report-suspicious-emails-websites-phishing",
    label: "GOV.UK — report phishing",
  },
  {
    href: "https://www.actionfraud.police.uk",
    label: "Action Fraud — report fraud and cybercrime",
  },
  {
    href: "https://consumer.ftc.gov/articles/how-recognize-avoid-phishing-scams",
    label: "FTC — phishing advice",
  },
  {
    href: "https://www.cisa.gov/secure-our-world/recognize-and-report-phishing",
    label: "CISA — recognise and report phishing",
  },
];

export function PhishingTypesSection() {
  return (
    <Section
      id="types"
      number="1"
      title="Types of phishing attack"
      intro="Phishing goes far beyond email. Understanding the different forms helps you recognise them across channels."
    >
      <div className="scenario-grid">
        {PHISHING_TYPES.map((item) => (
          <div key={item.type} className="scenario-card">
            <h3>{item.type}</h3>
            <p>{item.description}</p>
            <p className="scenario-example"><em>Example: {item.example}</em></p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function ScenarioSections() {
  return (
    <Section
      id="scenarios"
      number="6"
      title="Common phishing scenarios"
      intro="Phishing often appears in familiar forms. Each example includes the red flag and what to do."
    >
      <div className="scenario-grid">
        {scenarios.map((scenario) => (
          <div key={scenario.title} className="scenario-card">
            <h3>{scenario.title}</h3>
            <p>{scenario.text}</p>
            {scenario.redFlag && (
              <p className="scenario-red-flag">
                <strong>Red flag:</strong> {scenario.redFlag}
              </p>
            )}
            {scenario.action && (
              <p className="scenario-action">
                <strong>What to do:</strong> {scenario.action}
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

export function ProtectionSection() {
  return (
    <Section
      id="protection"
      number="7"
      title="Protecting yourself"
      intro="Good habits reduce the damage even when phishing is not immediately obvious."
    >
      <div className="education-grid education-grid--two">
        <div className="education-card">
          <h3>Enable multi-factor authentication (MFA)</h3>
          <p>
            MFA requires a second form of verification beyond your password — a code from an
            app, a text, or a hardware key. Even if your password is stolen, MFA stops an
            attacker from accessing your account without that second factor. Enable it on
            email, banking, and social media accounts as a priority.
          </p>
        </div>

        <div className="education-card">
          <h3>Use unique passwords</h3>
          <p>
            Reusing passwords means one breach exposes many accounts. Use a password manager
            to generate and store unique passwords for each service so you do not need to
            remember them.
          </p>
        </div>

        <div className="education-card">
          <h3>Review your social media privacy</h3>
          <p>
            Attackers use publicly available information — job titles, colleagues, recent
            events, interests — to personalise spear phishing messages. Regularly review
            what is visible on your profiles and limit public access where possible.
          </p>
        </div>

        <div className="education-card">
          <h3>Keep software updated</h3>
          <p>
            Updates patch security vulnerabilities that attackers exploit. Enable automatic
            updates on your operating system, browser, and apps so you are not left exposed
            by a known weakness.
          </p>
        </div>

        <div className="education-card">
          <h3>Build a verification habit</h3>
          <p>
            For any unusual request — a payment change, a password reset, an urgent task from
            a manager — verify it through a separate, trusted channel. Call the person
            directly using a number you already hold, not one provided in the message.
          </p>
        </div>

        <div className="education-card">
          <h3>Be cautious with QR codes</h3>
          <p>
            QR codes in emails, messages, or on physical items can lead to phishing pages.
            Before scanning, consider the source. After scanning, check the URL that opens
            before entering any information.
          </p>
        </div>
      </div>
    </Section>
  );
}

export function MythSections() {
  return (
    <Section
      id="myths"
      number="13"
      title="Myths about phishing"
      intro="These misconceptions can make users overconfident and easier to deceive."
    >
      <div className="myth-grid">
        {myths.map((item) => (
          <div key={item.myth} className="myth-card">
            <h3>Myth: {item.myth}</h3>
            <p>Reality: {item.reality}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

export function QuizSection() {
  return (
    <Section
      id="quiz"
      number="14"
      title="Mini quiz"
      intro="A short interactive quiz to practise applying the guidance."
    >
      <QuizLauncher />
    </Section>
  );
}

export function LimitationsSection() {
  return (
    <Section
      id="limitations"
      number="15"
      title="System limitations"
      intro="The system supports judgement, but it does not replace it."
    >
      <div className="education-card">
        <p>
          This prototype can help identify suspicious emails, but it cannot
          guarantee perfect detection. Some phishing emails — particularly AI-generated
          or highly targeted spear phishing — may avoid obvious warning signs, and some
          benign emails may still appear unusual.
        </p>
        <p>
          The machine learning model provides classification, while highlighted
          indicators support explanation. Users should still check suspicious
          messages carefully, apply the checks covered in this guide, and follow
          safe reporting practices.
        </p>
      </div>
    </Section>
  );
}

export function ResourcesSection() {
  return (
    <Section
      id="resources"
      number="16"
      title="Trusted resources"
      intro="Useful official guidance for further reading and reporting."
    >
      <div className="resource-grid">
        {RESOURCES.map(({ href, label }) => (
          <a key={href} href={href} target="_blank" rel="noreferrer">
            {label}
          </a>
        ))}
      </div>
    </Section>
  );
}
