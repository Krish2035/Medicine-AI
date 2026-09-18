import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Pill,
  ArrowRight,
  Activity,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';
import { translations } from '../utils/translations';
import { sendChatMessage } from '../utils/api';

export default function ChatInterface({
  language = 'gu',
  activeProvider,
  selectedModel,
  onSelectMedicine
}) {
  const t = translations[language] || translations.gu;

  const quickSymptoms = [
    { icon: '🤕', label: language === 'gu' ? 'માથાનો સખત દુખાવો' : 'Severe Headache', query: language === 'gu' ? 'મને સવારથી માથાનો સખત દુખાવો છે, શું દવા લેવી?' : 'I have had a severe headache since morning, what medicine should I take?' },
    { icon: '🌡️', label: language === 'gu' ? 'તાવ અને શરીર દુખવું' : 'Fever & Body Ache', query: language === 'gu' ? 'મને તાવ આવે છે અને આખું શરીર કળતર થાય છે' : 'I have a fever and whole body ache' },
    { icon: '🤢', label: language === 'gu' ? 'ગેસ અને એસિડિટી' : 'Gas & Acidity', query: language === 'gu' ? 'પેટમાં બહુ એસિડિટી, બળતરા અને ગેસ થાય છે' : 'I have terrible acidity, heartburn, and gas in my stomach' },
    { icon: '🤮', label: language === 'gu' ? 'ઉલટી અને ઉબકા' : 'Nausea & Vomiting', query: language === 'gu' ? 'મને વારંવાર ઉલટી અને ઉબકા આવે છે' : 'I have frequent vomiting and nausea' },
    { icon: '💧', label: language === 'gu' ? 'ઝાડા અને પેટમાં મરોડ' : 'Loose Motion / Diarrhea', query: language === 'gu' ? 'પેટમાં ચૂંક આવે છે અને ઝાડા (લૂઝ મોશન) થઈ ગયા છે' : 'I have severe loose motions and stomach cramps' },
    { icon: '🤧', label: language === 'gu' ? 'શરદી અને છીંકો' : 'Cold & Sneezing', query: language === 'gu' ? 'નાકમાંથી પાણી વહે છે અને વારંવાર છીંકો આવે છે' : 'I have a runny nose and frequent sneezing allergy' },
    { icon: '🫁', label: language === 'gu' ? 'શ્વાસ ચડવો / અસ્થમા' : 'Breathing / Asthma', query: language === 'gu' ? 'મને શ્વાસ લેવામાં તકલીફ થાય છે અને શ્વાસ ફૂલે છે' : 'I have difficulty breathing and shortness of breath' },
    { icon: '🧴', label: language === 'gu' ? 'ધાધર અને ખંજવાળ' : 'Fungal Ringworm / Itch', query: language === 'gu' ? 'ચામડી પર ધાધર થઈ છે અને બહુ ખંજવાળ આવે છે' : 'I have fungal ringworm rash and intense itching' },
    { icon: '🩹', label: language === 'gu' ? 'દાઝી જવું / છોલાવું' : 'Burns & Cuts', query: language === 'gu' ? 'હાથ ગરમ તેલથી દાઝી ગયો છે અને બળતરા થાય છે' : 'Burned hand with hot oil and experiencing burning pain' },
    { icon: '🩺', label: language === 'gu' ? 'હાઈ બીપી / ધબકારા' : 'High BP / Palpitations', query: language === 'gu' ? 'હાઈ બીપી છે અને છાતીમાં ધબકારા વધી ગયા છે' : 'I have high blood pressure and rapid heart palpitations' }
  ];

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: language === 'gu'
        ? `નમસ્તે! હું તમારો **મેડિસિન AI (Medicine AI)** સહાયક છું. \n\nતમારી શારીરિક તકલીફ (જેમ કે **માથાનો દુખાવો**, **તાવ**, **એસિડિટી**, **ઉધરસ**, **ઝાડા**, **ખંજવાળ** કે અન્ય કોઈ પણ સમસ્યા) ગુજરાતી અથવા અંગ્રેજીમાં જણાવો. તમે **માઇક બટન** દબાવીને ગુજરાતીમાં બોલી પણ શકો છો! હું અમારા ૧૫૦ પ્રમાણિત દવાઓના ડેટાબેઝમાંથી તમને યોગ્ય દવા અને સલાહ આપીશ.`
        : `Hello! I am your **Medicine AI** clinical assistant.\n\nPlease describe your physical symptoms in Gujarati or English. You can also click the **Mic button** to speak your query in Gujarati! I will suggest verified medications and guidance from our 150-medicine emergency dataset.`,
      matchedMedicines: [],
      provider: activeProvider
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Voice feature states
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speakingId, setSpeakingId] = useState(null);
  const [autoSpeak, setAutoSpeak] = useState(() => {
    return localStorage.getItem('medicine_ai_auto_speak') === 'true';
  });
  const [speechError, setSpeechError] = useState('');

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, liveTranscript]);

  // Clean text for Text-To-Speech (strips markdown symbols)
  const cleanMarkdownForSpeech = (text) => {
    if (!text) return '';
    return text
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/_{1,2}/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[-•]\s/g, ' ')
      .replace(/⚠️|ℹ️|🚨|✅|👉|💊|🩺/g, '')
      .replace(/\n+/g, '. ')
      .trim();
  };

  // Text-To-Speech function
  const speakMessage = (text, msgId) => {
    if (!('speechSynthesis' in window)) {
      alert('તમારા બ્રાઉઝરમાં Text-to-Speech સપોર્ટ નથી.');
      return;
    }

    // If already speaking this message, stop it
    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = cleanMarkdownForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Target Gujarati, Hindi, or Indian English voices
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;

    if (language === 'gu') {
      selectedVoice = voices.find(v => v.lang.startsWith('gu')) ||
                      voices.find(v => v.lang === 'hi-IN') ||
                      voices.find(v => v.lang.includes('IN'));
      utterance.lang = selectedVoice?.lang || 'gu-IN';
    } else {
      selectedVoice = voices.find(v => v.lang.startsWith('en-IN')) ||
                      voices.find(v => v.lang.startsWith('en'));
      utterance.lang = selectedVoice?.lang || 'en-US';
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setSpeakingId(msgId);
    };

    utterance.onend = () => {
      setSpeakingId(null);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      setSpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Toggle Speech Recognition (Mic)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(t.micNotSupported);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Set language to Gujarati (gu-IN) or English
      recognition.lang = language === 'gu' ? 'gu-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      setSpeechError('');
      setIsListening(true);
      setLiveTranscript('');

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        const currentText = finalText || interimText;
        setLiveTranscript(currentText);

        if (finalText) {
          setInputMessage(finalText);
          setIsListening(false);
          // Automatically send the recognized query for a seamless conversation experience!
          setTimeout(() => {
            handleSend(finalText);
            setLiveTranscript('');
          }, 400);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError(t.micPermissionError);
        } else if (event.error !== 'no-speech') {
          setSpeechError(`માઇક એરર: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setSpeechError(t.micNotSupported);
    }
  };

  const handleToggleAutoSpeak = () => {
    const newVal = !autoSpeak;
    setAutoSpeak(newVal);
    localStorage.setItem('medicine_ai_auto_speak', String(newVal));
    if (!newVal && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    // Stop any ongoing speech playback
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    const userMsgId = Date.now();
    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'user', text: query }
    ]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await sendChatMessage({
        message: query,
        language,
        provider: activeProvider,
        model: selectedModel
      });

      const botMsgId = Date.now() + 1;
      setMessages(prev => [
        ...prev,
        {
          id: botMsgId,
          sender: 'bot',
          text: response.reply,
          matchedMedicines: response.matchedMedicines || [],
          provider: response.provider || activeProvider,
          model: response.model
        }
      ]);

      // If auto-speak is enabled, speak the answer automatically
      if (autoSpeak && response.reply) {
        setTimeout(() => {
          speakMessage(response.reply, botMsgId);
        }, 500);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: language === 'gu'
            ? `⚠️ માફ કરશો, જવાબ તૈયાર કરવામાં તકલીફ થઈ: ${err.message}. કૃપા કરીને ફરી પ્રયાસ કરો અથવા Local RAG મોડ પસંદ કરો.`
            : `⚠️ Sorry, error generating response: ${err.message}. Please try again or switch to Local RAG mode.`,
          matchedMedicines: [],
          isError: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="doc-avatar">
              <Bot size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {language === 'gu' ? 'મેડિસિન AI કન્સલ્ટેશન' : 'Medicine AI Consultation'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {language === 'gu' ? '૧૫૦ દવાઓ • વૉઇસ કન્વર્સેશન સક્ષમ' : '150 Medications • Voice Enabled'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Auto-Speak Toggle */}
            <button
              id="auto-speak-toggle-btn"
              type="button"
              className={`auto-speak-toggle ${autoSpeak ? 'active' : ''}`}
              onClick={handleToggleAutoSpeak}
              title={t.autoVoiceMode}
            >
              {autoSpeak ? <Volume2 size={13} /> : <VolumeX size={13} />}
              <span>{t.autoVoiceMode}</span>
            </button>

            <div className="provider-chip">
              <Activity size={13} />
              <span>
                {activeProvider === 'groq' ? 'Groq LLaMA-3.3' : (activeProvider === 'huggingface' ? 'Hugging Face' : 'Local RAG')}
              </span>
            </div>
          </div>
        </div>

        {/* Message feed */}
        <div className="chat-messages" id="chat-messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-item ${msg.sender}`}>
              <div className="msg-avatar">
                {msg.sender === 'bot' ? <Bot size={18} /> : <User size={18} />}
              </div>

              <div className="msg-content">
                <div className="msg-markdown">{msg.text}</div>

                {/* Matched medicine cards */}
                {msg.matchedMedicines && msg.matchedMedicines.length > 0 && (
                  <div className="matched-meds-box">
                    <div className="matched-title">
                      <Pill size={14} />
                      <span>{t.matchedMedicinesTitle}</span>
                    </div>

                    <div className="matched-grid">
                      {msg.matchedMedicines.map((med) => (
                        <div
                          key={med.id}
                          className="matched-card"
                          onClick={() => onSelectMedicine(med)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="card-top">
                            <span className="med-id-badge">#{med.id}</span>
                            <span className="med-card-form">{med.form}</span>
                          </div>
                          <div>
                            <div className="med-card-name">{med.name}</div>
                            <div className="med-card-raw">{med.indication_raw}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: med.prescription_required ? '#fca5a5' : '#86efac' }}>
                              {med.prescription_required ? '⚠️ Rx પ્રિસ્ક્રિપ્શન' : '✅ OTC'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              {t.viewDetails} <ArrowRight size={11} />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Speaker Button for Bot Messages */}
                {msg.sender === 'bot' && !msg.isError && (
                  <div className="msg-actions-row">
                    <button
                      type="button"
                      className={`speak-msg-btn ${speakingId === msg.id ? 'speaking' : ''}`}
                      onClick={() => speakMessage(msg.text, msg.id)}
                      title={speakingId === msg.id ? t.stopSpeaking : t.speakAnswer}
                    >
                      {speakingId === msg.id ? (
                        <>
                          <VolumeX size={13} />
                          <span>{t.stopSpeaking}</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={13} />
                          <span>{t.speakAnswer}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-item bot">
              <div className="msg-avatar">
                <Bot size={18} />
              </div>
              <div className="msg-content" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
                <Sparkles size={16} className="animate-spin" />
                <span>
                  {language === 'gu'
                    ? 'તમારા પ્રશ્નનું વિશ્લેષણ અને યોગ્ય દવાઓની ચકાસણી થઈ રહી છે...'
                    : 'Analyzing symptoms and cross-referencing medications...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar with Voice Controls */}
        <div className="chat-input-container">
          {/* Live speech recognition banner */}
          {isListening && (
            <div className="voice-live-banner" id="voice-live-banner">
              <div className="voice-live-left">
                <div className="voice-waves">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div>
                  <strong>{t.listening}...</strong>{' '}
                  <span style={{ opacity: 0.9 }}>
                    {liveTranscript ? `"${liveTranscript}"` : (language === 'gu' ? 'તમારો પ્રશ્ન બોલો' : 'Speak your question')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="voice-stop-btn"
                onClick={toggleListening}
              >
                પૂર્ણ કરો (Stop)
              </button>
            </div>
          )}

          {speechError && (
            <div style={{ color: '#fca5a5', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
              ⚠️ {speechError}
            </div>
          )}

          <form
            className="chat-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            {/* Mic button */}
            <button
              id="voice-mic-btn"
              type="button"
              className={`chat-mic-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              disabled={loading}
              title={isListening ? 'રેકોર્ડિંગ રોકો (Stop)' : t.micButton}
            >
              {isListening ? <MicOff size={19} /> : <Mic size={19} />}
            </button>

            <input
              id="chat-symptom-input"
              type="text"
              className="chat-input"
              placeholder={isListening ? t.listening : t.askDoctorPlaceholder}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
            />

            <button
              id="chat-send-btn"
              type="submit"
              className="chat-send-btn"
              disabled={loading || !inputMessage.trim()}
            >
              <Send size={16} />
              <span>{t.sendButton}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Quick symptom prompts */}
      <section className="quick-prompts" aria-label="Quick symptom selection">
        <h3 className="quick-prompts-title">
          <Sparkles size={15} style={{ color: '#34d399' }} />
          <span>{t.quickPromptTitle}</span>
        </h3>
        <div className="chips-grid">
          {quickSymptoms.map((qs, i) => (
            <button
              key={i}
              className="symptom-chip"
              onClick={() => handleSend(qs.query)}
              disabled={loading}
            >
              <span>{qs.icon}</span>
              <span>{qs.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
