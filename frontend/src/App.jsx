import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DisclaimerAlert from './components/DisclaimerAlert';
import ChatInterface from './components/ChatInterface';
import MedicineCatalog from './components/MedicineCatalog';
import MedicineDetailModal from './components/MedicineDetailModal';
import { fetchServerStatus } from './utils/api';
import { translations } from './utils/translations';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'catalog'
  const [language, setLanguage] = useState('gu'); // 'gu' or 'en'
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // AI Provider state automatically fetched from backend .env status
  const [activeProvider, setActiveProvider] = useState('local-rag');
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [serverStatus, setServerStatus] = useState(null);

  useEffect(() => {
    fetchServerStatus().then(status => {
      setServerStatus(status);
      if (status?.defaultProvider) {
        setActiveProvider(status.defaultProvider);
      }
    });
  }, []);

  const t = translations[language] || translations.gu;

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        serverStatus={serverStatus}
        activeProvider={activeProvider}
      />

      <main className="main-content">
        {/* Emergency Alert Banner */}
        <DisclaimerAlert language={language} />

        {/* Tab 1: AI Doctor Chat */}
        {activeTab === 'chat' && (
          <ChatInterface
            language={language}
            activeProvider={activeProvider}
            selectedModel={selectedModel}
            onSelectMedicine={(med) => setSelectedMedicine(med)}
          />
        )}

        {/* Tab 2: 150 Medicines Directory */}
        {activeTab === 'catalog' && (
          <MedicineCatalog
            language={language}
            onSelectMedicine={(med) => setSelectedMedicine(med)}
          />
        )}
      </main>

      {/* Medicine Detail Modal */}
      <MedicineDetailModal
        medicine={selectedMedicine}
        onClose={() => setSelectedMedicine(null)}
        language={language}
      />

      {/* Footer */}
      <footer className="app-footer">
        <p>{t.disclaimerFooter}</p>
        <p style={{ marginTop: '0.4rem', opacity: 0.6 }}>
          Medicine AI © {new Date().getFullYear()} • 150 Essential Medicines Clinical Dataset • Powered by React & Node
        </p>
      </footer>
    </div>
  );
}
