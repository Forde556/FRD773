import React, { useState, useRef } from 'react';
import { useCoreEngine } from '../../context/CoreEngineContext';
import { useEditor } from '../../context/EditorContext';
import { NODE_TYPES } from '../../services/processingEngine';
import { HIGHLIGHT_TONES } from '../../utils/formatters';
import { sound } from '../../utils/soundscape';

export default function LectureEditor() {
  const { activeLecture } = useCoreEngine();
  const {
    edits,
    saveStatus,
    updateSlideTitle,
    updateNodeText,
    addClinicalPearl,
    deleteClinicalPearl,
    addDiagram,
    removeDiagram,
    resetAllCustomizations,
  } = useEditor();

  const [activeTone, setActiveTone] = useState('amber');
  const [pearlDrafts, setPearlDrafts] = useState({});
  const fileInputRef = useRef({});

  if (!activeLecture) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✍️</div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>يرجى اختيار محاضرة أولاً للبدء بالتخصيص</h3>
      </div>
    );
  }

  const { slides, nodes } = activeLecture;

  const applyHighlight = (tone) => {
    sound.tap();
    setActiveTone(tone);
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const mark = document.createElement('mark');
    mark.setAttribute('data-tone', tone);
    mark.appendChild(range.extractContents());
    range.insertNode(mark);
    selection.removeAllRanges();

    // Trigger input event on the container contentEditable
    const parentEditable = mark.closest('[contenteditable="true"]');
    if (parentEditable) {
      parentEditable.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  const handleDiagramUpload = (slideId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      addDiagram(slideId, { url: e.target.result, caption: file.name.replace(/\.[^/.]+$/, '') });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="container" style={{ padding: '24px 20px 60px' }}>
      {/* Editor Floating Toolbar */}
      <div
        className="glass-surface-heavy editor-toolbox"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '12px 20px',
          marginBottom: 24,
          position: 'sticky',
          top: 76,
          zIndex: 30,
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
            محرر المحاضرة التفاعلي
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            عدّل العناوين والنصوص، وظلل بالألوان الهادئة، وأضف مخططاتك ولآلئك السريرية الخاصة دون التأثير على الأصل.
          </p>
        </div>

        {/* Formatting Tools & Autosave Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Pastel Tones Palette */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-ground)', padding: '4px 8px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-subtle)', marginLeft: 4 }}>
              قلم التظليل:
            </span>
            {HIGHLIGHT_TONES.map((tone) => (
              <button
                key={tone}
                onClick={() => applyHighlight(tone)}
                title={`تظليل بلون ${tone}`}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: activeTone === tone ? '2px solid var(--text-main)' : '1px solid rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  backgroundColor:
                    tone === 'amber'
                      ? '#FDE047'
                      : tone === 'mint'
                      ? '#6EE7B7'
                      : tone === 'rose'
                      ? '#FDA4AF'
                      : tone === 'lavender'
                      ? '#D8B4FE'
                      : '#7DD3FC',
                }}
              />
            ))}
          </div>

          {/* Autosave Status */}
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              color: saveStatus === 'error'
                ? '#EF4444'
                : saveStatus === 'saving' || saveStatus === 'dirty'
                  ? '#F59E0B'
                  : 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>
              {saveStatus === 'saving'
                ? '⏳ جاري الحفظ...'
                : saveStatus === 'dirty'
                  ? '⏳ بانتظار الحفظ...'
                  : saveStatus === 'error'
                    ? '⚠️ تعذر الحفظ محلياً'
                    : '✓ تم الحفظ محلياً'}
            </span>
          </div>

          {/* Reset custom edits */}
          <button
            className="btn-ghost"
            onClick={() => {
              if (window.confirm('هل أنت متأكد من استعادة المحاضرة الأصلية وإلغاء جميع تعديلاتك؟')) {
                resetAllCustomizations();
              }
            }}
            style={{ fontSize: '0.78rem', color: '#EF4444' }}
          >
            استعادة الأصل
          </button>
        </div>
      </div>

      {/* Slide Customizer List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {slides.map((slide, sIdx) => {
          const slideNumber = slide.number ?? sIdx + 1;
          const slideNodes = (nodes || []).filter((node) => node.slideNumber === slideNumber);
          const currentSlideTitle = edits.customTitles[slide.id] || slide.title;
          const slideDiagrams = edits.diagrams[slide.id] || [];
          const slidePearls = edits.pearls[slide.id] || [];

          return (
            <div
              key={slide.id}
              className="glass-surface"
              style={{
                padding: '24px 28px',
                border: '1px solid var(--border-subtle)',
                position: 'relative',
              }}
            >
              {/* Slide Heading Editable */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--accent-primary-soft)', padding: '2px 8px', borderRadius: 6 }}>
                    شريحة {sIdx + 1}
                  </span>
                  <input
                    type="text"
                    value={currentSlideTitle}
                    onChange={(e) => updateSlideTitle(slide.id, e.target.value)}
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px dashed var(--border-light)',
                      padding: '4px 6px',
                      width: '80%',
                      outline: 'none',
                    }}
                    title="اضغط لتعديل عنوان الشريحة"
                  />
                </div>

                {/* Diagram Upload Trigger */}
                <div>
                  <input
                    type="file"
                    ref={(el) => (fileInputRef.current[slide.id] = el)}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleDiagramUpload(slide.id, e.target.files[0]);
                    }}
                  />
                  <button
                    className="btn-secondary"
                    onClick={() => fileInputRef.current[slide.id]?.click()}
                    style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                  >
                    📷 إرفاق رسم / صورة شعاعية
                  </button>
                </div>
              </div>

              {/* Diagrams Attached */}
              {slideDiagrams.length > 0 && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
                  {slideDiagrams.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        position: 'relative',
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: '1px solid var(--border-subtle)',
                        maxWidth: 240,
                      }}
                    >
                      <img src={d.url} alt={d.caption} style={{ width: '100%', maxHeight: 160, objectFit: 'contain' }} />
                      <button
                        onClick={() => removeDiagram(slide.id, d.id)}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          background: 'rgba(239, 68, 68, 0.85)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          width: 22,
                          height: 22,
                          cursor: 'pointer',
                        }}
                        title="حذف الرسم"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Node List Editable */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {slideNodes.map((node) => {
                  const typeDef = NODE_TYPES[node.type] || NODE_TYPES.concept;
                  const currentHtml = edits.customNodeContent[node.id] || node.text;
                  const nodePearls = edits.pearls[node.id] || [];

                  return (
                    <div
                      key={node.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 12,
                        background: 'var(--surface-ground)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span className={`badge-clinical badge-${typeDef.key}`}>{typeDef.ar}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                          انقر على النص أدناه للتعديل المباشر
                        </span>
                      </div>

                      {/* Content Editable Body */}
                      <div
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => updateNodeText(node.id, e.currentTarget.innerHTML)}
                        dangerouslySetInnerHTML={{ __html: currentHtml }}
                        style={{
                          fontSize: '0.94rem',
                          lineHeight: 1.65,
                          outline: 'none',
                          padding: '6px 8px',
                          borderRadius: 8,
                          background: 'var(--surface-card)',
                          border: '1px solid transparent',
                          transition: 'border-color var(--trans-fast)',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        }}
                      />

                      {/* Node Pearls */}
                      {nodePearls.length > 0 && (
                        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {nodePearls.map((p) => (
                            <div
                              key={p.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 10px',
                                borderRadius: 8,
                                background: 'rgba(250, 204, 21, 0.14)',
                                border: '1px solid rgba(250, 204, 21, 0.35)',
                                fontSize: '0.82rem',
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 700, color: '#D97706' }}>💡 همسة: </span>
                                <span>{p.text}</span>
                              </div>
                              <button
                                className="btn-ghost"
                                onClick={() => deleteClinicalPearl(node.id, p.id)}
                                style={{ padding: 2, fontSize: '0.8rem', color: '#EF4444' }}
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Clinical Pearl Input for this Slide */}
              <div style={{ marginTop: 18, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    value={pearlDrafts[slide.id] || ''}
                    onChange={(e) => setPearlDrafts({ ...pearlDrafts, [slide.id]: e.target.value })}
                    placeholder="أضف لؤلؤة سريرية أو ملاحظة شخصية لهذه الشريحة..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: 'var(--surface-ground)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.86rem',
                      outline: 'none',
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addClinicalPearl(slide.id, pearlDrafts[slide.id]);
                        setPearlDrafts({ ...pearlDrafts, [slide.id]: '' });
                      }
                    }}
                  />
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      addClinicalPearl(slide.id, pearlDrafts[slide.id]);
                      setPearlDrafts({ ...pearlDrafts, [slide.id]: '' });
                    }}
                    style={{ fontSize: '0.84rem' }}
                  >
                    + إضافة لؤلؤة
                  </button>
                </div>

                {/* Slide Pearls List */}
                {slidePearls.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {slidePearls.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: 'rgba(250, 204, 21, 0.12)',
                          border: '1px solid rgba(250, 204, 21, 0.35)',
                          fontSize: '0.84rem',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, color: '#D97706' }}>💡 لؤلؤة سريرية: </span>
                          <span>{p.text}</span>
                        </div>
                        <button
                          className="btn-ghost"
                          onClick={() => deleteClinicalPearl(slide.id, p.id)}
                          style={{ padding: 2, fontSize: '0.8rem', color: '#EF4444' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
