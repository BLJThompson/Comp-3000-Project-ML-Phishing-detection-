// frontend/src/api/mailApi.js

const API_BASE = "http://localhost:4000/api";

// Base fetch wrapper — throws on non-ok responses with the server's error message.
async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }

  return response.json();
}

// Shorthand for requests with a JSON body.
function jsonRequest(url, method, payload) {
  return request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// ─── Emails ───────────────────────────────────────────────────────────────────

export function fetchEmails({ folder, searchTerm = "" }) {
  const params = new URLSearchParams();
  if (folder) params.set("folder", folder);
  if (searchTerm) params.set("search", searchTerm);
  return request(`${API_BASE}/emails?${params}`);
}

export function fetchFolderCounts() {
  return request(`${API_BASE}/emails/counts`);
}

export function getEmailById(id) {
  return request(`${API_BASE}/emails/${id}`);
}

export function getEmailThread(id) {
  return request(`${API_BASE}/emails/${id}/thread`);
}

export function updateEmail(id, payload) {
  return jsonRequest(`${API_BASE}/emails/${id}`, "PATCH", payload);
}

export function moveEmail(id, folder) {
  return jsonRequest(`${API_BASE}/emails/${id}/move`, "PATCH", { folder });
}

export function deleteEmail(id) {
  return request(`${API_BASE}/emails/${id}/delete`, { method: "PATCH" });
}

export function restoreEmail(id) {
  return request(`${API_BASE}/emails/${id}/restore`, { method: "PATCH" });
}

export function createDraft(payload) {
  return jsonRequest(`${API_BASE}/emails/draft`, "POST", payload);
}

export function updateDraft(id, payload) {
  return jsonRequest(`${API_BASE}/emails/${id}/draft`, "PATCH", payload);
}

export function sendEmail(payload) {
  return jsonRequest(`${API_BASE}/emails/send`, "POST", payload);
}

// ─── Gmail ────────────────────────────────────────────────────────────────────

export function sendGmailEmail(payload) {
  return jsonRequest(`${API_BASE}/gmail/send`, "POST", payload);
}

export function importUnreadGmailEmails(maxResults = 10) {
  return jsonRequest(`${API_BASE}/gmail/import-unread`, "POST", { maxResults });
}

// ─── Dev ──────────────────────────────────────────────────────────────────────

export function clearInbox() {
  return request(`${API_BASE}/dev/clear-inbox`, { method: "DELETE" });
}

export function clearAllEmails() {
  return request(`${API_BASE}/dev/clear-all`, { method: "DELETE" });
}
