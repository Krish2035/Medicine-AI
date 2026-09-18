/**
 * API Key Manager with Multi-Key Rotation and Automatic Failover
 * Supports comma-separated, newline-separated, or array of keys in .env
 */

function parseKeys(envValue) {
  if (!envValue || typeof envValue !== 'string') return [];
  return envValue
    .split(/[,\r\n]+/)
    .map(k => k.trim().replace(/^["']|["']$/g, '').trim())
    .filter(k => k.length > 5);
}

let groqIndex = 0;
let hfIndex = 0;

export function getGroqKeys() {
  return parseKeys(process.env.GROQ_API_KEY);
}

export function getHfKeys() {
  return parseKeys(process.env.HUGGINGFACE_API_KEY);
}

export function getNextGroqKey() {
  const keys = getGroqKeys();
  if (keys.length === 0) return null;
  const key = keys[groqIndex % keys.length];
  groqIndex = (groqIndex + 1) % keys.length;
  return key;
}

export function getNextHfKey() {
  const keys = getHfKeys();
  if (keys.length === 0) return null;
  const key = keys[hfIndex % keys.length];
  hfIndex = (hfIndex + 1) % keys.length;
  return key;
}

export function getKeyStats() {
  const groq = getGroqKeys();
  const hf = getHfKeys();
  return {
    groq: {
      count: groq.length,
      hasKeys: groq.length > 0,
      preview: groq.map(k => `${k.slice(0, 7)}...${k.slice(-4)}`)
    },
    huggingface: {
      count: hf.length,
      hasKeys: hf.length > 0,
      preview: hf.map(k => `${k.slice(0, 7)}...${k.slice(-4)}`)
    }
  };
}
