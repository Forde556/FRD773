import React, { useState } from 'react';
import { useCoreEngine } from '../../context/CoreEngineContext';
import { PIPELINE_STAGES } from '../../services/processingEngine';
import { sound } from '../../utils/soundscape';
import CyberBrowserLoader from './CyberBrowserLoader';

const SAMPLE_LECTURES = {
  oral_histo: {
    title: 'Oral Histology: Enamel Structure & Amelogenesis',
    text: `Physical and Chemical Properties of Enamel
Enamel is the most highly mineralized and hardest tissue in the human body.
It consists of 96% inorganic minerals (mainly hydroxyapatite crystals) and 4% water and organic matrix.
Enamel cannot regenerate or repair itself cellularly because ameloblasts are lost during tooth eruption.

Microscopic Features of Enamel
Enamel rods (or prisms) are the basic structural units formed by ameloblasts.
Striae of Retzius represent incremental lines of growth during enamel formation.
Hunter-Schreger bands are optical alternating light and dark bands due to rod curvature.
The cementoenamel junction (CEJ) marks the anatomical boundary between enamel and cementum.`,
  },
  prostho: {
    title: 'Prosthodontics: Complete Denture Impressions',
    text: `Primary Impressions and Diagnostic Casts
Primary impressions are taken using stock trays and irreversible hydrocolloid (alginate).
The primary cast is poured with dental plaster to construct a custom special tray for secondary impression.
Relief wax is placed over tissue undercuts and the incisive papilla to prevent pressure trauma.

Border Molding and Final Impression
Border molding records the depth and width of the sulcus accurately using green stick compound.
Secondary impressions are made using zinc oxide eugenol or polyether for extreme accuracy.
Working cast is poured with high-strength dental stone to support the permanent denture base.`,
  },
  materials: {
    title: 'Dental Materials: Gypsum Products & Casting',
    text: `Classification of Dental Gypsum Products
Type I: Impression Plaster, rarely used today due to rigid fracture in undercuts.
Type II: Dental Plaster (Plaster of Paris) used for study casts and flasking procedures.
Type III: Dental Stone used for diagnostic casts and full denture master models.
Type IV and Type V: Die Stone providing superior hardness, abrasion resistance and low setting expansion.

Manipulation and Water-Powder Ratio
Higher water-powder ratio results in longer setting time and lower compressive strength.
Vibration during pouring eliminates entrapped air voids and ensures smooth surface detail.`,
  },
};

