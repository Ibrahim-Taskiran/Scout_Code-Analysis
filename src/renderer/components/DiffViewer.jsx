import React from 'react';
import Modal from './Modal';

export default function DiffViewer({ isOpen, onClose, originalCode = '', suggestedCode = '', fileName = '', onApprove }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Auto-Fix: ${fileName}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
          Yapay zeka tarafından önerilen değişiklikler aşağıdadır. Onaylarsanız dosyanız güncellenecektir.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* Original */}
          <div style={{ background: 'rgba(255, 82, 82, 0.08)', border: '1px solid rgba(255, 82, 82, 0.2)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 700, color: 'var(--error)', marginBottom: '8px', fontSize: '0.85rem' }}>Mevcut Kod</div>
            <pre className="font-mono" style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
              {originalCode}
            </pre>
          </div>

          {/* Suggested */}
          <div style={{ background: 'rgba(0, 230, 118, 0.08)', border: '1px solid rgba(0, 230, 118, 0.2)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: '8px', fontSize: '0.85rem' }}>Önerilen Kod</div>
            <pre className="font-mono" style={{ fontSize: '0.8rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
              {suggestedCode}
            </pre>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Reddet
          </button>
          <button className="btn btn-primary" onClick={onApprove}>
            Değişikliği Onayla & Uygula
          </button>
        </div>
      </div>
    </Modal>
  );
}
