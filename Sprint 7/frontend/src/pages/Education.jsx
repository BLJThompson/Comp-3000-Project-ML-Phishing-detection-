import React from "react";
import "./Education.css";

function Education() {
  return (
    <div className="education-page">
      <div className="education-hero">
        <h1>How to Spot Phishing Emails</h1>
        <p>
          Phishing emails attempt to deceive users into revealing sensitive
          information or clicking malicious links. Understanding common warning
          signs can significantly reduce the risk of compromise.
        </p>
      </div>

      <div className="education-grid">
        <div className="education-card education-card--blue">
          <h3>🔗 Suspicious Links</h3>
          <p>Attackers often disguise malicious links to appear legitimate.</p>

          <div className="example-box bad">
            https://secure-login-example.com
          </div>

          <div className="example-box good">
            https://login.microsoft.com
          </div>

          <ul>
            <li>Look for unusual domains</li>
            <li>Check for spelling errors such as micr0soft</li>
            <li>Hover over links before clicking</li>
          </ul>
        </div>

        <div className="education-card education-card--red">
          <h3>Urgency Language</h3>
          <p>Phishing emails often create panic to force quick decisions.</p>

          <div className="example-box bad">
            "Act now or your account will be locked!"
          </div>

          <div className="example-box good">
            "Please review your account activity at your convenience."
          </div>

          <ul>
            <li>"Urgent"</li>
            <li>"Immediate action required"</li>
            <li>"Within 24 hours"</li>
          </ul>
        </div>

        <div className="education-card education-card--purple">
          <h3>Sender Mismatch</h3>
          <p>
            The sender name may look legitimate, but the email domain can reveal
            fraud.
          </p>

          <div className="example-box bad">
            support@micr0soft-alerts.com
          </div>

          <div className="example-box good">
            support@microsoft.com
          </div>

          <ul>
            <li>Check the full email address</li>
            <li>Look for unusual domains</li>
            <li>Verify known organisations independently</li>
          </ul>
        </div>

        <div className="education-card education-card--amber">
          <h3>Reward / Bonus Scams</h3>
          <p>Offers of rewards or prizes are commonly used to lure users.</p>

          <div className="example-box bad">
            "You’ve won a £500 gift card!"
          </div>

          <div className="example-box good">
            Legitimate services rarely offer rewards via unsolicited email
          </div>

          <ul>
            <li>Too good to be true usually means a scam</li>
            <li>Unexpected prizes are suspicious</li>
          </ul>
        </div>

        <div className="education-card education-card--green">
          <h3>Requests for Credentials</h3>
          <p>
            Legitimate organisations will never ask for passwords via email.
          </p>

          <div className="example-box bad">
            "Verify your password to continue"
          </div>

          <div className="example-box good">
            Use official website login pages only
          </div>

          <ul>
            <li>Never enter passwords through email links</li>
            <li>Check login pages manually</li>
          </ul>
        </div>

        <div className="education-card education-card--neutral">
          <h3>What Should You Do?</h3>
          <ul>
            <li>Do not click suspicious links</li>
            <li>Do not download unknown attachments</li>
            <li>Verify the sender independently</li>
            <li>Report phishing emails if possible</li>
          </ul>

          <div className="tip-box">
            Always go directly to official websites instead of clicking links in
            emails.
          </div>
        </div>
      </div>

      <div className="education-card education-card--links">
        <h3>Learn More (Trusted Resources)</h3>
        <p>
          These trusted organisations provide guidance on identifying and
          avoiding phishing attacks:
        </p>

        <ul className="education-links">
          <li>
            <a
              href="https://www.ncsc.gov.uk/guidance/phishing"
              target="_blank"
              rel="noopener noreferrer"
            >
              🇬🇧 UK National Cyber Security Centre (NCSC) – Phishing Guidance
            </a>
          </li>

          <li>
            <a
              href="https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams"
              target="_blank"
              rel="noopener noreferrer"
            >
              🇺🇸 Federal Trade Commission – Avoid Phishing Scams
            </a>
          </li>

          <li>
            <a
              href="https://www.cisa.gov/news-events/news/avoid-phishing-attacks"
              target="_blank"
              rel="noopener noreferrer"
            >
              🇺🇸 CISA – Avoid Phishing Attacks
            </a>
          </li>

          <li>
            <a
              href="https://support.google.com/mail/answer/8253"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google – Identify Suspicious Emails
            </a>
          </li>

          <li>
            <a
              href="https://www.microsoft.com/en-us/security/business/security-101/what-is-phishing"
              target="_blank"
              rel="noopener noreferrer"
            >
              Microsoft Security – What is Phishing?
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default Education;