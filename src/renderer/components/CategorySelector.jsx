import React from 'react';

const CATEGORIES = [
  { id: 'security', name: 'Security', icon: '🔒', desc: 'Vulnerabilities, sensitive leaks' },
  { id: 'performance', name: 'Performance', icon: '⚡', desc: 'Slow loops, memory efficiency' },
  { id: 'codeQuality', name: 'Code Quality', icon: '🧹', desc: 'Duplication, readability, standards' },
  { id: 'testCoverage', name: 'Test Coverage', icon: '🧪', desc: 'Unit and integration test ratio' },
  { id: 'architecture', name: 'Architecture', icon: '🏗️', desc: 'Modularity, dependency layers' },
];

export default function CategorySelector({ selectedCategories = [], onChange }) {
  const toggleCategory = (id) => {
    if (selectedCategories.includes(id)) {
      onChange(selectedCategories.filter((c) => c !== id));
    } else {
      onChange([...selectedCategories, id]);
    }
  };

  const toggleAll = () => {
    if (selectedCategories.length === CATEGORIES.length) {
      onChange([]);
    } else {
      onChange(CATEGORIES.map((c) => c.id));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>3. Select Analysis Categories</h3>
        <button onClick={toggleAll} className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
          {selectedCategories.length === CATEGORIES.length ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategories.includes(cat.id);
          return (
            <div
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
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
              <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? '#FFFFFF' : 'var(--text-primary)' }}>
                  {cat.name}
                </div>
                <div className="text-muted font-mono" style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                  {cat.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
