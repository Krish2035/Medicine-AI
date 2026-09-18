import React from 'react';
import { Activity, MessageSquare, BookOpen, Globe } from 'lucide-react';
import { translations } from '../utils/translations';

export default function Navbar({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  serverStatus,
  activeProvider
}) {
  const t = translations[language] || translations.gu;

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'gu' ? 'en' : 'gu'));
  };

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        <div className="nav-brand" onClick={() => setActiveTab('chat')} role="button" tabIndex={0}>
          <div className="brand-icon">
            <Activity size={24} />
          </div>
          <div>
            <div className="brand-title">
              Medicine AI
              <span className="brand-badge">૧૫૦ દવાઓ</span>
            </div>
            <div className="brand-sub">
              {language === 'gu' ? 'મેડિસિન AI - ગુજરાતી કન્સલ્ટેશન' : 'Gujarati & English Clinical AI'}
            </div>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Main Navigation">
          <button
            id="tab-chat-btn"
            className={`nav-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <MessageSquare size={16} />
            <span>{t.chatTab}</span>
          </button>
          <button
            id="tab-catalog-btn"
            className={`nav-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <BookOpen size={16} />
            <span>{t.catalogTab}</span>
          </button>
        </nav>

        <div className="nav-actions">
          <button
            id="lang-toggle-btn"
            className="lang-btn"
            onClick={toggleLanguage}
            title="Switch Language"
          >
            <Globe size={16} />
            <span>{language === 'gu' ? 'ગુજરાતી' : 'English'}</span>
            <span className="lang-pill">{language === 'gu' ? 'GU' : 'EN'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
