import React, { createContext, useContext, useEffect, useState } from 'react';
import { setSoundEnabled, sound } from '../utils/soundscape';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('dsp.theme');
      if (saved === 'day' || saved === 'night') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
    } catch {
      return 'night';
    }
  });

  const [soundActive, setSoundActive] = useState(() => {
    try {
      return localStorage.getItem('dsp.sound') !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('dsp.theme', theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    setSoundEnabled(soundActive);
    try {
      localStorage.setItem('dsp.sound', String(soundActive));
    } catch {}
  }, [soundActive]);

  const toggleTheme = () => {
    sound.tap();
    setTheme((prev) => (prev === 'day' ? 'night' : 'day'));
  };

  const toggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    if (next) sound.tap();
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, soundActive, toggleSound }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
