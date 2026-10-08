import React from 'react';
import { useUser } from '../../context/UserContext';

export default function Toast() {
  const { toastMessage, dismissToast } = useUser();

  if (!toastMessage) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: 24,
        right: 24,
        maxWidth: 520,
        margin: '0 auto',
        zIndex: 120,
      }}
    >
      <div
        className="glass-surface-heavy animate-fade-in"
        style={{
          padding: '16px 20px',
          border: '1px solid var(--accent-primary)',
          boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
        }}
      >
        <span style={{ fontSize: '1.4rem' }}>🌿</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.96rem', color: 'var(--text-main)', marginBottom: 4 }}>
            {toastMessage.title}
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
            {toastMessage.body}
          </div>
        </div>
        <button className="btn-ghost" onClick={dismissToast} style={{ padding: 4, fontSize: '1rem', color: 'var(--text-subtle)' }}>
          ✕
        </button>
      </div>
    </div>
  );
}
