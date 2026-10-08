import React, { useState, useEffect } from 'react';
import { useCoreEngine } from '../../context/CoreEngineContext';
import { buildMatchPairs, buildFlashcards } from '../../services/processingEngine';
import { cryptoShuffle } from '../../utils/cryptoShuffle';
import { formatClock } from '../../utils/formatters';
import { sound } from '../../utils/soundscape';

export default function GamifiedDrills() {
  const { activeLecture } = useCoreEngine();
  const [activeDrill, setActiveDrill] = useState('match'); // 'match' | 'flashcards'

  if (!activeLecture) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>⚡</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
          اختر أو ارفع محاضرة لبدء ألعاب التثبيت السريرية
        </h3>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-subtle)', marginTop: 6 }}>
          تمارين لترسيخ أسماء المعالم والمصطلحات في الذاكرة طويلة المدى.
        </p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '24px 20px 60px', maxWidth: 960 }}>
      {/* Drills Switcher Header */}
      <div
        className="glass-surface-heavy"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '14px 22px',
          marginBottom: 24,
          borderRadius: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            ألعاب التثبيت والاسترجاع النشط ⚡
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', margin: '4px 0 0' }}>
            تمارين سريرية تفاعلية لتثبيت المصطلحات والمفاهيم الطبية للمحاضرة في الذاكرة.
          </p>
        </div>

        {/* Drill Toggle */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--surface-ground)', padding: 4, borderRadius: 12 }}>
          <button
            onClick={() => {
              sound.tap();
              setActiveDrill('match');
            }}
            className="btn-ghost"
            style={{
              padding: '7px 16px',
              borderRadius: 9,
              fontSize: '0.84rem',
              fontWeight: activeDrill === 'match' ? 800 : 500,
              background: activeDrill === 'match' ? 'var(--accent-primary)' : 'transparent',
              color: activeDrill === 'match' ? '#FFFFFF' : 'var(--text-muted)',
            }}
          >
            🧩 مطابقة المصطلحات السريعة
          </button>
          <button
            onClick={() => {
              sound.tap();
              setActiveDrill('flashcards');
            }}
            className="btn-ghost"
            style={{
              padding: '7px 16px',
              borderRadius: 9,
              fontSize: '0.84rem',
              fontWeight: activeDrill === 'flashcards' ? 800 : 500,
              background: activeDrill === 'flashcards' ? 'var(--accent-primary)' : 'transparent',
              color: activeDrill === 'flashcards' ? '#FFFFFF' : 'var(--text-muted)',
            }}
          >
            🃏 بطاقات الاسترجاع (Flashcards)
          </button>
        </div>
      </div>

      {activeDrill === 'match' ? (
        <TerminologyMatchDrill lecture={activeLecture} />
      ) : (
        <FlashcardDrill lecture={activeLecture} />
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Sub-Drill 1: Multi-Round Terminology & Landmark Matching
   -------------------------------------------------------------------------- */
function TerminologyMatchDrill({ lecture }) {
  const [allPairs, setAllPairs] = useState([]);
  const [round, setRound] = useState(1);
  const [pairs, setPairs] = useState([]);
  const [leftItems, setLeftItems] = useState([]);
  const [rightItems, setRightItems] = useState([]);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [totalScore, setTotalScore] = useState(0);

  const initGame = (customRound = 1) => {
    sound.tap();
    const all = buildMatchPairs(lecture);
    setAllPairs(all);

    const startIndex = ((customRound - 1) * 6) % Math.max(1, all.length);
    let selected = all.slice(startIndex, startIndex + 6);
    if (selected.length < 6) {
      selected = cryptoShuffle(all).slice(0, 6);
    }

    setRound(customRound);
    setPairs(selected);
    setLeftItems(cryptoShuffle(selected.map((p) => ({ id: p.id, text: p.left }))));
    setRightItems(cryptoShuffle(selected.map((p) => ({ id: p.id, text: p.right }))));
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedIds(new Set());
    setSecondsLeft(60);
    setTimerRunning(true);
    setGameCompleted(false);
  };

  useEffect(() => {
    initGame(1);
    setTotalScore(0);
  }, [lecture?.id]);

  useEffect(() => {
    let t = null;
    if (timerRunning && secondsLeft > 0 && !gameCompleted) {
      t = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    } else if (secondsLeft === 0 && !gameCompleted) {
      sound.gentleError();
      setTimerRunning(false);
    }
    return () => clearInterval(t);
  }, [timerRunning, secondsLeft, gameCompleted]);

  const handleSelectLeft = (item) => {
    if (matchedIds.has(item.id)) return;
    sound.tap();
    setSelectedLeft(item);
    if (selectedRight) checkMatch(item.id, selectedRight.id);
  };

  const handleSelectRight = (item) => {
    if (matchedIds.has(item.id)) return;
    sound.tap();
    setSelectedRight(item);
    if (selectedLeft) checkMatch(selectedLeft.id, item.id);
  };

  const checkMatch = (leftId, rightId) => {
    if (leftId === rightId) {
      sound.success();
      setMatchedIds((prev) => {
        const next = new Set([...prev, leftId]);
        if (next.size === pairs.length) {
          sound.complete();
          setGameCompleted(true);
          setTimerRunning(false);
          setTotalScore((sc) => sc + 6);
        }
        return next;
      });
    } else {
      sound.gentleError();
    }
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  return (
    <div className="glass-surface-heavy" style={{ padding: '28px 32px', borderRadius: 24 }}>
      {/* Top Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.4rem' }}>⏱️</span>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-latin)' }}>
                {formatClock(secondsLeft * 1000)}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                الوقت المتبقي
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--surface-ground)', padding: '4px 12px', borderRadius: 10, fontSize: '0.84rem', fontWeight: 700 }}>
            الجولة {round} • النقاط: {totalScore}
          </div>
        </div>

        <div>
          <button className="btn-secondary" onClick={() => initGame(round)} style={{ fontSize: '0.82rem' }}>
            🔄 إعادة الجولة
          </button>
        </div>
      </div>

      {gameCompleted ? (
        <div className="animate-fade-in" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>🎉</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
            إنجاز رائع! أتقنت مصطلحات الجولة {round} بنجاح!
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            أنهيت المطابقة مع بقاء {secondsLeft} ثانية.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            <button className="btn-primary" onClick={() => initGame(round + 1)}>
              الانتقال للجولة التالية بمصطلحات جديدة 🚀
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left: English terms */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-primary)', textAlign: 'center' }}>
              المصطلح السني بالإنجليزية
            </div>
            {leftItems.map((item) => {
              const isMatched = matchedIds.has(item.id);
              const isSelected = selectedLeft?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectLeft(item)}
                  disabled={isMatched}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: isMatched
                      ? '1px solid #10B981'
                      : isSelected
                      ? '2px solid var(--accent-primary)'
                      : '1px solid var(--border-subtle)',
                    background: isMatched
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isSelected
                      ? 'var(--accent-primary-soft)'
                      : 'var(--surface-ground)',
                    color: isMatched ? '#10B981' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    fontFamily: 'var(--font-latin)',
                    cursor: isMatched ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isMatched ? 0.6 : 1,
                  }}
                >
                  {item.text}
                </button>
              );
            })}
          </div>

          {/* Right: Arabic Meanings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10B981', textAlign: 'center' }}>
              المعنى السريري بالعربية
            </div>
            {rightItems.map((item) => {
              const isMatched = matchedIds.has(item.id);
              const isSelected = selectedRight?.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectRight(item)}
                  disabled={isMatched}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: isMatched
                      ? '1px solid #10B981'
                      : isSelected
                      ? '2px solid #10B981'
                      : '1px solid var(--border-subtle)',
                    background: isMatched
                      ? 'rgba(16, 185, 129, 0.15)'
                      : isSelected
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'var(--surface-ground)',
                    color: isMatched ? '#10B981' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: isMatched ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isMatched ? 0.6 : 1,
                  }}
                >
                  {item.text}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------------
   Sub-Drill 2: Rich Flashcards (Covering the entire lecture)
   -------------------------------------------------------------------------- */
function FlashcardDrill({ lecture }) {
  const [cards, setCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mastery, setMastery] = useState({ review: 0, good: 0, mastered: 0 });

  const initFlashcards = () => {
    const raw = buildFlashcards(lecture);
    setCards(cryptoShuffle(raw));
    setCurrentIdx(0);
    setIsFlipped(false);
    setMastery({ review: 0, good: 0, mastered: 0 });
  };

  useEffect(() => {
    initFlashcards();
  }, [lecture?.id]);

  if (!cards.length) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        لا توجد بطاقات متاحة لهذه المحاضرة حالياً.
      </div>
    );
  }

  const curCard = cards[currentIdx];

  const handleFlip = () => {
    sound.flip();
    setIsFlipped(!isFlipped);
  };

  const handleRating = (level) => {
    sound.tap();
    setMastery((prev) => ({ ...prev, [level]: prev[level] + 1 }));
    setIsFlipped(false);
    if (currentIdx < cards.length - 1) {
      setCurrentIdx((i) => i + 1);
    } else {
      sound.complete();
    }
  };

  const isCompleted = currentIdx === cards.length - 1 && (mastery.review + mastery.good + mastery.mastered === cards.length);

  return (
    <div style={{ maxWidth: 660, margin: '0 auto' }}>
      {/* Progress & Counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: '0.88rem', color: 'var(--text-subtle)', fontWeight: 700 }}>
          البطاقة {currentIdx + 1} من {cards.length}
        </span>
        <div style={{ display: 'flex', gap: 10, fontSize: '0.8rem', fontWeight: 600 }}>
          <span style={{ color: '#EF4444' }}>مراجعة: {mastery.review}</span>
          <span style={{ color: '#38BDF8' }}>جيد: {mastery.good}</span>
          <span style={{ color: '#10B981' }}>متقن: {mastery.mastered}</span>
        </div>
      </div>

      {/* 3D Flip Card */}
      <div
        onClick={handleFlip}
        className="glass-surface-heavy animate-fade-in"
        style={{
          minHeight: 290,
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          borderRadius: 24,
          border: '2px solid var(--accent-primary)',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          userSelect: 'none',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 16,
            right: 18,
            fontSize: '0.74rem',
            padding: '3px 10px',
            borderRadius: 999,
            background: 'var(--surface-ground)',
            color: 'var(--text-subtle)',
          }}
        >
          {isFlipped ? 'الإجابة والمدلول 💡' : 'انقر لقلب البطاقة 🔄'}
        </span>

        {!isFlipped ? (
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 700, marginBottom: 8 }}>
              {curCard?.frontSub || 'مصطلح / مفهوم'}
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.4, fontFamily: 'var(--font-latin)' }}>
              {curCard?.front}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10B981', marginBottom: 10, lineHeight: 1.5 }}>
              {curCard?.back}
            </div>
            {curCard?.backDetails && (
              <div style={{ fontSize: '0.86rem', color: 'var(--text-subtle)', maxWidth: 480, margin: '0 auto', lineHeight: 1.6 }}>
                {curCard.backDetails}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Rating Buttons */}
      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12 }}>
        <button
          onClick={() => handleRating('review')}
          className="btn-secondary"
          style={{ borderColor: '#EF4444', color: '#EF4444', fontSize: '0.86rem', padding: '10px 18px', borderRadius: 12 }}
        >
          ❌ بحاجة لمراجعة
        </button>
        <button
          onClick={() => handleRating('good')}
          className="btn-secondary"
          style={{ borderColor: '#38BDF8', color: '#38BDF8', fontSize: '0.86rem', padding: '10px 18px', borderRadius: 12 }}
        >
          🤔 جيد نوعاً ما
        </button>
        <button
          onClick={() => handleRating('mastered')}
          className="btn-primary"
          style={{ background: '#10B981', borderColor: '#10B981', fontSize: '0.86rem', padding: '10px 20px', borderRadius: 12 }}
        >
          ✅ أتقنت المصطلح
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 14 }}>
        <button onClick={initFlashcards} className="btn-ghost" style={{ fontSize: '0.78rem' }}>
          🔀 إعادة خلط وترتيب البطاقات
        </button>
      </div>
    </div>
  );
}
