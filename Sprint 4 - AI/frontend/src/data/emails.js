// src/data/emails.js

export const emails = [
  {
    id: 1,
    folder: "Inbox",
    sender: "Course Admin <courseadmin@plymouth.ac.uk>",
    subject: "COMP3000 Project Progress Meeting – Reminder",
    date: "Today · 3:42 PM",
    group: "Today",
    isUnread: true,
    isFlagged: false,
    body: `Hi Benjamin,

Just a quick reminder that your COMP3000 project progress meeting is scheduled for tomorrow at 10:00 in Babbage Building, Room 3.14.

Please be prepared to briefly cover:
- Your current implementation status
- Any design changes since the last meeting
- Risks or blockers you are currently facing

If you need to reschedule, reply to this email as soon as possible.

Kind regards,
Course Admin
School of Computing and Communications`,
  },
  {
    id: 2,
    folder: "Inbox",
    sender: "Nathan Clarke <nathan.clarke@plymouth.ac.uk>",
    subject: "CSCAN Seminar – Updated Schedule",
    date: "Today · 11:18 AM",
    group: "Today",
    isUnread: false,
    isFlagged: true,
    body: `Dear all,

The CSCAN seminar this week has been moved to Thursday at 14:00 in Jill Craigie Lecture Theatre.
The talk will focus on applied digital forensics and incident response in modern organisations.

The revised schedule and abstracts are available on the CSCAN website. Attendance is highly recommended
for final-year students, particularly those working on security-related projects.

Best regards,
Nathan`,
  },
  {
    id: 3,
    folder: "Inbox",
    sender: "GitHub <noreply@github.com>",
    subject: "New sign-in to your GitHub account",
    date: "Today · 9:02 AM",
    group: "Today",
    isUnread: true,
    isFlagged: false,
    body: `Hi Benjamin,

We noticed a new sign-in to your GitHub account:

- Location: Plymouth, United Kingdom (approximate)
- Device: Chrome on Windows
- Time: Today at 09:00 (GMT)

If this was you, no further action is required.
If you do not recognise this activity, we strongly recommend that you:

1. Change your password immediately.
2. Review your active sessions and revoke any you do not recognise.
3. Enable two-factor authentication if it is not already enabled.

Thanks,
The GitHub Security Team`,
  },
  {
    id: 4,
    folder: "Inbox",
    sender: "LinkedIn Learning <no-reply@linkedin.com>",
    subject: "New recommendations based on your interest in cybersecurity",
    date: "Yesterday · 6:51 PM",
    group: "This week",
    isUnread: false,
    isFlagged: false,
    body: `Hi Benjamin,

Based on your recent activity, we’ve selected a few courses you might find useful:

- Introduction to Threat Modeling
- Building Secure Web Applications
- Python for Security Professionals

You can start any of these courses for free as part of your institutional access through the University of Plymouth.

Happy learning,
The LinkedIn Learning Team`,
  },
  {
    id: 5,
    folder: "Inbox",
    sender: "Student Services <studentsupport@plymouth.ac.uk>",
    subject: "Wellbeing support during assessment period",
    date: "Mon · 4:23 PM",
    group: "This week",
    isUnread: false,
    isFlagged: true,
    body: `Dear Benjamin,

As we approach the assessment period, we want to remind you of the support available to you:

- One-to-one wellbeing appointments
- Study skills and time management sessions
- 24/7 online resources via the student portal

If you are feeling overwhelmed, please do not hesitate to reach out. You can book a confidential appointment
using the Student Services booking system.

Best wishes,
Student Services`,
  },
  {
    id: 6,
    folder: "Sent",
    sender: "You",
    subject: "Sprint 2 – Frontend UI progress update",
    date: "Sun · 8:09 PM",
    group: "This week",
    isUnread: false,
    isFlagged: false,
    body: `Hi [Supervisor Name],

Here is a quick update on Sprint 2 (Frontend UI):

- Implemented a React-based email client layout (sidebar, inbox list, reading pane)
- Added dummy data to simulate inbox, sent, and flagged emails
- Implemented search functionality on subject, sender, and preview text
- Added icons for mark as read, flag, pin, and delete (UI only for now)

Next steps:
- Connect the UI to a local-only backend in the next sprint
- Add basic interaction logic for the icons (e.g. mark as read, pin behaviour)

Kind regards,
Benjamin`,
  },
  {
    id: 7,
    folder: "Sent",
    sender: "You",
    subject: "Request for feedback on COMP3000 UI prototype",
    date: "Fri · 10:31 AM",
    group: "Last week",
    isUnread: false,
    isFlagged: true,
    body: `Dear [Supervisor Name],

I’ve completed the first version of the email client UI for my COMP3000 project.
When you have a moment, I would appreciate any feedback on:

- The overall layout (sidebar, inbox, reading pane)
- Usability and clarity of the risk indicators I plan to add
- Any improvements you would recommend before I start integrating the backend

I have attached a few screenshots and will bring a live demo to the next meeting.

Best regards,
Benjamin`,
  },
  {
    id: 8,
    folder: "Inbox",
    sender: "Plymouth City Council <elections@plymouth.gov.uk>",
    subject: "Reminder: Voter registration details",
    date: "Thu · 2:14 PM",
    group: "Last week",
    isUnread: false,
    isFlagged: false,
    body: `Dear Benjamin,

Our records indicate that you are registered to vote at your current address.
This is a reminder to check that your details are still correct ahead of the upcoming election.

You can review and update your registration details on the official GOV.UK website.
If you have recently moved, please ensure you submit any changes as soon as possible.

Kind regards,
Electoral Services
Plymouth City Council`,
  },
  {
    id: 9,
    folder: "Inbox",
    sender: "Steam Support <noreply@steampowered.com>",
    subject: "Purchase receipt – Game transaction",
    date: "Last week",
    group: "Last week",
    isUnread: false,
    isFlagged: false,
    body: `Hello Benjamin,

Thank you for your purchase on Steam. Here are your order details:

- Item: Cyber Threat Simulator
- Price: £19.99
- Payment method: Visa ending in •••• 1234
- Date: Last week

You can view your full purchase history from your Steam account settings.

Thank you for shopping on Steam.`,
  },
  {
    id: 10,
    folder: "Inbox",
    sender: "Microsoft Account Team <account-security-noreply@account.microsoft.com>",
    subject: "Security alert: Unusual sign-in activity",
    date: "Older",
    group: "Older",
    isUnread: true,
    isFlagged: true,
    body: `We detected something unusual about a recent sign-in to your Microsoft account.

Sign-in details:
- Account: benjamin******@outlook.com
- Location: New device, United Kingdom (approximate)
- Time: 2 weeks ago

If this was you, you can safely ignore this message.
If this was not you, we recommend that you:

1. Change your password immediately.
2. Review your recent account activity.
3. Make sure two-step verification is turned on.

Thank you,
Microsoft Account Team`,
  },
];
