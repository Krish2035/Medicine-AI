import React, { useState } from 'react';
import { X, Key, Cpu, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { translations } from '../utils/translations';

export default function ApiSettingsModal({
  isOpen,
  onClose,
  language = 'gu',
  groqKey,
  setGroqKey,
  hfKey,
  setHfKey,
  activeProvider,
  setActiveProvider,
  selectedModel,
  setSelectedModel
}) {
  if (!isOpen) return null;
  const t = translations[language] || translations.gu;

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('medicine_ai_groq_key', groqKey || '');
    localStorage.setItem('medicine_ai_hf_key', hfKey || '');
    localStorage.setItem('medicine_ai_provider', activeProvider || 'local-rag');
    localStorage.setItem('medicine_ai_model', selectedModel || 'llama-3.3-70b-versatile');
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="alert-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
              <Cpu size={20} />
            </div>
            <div>
              <h2 className="card-title" style={{ fontSize: '1.25rem' }}>{t.settingsTitle}</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Groq AI, Hugging Face અથવા Local RAG સેટ કરો
              </div>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-body settings-form">
          {/* Provider Selection */}
          <div className="input-group">
            <label htmlFor="ai-provider-select">{t.activeProviderLabel}</label>
            <select
              id="ai-provider-select"
              className="settings-select"
              value={activeProvider}
              onChange={e => setActiveProvider(e.target.value)}
            >
              <option value="local-rag">
                ⚡ Local Medical RAG Engine (ઓફલાઇન / ૧૫૦ દવાઓ ડાયરેક્ટ - No API Key Needed)
              </option>
              <option value="groq">
                🚀 Groq AI (Ultra-fast LLaMA 3.3 70B / 3.1 8B)
              </option>
              <option value="huggingface">
                🤗 Hugging Face Inference API
              </option>
            </select>
            <span className="hint-text">
              Local RAG તમારા ૧૫૦ દવાઓના ડેટાબેઝ સાથે તરત જ કામ કરે છે. Groq AI વધુ વિગતવાર ગુજરાતી વાર્તાલાપ આપે છે.
            </span>
          </div>

          {/* Groq Key */}
          <div className="input-group">
            <label htmlFor="groq-key-input" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Key size={15} style={{ color: '#34d399' }} />
              <span>{t.groqKeyLabel}</span>
            </label>
            <input
              id="groq-key-input"
              type="password"
              className="settings-input"
              placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxx"
              value={groqKey}
              onChange={e => setGroqKey(e.target.value)}
            />
            <span className="hint-text">
              તમે <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">console.groq.com/keys</a> પરથી મફત Groq કી બનાવી શકો છો.
            </span>
          </div>

          {/* Model Selector for Groq */}
          {activeProvider === 'groq' && (
            <div className="input-group">
              <label htmlFor="groq-model-select">Groq Model</label>
              <select
                id="groq-model-select"
                className="settings-select"
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
              >
                <option value="llama-3.3-70b-versatile">llama-3.3-70b-versatile (સૌથી હોશિયાર)</option>
                <option value="llama-3.1-8b-instant">llama-3.1-8b-instant (અતિ ઝડપી)</option>
                <option value="mixtral-8x7b-32768">mixtral-8x7b-32768</option>
              </select>
            </div>
          )}

          {/* Hugging Face Key */}
          <div className="input-group">
            <label htmlFor="hf-key-input" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Key size={15} style={{ color: '#06b6d4' }} />
              <span>{t.hfKeyLabel}</span>
            </label>
            <input
              id="hf-key-input"
              type="password"
              className="settings-input"
              placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxx"
              value={hfKey}
              onChange={e => setHfKey(e.target.value)}
            />
            <span className="hint-text">
              Hugging Face એકાઉન્ટના Settings &gt; Access Tokens માંથી મેળવો.
            </span>
          </div>

          {savedNotice && (
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.65rem 1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
              <Check size={18} />
              <span>સેટિંગ્સ સફળતાપૂર્વક સાચવવામાં આવી છે!</span>
            </div>
          )}

          <div className="modal-footer" style={{ padding: '0.75rem 0 0', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ marginRight: '0.65rem' }}>
              {t.close}
            </button>
            <button type="submit" className="btn-primary" id="save-settings-submit-btn">
              {t.saveSettings}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
