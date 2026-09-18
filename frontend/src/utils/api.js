const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Fetch server status and key configuration
 */
export async function fetchServerStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/status`);
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch (err) {
    console.warn('Backend offline or unreachable, using client offline mode', err);
    return {
      status: 'offline',
      totalMedicines: 150,
      keysConfigured: { groq: false, huggingface: false },
      defaultProvider: 'local-rag'
    };
  }
}

/**
 * Fetch all medicines with optional search and category
 */
export async function fetchMedicines(search = '', category = 'all') {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category && category !== 'all') params.append('category', category);

  const res = await fetch(`${API_BASE_URL}/medicines?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch medicines');
  return await res.json();
}

/**
 * Fetch single medicine
 */
export async function fetchMedicineById(id) {
  const res = await fetch(`${API_BASE_URL}/medicines/${id}`);
  if (!res.ok) throw new Error('Medicine not found');
  return await res.json();
}

/**
 * Send chat message to AI
 */
export async function sendChatMessage({ message, language = 'gu', provider = 'local-rag', apiKey = '', model = '' }) {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      language,
      provider,
      apiKey,
      model
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || err.details || 'Chat request failed');
  }

  return await res.json();
}
