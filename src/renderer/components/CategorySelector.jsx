import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const CATEGORY_IDS = ['security', 'performance', 'codeQuality', 'testCoverage', 'architecture'];

export default function CategorySelector({ selectedCategories = [], onChange }) {
  const { t } = useLanguage();

  const toggleCategory = (id) => {
    if (selectedCategories.includes(id)) {
      onChange(selectedCategories.filter((c) => c !== id));
    } else {
      onChange([...selectedCategories, id]);
    }
  };

  const toggleAll = () => {
    if (selectedCategories.length === CATEGORY_IDS.length) {
      onChange([]);
    } else {
      onChange([...CATEGORY_IDS]);
    }
  };

  const icons = {
    security: '🔒',
    performance: '⚡',
    codeQuality: '🧹',
    testCoverage: '🧪',
    architecture: '🏗️',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t('analysis.step3Title')}</h3>
        <button onClick={toggleAll} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
          {selectedCategories.length === CATEGORY_IDS.length ? t('analysis.deselectAll') : t('analysis.selectAll')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {CATEGORY_IDS.map((id) => {
          const isSelected = selectedCategories.includes(id);
          return (
            <div
              key={id}
              onClick={() => toggleCategory(id)}
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isSelected ? 'rgba(255, 0, 0, 0.12)' : 'var(--surface-highest)',
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{icons[id]}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? '#FFFFFF' : 'var(--text-primary)' }}>
                  {t(`categories.${id}`)}
                </div>
                <div className="text-muted font-mono" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                  {t(`categories.${id}Desc`)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
