import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getQuota, consumeQuota, msUntilReset, DAILY_TRANSLATION_LIMIT } from '../utils/quotaTracker';
import { formatHoursMinutes } from '../utils/formatters';
import { sound } from '../utils/soundscape';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [quotaState, setQuotaState] = useState(getQuota());
  const [toastMessage, setToastMessage] = useState(null);
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dsp.bookmarks') || '[]');
    } catch {
      return [];
    }
  });

  // Keep quota synchronized across midnight boundary
  useEffect(() => {
    const checkQuota = () => setQuotaState(getQuota());
    const ms = msUntilReset();
    const timer = setTimeout(() => {
      checkQuota();
    }, ms + 1000);

    window.addEventListener('storage', checkQuota);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('storage', checkQuota);
    };
  }, []);

  const requestTranslationUse = useCallback((kind = 'selection') => {
    const result = consumeQuota(kind);
    setQuotaState(result);

    if (!result.ok) {
      sound.gentleError();
      const timeLeft = formatHoursMinutes(msUntilReset());
      setToastMessage({
        type: 'exhausted',
        title: 'أحسنت في مذاكرتك اليوم ومثابرتك العالية!',
        body: `استنفدت رصيد الترجمات المنهجية الخمسة المتاحة لهذا اليوم، لتشجيعك على ترسيخ المصطلح الطبي باللغة الإنجليزية في ذهنك بنفسك. سيتجدد الرصيد تلقائياً خلال ${timeLeft}.`,
      });
      return false;
    }

    sound.tap();
    return true;
  }, []);

  const toggleBookmark = useCallback((nodeId) => {
    sound.tap();
    setBookmarks((prev) => {
      const next = prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId];
      try {
        localStorage.setItem('dsp.bookmarks', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  return (
    <UserContext.Provider
      value={{
        quota: quotaState,
        requestTranslationUse,
        bookmarks,
        toggleBookmark,
        toastMessage,
        setToastMessage,
        dismissToast,
        dailyLimit: DAILY_TRANSLATION_LIMIT,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}
