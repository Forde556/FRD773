import React from 'react';
import { useCoreEngine } from '../../context/CoreEngineContext';

export default function CoreEngineMetrics() {
  const { activeLecture } = useCoreEngine();

  if (!activeLecture) {
    return <div style={{ padding: 60, textAlign: 'center' }}>لا توجد بيانات محرك متوفرة.</div>;
  }

  const metrics = activeLecture.metrics || {};
  const nodes = activeLecture.nodes || [];
  const units = activeLecture.units || [];
  const terms = activeLecture.terms || [];
  const wordsCount = metrics.wordsCount ?? (activeLecture.rawText || '').split(/\s+/).filter(Boolean).length;
  const slideCount = metrics.slideCount ?? (activeLecture.slides || []).length;
  const glossaryCount = metrics.glossaryCount ?? (activeLecture.glossary || []).length;
  const readingMinutes = metrics.readingMinutes ?? Math.max(1, Math.round(wordsCount / 150));

  return (
    <div className="container metrics-page" style={{ padding: '24px 20px 60px' }}>
      {/* Header */}
      <div className="glass-surface-heavy metrics-header" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>إحصاءات المحاضرة</span>
          <span style={{ fontSize: '0.8rem', background: 'var(--accent-primary-soft)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
            نواة المعالجة السريرية
          </span>
        </h2>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginTop: 4 }}>
          أعداد مستخرجة من محتوى المحاضرة الحالي. لا تمثل هذه الإحصاءات قياساً لدقة الترجمة أو ضماناً لعدم فقدان المعلومات.
        </p>
      </div>

      {/* Observable lecture statistics */}
      <div className="metrics-cards">
        <div className="glass-surface metric-card">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontWeight: 600 }}>كلمات النص الأصلي</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: 4 }}>{wordsCount}</div>
        </div>
        <div className="glass-surface metric-card">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontWeight: 600 }}>الشرائح</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: 4 }}>{slideCount}</div>
        </div>
        <div className="glass-surface metric-card">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontWeight: 600 }}>مصطلحات مفهرسة</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: 4 }}>{glossaryCount}</div>
        </div>
        <div className="glass-surface metric-card">
          <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontWeight: 600 }}>وقت قراءة تقديري</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: 4 }}>{readingMinutes} دقيقة</div>
        </div>
      </div>

      {/* Extracted content and study units */}
      <div className="metrics-details">
        <div className="glass-surface metrics-panel">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 16 }}>محتوى المحاضرة المستخرج</h3>
          <div className="metrics-breakdown">
            {[
              ['كتل المحتوى', nodes.length],
              ['وحدات الدراسة', units.length],
              ['مصطلحات القاموس', terms.length],
            ].map(([label, count]) => (
              <div key={label} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--surface-ground)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>{label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginTop: 4 }}>{count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-surface metrics-panel">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 12 }}>
            وحدات الدراسة
          </h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: 14 }}>
            مصطلحات مختارة من محتوى المحاضرة للمراجعة:
          </p>

          <div className="metrics-units">
            {units.length > 0 ? (
              units.map((u, i) => (
                <div
                  key={i}
                  className="metrics-unit"
                >
                  <div className="metrics-unit__terms">
                    <span className="metrics-unit__english">{u.term}</span>
                    {u.ar && <span className="metrics-unit__arabic">{u.ar}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>لا توجد وحدات ربط سياقي متعددة الأبعاد.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
