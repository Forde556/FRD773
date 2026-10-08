import React, { useState } from 'react';
import { useCoreEngine } from '../../context/CoreEngineContext';
import { useEditor } from '../../context/EditorContext';
import { downloadPdf, printDocument, safeFilename } from '../../services/pdfService';
import { sound } from '../../utils/soundscape';
import DentalLoader from '../common/DentalLoader';

export default function ExportModal({ isOpen, onClose }) {
  const { activeLecture, translationDisplayMode } = useCoreEngine();
  const { edits } = useEditor();
  const [isExporting, setIsExporting] = useState(false);
  const [includePearls, setIncludePearls] = useState(true);
  const [includeDiagrams, setIncludeDiagrams] = useState(true);

  if (!isOpen || !activeLecture) return null;

  const { title, slides = [], nodes = [] } = activeLecture;

  const handleDownload = async () => {
    sound.tap();
    setIsExporting(true);
    try {
      const el = document.getElementById('print-export-document');
      await downloadPdf(el, safeFilename(title));
      sound.complete();
      onClose();
    } catch (err) {
      console.error(err);
      sound.gentleError();
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    sound.tap();
    window.addEventListener('afterprint', onClose, { once: true });
    printDocument();
  };

  return (
    <div
      className="print-hide export-modal-overlay"
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
          maxWidth: 600,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
              تصدير المحاضرة كـ PDF وطباعة A4
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              تنسيق A4 مخصص لمنع انقطاع البطاقات والمخططات بين الصفحات مع إبقاء الخطوط حادة وواضحة.
            </p>
          </div>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: '1.2rem', padding: '4px 10px' }}>
            ✕
          </button>
        </div>

        {/* Body Options */}
        <div style={{ padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={includePearls}
                onChange={(e) => setIncludePearls(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
              />
              <span>تضمين اللآلئ والملاحظات السريرية الشخصية المضافة</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={includeDiagrams}
                onChange={(e) => setIncludeDiagrams(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
              />
              <span>تضمين الصور الشعاعية والمخططات التوضيحية المرفقة</span>
            </label>
          </div>

          {/* Action Buttons or Exporting Loader */}
          {isExporting ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <DentalLoader text="الأسـهـل بطب الأسـنان" variant="medical" />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: 8 }}>
                جاري تجميع بطاقات المحاضرة والمخططات بجودة A4 عالية...
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {/* Uiverse.io Download Button */}
              <button
                className="uiverse-download-btn"
                onClick={handleDownload}
                style={{ flex: 1, minWidth: 200 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="currentColor" d="M6 21H18M12 3V17M12 17L17 12M12 17L7 12" />
                </svg>
                <span>تحميل الملزمة PDF</span>
                <div className="uiverse-download-tooltip">
                  حفظ كملف PDF عالي الدقة A4
                </div>
              </button>

              {/* Uiverse.io Print Button */}
              <button
                className="uiverse-download-btn print-mode"
                onClick={handlePrint}
                disabled={isExporting}
                style={{ flex: 1, minWidth: 200 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2" stroke="currentColor" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>طباعة الملزمة A4</span>
                <div className="uiverse-download-tooltip">
                  طباعة فورية متجهة بدون تقطيع
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Printable Document for html2pdf / print preview */}
      <div id="print-export-document" className="print-document" style={{ display: 'none' }}>
        <div style={{ padding: '24px', maxWidth: '780px', margin: '0 auto', background: '#fff', color: '#0F172A', direction: 'rtl' }}>
          {/* Print Header */}
          <div style={{ borderBottom: '2px solid #0D9488', paddingBottom: 14, marginBottom: 24 }}>
            <h1 style={{ fontSize: '22pt', fontWeight: 800, color: '#0D9488', margin: 0 }}>{title}</h1>
            <div style={{ fontSize: '9pt', color: '#64748B', marginTop: 4 }}>
              FRD — منصة ترجمة وتلخيص وترتيب محاضرات طب الأسنان · نُسخة التصدير السريرية المعتمدة
            </div>
          </div>

          {/* Slides Loop */}
          {slides.map((s, idx) => {
            const slideTitle = edits.customTitles[s.id] || s.title;
            const slideNumber = s.number ?? idx + 1;
            const slideNodes = nodes.filter((node) => node.slideNumber === slideNumber);
            const useParagraphs = translationDisplayMode === 'paragraphs' && s.paragraphs?.length > 0;
            const exportItems = useParagraphs
              ? s.paragraphs.map((item) => ({ ...item, nodeId: null }))
              : (s.blocks || []).map((item, itemIndex) => ({
                  ...item,
                  content: edits.customNodeContent[slideNodes[itemIndex]?.id] || null,
                  nodeId: slideNodes[itemIndex]?.id,
                }));
            const slideDiagrams = includeDiagrams ? edits.diagrams[s.id] || [] : [];
            const slidePearls = includePearls ? edits.pearls[s.id] || [] : [];

            return (
              <div
                key={s.id}
                className="print-slide"
                style={{
                  marginBottom: '20pt',
                  border: '1pt solid #CBD5E1',
                  borderRadius: '8pt',
                  padding: '14pt',
                  pageBreakInside: 'avoid',
                }}
              >
                <h2 style={{ fontSize: '14pt', fontWeight: 700, color: '#0D9488', marginBottom: '10pt' }}>
                  {idx + 1}. {slideTitle}
                </h2>

                {slideDiagrams.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                    {slideDiagrams.map((d) => (
                      <div key={d.id} className="print-figure" style={{ maxWidth: 220 }}>
                        <img src={d.url} alt={d.caption} style={{ width: '100%', maxHeight: 160, objectFit: 'contain' }} />
                        {d.caption && <div style={{ fontSize: '8pt', color: '#64748B' }}>{d.caption}</div>}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8pt' }}>
                  {exportItems.map((item) => {
                    const nodePearls = includePearls && item.nodeId ? edits.pearls[item.nodeId] || [] : [];

                    return (
                      <div key={item.id} className="print-block" style={{ fontSize: '10pt', lineHeight: 1.55 }}>
                        {item.content ? (
                          <div dangerouslySetInnerHTML={{ __html: item.content }} />
                        ) : (
                          <div>{item.en}</div>
                        )}
                        {item.ar && (
                          <div dir="rtl" lang="ar" style={{ marginTop: 5, color: '#334155' }}>
                            {item.ar}
                          </div>
                        )}
                        {nodePearls.map((p) => (
                          <div key={p.id} className="print-pearl" style={{ marginTop: 4, fontSize: '8.5pt', color: '#B45309' }}>
                            💡 {p.text}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                {slidePearls.map((p) => (
                  <div key={p.id} className="print-pearl" style={{ marginTop: 8, fontSize: '9pt', color: '#B45309' }}>
                    💡 لؤلؤة سريرية: {p.text}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
