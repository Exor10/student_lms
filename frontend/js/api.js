async function apiRequest(action, payload = {}, method = 'POST') {
  const requestPayload = { action, ...payload };

  if (method === 'GET') {
    const params = new URLSearchParams(requestPayload).toString();
    const response = await fetch(`${CONFIG.API_URL}?${params}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'API request failed');
    return data;
  }

  const response = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestPayload)
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message || 'API request failed');
  return data;
}

function setMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.style.color = isError ? '#c0392b' : '#1f7a36';
}
