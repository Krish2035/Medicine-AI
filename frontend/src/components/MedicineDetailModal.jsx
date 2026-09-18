import React from 'react';
import { X, AlertCircle, CheckCircle2, ShieldAlert, Pill, FileText } from 'lucide-react';
import { translations } from '../utils/translations';

export default function MedicineDetailModal({ medicine, onClose, language = 'gu' }) {
  if (!medicine) return null;
  const t = translations[language] || translations.gu;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="card-num">#{medicine.id}</span>
              <span className="card-raw-ind">{medicine.indication_raw}</span>
            </div>
            <h2 className="card-title" style={{ fontSize: '1.4rem' }}>{medicine.name}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{medicine.category}</div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Prescription status */}
          {medicine.prescription_required ? (
            <div className="field-box danger" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <ShieldAlert size={20} />
              <div>
                <strong>⚠️ {t.prescriptionNotice}</strong>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  {language === 'gu'
                    ? 'આ દવા એન્ટિબાયોટિક અથવા નિયંત્રિત કેટેગરીમાં આવે છે. ડૉક્ટરની તપાસ અને પરવાનગી વગર લેવી જોખમી છે.'
                    : 'This medication requires a valid medical prescription from a registered doctor.'}
                </div>
              </div>
            </div>
          ) : (
            <div className="field-box" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.08)' }}>
              <CheckCircle2 size={20} style={{ color: '#34d399' }} />
              <div>
                <strong style={{ color: '#34d399' }}>ℹ️ {t.otcNotice}</strong>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {language === 'gu'
                    ? 'પ્રાથમિક સારવાર તરીકે વાપરી શકાય તેવી દવા, છતાં યોગ્ય માત્રા જાળવવી.'
                    : 'Available as an over-the-counter medicine for primary symptom relief.'}
                </div>
              </div>
            </div>
          )}

          {/* Form & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="modal-field">
              <span className="field-label">{t.dosageForm}</span>
              <div className="field-val" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Pill size={16} style={{ color: '#34d399' }} />
                <span>{medicine.form}</span>
              </div>
            </div>
            <div className="modal-field">
              <span className="field-label">શ્રેણી / Category</span>
              <div className="field-val">{medicine.category}</div>
            </div>
          </div>

          {/* Clinical description */}
          <div className="modal-field">
            <span className="field-label">{t.primaryUse}</span>
            <div className="field-box">
              <p style={{ marginBottom: '0.4rem', fontWeight: 500 }}>
                {medicine.description_gu}
              </p>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                {medicine.description_en}
              </p>
            </div>
          </div>

          {/* Target Symptoms */}
          <div className="modal-field">
            <span className="field-label">{t.symptomsAddressed}</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {(medicine.symptoms_gu || []).map((sym, i) => (
                <span key={i} className="symptom-chip" style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem' }}>
                  {sym}
                </span>
              ))}
              {(medicine.symptoms_en || []).map((sym, i) => (
                <span key={i} className="symptom-chip" style={{ fontSize: '0.8rem', padding: '0.25rem 0.65rem', opacity: 0.75 }}>
                  {sym}
                </span>
              ))}
            </div>
          </div>

          {/* How to take / Dosage advice */}
          <div className="modal-field">
            <span className="field-label">{t.howToUse}</span>
            <div className="field-box">
              <p>{medicine.dosage_advice_gu}</p>
            </div>
          </div>

          {/* Precautions & Warnings */}
          <div className="modal-field">
            <span className="field-label">{t.precautions}</span>
            <div className="field-box warning">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{medicine.precautions_gu}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
