import React, { useState, useEffect } from 'react';
import { useCoreEngine } from '../../context/CoreEngineContext';
import { generateExam } from '../../services/processingEngine';
import { hasGeminiKey, generateExamWithGemini } from '../../services/geminiService';
import { formatClock } from '../../utils/formatters';
import { sound } from '../../utils/soundscape';
import DominoSpinner from '../common/DominoSpinner';

export default function ExamEngine() {
  const { activeLecture } = useCoreEngine();
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [questionCount, setQuestionCount] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate examination from active lecture
  const startNewExam = async (count = questionCount) => {
    if (!activeLecture) return;
    sound.tap();
    setIsGenerating(true);

    try {
      let examQuestions = [];
      // إذا كان Gemini مفعلاً ولديه مفتاح، نحاول توليد أسئلة AI سريرية متقدمة
      if (hasGeminiKey() && activeLecture.rawText) {
        try {
          examQuestions = await generateExamWithGemini(activeLecture.rawText, count);
        } catch {}
      }

      // Fallback أو محرك محلي سريع
      if (!examQuestions || examQuestions.length === 0) {
        examQuestions = generateExam(activeLecture, { count });
      }

      setQuestions(examQuestions);
      setCurrentIdx(0);
      setSelectedAnswers({});
      setShowResults(false);
      setTimerSeconds(0);
      setTimerActive(true);
    } catch (err) {
      console.error('Exam error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (activeLecture) {
      startNewExam(questionCount);
    }
  }, [activeLecture?.id]);

  // Exam stopwatch
  useEffect(() => {
    let interval = null;
    if (timerActive && !showResults) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, showResults]);

  if (!activeLecture) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>📝</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
          يرجى اختيار أو رفع محاضرة لبدء الاختبار المنهجي
        </h3>
      </div>
    );
  }

  if (isGenerating || questions.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="glass-surface-heavy animate-fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '36px 24px', borderRadius: 20 }}>
          <DominoSpinner />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: 12, color: 'var(--text-main)' }}>
            جارٍ توليد وتحديث بنك الأسئلة السريرية...
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginTop: 6 }}>
            تحليل نصوص ومفاهيم المحاضرة وتوزيع المشتتات السريرية المتوازنة.
          </p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSelectOption = (qId, optionId) => {
    if (showResults) return;
    sound.tap();
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionId }));
  };

  const handleFinishExam = () => {
    sound.complete();
    setTimerActive(false);
    setShowResults(true);
  };

  // Score calculation
  const score = questions.reduce((acc, q) => {
    return selectedAnswers[q.id] === q.correctId ? acc + 1 : acc;
  }, 0);
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className="container" style={{ padding: '24px 20px 60px', maxWidth: 900 }}>
      {/* Exam Header Controls */}
      <div
        className="glass-surface-heavy"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '14px 22px',
          marginBottom: 20,
          borderRadius: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            الاختبار المنهجي الذكي 📝
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', margin: '4px 0 0' }}>
            أسئلة اختيار من متعدد مبنية على محتوى ملف المحاضرة المرفوع.
          </p>
        </div>

        {/* Count Selector & Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Question count selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-ground)', padding: '4px 8px', borderRadius: 10 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>عدد الأسئلة:</span>
            {[7, 10, 15, 20].map((c) => (
              <button
                key={c}
                onClick={() => {
                  setQuestionCount(c);
                  startNewExam(c);
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  fontWeight: questionCount === c ? 800 : 500,
                  background: questionCount === c ? 'var(--accent-primary)' : 'transparent',
                  color: questionCount === c ? '#FFF' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-ground)', padding: '6px 12px', borderRadius: 10 }}>
            <span>⏱️</span>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', fontFamily: 'var(--font-latin)' }}>
              {formatClock(timerSeconds * 1000)}
            </span>
          </div>

          <button
            onClick={() => startNewExam(questionCount)}
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '6px 12px' }}
          >
            🔄 اختبار جديد
          </button>
        </div>
      </div>

      {showResults ? (
        /* Results View */
        <div className="glass-surface-heavy animate-fade-in" style={{ padding: '36px 32px', borderRadius: 24, textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 12 }}>
            {percentage >= 70 ? '🏆' : percentage >= 50 ? '👍' : '📚'}
          </div>
          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 8 }}>
            نتيجة الاختبار: {score} من {totalQuestions} ({percentage}%)
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.9rem' }}>
            {percentage >= 85
              ? 'مستوى ممتاز جداً! أتقنت المفاهيم السريرية لهذه المحاضرة.'
              : percentage >= 60
              ? 'أداء جيد! يُنصح بمراجعة المصطلحات السنية والأرقام السريرية.'
              : 'تحتاج لمزيد من المذاكرة، استخدم بطاقات الاسترجاع لترسيخ المفاهيم.'}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
            <button onClick={() => startNewExam(questionCount)} className="btn-primary" style={{ padding: '10px 24px' }}>
              إعادة الاختبار بأسئلة أخرى
            </button>
          </div>

          {/* Review all questions */}
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 10px' }}>
              مراجعة إجابات الأسئلة بالتفصيل:
            </h4>
            {questions.map((q, idx) => {
              const userAns = selectedAnswers[q.id];
              const isCorrect = userAns === q.correctId;
              return (
                <div
                  key={q.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 16,
                    background: 'var(--surface-ground)',
                    border: `1px solid ${isCorrect ? '#10B981' : '#EF4444'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span>{isCorrect ? '✅' : '❌'}</span>
                    <b style={{ fontSize: '0.92rem' }}>السؤال {idx + 1}: {q.stem}</b>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', marginBottom: 6 }}>
                    إجابتك: {q.options.find((o) => o.id === userAns)?.text || 'لم تجب'} | الإجابة الصحيحة: {q.options.find((o) => o.id === q.correctId)?.text}
                  </div>

                  {q.rationale && (
                    <div style={{ fontSize: '0.8rem', color: '#10B981' }}>
                      💡 الشرح: {q.rationale}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Question Card View */
        <div className="glass-surface-heavy animate-fade-in" style={{ padding: '32px 34px', borderRadius: 24 }}>
          {/* Question Progress Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
              السؤال {currentIdx + 1} من {totalQuestions}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              أجبت عن {answeredCount} من {totalQuestions}
            </span>
          </div>

          {/* Question Text */}
          <h3 style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.6, marginBottom: 24 }}>
            {currentQ?.stem}
          </h3>

          {/* Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
            {currentQ?.options.map((opt) => {
              const isSelected = selectedAnswers[currentQ.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelectOption(currentQ.id, opt.id)}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 14,
                    border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--accent-primary-soft)' : 'var(--surface-ground)',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '0.92rem',
                    textAlign: 'right',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isSelected ? 'var(--accent-primary)' : 'var(--surface-card)',
                      color: isSelected ? '#FFF' : 'var(--text-muted)',
                      fontWeight: 800,
                      fontSize: '0.84rem',
                    }}
                  >
                    {opt.id}
                  </span>
                  <span>{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
            <button
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="btn-secondary"
              style={{ fontSize: '0.84rem', padding: '8px 16px', opacity: currentIdx === 0 ? 0.4 : 1 }}
            >
              السابق
            </button>

            {currentIdx < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="btn-primary"
                style={{ fontSize: '0.84rem', padding: '8px 20px' }}
              >
                التالي
              </button>
            ) : (
              <button
                onClick={handleFinishExam}
                className="btn-primary"
                style={{ fontSize: '0.84rem', padding: '8px 24px', background: '#10B981', borderColor: '#10B981' }}
              >
                إنهاء الاختبار وعرض النتيجة ✓
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
