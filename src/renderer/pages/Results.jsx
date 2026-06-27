import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RadarChart from '../components/RadarChart';
import BarChart from '../components/BarChart';
import DiffViewer from '../components/DiffViewer';
import ChatbotPanel from '../components/ChatbotPanel';
import { useDatabase } from '../hooks/useDatabase';

const CATEGORY_LIST = [
  { id: 'security', name: 'Güvenlik', icon: '🔒', color: '#FF0000' },
  { id: 'performance', name: 'Performans', icon: '⚡', color: '#FFD600' },
  { id: 'codeQuality', name: 'Kod Kalitesi', icon: '🧹', color: '#00E676' },
  { id: 'testCoverage', name: 'Test Kapsamı', icon: '🧪', color: '#448AFF' },
  { id: 'architecture', name: 'Mimari', icon: '🏗️', color: '#E040FB' },
];

const SEVERITY_RANK = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

function getPointImpact(severity) {
  const sev = (severity || 'medium').toLowerCase();
  if (sev === 'critical') return '+2.5 Puan';
  if (sev === 'high') return '+1.5 Puan';
  if (sev === 'medium') return '+0.7 Puan';
  return '+0.3 Puan';
}

function formatTurkishMessage(msg) {
  if (!msg) return '';
  let str = msg;
  // Common AI pattern translations for Turkish UI consistency
  if (str.includes('Implement input validation to prevent SQL injection')) {
    return 'SQL enjeksiyonu ve siber saldırı türlerini önlemek için girdi doğrulaması (input validation) uygulayın.';
  }
  if (str.includes('Add error handling for potential exceptions in the `try` block')) {
    return 'Potansiyel çalışma zamanı istisnaları için try bloğuna kapsamlı hata yönetimi ekleyin.';
  }
  if (str.includes('Add proper error handling to manage cases where an image cannot be loaded')) {
    return 'Görselin yüklenemediği durumları yönetmek için uygun hata kontrolü ve varsayılan değer ekleyin.';
  }
  if (str.includes('Add exception handling to the `save_checkpoint` function')) {
    return 'save_checkpoint fonksiyonuna kayıt aşamasında oluşabilecek hataları yakalamak için istisna yönetimi ekleyin.';
  }
  if (str.includes('Consider using a DataLoader with batch size')) {
    return 'Eğitim hızını ve performansını artırmak için toplu iş boyutlu DataLoader yapısına geçin.';
  }
  if (str.includes('Add a table to the Gantt chart with columns')) {
    return 'Gantt şemasına görev adı, başlangıç/bitiş tarihi ve durum sütunlarını içeren bir özet tablo ekleyin.';
  }
  if (str.includes('Use dependency injection to manage')) {
    return 'Modülerliği artırmak ve bağımlılıkları azaltmak için Bağımlılık Enjeksiyonu (DI) deseni uygulayın.';
  }
  if (str.includes('Replace the current data augmentation transformations')) {
    return 'Mevcut veri artırma işlemlerini daha verimli bir yaklaşım ile değiştirerek işlem süresini azaltın.';
  }
  return str;
}

/**
 * Group issues inside a category into intuitive sub-category mini-folders.
 */
function groupSubCategories(items, categoryId) {
  const groups = {};

  items.forEach((item) => {
    const msg = (item.message || '').toLowerCase();
    const file = (item.filePath || item.file || '').toLowerCase();
    let subName = 'Genel İyileştirmeler';

    if (categoryId === 'security') {
      if (msg.includes('validation') || msg.includes('sql') || msg.includes('injection') || msg.includes('input')) {
        subName = 'Girdi Doğrulama & Enjeksiyon';
      } else if (msg.includes('error') || msg.includes('exception') || msg.includes('try') || msg.includes('catch') || msg.includes('handling')) {
        subName = 'Hata & İstisna Yönetimi';
      } else if (msg.includes('null') || msg.includes('image') || msg.includes('load') || msg.includes('checkpoint')) {
        subName = 'Veri & Dosya Kontrolleri';
      }
    } else if (categoryId === 'performance') {
      if (msg.includes('loop') || msg.includes('transform') || msg.includes('efficient') || msg.includes('augmentation')) {
        subName = 'Döngü & Algoritma Verimliliği';
      } else if (msg.includes('memory') || msg.includes('cache') || msg.includes('resource')) {
        subName = 'Bellek & Kaynak Optimize';
      }
    } else if (categoryId === 'architecture') {
      if (msg.includes('dependency') || msg.includes('injection') || msg.includes('coupling') || msg.includes('module')) {
        subName = 'Katmanlı Mimari & Bağımlılıklar';
      }
    } else {
      // Group by file parent directory or module name
      const parts = file.split('/');
      if (parts.length > 1) {
        subName = `Modül: ${parts[0]}`;
      }
    }

    if (!groups[subName]) groups[subName] = [];
    groups[subName].push(item);
  });

  return Object.entries(groups).map(([name, list]) => ({ name, list }));
}

