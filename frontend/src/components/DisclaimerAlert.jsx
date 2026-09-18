import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { translations } from '../utils/translations';

export default function DisclaimerAlert({ language = 'gu' }) {
  const t = translations[language] || translations.gu;

  return (
    <aside className="emergency-alert" role="alert" aria-label="Emergency warning">
      <div className="alert-left">
        <div className="alert-icon-wrap" aria-hidden="true">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h2 className="alert-title">🚨 {t.emergencyAlertTitle}</h2>
          <p className="alert-text">{t.emergencyAlertText}</p>
        </div>
      </div>
      <div className="alert-badge">
        EMERGENCY 108 / 112
      </div>
    </aside>
  );
}
