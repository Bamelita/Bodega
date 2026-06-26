import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration + 300); // extra time for exit animation
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error:   (msg, duration) => addToast(msg, 'error',   duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    info:    (msg, duration) => addToast(msg, 'info',    duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// ── Toast Container ──────────────────────────────────────────────────────────
const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
      <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
};

const COLORS = {
  success: { bg: 'var(--success-bg)', border: 'var(--success)', color: 'var(--success)' },
  error:   { bg: 'var(--danger-bg)',  border: 'var(--danger)',  color: 'var(--danger)' },
  warning: { bg: 'var(--warning-bg)', border: 'var(--warning)', color: 'var(--warning)' },
  info:    { bg: 'var(--info-bg)',    border: 'var(--info)',    color: 'var(--info)' },
};

const ToastItem = ({ toast, onRemove }) => {
  const c = COLORS[toast.type] || COLORS.info;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '14px',
        background: 'var(--glass-white)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        border: `1.5px solid ${c.border}`,
        boxShadow: 'var(--glass-shadow-lg)',
        minWidth: '280px',
        maxWidth: '380px',
        position: 'relative',
        overflow: 'hidden',
        animation: 'toast-in 0.3s cubic-bezier(.4,0,.2,1)',
      }}
    >
      {/* Icon */}
      <span style={{ color: c.color, flexShrink: 0, marginTop: '1px' }}>
        {ICONS[toast.type]}
      </span>

      {/* Message */}
      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--ink)', flex: 1, lineHeight: 1.5 }}>
        {toast.message}
      </span>

      {/* Close */}
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted)', padding: '0', flexShrink: 0,
          lineHeight: 1,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Progress bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0, left: 0,
          height: '3px',
          background: c.border,
          borderRadius: '0 0 0 14px',
          animation: `toast-progress ${toast.duration}ms linear forwards`,
        }}
      />
    </div>
  );
};

const ToastContainer = ({ toasts, onRemove }) => (
  <>
    <style>{`
      @keyframes toast-in {
        from { opacity: 0; transform: translateX(100%) scale(0.95); }
        to   { opacity: 1; transform: translateX(0) scale(1); }
      }
      @keyframes toast-progress {
        from { width: 100%; }
        to   { width: 0%; }
      }
    `}</style>
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  </>
);

export default ToastProvider;
