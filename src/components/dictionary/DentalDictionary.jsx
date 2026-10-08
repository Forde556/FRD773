import React, { useState, useMemo } from 'react';
import { getDentalDictionary, saveUserCustomTerm, speakText } from '../../services/translationService';
import { sound } from '../../utils/soundscape';

export default function DentalDictionary() {
  const [filterLetter, setFilterLetter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [customEn, setCustomEn] = useState('');
  const [customAr, setCustomAr] = useState('');
  const [dictVersion, setDictVersion] = useState(0);
  const [toastMsg, setToastMsg] = useState('');

  const letters = useMemo(() => ['الكل', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'], []);

  const dictionaryList = useMemo(() => {
    const dict = getDentalDictionary();
    const q = searchQuery.toLowerCase().trim();
    const l = filterLetter.toUpperCase();

    const items = [];
    for (const [en, ar] of dict.entries()) {
      const matchLetter = !filterLetter || en.toUpperCase().startsWith(l);
      const matchQuery = !q || en.includes(q) || ar.includes(q);
      if (matchLetter && matchQuery) {
        items.push({ en, ar });
      }
    }
    return items.sort((a, b) => a.en.localeCompare(b.en));
  }, [filterLetter, searchQuery, dictVersion]);

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customEn.trim() || !customAr.trim()) return;
    const ok = saveUserCustomTerm(customEn, customAr);
    if (ok) {
      sound.complete();
      setToastMsg(`تمت إضافة المصطلح "${customEn}" إلى القاموس بنجاح ✓`);
      setCustomEn('');
      setCustomAr('');
      setDictVersion((v) => v + 1);
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: 1100 }}>
      {/* Title & Badge */}
      <div className="glass-surface-heavy" style={{ padding: '24px 28px', borderRadius: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.8rem' }}>📖</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                قاموس طب الأسنان الشامل (المرحلة الثانية والسريرية)
              </h2>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-subtle)', marginTop: 6, lineHeight: 1.6 }}>
              قاموس تخصصي يغطي مواد صناعة الأسنان والتعويضات (Prosthodontics)، خواص المواد (Dental Materials)، الأنسجة الفموية (Oral Histology)، والتشريح السني وترقيم FDI.
            </p>
          </div>
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 999,
              background: 'var(--accent-primary-soft)',
              color: 'var(--accent-primary)',
              fontWeight: 800,
              fontSize: '0.88rem',
              border: '1px solid var(--accent-primary)',
            }}
          >
            {dictionaryList.length} مصطلح سني
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginTop: 20 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في القاموس السني (باللغة الإنجليزية أو العربية)... مثلاً: Ameloblast, Alginate, Pulp"
            style={{
              width: '100%',
              padding: '12px 18px',
              borderRadius: 14,
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-ground)',
              fontSize: '0.92rem',
              color: 'var(--text-main)',
              outline: 'none',
              transition: 'border-color var(--trans-fast)',
            }}
          />
        </div>

        {/* Alphabet Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 16,
          }}
        >
          {letters.map((char) => {
            const isSelected = (char === 'الكل' && !filterLetter) || filterLetter === char;
            return (
              <button
                key={char}
                onClick={() => {
                  sound.tap();
                  setFilterLetter(char === 'الكل' ? '' : char);
                }}
                className="btn-ghost"
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: isSelected ? 'var(--accent-primary)' : 'var(--surface-card)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-muted)',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  minWidth: 32,
                  transition: 'all var(--trans-fast)',
                }}
              >
                {char}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dictionary Cards Grid */}
      <div
        className="custom-scrollbar"
        style={{
          maxHeight: '52vh',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 12,
          paddingRight: 4,
          marginBottom: 24,
        }}
      >
        {dictionaryList.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 0', color: 'var(--text-subtle)' }}>
            لا توجد مصطلحات مطابقة للبحث المحدد.
          </div>
        ) : (
          dictionaryList.slice(0, 180).map((item, idx) => (
            <div
              key={idx}
              className="glass-surface-heavy"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 14,
                border: '1px solid var(--border-subtle)',
                transition: 'transform var(--trans-fast), box-shadow var(--trans-fast)',
              }}
            >
              <div>
                <b style={{ fontFamily: 'var(--font-latin)', fontSize: '0.94rem', color: 'var(--accent-primary)', display: 'block' }}>
                  {item.en}
                </b>
                <span style={{ fontSize: '0.86rem', color: 'var(--text-main)', fontWeight: 600, marginTop: 2, display: 'block' }}>
                  {item.ar}
                </span>
              </div>
              <button
                onClick={() => {
                  sound.tap();
                  speakText(item.en);
                }}
                className="btn-ghost"
                title="نطق المصطلح بالإنجليزية"
                style={{
                  padding: '6px 10px',
                  borderRadius: 10,
                  fontSize: '0.9rem',
                  color: 'var(--accent-primary)',
                  cursor: 'pointer',
                }}
              >
                🔊
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Custom Term Section */}
      <div className="glass-surface-heavy" style={{ padding: '22px 28px', borderRadius: 20 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>➕</span>
          <span>أضف مصطلحاتك الخاصة إلى القاموس</span>
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginBottom: 16 }}>
          المصطلحات المضافة تُحفظ محلياً في متصفحك وستتعرف عليها لوحة المحاضرات والاختبار فورياً.
        </p>

        {toastMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid #10B981', padding: '8px 14px', borderRadius: 10, fontSize: '0.86rem', fontWeight: 700, marginBottom: 12 }}>
            {toastMsg}
          </div>
        )}

        <form onSubmit={handleAddCustom} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) auto', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            value={customEn}
            onChange={(e) => setCustomEn(e.target.value)}
            placeholder="المصطلح الإنجليزي (مثال: Line Angle)"
            required
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-ground)',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-latin)',
              outline: 'none',
              color: 'var(--text-main)',
            }}
          />
          <input
            type="text"
            value={customAr}
            onChange={(e) => setCustomAr(e.target.value)}
            placeholder="الترجمة والشرح السني بالعربية"
            required
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-ground)',
              fontSize: '0.88rem',
              outline: 'none',
              color: 'var(--text-main)',
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.88rem', fontWeight: 700, borderRadius: 12 }}
          >
            حفظ في القاموس
          </button>
        </form>
      </div>
    </div>
  );
}
