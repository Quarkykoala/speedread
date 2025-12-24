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

  const wordsLeft = totalWords - currentIndex;
  const minutesLeft = Math.floor(wordsLeft / wpm);
  const secondsLeft = Math.floor(((wordsLeft % wpm) / wpm) * 60);

  return (
    <div className="glass p-6 rounded-2xl shadow-2xl space-y-6">

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-white/50 font-mono">
          <span>{currentIndex} / {totalWords} words</span>
          <span>~{minutesLeft}m {secondsLeft}s remaining</span>
        </div>
        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 gradient-bg rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={onSeek}
          className="w-full h-2 bg-transparent rounded-lg cursor-pointer absolute opacity-0"
          style={{ marginTop: '-0.5rem' }}
        />
      </div>

      {/* Main Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">

        {/* Playback Buttons */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onReset}
            className="p-3 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all"
            title="Restart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={onTogglePlay}
            className={`p-4 rounded-full transition-all transform hover:scale-105 shadow-xl gradient-glow ${isPlaying ? 'bg-white/10 hover:bg-white/20 text-white' : 'gradient-bg text-white'
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
        <div className="flex bg-black/30 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setMode('normal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'normal'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/50 hover:text-white'
              }`}
          >
            Normal
          </button>
          <button
            onClick={() => setMode('technical')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${mode === 'technical'
                ? 'gradient-bg text-white shadow-sm'
                : 'text-white/50 hover:text-white'
              }`}
          >
            Technical
          </button>
        </div>

        {/* WPM Slider */}
        <div className="flex items-center space-x-4 w-full md:w-auto bg-black/30 p-3 rounded-xl border border-white/10">
          <span className="text-sm font-bold text-white/50 uppercase tracking-wider">Speed</span>
          <div className="flex flex-col w-full md:w-48">
            <input
              type="range"
              min="60"
              max="1000"
              step="10"
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-full h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>60</span>
              <span className="gradient-text font-bold" style={{ WebkitTextFillColor: 'transparent', background: 'linear-gradient(135deg, #FF6B9D, #FF7043)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>{wpm} WPM</span>
              <span>1000</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};