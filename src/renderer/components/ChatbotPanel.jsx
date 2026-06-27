import React, { useState, useEffect, useRef } from 'react';

export default function ChatbotPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Merhaba! Ben Scout AI kod asistanınız. Kodlarınız veya analiz sonuçlarınız hakkında bana soru sorabilirsiniz.' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Listen for custom external ask-chatbot triggers from Results page or cards
    const handleCustomAsk = (event) => {
      const promptText = event.detail;
      if (promptText) {
        setIsOpen(true);
        handleSend(promptText);
      }
    };

    window.addEventListener('ask-chatbot', handleCustomAsk);
    return () => window.removeEventListener('ask-chatbot', handleCustomAsk);
  }, [isThinking]);

  useEffect(() => {
    if (!window.electronAPI) return;

    const removeChunk = window.electronAPI.onChatResponseChunk(({ chunk, done }) => {
      if (done) {
        setIsThinking(false);
      }
      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
          return [
            ...prev.slice(0, -1),
            { ...lastMsg, text: lastMsg.text + chunk, isStreaming: !done }
          ];
        } else {
          return [...prev, { role: 'assistant', text: chunk, isStreaming: !done }];
        }
      });
    });

    return () => removeChunk();
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || isThinking) return;

    setMessages((prev) => [...prev, { role: 'user', text: query }]);
    if (!textToSend) setInput('');
    setIsThinking(true);

    try {
      await window.electronAPI.sendChatMessage({ message: query });
    } catch (err) {
      setIsThinking(false);
      setMessages((prev) => [...prev, { role: 'assistant', text: `Hata: ${err.message}` }]);
    }
  };

  const handleStop = async () => {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.stopChatMessage();
      setIsThinking(false);
    } catch (err) {
      console.error('Failed to stop chat:', err);
    }
  };

  return (
    <div
      className="card"
      id="chatbot-panel-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginTop: '12px',
        backgroundColor: 'var(--surface-low)',
        borderColor: 'var(--glass-border)',
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>🤖</span>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Scout AI Geliştirici Asistanı</h3>
        </div>
        <span className="font-mono text-muted" style={{ fontSize: '0.85rem' }}>{isOpen ? '▲ DARALT' : '▼ GENİŞLET'}</span>
      </div>

      {isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>
          {/* Messages list */}
          <div
            style={{
              maxHeight: '320px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              paddingRight: '6px',
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-highest)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  border: msg.role === 'assistant' ? '1px solid var(--glass-border)' : 'none',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {msg.text}
              </div>
            ))}
            {isThinking && (
              <div className="text-muted font-mono" style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>
                Yazıyor...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions chips */}
          {messages.length <= 2 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Güvenlik skorumu nasıl artırabilirim?', 'En kritik sorun nedir?'].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(chip)}
                  style={{
                    backgroundColor: 'var(--surface-highest)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px',
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--glass-border)')}
                >
                  💡 {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input field */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Sorunuzu buraya yazın..."
              disabled={isThinking}
            />
            {isThinking ? (
              <button className="btn btn-danger" onClick={handleStop}>
                ⏹️ Durdur
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => handleSend()}>
                Gönder
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
