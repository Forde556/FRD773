import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useCoreEngine } from './CoreEngineContext';
import { get, put, remove, STORES } from '../services/storageService';
import { sanitizeRichHtml, uid } from '../utils/formatters';
import { sound } from '../utils/soundscape';

const EditorContext = createContext(null);

export function EditorProvider({ children }) {
  const { activeLecture } = useCoreEngine();
  const [currentEdits, setCurrentEdits] = useState({
    lectureId: null,
    customTitles: {},
    customNodeContent: {},
    pearls: {},
    diagrams: {},
    updatedAt: null,
  });
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'dirty'
  const autosaveTimerRef = useRef(null);

  // Load customizations when active lecture changes
  useEffect(() => {
    if (!activeLecture?.id) {
      setCurrentEdits({ lectureId: null, customTitles: {}, customNodeContent: {}, pearls: {}, diagrams: {} });
      return;
    }

    let isMounted = true;
    async function loadEdits() {
      const stored = await get(STORES.edits, activeLecture.id);
      if (isMounted) {
        if (stored) {
          setCurrentEdits(stored);
        } else {
          setCurrentEdits({
            lectureId: activeLecture.id,
            customTitles: {},
            customNodeContent: {},
            pearls: {},
            diagrams: {},
            updatedAt: new Date().toISOString(),
          });
        }
        setSaveStatus('saved');
      }
    }
    loadEdits();

    return () => {
      isMounted = false;
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [activeLecture?.id]);

  // Debounced autosave to IndexedDB
  const scheduleSave = useCallback((updated) => {
    setSaveStatus('dirty');
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      const payload = {
        ...updated,
        updatedAt: new Date().toISOString(),
      };
      try {
        await put(STORES.edits, payload);
        setSaveStatus('saved');
      } catch (error) {
        console.error('[Editor] Autosave failed:', error);
        setSaveStatus('error');
      }
    }, 600);
  }, []);

  const updateSlideTitle = useCallback(
    (slideId, title) => {
      setCurrentEdits((prev) => {
        const next = {
          ...prev,
          customTitles: { ...prev.customTitles, [slideId]: title },
        };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const updateNodeText = useCallback(
    (nodeId, rawHtml) => {
      const clean = sanitizeRichHtml(rawHtml);
      setCurrentEdits((prev) => {
        const next = {
          ...prev,
          customNodeContent: { ...prev.customNodeContent, [nodeId]: clean },
        };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const addClinicalPearl = useCallback(
    (targetId, text) => {
      if (!text?.trim()) return;
      sound.tap();
      const pearl = {
        id: uid('pearl'),
        text: text.trim(),
        createdAt: new Date().toISOString(),
      };
      setCurrentEdits((prev) => {
        const existing = prev.pearls[targetId] || [];
        const next = {
          ...prev,
          pearls: { ...prev.pearls, [targetId]: [...existing, pearl] },
        };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const deleteClinicalPearl = useCallback(
    (targetId, pearlId) => {
      sound.tap();
      setCurrentEdits((prev) => {
        const existing = prev.pearls[targetId] || [];
        const next = {
          ...prev,
          pearls: { ...prev.pearls, [targetId]: existing.filter((p) => p.id !== pearlId) },
        };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const addDiagram = useCallback(
    (slideId, { url, caption = '' }) => {
      sound.complete();
      const diagram = {
        id: uid('diag'),
        url,
        caption,
        createdAt: new Date().toISOString(),
      };
      setCurrentEdits((prev) => {
        const existing = prev.diagrams[slideId] || [];
        const next = {
          ...prev,
          diagrams: { ...prev.diagrams, [slideId]: [...existing, diagram] },
        };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const removeDiagram = useCallback(
    (slideId, diagramId) => {
      sound.tap();
      setCurrentEdits((prev) => {
        const existing = prev.diagrams[slideId] || [];
        const next = {
          ...prev,
          diagrams: { ...prev.diagrams, [slideId]: existing.filter((d) => d.id !== diagramId) },
        };
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave],
  );

  const resetAllCustomizations = useCallback(async () => {
    if (!activeLecture?.id) return;
    sound.gentleError();
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    await remove(STORES.edits, activeLecture.id);
    setCurrentEdits({
      lectureId: activeLecture.id,
      customTitles: {},
      customNodeContent: {},
      pearls: {},
      diagrams: {},
      updatedAt: new Date().toISOString(),
    });
    setSaveStatus('saved');
  }, [activeLecture?.id]);

  return (
    <EditorContext.Provider
      value={{
        edits: currentEdits,
        saveStatus,
        updateSlideTitle,
        updateNodeText,
        addClinicalPearl,
        deleteClinicalPearl,
        addDiagram,
        removeDiagram,
        resetAllCustomizations,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditor must be used within EditorProvider');
  return context;
}
