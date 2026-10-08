import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { processLecture, extractLectureFromFile, extractTextFromFile } from '../services/processingEngine';
import { put, get, getAll, remove, STORES } from '../services/storageService';
import { SAMPLE_LECTURE, SAMPLE_LECTURE_TITLE } from '../utils/sampleLecture';
import { sound } from '../utils/soundscape';

const CoreEngineContext = createContext(null);

export function CoreEngineProvider({ children }) {
  const [activeLecture, setActiveLecture] = useState(null);
  const [savedLectures, setSavedLectures] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(null);
  const [highlightFacts, setHighlightFacts] = useState(true);
  const [bilingualMode, setBilingualMode] = useState(false);
  const [translationDisplayMode, setTranslationDisplayMode] = useState('lines'); // 'lines' | 'paragraphs'
  const [error, setError] = useState(null);

  // Load lectures from local storage / IndexedDB on mount
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const stored = await getAll(STORES.lectures);
        if (!mounted) return;
        if (stored && stored.length > 0) {
          // Sort most recent first
          stored.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setSavedLectures(stored);
          setActiveLecture(stored[0]);
        } else {
          // Seed sample lecture seamlessly
          const seeded = await processLecture(SAMPLE_LECTURE, {
            title: SAMPLE_LECTURE_TITLE,
            sourceName: 'محاضرة توضيحية معتمدة',
            pace: 0,
          });
          if (!mounted) return;
          await put(STORES.lectures, seeded);
          setSavedLectures([seeded]);
          setActiveLecture(seeded);
        }
      } catch (err) {
        console.error('[CoreEngine] Init error:', err);
        setError('تعذر تحميل المحاضرات المخزنة محلياً.');
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const ingestText = useCallback(async (text, title, sourceName = 'نص يدوي', extraData = {}) => {
    setIsProcessing(true);
    setError(null);
    try {
      const parsed = await processLecture(text, {
        title,
        sourceName,
        onStage: (idx, info) => {
          setProcessingStage({ idx, ...info });
        },
        pace: 120, // smooth clinical progress feel
        pageImages: extraData.pageImages || [],
      });

      await put(STORES.lectures, parsed);
      setSavedLectures((prev) => [parsed, ...prev.filter((l) => l.id !== parsed.id)]);
      setActiveLecture(parsed);
      sound.complete();
      return parsed;
    } catch (err) {
      console.error('[CoreEngine] Processing error:', err);
      setError(err.message || 'حدث خطأ أثناء معالجة المحاضرة.');
      sound.gentleError();
      throw err;
    } finally {
      setIsProcessing(false);
      setProcessingStage(null);
    }
  }, []);

  const ingestFile = useCallback(async (file) => {
    setIsProcessing(true);
    setError(null);
    try {
      const { text, pageImages } = await extractLectureFromFile(file, (msg, pct) => {
        setProcessingStage({ customMsg: msg, pct });
      });
      const title = file.name.replace(/\.[^/.]+$/, '');
      return await ingestText(text, title, file.name, { pageImages });
    } catch (err) {
      console.error('[CoreEngine] File intake error:', err);
      setError(err.message || 'حدث خطأ أثناء قراءة ملف المحاضرة.');
      sound.gentleError();
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [ingestText]);

  const selectLecture = useCallback(async (lectureId) => {
    sound.tap();
    const found = savedLectures.find((l) => l.id === lectureId);
    if (found) {
      setActiveLecture(found);
    } else {
      const fromDb = await get(STORES.lectures, lectureId);
      if (fromDb) setActiveLecture(fromDb);
    }
  }, [savedLectures]);

  const deleteLecture = useCallback(async (lectureId) => {
    sound.tap();
    await remove(STORES.lectures, lectureId);
    await remove(STORES.edits, lectureId);
    setSavedLectures((prev) => prev.filter((l) => l.id !== lectureId));
    if (activeLecture?.id === lectureId) {
      const remaining = savedLectures.filter((l) => l.id !== lectureId);
      setActiveLecture(remaining[0] || null);
    }
  }, [activeLecture, savedLectures]);


  const updateSlideTranslation = useCallback(async (slideId, blockId, newAr) => {
    if (!activeLecture) return;
    const updatedSlides = activeLecture.slides.map((s) => {
      if (s.id !== slideId && s.number !== slideId) return s;
      const updatedBlocks = (s.blocks || []).map((b) => (b.id === blockId ? { ...b, ar: newAr } : b));
      return { ...s, blocks: updatedBlocks };
    });
    const updatedLecture = { ...activeLecture, slides: updatedSlides };
    setActiveLecture(updatedLecture);
    await put(STORES.lectures, updatedLecture);
    setSavedLectures((prev) => prev.map((l) => (l.id === updatedLecture.id ? updatedLecture : l)));
  }, [activeLecture]);

  const updateSlideParagraphTranslation = useCallback(async (slideId, paraId, newAr, newEn) => {
    if (!activeLecture) return;
    const updatedSlides = activeLecture.slides.map((s) => {
      if (s.id !== slideId && s.number !== slideId) return s;
      const updatedParas = (s.paragraphs || []).map((p) => (
        p.id === paraId ? { ...p, ...(newEn ? { en: newEn } : {}), ar: newAr } : p
      ));
      return { ...s, paragraphs: updatedParas };
    });
    const updatedLecture = { ...activeLecture, slides: updatedSlides };
    setActiveLecture(updatedLecture);
    await put(STORES.lectures, updatedLecture);
    setSavedLectures((prev) => prev.map((l) => (l.id === updatedLecture.id ? updatedLecture : l)));
  }, [activeLecture]);

  const importLectures = useCallback(async (importedList) => {
    if (!Array.isArray(importedList)) return;
    for (const lec of importedList) {
      await put(STORES.lectures, lec);
    }
    setSavedLectures((prev) => {
      const map = new Map();
      [...importedList, ...prev].forEach((l) => map.set(l.id, l));
      return [...map.values()];
    });
    if (importedList[0]) setActiveLecture(importedList[0]);
  }, []);

  return (
    <CoreEngineContext.Provider
      value={{
        activeLecture,
        savedLectures,
        isProcessing,
        processingStage,
        ingestText,
        ingestFile,
        selectLecture,
        deleteLecture,
        updateSlideTranslation,
        updateSlideParagraphTranslation,
        translationDisplayMode,
        setTranslationDisplayMode,
        importLectures,
        highlightFacts,
        setHighlightFacts,
        bilingualMode,
        setBilingualMode,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </CoreEngineContext.Provider>
  );
}

export function useCoreEngine() {
  const context = useContext(CoreEngineContext);
  if (!context) throw new Error('useCoreEngine must be used within CoreEngineProvider');
  return context;
}
