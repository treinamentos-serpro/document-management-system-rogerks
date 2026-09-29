const API_PREFIX = '/api';

async function readError(response) {
  let payload;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  const message = payload?.error?.message || `A solicitação falhou (${response.status}).`;
  return new Error(message);
}

export async function listDocuments({ signal } = {}) {
  const response = await fetch(`${API_PREFIX}/documents`, { signal });
  if (!response.ok) {
    throw await readError(response);
  }

  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw await readError(response);
  }

  return response.json();
}

export async function downloadDocument(id) {
  const response = await fetch(`${API_PREFIX}/documents/${encodeURIComponent(id)}/download`);
  if (!response.ok) {
    throw await readError(response);
  }

  return response.blob();
}