import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReaderDisplay } from './components/ReaderDisplay';
import { ControlPanel } from './components/ControlPanel';
import { Sidebar } from './components/Sidebar';
import { DocumentMapItem, PDFMetadata, ReadingMode, WordItem } from './types';

const DEFAULT_TEXT_OBJ: WordItem[] = "Welcome to HyperRead AI. Upload a PDF or paste text to begin speed reading. Switch to Technical Mode for adaptive pacing and visual context syncing.".split(' ').map(w => ({ text: w, page: 1 }));

function App() {
  const [words, setWords] = useState<WordItem[]>(DEFAULT_TEXT_OBJ);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [mode, setMode] = useState<ReadingMode>('normal');

  // State for Context Viewing
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [fullRawText, setFullRawText] = useState<string>("");
  const [mapItems, setMapItems] = useState<DocumentMapItem[]>([]);
  const [figureIndex, setFigureIndex] = useState<Record<string, number>>({});
  const [manualContextPage, setManualContextPage] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);

  const startReader = useCallback(() => {
    if (currentIndex >= words.length) {
      setCurrentIndex(0);
    }
    setManualContextPage(null);
    setIsPlaying(true);
  }, [currentIndex, words.length]);

  const pauseReader = useCallback(() => {
    setIsPlaying(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetReader = useCallback(() => {
    pauseReader();
    setCurrentIndex(0);
  }, [pauseReader]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pauseReader();
    } else {
      startReader();
    }
  }, [isPlaying, pauseReader, startReader]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = Number(e.target.value);
    const newIndex = Math.floor((percentage / 100) * words.length);
    setCurrentIndex(newIndex);
  };

  const handleDocumentLoad = (metadata: PDFMetadata) => {
    setWords(metadata.words);
    setFullRawText(metadata.rawContent);
    setPdfData(metadata.fileData);
    setMapItems(metadata.mapItems);
    setFigureIndex(metadata.figureIndex);
    setManualContextPage(null);
    resetReader();
    setMode('technical');
  };

  const scoreWordDifficulty = useCallback((word: string, readingMode: ReadingMode) => {
    if (!word) return 0;
    let score = 0;

    if (word.length > 8) score += 0.15;
    if (word.length > 13) score += 0.2;
    if (/[0-9]/.test(word)) score += 0.2;
    if (/%|\$|kg|mg|cm|mm|hz|khz|mhz|ghz/i.test(word)) score += 0.15;
    if (/[<>=]/.test(word)) score += 0.2;
    if (/Fig\.|Figure|Table|Tab\.|Eq\./.test(word)) score += 0.2;
    if (/[();:]/.test(word)) score += 0.1;

    if (readingMode === 'normal') {
      score *= 0.6;
    }

    return Math.min(1, score);
  }, []);

  const getFigureReferencePage = useCallback((word: string) => {
    const match = word.match(/(?:Fig\.|Figure|Table|Tab\.)\s*([0-9]+[a-z]?)/i);
    if (!match) return null;
    return figureIndex[match[1]] ?? null;
  }, [figureIndex]);

  const calculateDelay = useCallback((item: WordItem, baseWpm: number, mode: ReadingMode) => {
    let baseDelay = 60000 / baseWpm;
    const word = item.text;
    const difficulty = scoreWordDifficulty(word, mode);

    if (mode === 'technical' && word) {
      if (word.length > 8) baseDelay *= 1.3;
      if (word.length > 13) baseDelay *= 1.6;
      if (/[0-9]/.test(word)) baseDelay *= 1.4;
      if (/%|\$|€|kg|mg|cm/.test(word)) baseDelay *= 1.2;
      if (/Fig\.|Tab\.|Eq\./.test(word)) baseDelay *= 1.5;
      if (/[.;:!?]$/.test(word)) baseDelay *= 2.2;
      if (/,$/.test(word)) baseDelay *= 1.5;
    }

    baseDelay *= 1 + difficulty * (mode === 'technical' ? 1.1 : 0.4);

    return baseDelay;
  }, [scoreWordDifficulty]);

  useEffect(() => {
    if (!isPlaying) return;

    const currentItem = words[currentIndex];
    const delay = calculateDelay(currentItem, wpm, mode);

    timerRef.current = window.setTimeout(() => {
      setCurrentIndex((prev) => {
        if (prev >= words.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, wpm, mode, words, calculateDelay]);

  const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0;
  const currentWordItem = words[currentIndex];
  const currentWordText = currentWordItem?.text || "";
  const prevWordText = words[currentIndex - 1]?.text || "";
  const nextWordText = words[currentIndex + 1]?.text || "";
  const figurePage = currentWordItem ? getFigureReferencePage(currentWordItem.text) : null;
  const autoPage = figurePage ?? currentWordItem?.page ?? 1;
  const currentPage = manualContextPage ?? autoPage;
  const difficulty = scoreWordDifficulty(currentWordText, mode);

  return (
    <div className="relative flex flex-col lg:flex-row h-screen bg-black text-white overflow-hidden">

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 relative z-10">
        <header className="absolute top-4 left-8 lg:hidden">
          <h1 className="text-xl font-bold gradient-text">HyperRead AI</h1>
        </header>

        <div className="flex-1 flex items-center justify-center max-w-5xl mx-auto w-full">
          <ReaderDisplay
            word={currentWordText}
            prevWord={prevWordText}
            nextWord={nextWordText}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            mode={mode}
            difficulty={difficulty}
          />
        </div>

        <div className="mt-8 max-w-5xl mx-auto w-full">
          <ControlPanel
            wpm={wpm}
            setWpm={setWpm}
            progress={progress}
            onSeek={handleSeek}
            totalWords={words.length}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            onTogglePlay={togglePlay}
            onReset={resetReader}
            mode={mode}
            setMode={setMode}
          />
        </div>
      </main>

      {/* Sidebar */}
      <Sidebar
        onLoadDocument={handleDocumentLoad}
        currentText={fullRawText}
        mode={mode}
        currentPDFData={pdfData}
        currentPage={currentPage}
        mapItems={mapItems}
        onRequestPage={(page) => setManualContextPage(page)}
        onClearPageOverride={() => setManualContextPage(null)}
      />
    </div>
  );
}

export default App;
