import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function InstallPwaPrompt({ language = 'gu' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user previously dismissed in this session
      const dismissed = sessionStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If app installed, hide prompt
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="pwa-install-banner" role="banner" aria-label="Install PWA">
      <div className="pwa-install-content">
        <div className="pwa-install-icon">
          <Smartphone size={20} />
        </div>
        <div className="pwa-install-text">
          <div className="pwa-title">
            {language === 'gu' ? 'Medicine AI એપ ઇન્સ્ટોલ કરો' : 'Install Medicine AI App'}
          </div>
          <div className="pwa-sub">
            {language === 'gu' 
              ? 'તમારા હોમ સ્ક્રીન પરથી ડાયરેક્ટ ઝડપી ઍક્સેસ મેળવો!'
              : 'Add to Home Screen for instant offline-ready access!'}
          </div>
        </div>
      </div>

      <div className="pwa-install-actions">
        <button className="pwa-install-btn" onClick={handleInstall}>
          <Download size={15} />
          <span>{language === 'gu' ? 'ઇન્સ્ટોલ કરો' : 'Install'}</span>
        </button>
        <button className="pwa-dismiss-btn" onClick={handleDismiss} aria-label="Dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
