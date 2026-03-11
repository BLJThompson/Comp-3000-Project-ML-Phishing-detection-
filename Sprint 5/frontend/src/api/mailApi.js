// src/api/mailApi.js
const API_BASE_URL = "http://localhost:4000/api";

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Request failed");
  }
  return res.json();
}

export async function fetchEmails({ folder = "Inbox", searchTerm = "", flaggedOnly = false } = {}) {
  const params = new URLSearchParams();

  if (flaggedOnly) {
    params.set("flaggedOnly", "true");
  } else if (folder) {
    params.set("folder", folder);
  }

  if (searchTerm && searchTerm.trim()) {
    params.set("search", searchTerm.trim());
  }

  const url = `${API_BASE_URL}/emails?${params.toString()}`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function updateEmail(id, changes) {
  const res = await fetch(`${API_BASE_URL}/emails/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(changes),
  });
  return handleResponse(res);
}

// Optional: can be used later for compose
export async function sendEmail({ sender, subject, body }) {
  const res = await fetch(`${API_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sender, subject, body }),
  });
  return handleResponse(res);
}

export async function getEmailCounts() {
  const [inbox, sent, flagged] = await Promise.all([
    fetchEmails({ folder: "Inbox" }),
    fetchEmails({ folder: "Sent" }),
    fetchEmails({ flaggedOnly: true }),
  ]);

  return {
    Inbox: inbox.length,
    Sent: sent.length,
    Flagged: flagged.length,
  };
}
