import React, { useState, useEffect } from 'react';
import {
  getTermMeaning,
  analyzeMedicalTerm,
  translateText,
  speakText,
} from '../../services/translationService';
import { sound } from '../../utils/soundscape';

const HISTORY_KEY = 'medtr_word_history';

export default function TermTranslator() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      setHistory(stored);
    } catch {
      setHistory([]);
    }
  }, []);

  const saveHistory = (term) => {
    const clean = term.trim();
    if (!clean) return;
    const updated = [clean, ...history.filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
    setHistory(updated);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleSearch = async (termToSearch) => {
    const q = (termToSearch || query).trim();
    if (!q) return;
    sound.tap();
    setLoading(true);
    saveHistory(q);

    // 1. Direct dictionary match
    let meaning = getTermMeaning(q);
    let source = 'قاموس طب الأسنان المعتمد';

    // 2. Morphological breakdown (Prefix + Root + Suffix)
    if (!meaning) {
      const morph = analyzeMedicalTerm(q);
      if (morph) {
        meaning = morph;
        source = 'تحليل المقاطع الطبية (السوابق + الجذور + اللواحق)';
      }
    }

    // 3. Fallback to machine translation
    if (!meaning) {
      meaning = await translateText(q);
      source = 'ترجمة سريرية فورية';
    }

    setResult({
      term: q,
      meaning,
      source,
    });
    setLoading(false);
  };

  return (
    <div className="container" style={{ padding: '28px 16px', maxWidth: 860 }}>
      <div className="glass-surface-heavy" style={{ padding: '32px 30px', borderRadius: 24, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: 12, borderRadius: 16, background: 'var(--accent-primary-soft)', marginBottom: 12 }}>
          <span style={{ fontSize: '2rem' }}>🔍</span>
        </div>
        <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px' }}>
          مترجم وباحث المصطلحات الفوري
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-subtle)', maxWidth: 540, margin: '0 auto 24px', lineHeight: 1.6 }}>
          ابحث عن أي مصطلح طبي أو سني باللغة الإنجليزية أو العربية، مع التحليل التشريحي لمقاطع المصطلح والنطق الصوتي الواضح.
        </p>

        {/* Search Input Box */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            maxWidth: 600,
            margin: '0 auto',
            background: 'var(--surface-ground)',
            padding: '6px 8px',
            borderRadius: 16,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="اكتب المصطلح السني هنا... (مثلاً: Ameloblast, Gingivitis, Mandible, Alginate)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '10px 14px',
              fontSize: '0.94rem',
              fontFamily: 'var(--font-latin)',
              color: 'var(--text-main)',
              outline: 'none',
            }}
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query.trim()}
            className="btn-primary"
            style={{ padding: '10px 20px', borderRadius: 12, fontSize: '0.88rem', fontWeight: 700 }}
          >
            {loading ? '...' : 'ترجم الآن'}
          </button>
          <button
            onClick={() => {
              if (query.trim()) speakText(query.trim());
            }}
            title="نطق المصطلح بالإنجليزية"
            className="btn-ghost"
            style={{ padding: 10, borderRadius: 12, fontSize: '1.1rem', color: 'var(--accent-primary)' }}
          >
            🔊
          </button>
        </div>

        {/* Recent Search History Chips */}
        {history.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-subtle)', fontWeight: 600 }}>عمليات البحث الأخيرة:</span>
            {history.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(item);
                  handleSearch(item);
                }}
                className="btn-ghost"
                style={{
                  fontSize: '0.78rem',
                  padding: '3px 10px',
                  borderRadius: 8,
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-latin)',
                }}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* Search Result Card */}
        {result && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: 32,
              padding: '24px 28px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, var(--accent-primary-soft) 0%, rgba(255, 255, 255, 0.4) 100%)',
              border: '1px solid var(--accent-primary)',
              maxWidth: 580,
              marginRight: 'auto',
              marginLeft: 'auto',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-latin)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                {result.term}
              </span>
              <button
                onClick={() => speakText(result.term)}
                className="btn-ghost"
                title="نطق المصطلح"
                style={{ fontSize: '1.2rem', padding: '4px 8px' }}
              >
                🔊
              </button>
            </div>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '6px 0 12px' }}>
              {result.meaning}
            </p>
            <div style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 999, background: 'rgba(255, 255, 255, 0.8)', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-subtle)', border: '1px solid var(--border-subtle)' }}>
              المصدر: {result.source}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
