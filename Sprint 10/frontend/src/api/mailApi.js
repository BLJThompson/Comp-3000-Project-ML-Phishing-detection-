const API_BASE = "http://localhost:4000/api";

async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }

  return response.json();
}

export async function fetchEmails({ folder, searchTerm = "" }) {
  const params = new URLSearchParams();
  if (folder) params.set("folder", folder);
  if (searchTerm) params.set("search", searchTerm);

  return request(`${API_BASE}/emails?${params.toString()}`);
}

export async function fetchFolderCounts() {
  return request(`${API_BASE}/emails/counts`);
}

export async function getEmailById(id) {
  return request(`${API_BASE}/emails/${id}`);
}

export async function getEmailThread(id) {
  return request(`${API_BASE}/emails/${id}/thread`);
}

export async function updateEmail(id, payload) {
  return request(`${API_BASE}/emails/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function moveEmail(id, folder) {
  return request(`${API_BASE}/emails/${id}/move`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder }),
  });
}

export async function deleteEmail(id) {
  return request(`${API_BASE}/emails/${id}/delete`, {
    method: "PATCH",
  });
}

export async function restoreEmail(id) {
  return request(`${API_BASE}/emails/${id}/restore`, {
    method: "PATCH",
  });
}

export async function createDraft(payload) {
  return request(`${API_BASE}/emails/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateDraft(id, payload) {
  return request(`${API_BASE}/emails/${id}/draft`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function sendEmail(payload) {
  return request(`${API_BASE}/emails/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function sendGmailEmail(payload) {
  return request(`${API_BASE}/gmail/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function importUnreadGmailEmails(maxResults = 10) {
  return request(`${API_BASE}/gmail/import-unread`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ maxResults }),
  });
}

export async function clearInbox() {
  return request(`${API_BASE}/dev/clear-inbox`, {
    method: "POST",
  });
}

export async function clearAllEmails() {
  return request(`${API_BASE}/dev/clear-all`, {
    method: "POST",
  });
}