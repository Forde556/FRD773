import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { useCoreEngine } from '../../context/CoreEngineContext';
import { translateSelection } from '../../services/processingEngine';
import { CATEGORY_LABELS } from '../../utils/dentalLexicon';
import { formatHoursMinutes } from '../../utils/formatters';
import { msUntilReset } from '../../utils/quotaTracker';
import { sound } from '../../utils/soundscape';

export default function TranslationModal({ isOpen, onClose, initialQuery = '' }) {
  const { quota, requestTranslationUse, toastMessage } = useUser();
  const { activeLecture, bilingualMode, setBilingualMode } = useCoreEngine();
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [currentResult, setCurrentResult] = useState(null);

  useEffect(() => {
    if (initialQuery) {
      setSearchTerm(initialQuery);
      handleTranslate(initialQuery);
    }
  }, [initialQuery]);

  if (!isOpen) return null;

  const handleTranslate = (term) => {
    const q = (term || searchTerm).trim();
    if (!q) return;

    // Quota check
    const allowed = requestTranslationUse('selection');
    if (!allowed) {
      // Quota exhausted — user context already sets toastMessage
      return;
    }

    const res = translateSelection(q, activeLecture);
    setCurrentResult(res);
  };

  const handleToggleBilingualLecture = () => {
    const next = !bilingualMode;
    if (next) {
      const allowed = requestTranslationUse('lecture');
      if (!allowed) return;
    }
    sound.tap();
    setBilingualMode(next);
  };

  const timeLeft = formatHoursMinutes(msUntilReset());

  return (
    <div
      className="translation-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        className="glass-surface-heavy animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>🌐</span>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                الترجمة المنهجية لطب الأسنان
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                المتبقي اليوم: <strong>{quota.remaining}</strong> من أصل <strong>{quota.limit}</strong> طلبات
              </div>
            </div>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '1.2rem', padding: '4px 10px' }}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 22, overflowY: 'auto' }}>
          {/* Quota Depletion Alert if exhausted */}
          {quota.remaining === 0 && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(234, 179, 8, 0.12)',
                border: '1px solid rgba(234, 179, 8, 0.35)',
                marginBottom: 18,
                fontSize: '0.85rem',
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 800, color: '#B45309', marginBottom: 4 }}>
                أحسنت في مذاكرتك اليوم ومثابرتك العالية!
              </div>
              <div style={{ color: 'var(--text-main)' }}>
                استنفدت رصيد الترجمات الخمسة المتاحة لهذا اليوم، لتشجيعك على ترسيخ المصطلح الطبي باللغة الإنجليزية في ذهنك بنفسك. سيتجدد الرصيد تلقائياً خلال {timeLeft}.
              </div>
            </div>
          )}

          {/* Search Box */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="اكتب مصطلحاً طبياً بالإنجليزية (مثل: Oblique ridge, Cusp, Alginate)..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'var(--surface-ground)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTranslate();
              }}
            />
            <button
              className="btn-primary"
              onClick={() => handleTranslate()}
              disabled={!searchTerm.trim() || quota.remaining === 0}
              style={{ fontSize: '0.86rem' }}
            >
              ترجمة
            </button>
          </div>

          {/* Translation Result Card */}
          {currentResult && (
            <div className="glass-surface" style={{ padding: 18, marginBottom: 20 }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', fontWeight: 600, marginBottom: 6 }}>
                النتيجة المنهجية المعتمدة:
              </div>

              {currentResult.items.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {currentResult.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-ground)', borderRadius: 8 }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', fontFamily: 'var(--font-latin)' }}>
                          {item.en}
                        </span>
                        {item.cat && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-primary)', marginRight: 8 }}>
                            [{CATEGORY_LABELS[item.cat] || item.cat}]
                          </span>
                        )}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-primary)' }}>
                        {item.ar}
                      </div>
                    </div>
                  ))}

                  {currentResult.definition && (
                    <div style={{ marginTop: 6, fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      <strong>التعريف السريري في المحاضرة: </strong>
                      {currentResult.definition}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: 'var(--text-subtle)', fontSize: '0.86rem' }}>
                  لم يتم العثور على مصطلح مطابق بدقة في القاموس السريري المدمج لهذا البحث.
                </div>
              )}
            </div>
          )}

          {/* Dual View Option: Full lecture bilingual toggle */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                  عرض المحاضرة بالكامل بنمط ثنائي اللغة
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-subtle)' }}>
                  إدراج المقابل العربي بجانب كل مصطلح إنجليزي في لوحة الشرائح.
                </div>
              </div>
              <button
                className={bilingualMode ? 'btn-primary' : 'btn-secondary'}
                onClick={handleToggleBilingualLecture}
                style={{ fontSize: '0.82rem', padding: '6px 14px' }}
              >
                {bilingualMode ? 'مفعّل حالياً ✓' : 'تفعيل العرض'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
