import React, { useState } from 'react';
import { NODE_TYPES } from '../../services/processingEngine';
import { sound } from '../../utils/soundscape';

export default function GlowingSearchBar({ searchQuery, onSearchChange, activeFilter, onFilterChange }) {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Conic Glow Search Box */}
      <div className="glowing-search-wrapper">
        <div className="glowing-search-inner">
          <span style={{ fontSize: '1rem', color: 'var(--text-subtle)', userSelect: 'none' }}>🔍</span>
          <input
            type="text"
            className="glowing-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث عن معالم، أرقام، أو مصطلحات سريرية..."
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="btn-ghost"
              style={{ padding: '2px 6px', fontSize: '0.8rem', color: 'var(--text-subtle)' }}
              title="مسح البحث"
            >
              ✕
            </button>
          )}

          {/* Rotating Conic Border Filter Icon */}
          <div
            className="filter-icon-container"
            onClick={() => {
              sound.tap();
              setFilterMenuOpen(!filterMenuOpen);
            }}
            title="تصفية حسب التصنيف السريري"
          >
            <div className="filter-border-glow" />
            <div className="filter-icon-content">
              <span style={{ fontSize: '0.88rem' }}>⚡</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Dropdown Menu */}
      {filterMenuOpen && (
        <div
          className="glass-surface-heavy animate-fade-in"
          style={{
            position: 'absolute',
            top: '115%',
            left: 0,
            width: 240,
            padding: 8,
            zIndex: 60,
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-subtle)', padding: '4px 8px' }}>
            تصفية البطاقات حسب النوع:
          </div>
          <button
            className="btn-ghost"
            onClick={() => {
              onFilterChange('all');
              setFilterMenuOpen(false);
            }}
            style={{
              justifyContent: 'flex-start',
              fontSize: '0.82rem',
              fontWeight: activeFilter === 'all' ? 700 : 500,
              color: activeFilter === 'all' ? 'var(--accent-primary)' : 'var(--text-main)',
              background: activeFilter === 'all' ? 'var(--accent-primary-soft)' : 'transparent',
              padding: '6px 10px',
            }}
          >
            جميع البطاقات (الكل)
          </button>
          {Object.entries(NODE_TYPES).map(([k, def]) => (
            <button
              key={k}
              className="btn-ghost"
              onClick={() => {
                onFilterChange(k);
                setFilterMenuOpen(false);
              }}
              style={{
                justifyContent: 'flex-start',
                fontSize: '0.82rem',
                fontWeight: activeFilter === k ? 700 : 500,
                color: activeFilter === k ? 'var(--accent-primary)' : 'var(--text-main)',
                background: activeFilter === k ? 'var(--accent-primary-soft)' : 'transparent',
                padding: '6px 10px',
              }}
            >
              <span className={`badge-clinical badge-${def.key}`} style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                {def.ar}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
