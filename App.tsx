import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ReaderDisplay } from './components/ReaderDisplay';
import { ControlPanel } from './components/ControlPanel';
import { Sidebar } from './components/Sidebar';
import { ReadingMode } from './types';

const DEFAULT_TEXT = "Welcome to HyperRead AI. Upload a PDF or paste text to begin speed reading. Switch to Technical Mode for adaptive pacing on complex documents.";

function App() {
  const [words, setWords] = useState<string[]>(DEFAULT_TEXT.split(' '));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [mode, setMode] = useState<ReadingMode>('normal');
  
  // Timer Ref to manage the loop. Used as a number for window.setTimeout.
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

  const handleTextLoad = (text: string) => {
    // Sanitize and split text
    const newWords = text
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(w => w.length > 0);
      
    setWords(newWords);
    resetReader();
  };

  // Adaptive Speed Logic Calculation
  const calculateDelay = useCallback((word: string, baseWpm: number, mode: ReadingMode) => {
    let baseDelay = 60000 / baseWpm;
    
    if (mode === 'technical' && word) {
      // Slow down for long words
      if (word.length > 8) baseDelay *= 1.3;
      if (word.length > 13) baseDelay *= 1.6;
      
      // Slow down for numbers, equations or figures (simple heuristic)
      if (/[0-9]/.test(word) || /fig|eq|tab/i.test(word)) baseDelay *= 1.5;
      
      // Significant pause for sentence endings
      if (/[.;:!?]$/.test(word)) baseDelay *= 2.2;
      
      // Pause for comma
      if (/,$/.test(word)) baseDelay *= 1.5;
    }

    return baseDelay;
  }, []);

  // The Core Loop - Now using recursive setTimeout for variable speed
  useEffect(() => {
    if (!isPlaying) return;

    const currentWord = words[currentIndex];
    const delay = calculateDelay(currentWord, wpm, mode);

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

  // Calculate Progress for UI
  const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0;

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col p-4 md:p-8 relative">
        <header className="absolute top-4 left-8 lg:hidden">
          <h1 className="text-xl font-bold text-slate-100">HyperRead AI</h1>
        </header>

        <div className="flex-1 flex items-center justify-center max-w-5xl mx-auto w-full">
          <ReaderDisplay 
            word={words[currentIndex]} 
            prevWord={words[currentIndex - 1]}
            nextWord={words[currentIndex + 1]}
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
        onLoadText={handleTextLoad} 
        currentText={words.join(' ')}
        mode={mode}
      />
    </div>
  );
}

export default App;