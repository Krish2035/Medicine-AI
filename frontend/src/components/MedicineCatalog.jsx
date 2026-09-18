import React, { useState, useEffect } from 'react';
import { Search, Filter, Pill, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
import { translations } from '../utils/translations';
import { fetchMedicines } from '../utils/api';

export default function MedicineCatalog({ language = 'gu', onSelectMedicine }) {
  const t = translations[language] || translations.gu;

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { key: 'all', labelGu: 'બધા (૧૫૦)', labelEn: 'All (150)' },
    { key: 'pain_fever', labelGu: 'તાવ અને દુખાવો', labelEn: 'Pain & Fever' },
    { key: 'acidity_gas', labelGu: 'ગેસ અને એસિડિટી', labelEn: 'Acidity & Gas' },
    { key: 'antibiotics', labelGu: 'એન્ટિબાયોટિક્સ', labelEn: 'Antibiotics' },
    { key: 'allergy_cold', labelGu: 'શરદી અને એલર્જી', labelEn: 'Allergy & Cold' },
    { key: 'cough_cold', labelGu: 'ઉધરસ અને કફ', labelEn: 'Cough & Cold' },
    { key: 'respiratory', labelGu: 'શ્વાસ અને અસ્થમા', labelEn: 'Respiratory / Asthma' },
    { key: 'joints_muscle', labelGu: 'સાંધા અને સ્નાયુ', labelEn: 'Joints & Muscle' },
    { key: 'first_aid', labelGu: 'પ્રાથમિક સારવાર / દાઝવું', labelEn: 'First Aid & Burns' },
    { key: 'antifungal', labelGu: 'ફંગલ ઇન્ફેક્શન / ધાધર', labelEn: 'Antifungal' },
    { key: 'dermatology', labelGu: 'ત્વચા અને ખીલ', labelEn: 'Dermatology & Skin' },
    { key: 'supplements', labelGu: 'વિટામિન્સ અને મિનરલ્સ', labelEn: 'Vitamins & Supplements' },
    { key: 'diabetes', labelGu: 'ડાયાબિટીસ / સુગર', labelEn: 'Diabetes' },
    { key: 'cardiovascular', labelGu: 'હૃદય અને બીપી', labelEn: 'Cardiovascular & BP' },
    { key: 'mental_health', labelGu: 'માનસિક સ્વાસ્થ્ય', labelEn: 'Mental Health' },
    { key: 'deworming', labelGu: 'પેટના કૃમિ / કીડા', labelEn: 'Deworming' },
    { key: 'antimalarial', labelGu: 'મેલેરિયા', labelEn: 'Antimalarial' }
  ];

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchMedicines(searchQuery, selectedCategory);
        if (isMounted) {
          setMedicines(data.medicines || []);
        }
      } catch (err) {
        console.error('Failed to load medicines:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      loadData();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(debounce);
    };
  }, [searchQuery, selectedCategory]);

  return (
    <section className="catalog-section" aria-label="150 Medicine Catalog">
      {/* Header & Controls */}
      <div className="catalog-header">
        <div className="catalog-search-bar">
          <div className="search-input-wrap">
            <Search className="search-icon" size={18} />
            <input
              id="catalog-search-input"
              type="text"
              className="catalog-search-input"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="categories-bar">
          {categories.map((cat) => (
            <button
              key={cat.key}
              className={`cat-btn ${selectedCategory === cat.key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              {language === 'gu' ? cat.labelGu : cat.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Meta */}
      <div className="med-grid-info">
        <div>
          <span>{t.totalMedicinesFound} </span>
          <strong style={{ color: '#34d399' }}>{medicines.length}</strong>
        </div>
        <div style={{ fontSize: '0.8rem' }}>
          સ્ક્રીનશોટ યાદીમાંથી ૧ થી ૧૫૦ ક્રમાંક
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          દવાઓ લોડ થઈ રહી છે...
        </div>
      ) : medicines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          કોઈ દવા મળી નથી. અન્ય શોધ શબ્દ અજમાવો.
        </div>
      ) : (
        <div className="medicines-grid" id="medicines-grid-container">
          {medicines.map((med) => (
            <article
              key={med.id}
              className="grid-card"
              onClick={() => onSelectMedicine(med)}
              role="button"
              tabIndex={0}
            >
              <div>
                <div className="card-header-row">
                  <span className="card-num">#{med.id}</span>
                  <span style={{ fontSize: '0.75rem', color: med.prescription_required ? '#fca5a5' : '#86efac', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {med.prescription_required ? <ShieldAlert size={12} /> : <CheckCircle2 size={12} />}
                    {med.prescription_required ? 'Rx' : 'OTC'}
                  </span>
                </div>

                <h3 className="card-title">{med.name}</h3>
                <span className="card-raw-ind">{med.indication_raw}</span>

                <p className="card-desc-gu">
                  {language === 'gu' ? med.description_gu : med.description_en}
                </p>
              </div>

              <div className="card-footer-row">
                <span className="card-form-badge">{med.form}</span>
                <button className="card-view-btn" onClick={(e) => { e.stopPropagation(); onSelectMedicine(med); }}>
                  <span>{t.viewDetails}</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
