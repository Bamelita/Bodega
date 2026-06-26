import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import api from '../config/api';

const AiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', content: '¡Hola! Soy Invexis AI. Puedo ayudarte con dudas sobre el sistema, buscar productos, o darte resúmenes de ventas. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.reply }]);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Error conectando con Invexis AI.';
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ ${errMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      // Also handle single asterisks for italics if needed, but bold is most common
      const italicParts = part.split(/(\*.*?\*)/g);
      return italicParts.map((ip, j) => {
         if (ip.startsWith('*') && ip.endsWith('*')) {
           return <em key={`${i}-${j}`}>{ip.slice(1, -1)}</em>;
         }
         return <span key={`${i}-${j}`}>{ip}</span>;
      });
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        className={`ai-fab ${isOpen ? 'hidden' : ''}`}
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare size={24} />
      </button>

      {/* Chat Window */}
      <div className={`ai-window ${isOpen ? 'open' : ''}`}>
        <div className="ai-header">
          <div className="flex items-center gap-2">
            <div className="ai-avatar"><Bot size={18} /></div>
            <div>
              <div className="font-bold text-sm text-[var(--ink)]">Invexis AI</div>
              <div className="text-[0.65rem] text-[var(--muted)] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success"></span> En línea
              </div>
            </div>
          </div>
          <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <div className="ai-body">
          {messages.map((msg, idx) => (
            <div key={idx} className={`ai-msg-row ${msg.role === 'user' ? 'user' : 'ai'}`}>
              {msg.role === 'ai' && <div className="ai-msg-avatar"><Bot size={14} /></div>}
              <div className="ai-msg-bubble" style={{ whiteSpace: 'pre-wrap' }}>
                {renderFormattedText(msg.content)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="ai-msg-row ai">
              <div className="ai-msg-avatar"><Bot size={14} /></div>
              <div className="ai-msg-bubble flex gap-1 items-center justify-center p-3">
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
                <span className="ai-dot"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="ai-footer" onSubmit={handleSend}>
          <input
            type="text"
            placeholder="Pregúntale a Invexis AI..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={!input.trim() || isLoading} className="ai-send-btn">
            <Send size={16} />
          </button>
        </form>
      </div>
    </>
  );
};

export default AiAssistant;