export default function IntakeModal({ isOpen, onClose }) {
  const { ingestText, ingestFile, isProcessing, processingStage, error, clearError, translationDisplayMode, setTranslationDisplayMode } = useCoreEngine();
  const [tab, setTab] = useState('file'); // 'file' | 'text'
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  if (!isOpen) return null;

  const handleSubmitText = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await ingestText(text, title.trim() || undefined, 'نص ملصوق');
      onClose();
    } catch {}
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setSelectedFile(file);
    try {
      await ingestFile(file);
      onClose();
    } catch {}
  };

  const loadSample = (key) => {
    const s = SAMPLE_LECTURES[key];
    if (!s) return;
    setTitle(s.title);
    setText(s.text);
    setTab('text');
    sound.tap();
  };

  return (
    <div
      className="intake-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="intake-modal glass-surface-heavy animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 24,
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📄</span>
              <span>رفع المحاضرة وترجمتها وتلخيصها فورياً</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: 4 }}>
              ارفع ملف السلايدات (PDF أو PPTX) أو الصق النص — ستقوم المنصة بترجمة كل سطر، تلخيص النقاط، وترتيبها في شرائح جاهزة للمذاكرة.
            </p>
          </div>
          {!isProcessing && (
            <button className="btn-ghost" onClick={onClose} style={{ fontSize: '1.2rem', padding: '4px 10px' }}>
              ✕
            </button>
          )}
        </div>

        {/* Content Body */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#EF4444',
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: '0.86rem',
                marginBottom: 16,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>⚠️ {error}</span>
              <button onClick={clearError} className="btn-ghost" style={{ padding: '2px 8px', fontSize: '0.8rem' }}>
                تجاهل
              </button>
            </div>
          )}

          {isProcessing ? (
            /* Progress Display */
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <CyberBrowserLoader statusText={processingStage?.customMsg || "AI CLINICAL TRANSLATION & ANALYSIS..."} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
                {processingStage?.customMsg || 'جارٍ معالجة وترجمة وتلخيص المحاضرة...'}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginBottom: 20 }}>
                نقوم باستخراج النصوص والصور، ترجمة كل سطر باللغة العربية، تلخيص النقاط السريرية، وتجهيز الاختبار التفاعلي.
              </p>

              {/* Pipeline Stages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 440, margin: '0 auto', textAlign: 'right' }}>
                {PIPELINE_STAGES.map((stg, i) => {
                  const currentIdx = processingStage?.idx ?? -1;
                  const isDone = currentIdx > i || (processingStage?.status === 'done' && currentIdx >= i);
                  const isCurrent = currentIdx === i;

                  return (
                    <div
                      key={stg.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 14px',
                        borderRadius: 10,
                        background: isCurrent ? 'var(--accent-primary-soft)' : 'var(--surface-card)',
                        border: isCurrent ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        fontSize: '0.84rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>{isDone ? '✅' : isCurrent ? '⏳' : '⚪'}</span>
                        <span style={{ fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--accent-primary)' : 'var(--text-main)' }}>
                          {stg.ar}
                        </span>
                      </div>
                      {isCurrent && <span style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', fontWeight: 700 }}>جارٍ التنفيذ...</span>}
                      {isDone && <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>مكتمل</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                <button
                  className={tab === 'file' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setTab('file')}
                  style={{ flex: 1, padding: '10px 14px', fontSize: '0.88rem', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <span>📁</span>
                  <span>رفع ملف (PDF / PPTX)</span>
                </button>
                <button
                  className={tab === 'text' ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => setTab('text')}
                  style={{ flex: 1, padding: '10px 14px', fontSize: '0.88rem', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <span>✍️</span>
                  <span>لصق نص المحاضرة</span>
                </button>
              </div>

              {/* Translation Mode Selector (Dual Systems) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderRadius: 14,
                  background: 'var(--surface-ground)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: 16,
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-main)', display: 'block' }}>
                    نظام الترجمة المفضل:
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                    يمكنك التبديل بينهما في أي وقت بضغطة زر داخل السلايدات
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setTranslationDisplayMode('lines')}
                    className="btn-ghost"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 10,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: translationDisplayMode === 'lines' ? 'var(--accent-primary)' : 'var(--surface-card)',
                      color: translationDisplayMode === 'lines' ? '#FFFFFF' : 'var(--text-muted)',
                      border: translationDisplayMode === 'lines' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    🔤 سطر بسطر
                  </button>
                  <button
                    type="button"
                    onClick={() => setTranslationDisplayMode('paragraphs')}
                    className="btn-ghost"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 10,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: translationDisplayMode === 'paragraphs' ? 'var(--accent-primary)' : 'var(--surface-card)',
                      color: translationDisplayMode === 'paragraphs' ? '#FFFFFF' : 'var(--text-muted)',
                      border: translationDisplayMode === 'paragraphs' ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    📄 فقرة كاملة
                  </button>
                </div>
              </div>

              {tab === 'file' ? (
                /* Dropzone */
                <div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileUpload(file);
                    }}
                    onClick={() => document.getElementById('intake-file-input')?.click()}
                    style={{
                      border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-strong)'}`,
                      borderRadius: 20,
                      padding: '44px 20px',
                      textAlign: 'center',
                      background: dragOver ? 'var(--accent-primary-soft)' : 'var(--surface-ground)',
                      cursor: 'pointer',
                      transition: 'all var(--trans-normal)',
                    }}
                  >
                    <input
                      id="intake-file-input"
                      type="file"
                      accept=".pdf,.pptx,.txt,.md"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                    />
                    <div style={{ fontSize: '3.2rem', marginBottom: 12 }}>📤</div>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)', marginBottom: 6 }}>
                      انقر لاختيار ملف المحاضرة أو اسحبه إلى هنا
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                      يدعم ملفات السلايدات <b style={{ color: 'var(--accent-primary)' }}>PDF</b> وبوربوينت <b style={{ color: 'var(--accent-primary)' }}>PPTX</b> والملفات النصية (TXT / MD).
                    </div>
                  </div>

                  {/* Quick Clinical Samples */}
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', fontWeight: 700, marginBottom: 8 }}>
                      أو جرّب إحدى المحاضرات السريرية التوضيحية بنقرة واحدة:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      <button
                        onClick={() => loadSample('oral_histo')}
                        className="btn-ghost"
                        style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: 10, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
                      >
                        🔬 Oral Histology (الأنسجة)
                      </button>
                      <button
                        onClick={() => loadSample('prostho')}
                        className="btn-ghost"
                        style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: 10, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
                      >
                        🦿 Prosthodontics (التعويضات)
                      </button>
                      <button
                        onClick={() => loadSample('materials')}
                        className="btn-ghost"
                        style={{ fontSize: '0.78rem', padding: '6px 12px', borderRadius: 10, background: 'var(--surface-card)', border: '1px solid var(--border-subtle)' }}
                      >
                        🧪 Dental Materials (المواد)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Text Area Input */
                <form onSubmit={handleSubmitText} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-main)' }}>
                      عنوان المحاضرة (اختياري)
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="مثال: Endodontic Access Cavity Preparation"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: 'var(--surface-ground)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        color: 'var(--text-main)',
                      }}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        محتوى المحاضرة باللغة الإنجليزية
                      </label>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
                        سيتم ترجمة كل سطر تحت النص مباشرة
                      </span>
                    </div>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={9}
                      placeholder="الصق نص المحاضرة هنا باللغة الإنجليزية... سيتم تفكيكها إلى شرائح وترجمتها وتلخيصها."
                      required
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 12,
                        background: 'var(--surface-ground)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        fontFamily: 'var(--font-latin)',
                        outline: 'none',
                        resize: 'vertical',
                        color: 'var(--text-main)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                    <button type="button" className="btn-secondary" onClick={onClose} style={{ borderRadius: 12 }}>
                      إلغاء
                    </button>
                    <button type="submit" className="btn-primary" disabled={!text.trim()} style={{ borderRadius: 12, padding: '10px 24px', fontWeight: 800 }}>
                      ⚡ ترجمة وتلخيص وترتيب المحاضرة الآن
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
