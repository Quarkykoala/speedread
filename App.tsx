import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReaderDisplay } from './components/ReaderDisplay';
import { ControlPanel } from './components/ControlPanel';
import { Sidebar } from './components/Sidebar';
import { ReadingMode, WordItem } from './types';

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
  
  const timerRef = useRef<number | null>(null);

  const startReader = useCallback(() => {
    if (currentIndex >= words.length) {
      setCurrentIndex(0);
    }
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

  const handleDocumentLoad = (newWords: WordItem[], rawText: string, fileData: ArrayBuffer) => {
    setWords(newWords);
    setFullRawText(rawText);
    setPdfData(fileData);
    resetReader();
    setMode('technical'); // Auto-switch to technical mode for PDFs
  };

  // Adaptive Speed Logic Calculation
  const calculateDelay = useCallback((item: WordItem, baseWpm: number, mode: ReadingMode) => {
    let baseDelay = 60000 / baseWpm;
    const word = item.text;
    
    if (mode === 'technical' && word) {
      // Chunk length penalty (longer chunks like "1,200 kg" take longer to read)
      if (word.length > 8) baseDelay *= 1.3;
      if (word.length > 13) baseDelay *= 1.6;
      
      // Pattern recognition for data
      if (/[0-9]/.test(word)) baseDelay *= 1.4; // Numbers take cognitive load
      if (/%|\$|€|kg|mg|cm/.test(word)) baseDelay *= 1.2; // Units
      if (/Fig\.|Tab\.|Eq\./.test(word)) baseDelay *= 1.5; // References
      
      // Punctuation pauses
      if (/[.;:!?]$/.test(word)) baseDelay *= 2.2;
      if (/,$/.test(word)) baseDelay *= 1.5;
    }

    return baseDelay;
  }, []);

  // The Core Loop
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

  // Derived state
  const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0;
  const currentWordItem = words[currentIndex];
  
  // Safe accessors for display
  const currentWordText = currentWordItem?.text || "";
  const prevWordText = words[currentIndex - 1]?.text || "";
  const nextWordText = words[currentIndex + 1]?.text || "";
  const currentPage = currentWordItem?.page || 1;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 relative">
        <header className="absolute top-4 left-8 lg:hidden">
          <h1 className="text-xl font-bold text-slate-100">HyperRead AI</h1>
        </header>

        <div className="flex-1 flex items-center justify-center max-w-5xl mx-auto w-full">
          <ReaderDisplay 
            word={currentWordText} 
            prevWord={prevWordText}
            nextWord={nextWordText}
            isPlaying={isPlaying} 
            onTogglePlay={togglePlay}
            mode={mode}
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
      />
    </div>
  );
}

export default App;