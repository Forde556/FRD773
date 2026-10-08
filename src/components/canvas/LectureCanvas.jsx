import React, { useState, useMemo, useEffect } from 'react';
import { useCoreEngine } from '../../context/CoreEngineContext';
import { useEditor } from '../../context/EditorContext';
import { sound } from '../../utils/soundscape';
import { stripHtml } from '../../utils/formatters';
import {
  getTermMeaning,
  analyzeMedicalTerm,
  speakText,
  getDentalDictionary,
  translateText,
} from '../../services/translationService';
import { generateLectureQuiz } from '../../services/processingEngine';

export default function LectureCanvas({ onSelectTextForTranslation }) {
  const {
    activeLecture,
    updateSlideTranslation,
    updateSlideParagraphTranslation,
    translationDisplayMode,
    setTranslationDisplayMode,
    isProcessing,
  } = useCoreEngine();
  const { edits } = useEditor();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSizeLevel, setFontSizeLevel] = useState('normal'); // 'normal' | 'large' | 'xlarge'
  const [showSummary, setShowSummary] = useState(true);
  const [showGlossary, setShowGlossary] = useState(true);
  const [showQuiz, setShowQuiz] = useState(true);
  const [activeTermModal, setActiveTermModal] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [copyToast, setCopyToast] = useState('');
  const [translatingIds, setTranslatingIds] = useState(new Set());

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(0);

  const slides = activeLecture?.slides || [];
  const summary = activeLecture?.summary || {
    overview: 'تتناول هذه المحاضرة المفاهيم والخطوات السريرية التخصصية لدراسة الحالة.',
    benefits: ['فهم المبادئ السريرية', 'تطبيق الإجراءات العلاجية بدقة', 'تفادي الأخطاء الشائعة'],
  };
  const glossary = activeLecture?.glossary || [];

  // Reset quiz automatically whenever a different lecture is selected/uploaded
  useEffect(() => {
    setQuizQuestions(null);
    setQuizAnswers({});
    setQuizScore(0);
  }, [activeLecture?.id]);

  // Quiz generator
  const currentQuiz = useMemo(() => {
    if (quizQuestions) return quizQuestions;
    if (activeLecture?.quiz && activeLecture.quiz.length > 0) {
      return activeLecture.quiz;
    }
    return generateLectureQuiz(glossary, activeLecture, 7);
  }, [quizQuestions, activeLecture, glossary]);

  const handleRegenerateQuiz = () => {
    sound.tap();
    const newQ = generateLectureQuiz(glossary, activeLecture, 7);
    setQuizQuestions(newQ);
    setQuizAnswers({});
    setQuizScore(0);
  };

  const handleAnswerQuiz = (qId, option, correct) => {
    if (quizAnswers[qId]) return;
    const isCorrect = option.trim() === correct.trim();
    if (isCorrect) {
      sound.complete();
      setQuizScore((prev) => prev + 1);
    } else {
      sound.gentleError();
    }
    setQuizAnswers((prev) => ({
      ...prev,
      [qId]: { selected: option, isCorrect },
    }));
  };

  // Re-translate single line or paragraph on the fly
  const handleRetranslateItem = async (slideId, item, isParagraph = false) => {
    sound.tap();
    setTranslatingIds((prev) => new Set([...prev, item.id]));
    try {
      const slide = slides.find((entry) => entry.id === slideId);
      const sourceText = isParagraph
        ? (slide?.blocks || []).map((block) => block.en).filter(Boolean).join(' ').trim() || item.en
        : item.en;
      const newAr = await translateText(sourceText);
      if (isParagraph) {
        updateSlideParagraphTranslation(slideId, item.id, newAr, sourceText);
      } else {
        updateSlideTranslation(slideId, item.id, newAr);
      }
      sound.success();
    } catch {
      sound.gentleError();
    } finally {
      setTranslatingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  // Filter slides by search text
  const filteredSlides = useMemo(() => {
    if (!searchQuery.trim()) return slides;
    const q = searchQuery.toLowerCase().trim();
    return slides.filter((s) => {
      const matchTitle = (s.title || '').toLowerCase().includes(q);
      const matchBlocks = (s.blocks || []).some(
        (b) => (b.en || '').toLowerCase().includes(q) || (b.ar || '').toLowerCase().includes(q)
      );
      const matchParas = (s.paragraphs || []).some(
        (p) => (p.en || '').toLowerCase().includes(q) || (p.ar || '').toLowerCase().includes(q)
      );
      return matchTitle || matchBlocks || matchParas;
    });
  }, [slides, searchQuery]);

  // Copy single slide
  const handleCopySlide = (slide) => {
    sound.tap();
    const slideTitle = edits.customTitles?.[slide.id] || slide.title;
    let text = `--- الشريحة ${slide.number || slide.id}: ${slideTitle || ''} ---\n\n`;
    const items = translationDisplayMode === 'paragraphs'
      ? (slide.paragraphs || [])
      : (slide.blocks || []).map((block, index) => {
          const node = (activeLecture.nodes || []).filter((item) => item.slideNumber === slide.number)[index];
          const customHtml = edits.customNodeContent?.[node?.id];
          return customHtml ? { ...block, en: stripHtml(customHtml) } : block;
        });
    items.forEach((item) => {
      text += `• ${item.en}\n  [الترجمة]: ${item.ar}\n\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopyToast(`تم نسخ الشريحة ${slide.number || ''} بنجاح ✓`);
      setTimeout(() => setCopyToast(''), 3000);
    });
  };

  // Term Modal & Highlights
  const handleTermClick = (word) => {
    sound.tap();
    const clean = word.toLowerCase().trim();
    const meaning = getTermMeaning(clean) || 'مصطلح سني سريري';
    const morph = analyzeMedicalTerm(clean);
    setActiveTermModal({
      en: word,
      ar: meaning,
      morph: morph ? `التحليل المورفولوجي: ${morph}` : null,
    });
  };

  const renderEnglishWithTerms = (text) => {
    if (!text) return '';
    const dict = getDentalDictionary();
    const words = text.split(/(\s+|[.,;!?()]+)/);

    return words.map((w, idx) => {
      const low = w.toLowerCase().replace(/[^a-z]/g, '');
      if (low.length >= 3 && (dict.has(low) || analyzeMedicalTerm(low))) {
        return (
          <span
            key={idx}
            className="term-u"
            onClick={(e) => {
              e.stopPropagation();
              handleTermClick(low);
            }}
            title="انقر لعرض معنى ونطق المصطلح"
          >
            {w}
          </span>
        );
      }
      return <span key={idx}>{w}</span>;
    });
  };

  const handleJumpToSlide = (num) => {
    const el = document.getElementById(`slide-card-${num}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const fontSizeEn = fontSizeLevel === 'xlarge' ? '1.08rem' : fontSizeLevel === 'large' ? '1rem' : '0.94rem';
  const fontSizeAr = fontSizeLevel === 'xlarge' ? '1.05rem' : fontSizeLevel === 'large' ? '0.98rem' : '0.92rem';

  if (!activeLecture) {
    return (
      <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 14 }}>📚</div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
          {isProcessing ? 'جارٍ تفكيك وترجمة المحاضرة...' : 'لا توجد محاضرة محددة حالياً'}
        </h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-subtle)', marginTop: 6 }}>
          ارفع ملف سلايدات PDF أو بوربوينت من الأعلى لبدء الترجمة الفورية والتلخيص الذكي.
        </p>
      </div>
    );
  }

  const isParagraphMode = translationDisplayMode === 'paragraphs';

  return (
    <div className="container" style={{ padding: '20px 16px 80px', maxWidth: 1100 }}>
      {/* Toast Notification */}
      {copyToast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: 24,
            zIndex: 90,
            background: 'var(--accent-primary)',
            color: '#FFFFFF',
            padding: '10px 18px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '0.86rem',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {copyToast}
        </div>
      )}

      {/* Lightbox Image Zoom */}
      {zoomedImage && (
        <div
          className="modal-overlay animate-fade-in"
          onClick={() => setZoomedImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(0, 0, 0, 0.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            cursor: 'zoom-out',
          }}
        >
          <img
            src={zoomedImage}
            alt="تكبير الشريحة"
            style={{ maxWidth: '95vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}
          />
        </div>
      )}

      {/* Action Header Bar (No Print) */}
      <div
        className="glass-surface-heavy no-print animate-fade-in"
        style={{
          padding: '12px 18px',
          borderRadius: 18,
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Toggle Mode: Lines vs Paragraphs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              background: 'var(--surface-ground)',
              padding: 3,
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => {
                sound.tap();
                setTranslationDisplayMode('lines');
              }}
              style={{
                padding: '7px 16px',
                borderRadius: 9,
                fontSize: '0.84rem',
                fontWeight: !isParagraphMode ? 800 : 500,
                background: !isParagraphMode ? 'var(--accent-primary)' : 'transparent',
                color: !isParagraphMode ? '#FFFFFF' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--trans-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="نظام الترجمة سطر بسطر: ترجمة كل جملة أو نقطة على حدة مباشرة أسفلها"
            >
              <span>🔤</span>
              <span>سطر بسطر</span>
            </button>

            <button
              onClick={() => {
                sound.tap();
                setTranslationDisplayMode('paragraphs');
              }}
              style={{
                padding: '7px 16px',
                borderRadius: 9,
                fontSize: '0.84rem',
                fontWeight: isParagraphMode ? 800 : 500,
                background: isParagraphMode ? 'var(--accent-primary)' : 'transparent',
                color: isParagraphMode ? '#FFFFFF' : 'var(--text-muted)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--trans-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              title="نظام ترجمة الفقرة الكاملة: ترجمة الفقرة كاملة بسياق علمي متصل"
            >
              <span>📄</span>
              <span>فقرة كاملة</span>
            </button>
          </div>

          {/* Jump to Slide Selector */}
          {slides.length > 1 && (
            <select
              onChange={(e) => handleJumpToSlide(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 10,
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-ground)',
                fontSize: '0.82rem',
                color: 'var(--text-main)',
                outline: 'none',
                cursor: 'pointer',
              }}
              defaultValue=""
            >
              <option value="" disabled>انتقال لشريحة ▾</option>
              {slides.map((s, idx) => (
                <option key={s.id || idx} value={s.number || idx + 1}>
                  شريحة {s.number || idx + 1}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Font, Search, & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Font Size Adjuster */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--surface-ground)',
              padding: 2,
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <button
              onClick={() => setFontSizeLevel('normal')}
              style={{
                padding: '5px 8px',
                fontSize: '0.74rem',
                fontWeight: 700,
                border: 'none',
                borderRadius: 8,
                background: fontSizeLevel === 'normal' ? 'var(--accent-primary)' : 'transparent',
                color: fontSizeLevel === 'normal' ? '#FFF' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="حجم خط افتراضي"
            >
              A
            </button>
            <button
              onClick={() => setFontSizeLevel('large')}
              style={{
                padding: '5px 8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                borderRadius: 8,
                background: fontSizeLevel === 'large' ? 'var(--accent-primary)' : 'transparent',
                color: fontSizeLevel === 'large' ? '#FFF' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="حجم خط كبير"
            >
              A+
            </button>
            <button
              onClick={() => setFontSizeLevel('xlarge')}
              style={{
                padding: '5px 8px',
                fontSize: '0.9rem',
                fontWeight: 800,
                border: 'none',
                borderRadius: 8,
                background: fontSizeLevel === 'xlarge' ? 'var(--accent-primary)' : 'transparent',
                color: fontSizeLevel === 'xlarge' ? '#FFF' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
              title="حجم خط فائق الوضوح"
            >
              A++
            </button>
          </div>

          {/* Search Box */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في السلايدات..."
            style={{
              padding: '7px 12px',
              borderRadius: 10,
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-ground)',
              fontSize: '0.84rem',
              color: 'var(--text-main)',
              width: 140,
              outline: 'none',
            }}
          />

          {/* Toggles */}
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="btn-ghost"
            style={{
              fontSize: '0.78rem',
              padding: '6px 10px',
              borderRadius: 8,
              background: showSummary ? 'var(--accent-primary-soft)' : 'transparent',
              color: showSummary ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            💡 الملخص
          </button>

          <button
            onClick={() => setShowGlossary(!showGlossary)}
            className="btn-ghost"
            style={{
              fontSize: '0.78rem',
              padding: '6px 10px',
              borderRadius: 8,
              background: showGlossary ? 'var(--accent-primary-soft)' : 'transparent',
              color: showGlossary ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            📚 المصطلحات
          </button>

          <button
            onClick={() => setShowQuiz(!showQuiz)}
            className="btn-ghost"
            style={{
              fontSize: '0.78rem',
              padding: '6px 10px',
              borderRadius: 8,
              background: showQuiz ? 'var(--accent-primary-soft)' : 'transparent',
              color: showQuiz ? 'var(--accent-primary)' : 'var(--text-muted)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            🧠 الكويز
          </button>
        </div>
      </div>

      {/* 1. Smart Clinical Summary Section (نبذة + فائدة عملية فقط كما طلب المستخدم) */}
      {showSummary && (summary.overview || (summary.benefits && summary.benefits.length > 0)) && (
        <div
          className="glass-surface-heavy animate-fade-in"
          style={{
            padding: '22px 24px',
            borderRadius: 20,
            marginBottom: 24,
            border: '2px solid rgba(14, 165, 233, 0.4)',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05), rgba(99, 102, 241, 0.05))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💡</span>
              <span>الملخص الذكي للمحاضرة</span>
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)', background: 'var(--surface-ground)', padding: '4px 10px', borderRadius: 999 }}>
              نبذة موجزة وفوائد سريرية
            </span>
          </div>

          {/* عن ماذا تتحدث المحاضرة */}
          {summary.overview && (
            <div style={{ marginBottom: 14, padding: '12px 16px', background: 'var(--surface-ground)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 4 }}>
                🎯 عن ماذا تتحدث المحاضرة؟
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-main)', margin: 0 }}>
                {summary.overview}
              </p>
            </div>
          )}

          {/* ماذا ستستفيد من المحاضرة */}
          {summary.benefits && summary.benefits.length > 0 && (
            <div style={{ padding: '12px 16px', background: 'var(--surface-ground)', borderRadius: 12, border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10B981', marginBottom: 8 }}>
                🩺 ماذا ستستفيد من المحاضرة سريرياً؟
              </div>
              <ul style={{ margin: 0, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {summary.benefits.map((b, bIdx) => (
                  <li key={bIdx} style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
                    {typeof b === 'string' ? b : b.ar || b.en}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 2. Slide Cards Grid (Strict 1:1 Mapping - No Skips, Original HD Images) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {filteredSlides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            لا توجد نتائج مطابقة لبحثك.
          </div>
        ) : (
          filteredSlides.map((slide, sIdx) => {
            const slideNumber = slide.number || sIdx + 1;
            const slideTitle = edits.customTitles?.[slide.id] || slide.title;
            const displayItems = isParagraphMode
                ? (slide.paragraphs && slide.paragraphs.length > 0 ? slide.paragraphs : slide.blocks || [])
                : (slide.blocks || []).map((block, index) => {
                    const node = (activeLecture.nodes || []).filter((item) => item.slideNumber === slideNumber)[index];
                    const customHtml = edits.customNodeContent?.[node?.id];
                    return customHtml
                      ? { ...block, en: stripHtml(customHtml), customHtml }
                      : block;
                  });

            return (
              <article
                key={slide.id || sIdx}
                id={`slide-card-${slideNumber}`}
                className="slide-card glass-surface animate-fade-in"
                style={{
                  padding: '24px 26px',
                  borderRadius: 20,
                  border: '1px solid var(--border-subtle)',
                  position: 'relative',
                }}
              >
                {/* Slide Card Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: 14,
                    marginBottom: 16,
                    borderBottom: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        background: 'var(--accent-primary)',
                        color: '#FFFFFF',
                        borderRadius: 8,
                        fontWeight: 800,
                        fontSize: '0.8rem',
                      }}
                    >
                      شريحة {slideNumber}
                    </span>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {slideTitle || `الشريحة ${slideNumber}`}
                    </h4>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => handleCopySlide(slide)}
                      className="btn-ghost"
                      style={{ fontSize: '0.78rem', padding: '5px 10px', borderRadius: 8 }}
                      title="نسخ نص وترجمة هذه الشريحة"
                    >
                      📋 نسخ الشريحة
                    </button>
                    {slide.img && (
                      <button
                        onClick={() => setZoomedImage(slide.img)}
                        className="btn-secondary"
                        style={{ fontSize: '0.78rem', padding: '5px 10px', borderRadius: 8 }}
                        title="تكبير صورة الشريحة عالية الدقة"
                      >
                        🔍 تكبير الصورة
                      </button>
                    )}
                  </div>
                </div>

                {/* Original HD Slide Image (Never skipped, strictly 1:1) */}
                {slide.img && (
                  <div
                    style={{
                      marginBottom: 20,
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                      boxShadow: 'var(--shadow-sm)',
                      maxWidth: 680,
                      marginRight: 'auto',
                      marginLeft: 'auto',
                      cursor: 'zoom-in',
                      background: '#000',
                    }}
                    onClick={() => setZoomedImage(slide.img)}
                    title="انقر لتكبير الصورة كاملة"
                  >
                    <img
                      src={slide.img}
                      alt={`شريحة ${slideNumber}`}
                      style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                  </div>
                )}

                {/* Blocks or Paragraphs Container */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {displayItems.map((item) => (
                    <div key={item.id} className="slide-block" style={{ position: 'relative' }}>
                      {/* English Line with Interactive Medical Terms */}
                      <div className="slide-line-en" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ color: item.isHeading ? 'var(--accent-primary)' : 'var(--text-subtle)', marginRight: 6, fontWeight: 700 }}>
                            {item.isHeading ? '■' : '•'}
                          </span>
                          <span
                            style={{
                              fontWeight: item.isHeading ? 800 : 600,
                              fontSize: item.isHeading ? '1.05rem' : fontSizeEn,
                              lineHeight: 1.85,
                            }}
                          >
                            {item.customHtml
                              ? <span dangerouslySetInnerHTML={{ __html: item.customHtml }} />
                              : renderEnglishWithTerms(item.en)}
                          </span>
                        </div>

                        {/* Retranslate / Audio Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            onClick={() => speakText(item.en)}
                            className="btn-ghost"
                            title="استماع للنطق الإنجليزي الصحيح"
                            style={{ padding: '4px 6px', fontSize: '0.82rem', color: 'var(--text-subtle)' }}
                          >
                            🔊
                          </button>
                          <button
                            onClick={() => handleRetranslateItem(slide.id, item, isParagraphMode)}
                            disabled={translatingIds.has(item.id)}
                            className="btn-ghost"
                            title={isParagraphMode ? 'إعادة ترجمة الفقرة كاملة من نص الشريحة' : 'إعادة ترجمة هذا السطر'}
                            style={{ padding: '4px 6px', fontSize: '0.82rem', color: 'var(--accent-primary)' }}
                          >
                            {translatingIds.has(item.id) ? '⏳' : '🔄'}
                          </button>
                        </div>
                      </div>

                      {/* Arabic Translation Block directly below (Editable by student) */}
                      <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const val = e.currentTarget.textContent || '';
                          if (isParagraphMode) {
                            updateSlideParagraphTranslation(slide.id, item.id, val);
                          } else {
                            updateSlideTranslation(slide.id, item.id, val);
                          }
                        }}
                        className="translated-line"
                        style={{ fontSize: fontSizeAr }}
                        title="انقر لتعديل أي نص مباشرة"
                      >
                        {item.ar}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* 3. Extracted Lecture Glossary Section */}
      {showGlossary && glossary.length > 0 && (
        <div
          className="glass-surface-heavy animate-fade-in no-print"
          style={{
            marginTop: 32,
            padding: '24px 26px',
            borderRadius: 20,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📚</span>
              <span>المصطلحات السنية الواردة في المحاضرة</span>
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-subtle)' }}>
              {glossary.length} مصطلح مفهرس
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 10,
              maxHeight: 280,
              overflowY: 'auto',
              paddingRight: 4,
            }}
          >
            {glossary.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'var(--surface-ground)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <b style={{ fontFamily: 'var(--font-latin)', fontSize: '0.88rem', color: 'var(--accent-primary)', display: 'block' }}>
                    {item.en}
                  </b>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600 }}>
                    {item.ar}
                  </span>
                </div>
                <button
                  onClick={() => {
                    sound.tap();
                    speakText(item.en);
                  }}
                  className="btn-ghost"
                  title="نطق المصطلح"
                  style={{ padding: 6, fontSize: '0.9rem', color: 'var(--accent-primary)' }}
                >
                  🔊
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Interactive Quiz Section */}
      {showQuiz && currentQuiz.length > 0 && (
        <div
          className="glass-surface-heavy animate-fade-in no-print"
          style={{
            marginTop: 24,
            padding: '26px 28px',
            borderRadius: 22,
            border: '2px solid var(--accent-primary)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.12rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🧠</span>
                <span>اختبار المحاضرة التفاعلي ({currentQuiz.length} أسئلة مخصصة)</span>
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', margin: '4px 0 0' }}>
                أسئلة متجددة مبنية على الملف المرفوع لاختبار استيعابك للمفاهيم والمصطلحات.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleRegenerateQuiz}
                className="btn-secondary"
                style={{ fontSize: '0.8rem', padding: '6px 12px', borderRadius: 10 }}
              >
                🔄 توليد أسئلة أخرى
              </button>
            </div>
          </div>

          {/* Quiz Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {currentQuiz.map((q, qIdx) => {
              const ansState = quizAnswers[q.id];
              return (
                <div
                  key={q.id || qIdx}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 16,
                    background: 'var(--surface-ground)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 12 }}>
                    {q.stem}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                    {q.options.map((opt) => {
                      const optText = typeof opt === 'string' ? opt : opt.text;
                      const isSelected = ansState?.selected === optText;
                      const isCorrect = optText.trim() === (q.correctAr || '').trim();

                      let btnBg = 'var(--surface-card)';
                      let btnBorder = 'var(--border-subtle)';
                      let btnColor = 'var(--text-main)';

                      if (ansState) {
                        if (isCorrect) {
                          btnBg = 'rgba(16, 185, 129, 0.2)';
                          btnBorder = '#10B981';
                          btnColor = '#10B981';
                        } else if (isSelected) {
                          btnBg = 'rgba(239, 68, 68, 0.2)';
                          btnBorder = '#EF4444';
                          btnColor = '#EF4444';
                        }
                      }

                      return (
                        <button
                          key={optText}
                          onClick={() => handleAnswerQuiz(q.id, optText, q.correctAr)}
                          disabled={!!ansState}
                          style={{
                            padding: '10px 14px',
                            borderRadius: 12,
                            border: `1px solid ${btnBorder}`,
                            background: btnBg,
                            color: btnColor,
                            fontWeight: 600,
                            fontSize: '0.84rem',
                            textAlign: 'right',
                            cursor: ansState ? 'default' : 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          {optText}
                        </button>
                      );
                    })}
                  </div>

                  {ansState && q.rationale && (
                    <div style={{ marginTop: 10, fontSize: '0.78rem', color: '#10B981', fontWeight: 600 }}>
                      ✓ {q.rationale}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Term Quick Modal */}
      {activeTermModal && (
        <div
          className="modal-overlay animate-fade-in"
          onClick={() => setActiveTermModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 110,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            className="glass-surface-heavy"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 420,
              width: '100%',
              borderRadius: 20,
              padding: '24px 26px',
              border: '1px solid var(--accent-primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h4 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-latin)' }}>
                {activeTermModal.en}
              </h4>
              <button onClick={() => speakText(activeTermModal.en)} className="btn-ghost" title="نطق المصطلح">
                🔊
              </button>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
              {activeTermModal.ar}
            </div>
            {activeTermModal.morph && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', lineHeight: 1.5 }}>
                {activeTermModal.morph}
              </div>
            )}
            <div style={{ marginTop: 18, textAlign: 'left' }}>
              <button onClick={() => setActiveTermModal(null)} className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.82rem' }}>
                حسناً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
