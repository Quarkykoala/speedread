import React from 'react';
import { ReadingMode } from '../types';

interface ControlPanelProps {
  wpm: number;
  setWpm: (wpm: number) => void;
  progress: number;
  onSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  totalWords: number;
  currentIndex: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  mode: ReadingMode;
  setMode: (mode: ReadingMode) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  wpm,
  setWpm,
  progress,
  onSeek,
  totalWords,
  currentIndex,
  isPlaying,
  onTogglePlay,
  onReset,
  mode,
  setMode
}) => {
  
  // Calculate time remaining
  const wordsLeft = totalWords - currentIndex;
  // Approximation for remaining time
  const minutesLeft = Math.floor(wordsLeft / wpm);
  const secondsLeft = Math.floor(((wordsLeft % wpm) / wpm) * 60);

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg space-y-6">
      
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-400 font-mono">
          <span>{currentIndex} / {totalWords} words</span>
          <span>~{minutesLeft}m {secondsLeft}s remaining</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={onSeek}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
        />
      </div>

      {/* Main Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Playback Buttons */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={onReset}
            className="p-3 rounded-full hover:bg-slate-700 text-slate-300 transition-colors"
            title="Restart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <button 
            onClick={onTogglePlay}
            className={`p-4 rounded-full transition-all transform hover:scale-105 shadow-lg ${
              isPlaying ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            )}
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700/50">
          <button
            onClick={() => setMode('normal')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'normal' 
              ? 'bg-slate-700 text-white shadow-sm' 
              : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Normal
          </button>
          <button
             onClick={() => setMode('technical')}
             className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
               mode === 'technical' 
               ? 'bg-indigo-600 text-white shadow-sm' 
               : 'text-slate-400 hover:text-slate-200'
             }`}
           >
            Technical
          </button>
        </div>

        {/* WPM Slider */}
        <div className="flex items-center space-x-4 w-full md:w-auto bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Speed</span>
          <div className="flex flex-col w-full md:w-48">
             <input
              type="range"
              min="60"
              max="1000"
              step="10"
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>60</span>
              <span className="text-indigo-400 font-bold">{wpm} WPM</span>
              <span>1000</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};