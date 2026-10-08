import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { useCoreEngine } from '../../context/CoreEngineContext';
import { hasGeminiKey } from '../../services/geminiService';
import { sound } from '../../utils/soundscape';
import ThemeSwitch from '../common/ThemeSwitch';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenIntake,
  onOpenExport,
  onOpenTranslateModal,
  onOpenGeminiModal,
}) {
  const { theme, toggleTheme, soundActive, toggleSound } = useTheme();
  const { activeLecture, savedLectures, selectLecture } = useCoreEngine();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const isGeminiActive = hasGeminiKey();

  const tabs = [
    { id: 'canvas', label: 'المحاضرة والترجمة', icon: '📑' },
    { id: 'editor', label: 'محرر المحاضرة', icon: '✍️' },
    { id: 'terms', label: 'مترجم المصطلحات', icon: '🔍' },
    { id: 'dictionary', label: 'القاموس السني', icon: '📖' },
    { id: 'library', label: 'مكتبتي المحفوظة', icon: '🗂️' },
    { id: 'exam', label: 'الاختبار المنهجي', icon: '📝' },
    { id: 'games', label: 'ألعاب التثبيت', icon: '⚡' },
    { id: 'engine', label: 'إحصاءات المحاضرة', icon: '📊' },
  ];

  return (
    <header className="app-navbar glass-surface-heavy" style={{ position: 'sticky', top: 12, zIndex: 40, margin: '12px 24px 0', borderRadius: 20 }}>
      <div className="app-navbar__layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', gap: 14 }}>
        {/* Brand & Lecture Switcher */}
        <div className="app-navbar__identity" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="app-navbar__brand" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setActiveTab('canvas')}>
            <img src="/assets/icons/tooth.svg" alt="FRD" style={{ width: 34, height: 34, filter: 'drop-shadow(0 2px 8px var(--accent-primary-glow))' }} />
            <div>
              <div className="app-navbar__brand-title" style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--text-main)', lineHeight: 1.1 }}>
                FRD 🦷
              </div>
              <div className="app-navbar__brand-subtitle" style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
                منصة ترجمة وتلخيص وترتيب محاضرات طب الأسنان
              </div>
            </div>
          </div>

          <div className="app-navbar__divider" style={{ height: 26, width: 1, backgroundColor: 'var(--border-subtle)', margin: '0 4px' }} />

          {/* Lecture Dropdown */}
          <div className="app-navbar__lecture" style={{ position: 'relative' }}>
            <button
              className="btn-secondary"
              onClick={() => {
                sound.tap();
                setDropdownOpen(!dropdownOpen);
              }}
              style={{ fontSize: '0.84rem', padding: '6px 12px', maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}
              title={activeLecture?.title || 'اختر محاضرة'}
            >
              <span>📚</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeLecture?.title || 'جاري التحميل...'}
              </span>
              <span style={{ fontSize: '0.7rem' }}>▼</span>
            </button>

            {dropdownOpen && (
              <div
                className="glass-surface-heavy"
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: 290,
                  padding: 8,
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  boxShadow: 'var(--shadow-lg)',
                  borderRadius: 14,
                }}
              >
                <div style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', padding: '4px 8px', fontWeight: 600 }}>
                  المحاضرات المحفوظة محلياً ({savedLectures.length})
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {savedLectures.map((lec) => (
                    <button
                      key={lec.id}
                      className="btn-ghost"
                      onClick={() => {
                        selectLecture(lec.id);
                        setDropdownOpen(false);
                        setActiveTab('canvas');
                      }}
                      style={{
                        justifyContent: 'flex-start',
                        textAlign: 'right',
                        width: '100%',
                        fontSize: '0.82rem',
                        fontWeight: lec.id === activeLecture?.id ? 700 : 500,
                        color: lec.id === activeLecture?.id ? 'var(--accent-primary)' : 'var(--text-main)',
                        backgroundColor: lec.id === activeLecture?.id ? 'var(--accent-primary-soft)' : 'transparent',
                        padding: '8px 10px',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                        {lec.title}
                      </span>
                    </button>
                  ))}
                </div>
                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 4, paddingTop: 6 }}>
                  <button
                    className="glowbutton purple sm"
                    onClick={() => {
                      setDropdownOpen(false);
                      onOpenIntake();
                    }}
                    style={{ width: '100%', fontSize: '0.82rem' }}
                  >
                    + استيراد محاضرة جديدة
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--surface-ground)', padding: 4, borderRadius: 14 }}>
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.tap();
                  setActiveTab(tab.id);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderRadius: 10,
                  fontSize: '0.84rem',
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
                  backgroundColor: active ? 'var(--surface-card-hover)' : 'transparent',
                  border: active ? '1px solid var(--border-light)' : '1px solid transparent',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all var(--trans-fast)',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions & Utilities */}
        <div className="app-navbar__actions" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Gemini AI Settings Button */}
          <button
            onClick={onOpenGeminiModal}
            className="btn-secondary"
            aria-label="Gemini AI"
            title="إعدادات الذكاء الاصطناعي المجاني (Gemini AI)"
            style={{
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isGeminiActive ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-ground)',
              borderColor: isGeminiActive ? '#10B981' : 'var(--border-subtle)',
              color: isGeminiActive ? '#10B981' : 'var(--text-main)',
            }}
          >
            <span>✨</span>
            <span>Gemini AI</span>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: isGeminiActive ? '#10B981' : '#94A3B8',
                display: 'inline-block',
              }}
            />
          </button>

          {/* Prominent Upload Button */}
          <button
            className="btn-primary"
            aria-label="رفع محاضرة"
            onClick={onOpenIntake}
            title="رفع وترجمة محاضرة جديدة (PDF / PPTX)"
            style={{ padding: '7px 14px', fontSize: '0.82rem', fontWeight: 800, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>📁</span>
            <span>رفع محاضرة</span>
          </button>

          {/* Developer Telegram Contact */}
          <a
            className="app-navbar__developer"
            href="https://t.me/FordeReter"
            target="_blank"
            rel="noopener noreferrer"
            title="المطور: د. عبدالله فاضل (@FordeReter) — قناة الأسهل بطب الأسنان"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              borderRadius: 999,
              padding: '5px 10px',
              fontSize: '0.76rem',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span>✈️</span>
            <span>د. عبدالله فاضل</span>
          </a>

          {/* Export / Print Lecture */}
          <button
            className="uiverse-download-btn"
            aria-label="طباعة الملزمة"
            onClick={onOpenExport}
            title="طباعة وتحميل الملزمة كـ PDF"
            style={{ padding: '6px 14px', fontSize: '0.82rem', minHeight: 34 }}
          >
            <span>🖨️</span>
            <span>طباعة الملزمة</span>
            <div className="uiverse-download-tooltip">
              تصدير وطباعة A4
            </div>
          </button>

          {/* Sound Toggle */}
          <button
            className="btn-ghost"
            onClick={toggleSound}
            title={soundActive ? 'كتم المؤثرات الهادئة' : 'تفعيل المؤثرات الهادئة'}
            style={{ padding: 6, fontSize: '1rem', borderRadius: 10 }}
          >
            {soundActive ? '🔊' : '🔇'}
          </button>

          {/* Animated Day / Night Switch */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ThemeSwitch />
          </div>
        </div>
      </div>
    </header>
  );
}
