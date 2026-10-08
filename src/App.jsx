import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { UserProvider } from './context/UserContext';
import { CoreEngineProvider, useCoreEngine } from './context/CoreEngineContext';
import { EditorProvider } from './context/EditorContext';
import InteractiveBackground from './components/layout/InteractiveBackground';
import Navbar from './components/layout/Navbar';
import LectureCanvas from './components/canvas/LectureCanvas';
import LectureEditor from './components/editor/LectureEditor';
import TermTranslator from './components/terms/TermTranslator';
import DentalDictionary from './components/dictionary/DentalDictionary';
import SavedLibrary from './components/library/SavedLibrary';
import ExamEngine from './components/exam/ExamEngine';
import GamifiedDrills from './components/games/GamifiedDrills';
import CoreEngineMetrics from './components/engine/CoreEngineMetrics';
import IntakeModal from './components/common/IntakeModal';
import ExportModal from './components/export/ExportModal';
import TranslationModal from './components/translation/TranslationModal';
import GeminiSettingsModal from './components/common/GeminiSettingsModal';
import Toast from './components/common/Toast';
import './styles/globals.css';
import './styles/print.css';

function MainAppShell() {
  const [activeTab, setActiveTab] = useState('canvas');
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [isGeminiOpen, setIsGeminiOpen] = useState(false);
  const [translationQuery, setTranslationQuery] = useState('');
  const { selectLecture } = useCoreEngine();

  const handleSelectTextForTranslation = (selectedText) => {
    setTranslationQuery(selectedText);
    setIsTranslateOpen(true);
  };

  return (
    <div className="app-viewport">
      {/* Living Canvas Underlay */}
      <InteractiveBackground />

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenIntake={() => setIsIntakeOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenTranslateModal={() => {
          setTranslationQuery('');
          setIsTranslateOpen(true);
        }}
        onOpenGeminiModal={() => setIsGeminiOpen(true)}
      />

      {/* Main Tab Screen */}
      <main style={{ flex: 1, minHeight: 'calc(100vh - 80px)' }}>
        {activeTab === 'canvas' && (
          <LectureCanvas onSelectTextForTranslation={handleSelectTextForTranslation} />
        )}
        {activeTab === 'editor' && <LectureEditor />}
        {activeTab === 'terms' && <TermTranslator />}
        {activeTab === 'dictionary' && <DentalDictionary />}
        {activeTab === 'library' && (
          <SavedLibrary
            onSelectLecture={(id) => {
              selectLecture(id);
              setActiveTab('canvas');
            }}
          />
        )}
        {activeTab === 'exam' && <ExamEngine />}
        {activeTab === 'games' && <GamifiedDrills />}
        {activeTab === 'engine' && <CoreEngineMetrics />}
      </main>

      {/* Modals & Portals */}
      <IntakeModal isOpen={isIntakeOpen} onClose={() => setIsIntakeOpen(false)} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <TranslationModal
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
        initialQuery={translationQuery}
      />
      <GeminiSettingsModal isOpen={isGeminiOpen} onClose={() => setIsGeminiOpen(false)} />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <CoreEngineProvider>
          <EditorProvider>
            <MainAppShell />
          </EditorProvider>
        </CoreEngineProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