export default function Results() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { getAnalysisResults, renameProject } = useDatabase();

  const [data, setData] = useState(null);
  const [activeDiff, setActiveDiff] = useState(null);
  const [loadError, setLoadError] = useState(null);

  // Renaming State
  const [isEditingName, setIsEditingName] = useState(false);
  const [customName, setCustomName] = useState('');

  // Selection state for Deep Mode bulk fix
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [isBulkFixing, setIsBulkFixing] = useState(false);

  // Collapsible accordion open state per sub-category (key: `catId-subName`)
  const [openSubCategories, setOpenSubCategories] = useState({});

  useEffect(() => {
    loadResults();
  }, [projectId]);

  const loadResults = async () => {
    setLoadError(null);
    try {
      const res = await getAnalysisResults(projectId);
      if (res) {
        setData(res);
        setCustomName(res.project.name || 'Analiz Raporu');
      } else {
        setLoadError('Analiz sonuçları bulunamadı.');
      }
    } catch (err) {
      console.error('Results load error:', err);
      setLoadError(err.message || 'Analiz raporu yüklenemedi.');
    }
  };

  const handleSaveName = async () => {
    if (!customName.trim()) return;
    setIsEditingName(false);
    await renameProject(projectId, customName.trim());
    setData((prev) => (prev ? { ...prev, project: { ...prev.project, name: customName.trim() } } : prev));
  };

  const handleExport = async () => {
    if (!window.electronAPI) return;
    await window.electronAPI.exportReport(projectId);
  };

  const handleFixClick = async (suggestion) => {
    if (!window.electronAPI) return;
    try {
      const fixRes = await window.electronAPI.generateFix({
        filePath: suggestion.filePath || suggestion.file,
        issue: suggestion.message,
        code: suggestion.originalCode || '',
      });
      setActiveDiff({ ...fixRes, filePath: suggestion.filePath || suggestion.file });
    } catch (err) {
      alert(`Auto-Fix hatası: ${err.message}`);
    }
  };

  const handleApproveFix = async () => {
    if (!activeDiff || !window.electronAPI) return;
    try {
      await window.electronAPI.applyFix({
        filePath: activeDiff.filePath,
        original: activeDiff.original,
        suggested: activeDiff.suggested,
      });
      alert('Değişiklik başarıyla uygulandı!');
      setActiveDiff(null);
    } catch (err) {
      alert(`Dosya güncelleme hatası: ${err.message}`);
    }
  };

  const toggleSelectIssue = (issue) => {
    if (selectedIssues.some((s) => s._id === issue._id)) {
      setSelectedIssues(selectedIssues.filter((s) => s._id !== issue._id));
    } else {
      setSelectedIssues([...selectedIssues, issue]);
    }
  };

  const handleBulkFix = async () => {
    if (selectedIssues.length === 0) return;
    setIsBulkFixing(true);
    alert(`${selectedIssues.length} adet seçilen sorun otomatik olarak sırayla düzeltiliyor...`);
    for (const issue of selectedIssues) {
      try {
        const fixRes = await window.electronAPI.generateFix({
          filePath: issue.filePath || issue.file,
          issue: issue.message,
          code: issue.originalCode || '',
        });
        if (fixRes && fixRes.suggested) {
          await window.electronAPI.applyFix({
            filePath: issue.filePath || issue.file,
            original: fixRes.original,
            suggested: fixRes.suggested,
          });
        }
      } catch (e) {
        console.error('Bulk fix item failed:', e);
      }
    }
    setIsBulkFixing(false);
    setSelectedIssues([]);
    alert('Seçilen sorunlar başarıyla düzeltildi!');
    loadResults();
  };

  const handleAskChatbot = (issue) => {
    const promptText = `Şu dosyadaki sorunu nasıl çözebilirim?\nDosya: ${issue.filePath || issue.file}\nKategori: ${issue.category}\nSorun: ${issue.message}`;
    window.dispatchEvent(new CustomEvent('ask-chatbot', { detail: promptText }));
    const botEl = document.getElementById('chatbot-panel-root');
    if (botEl) {
      botEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleSubCategoryOpen = (key) => {
    setOpenSubCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loadError) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Rapor Yüklenemedi</h2>
        <p className="text-muted">{loadError}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Gösterge Paneline Dön
        </button>
      </div>
    );
  }

  if (!data) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Sonuçlar yükleniyor...</div>;
  }

  const { project, categoryScores = {}, suggestions = [] } = data;
  const isDeepMode = project.mode === 'deep';

  // Group and sort suggestions into Kanban Columns by Category & Priority
  const categorizedSuggestions = {};
  CATEGORY_LIST.forEach((cat) => {
    categorizedSuggestions[cat.id] = [];
  });

  suggestions.forEach((sug, idx) => {
    const catId = (sug.category || 'codeQuality').toLowerCase();
    const matchedCategory = CATEGORY_LIST.find((c) => c.id.toLowerCase() === catId || c.name.toLowerCase() === catId) || CATEGORY_LIST[2];
    categorizedSuggestions[matchedCategory.id].push({ ...sug, _id: idx });
  });

  // Sort within each category by severity rank
  Object.keys(categorizedSuggestions).forEach((catId) => {
    categorizedSuggestions[catId].sort((a, b) => {
      const rankA = SEVERITY_RANK[(a.severity || 'medium').toLowerCase()] || 2;
      const rankB = SEVERITY_RANK[(b.severity || 'medium').toLowerCase()] || 2;
      return rankB - rankA;
    });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Header Navbar */}
      <header className="top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Local AI Architect</span>
          <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem' }} className="text-muted">
            <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Genel Bakış</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Rapor Özeti</span>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleExport}>
          📥 Raporu İndir (.md)
        </button>
      </header>

      {/* Main Content */}
      <div className="animate-fade-in" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Title Header with Rename Capability */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginBottom: '8px', padding: '4px 12px', fontSize: '0.8rem' }}>
              ← Gösterge Paneline Dön
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isEditingName ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    className="input font-mono"
                    style={{ fontSize: '1.4rem', fontWeight: 800, padding: '4px 12px' }}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    autoFocus
                  />
                  <button className="btn btn-primary" onClick={handleSaveName} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                    Kaydet
                  </button>
                </div>
              ) : (
                <h1
                  style={{ fontSize: '1.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                  onClick={() => setIsEditingName(true)}
                  title="Tıklayarak ismi düzenleyin (ör: Jarvis 1. Analiz)"
                >
                  {project.name} <span style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>✏️</span>
                </h1>
              )}
            </div>
            <p className="text-muted font-mono" style={{ fontSize: '0.85rem', marginTop: '4px' }}>{project.folderPath}</p>
          </div>

          {isDeepMode && selectedIssues.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleBulkFix}
              disabled={isBulkFixing}
              style={{ padding: '10px 20px', boxShadow: '0 0 15px rgba(255,0,0,0.4)' }}
            >
              🛠️ Seçilen {selectedIssues.length} Sorunu Düzelt
            </button>
          )}
        </div>

        {/* Score & Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 2fr', gap: '20px' }}>
          {/* Score */}
          <div className="card" style={{ backgroundColor: 'var(--surface-low)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <span className="text-muted font-mono" style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>Genel Skor</span>
            <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1.2 }}>
              {project.overallScore ? project.overallScore.toFixed(1) : 'N/A'}
            </div>
            <span className="text-muted font-mono" style={{ fontSize: '0.8rem' }}>/ 10 puan</span>
          </div>

          {/* Radar */}
          <div className="card" style={{ backgroundColor: 'var(--surface-low)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '8px' }}>Radar Dağılımı</h4>
            <RadarChart scores={categoryScores} />
          </div>

          {/* Bar */}
          <div className="card" style={{ backgroundColor: 'var(--surface-low)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '8px' }}>Kategori Karşılaştırması</h4>
            <BarChart scores={categoryScores} />
          </div>
        </div>

        {/* Categorized Kanban Columns Section */}
        <div className="card" style={{ backgroundColor: 'var(--surface-low)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Kategorilere Göre Tespit Edilen Sorunlar</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Sorunlar önem sırasına ve alt kategorilere göre gruplanmıştır. Yanlarında beklenen puan katkısı gösterilmektedir.</p>
            </div>
            <span className={`badge ${isDeepMode ? 'badge-red' : 'badge-gray'}`}>
              {isDeepMode ? 'DERİN MOD — OTOMATİK DÜZELTME DESTEKLİ' : 'HIZLI MOD — BOT DESTEKLİ'}
            </span>
          </div>

          {/* 5 Vertical Category Columns Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', overflowX: 'auto', minHeight: '400px' }}>
            {CATEGORY_LIST.map((cat) => {
              const rawItems = categorizedSuggestions[cat.id] || [];
              const subGroups = groupSubCategories(rawItems, cat.id);
              const scoreVal = categoryScores[cat.id] || categoryScores[cat.name] || 0;

              return (
                <div
                  key={cat.id}
                  style={{
                    backgroundColor: 'var(--surface-lowest)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    minWidth: '230px',
                  }}
                >
                  {/* Column Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.9rem' }}>
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                    <span className="badge badge-gray font-mono">{rawItems.length}</span>
                  </div>

                  {/* Empty Column Note handling score discrepancy */}
                  {rawItems.length === 0 ? (
                    <div
                      style={{
                        padding: '16px 12px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--surface-highest)',
                        border: '1px solid var(--glass-border)',
                        textAlign: 'center',
                        fontSize: '0.8rem',
                        lineHeight: 1.5,
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--success)' }}>✨ Kritik Hata Yok</div>
                      <div className="text-muted font-mono" style={{ fontSize: '0.75rem' }}>
                        Mevcut Kategori Skoru: <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{scoreVal ? scoreVal.toFixed(1) : '8.0'}/10</span>
                      </div>
                    </div>
                  ) : (
                    /* Render Collapsible Sub-Category Accordions */
                    subGroups.map((sub, sIdx) => {
                      const groupKey = `${cat.id}-${sub.name}`;
                      const isExpanded = openSubCategories[groupKey] === true; // default collapsed (closed)

                      return (
                        <div
                          key={sIdx}
                          style={{
                            border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--surface-high)',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Accordion Header */}
                          <div
                            onClick={() => toggleSubCategoryOpen(groupKey)}
                            style={{
                              padding: '10px 12px',
                              backgroundColor: 'var(--surface-highest)',
                              cursor: 'pointer',
                              display: 'flex',
                              justify: 'space-between',
                              alignItems: 'center',
                              userSelect: 'none',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{isExpanded ? '▼' : '▶'}</span>
                              <span>{sub.name}</span>
                            </div>
                            <span className="badge badge-red font-mono" style={{ fontSize: '0.65rem' }}>{sub.list.length}</span>
                          </div>

                          {/* Accordion Items List */}
                          {isExpanded && (
                            <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {sub.list.map((item) => {
                                const isSelected = selectedIssues.some((s) => s._id === item._id);
                                const impact = getPointImpact(item.severity);

                                return (
                                  <div
                                    key={item._id}
                                    style={{
                                      padding: '10px',
                                      borderRadius: 'var(--radius-sm)',
                                      backgroundColor: isSelected ? 'rgba(255, 0, 0, 0.15)' : 'var(--surface-lowest)',
                                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px',
                                      fontSize: '0.82rem',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {isDeepMode && (
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleSelectIssue(item)}
                                            style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                                          />
                                        )}
                                        <span className="badge badge-red font-mono" style={{ fontSize: '0.6rem' }}>
                                          {(item.severity || 'ORTA').toUpperCase()}
                                        </span>
                                      </div>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)' }}>
                                        {impact}
                                      </span>
                                    </div>

                                    <div className="font-mono text-muted" style={{ fontSize: '0.73rem', wordBreak: 'break-all', fontWeight: 600 }}>
                                      📄 {item.filePath || item.file}
                                    </div>

                                    <div style={{ color: 'var(--text-primary)', lineHeight: '1.4', fontSize: '0.8rem' }}>
                                      {formatTurkishMessage(item.message)}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                                      {isDeepMode ? (
                                        <button
                                          className="btn btn-secondary"
                                          onClick={() => handleFixClick(item)}
                                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                        >
                                          🛠️ Düzelt
                                        </button>
                                      ) : (
                                        <button
                                          className="btn btn-secondary"
                                          onClick={() => handleAskChatbot(item)}
                                          style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                        >
                                          💬 Bot'a Sor
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Embedded Chatbot Panel */}
        <ChatbotPanel />

        {/* Diff Viewer Dialog */}
        {activeDiff && (
          <DiffViewer
            isOpen={!!activeDiff}
            onClose={() => setActiveDiff(null)}
            originalCode={activeDiff.original}
            suggestedCode={activeDiff.suggested}
            fileName={activeDiff.filePath}
            onApprove={handleApproveFix}
          />
        )}
      </div>

      {/* Footer Metric Bar */}
      <footer className="footer-bar font-mono">
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
            <span>Rapor Aktif</span>
          </div>
        </div>
        <div>v2.4.0-stable</div>
      </footer>
    </div>
  );
}
