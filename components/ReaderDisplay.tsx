import React, { useMemo } from 'react';
import { ReadingMode } from '../types';

interface ReaderDisplayProps {
  word: string;
  prevWord?: string;
  nextWord?: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  mode: ReadingMode;
}

export const ReaderDisplay: React.FC<ReaderDisplayProps> = ({ 
  word, 
  prevWord,
  nextWord,
  isPlaying, 
  onTogglePlay,
  mode 
}) => {
  
  // Pivot logic: Find the "optical center" of the word
  const pivotIndex = useMemo(() => {
    if (!word) return 0;
    const length = word.length;
    // Slightly left of center is usually best for ORP (Optimal Recognition Point)
    return Math.floor((length - 1) / 2);
  }, [word]);

  const leftPart = word ? word.slice(0, pivotIndex) : '';
  const pivotChar = word ? word[pivotIndex] : '';
  const rightPart = word ? word.slice(pivotIndex + 1) : '';

  const isTechnical = mode === 'technical';

  return (
    <div 
      className={`relative w-full h-80 rounded-xl shadow-inner border flex flex-col items-center justify-center cursor-pointer group overflow-hidden transition-colors duration-500
        ${isTechnical 
          ? 'bg-slate-900 border-indigo-900/50' 
          : 'bg-slate-800 border-slate-700'
        }
      `}
      onClick={onTogglePlay}
    >
      {/* Technical Background Grid */}
      {isTechnical && (
        <div className="absolute inset-0 opacity-10" 
             style={{ 
               backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }}>
        </div>
      )}

      {/* Guides */}
      <div className={`absolute top-4 bottom-4 w-px left-1/2 transform -translate-x-1/2 transition-colors ${isTechnical ? 'bg-indigo-500/30' : 'bg-slate-700/50'}`}></div>
      <div className={`absolute left-4 right-4 h-px top-1/2 transform -translate-y-1/2 transition-colors ${isTechnical ? 'bg-indigo-500/30' : 'bg-slate-700/50'}`}></div>

      {/* Context Words for Technical Mode */}
      {isTechnical && word && (
        <div className="absolute w-full flex justify-between px-8 top-1/2 transform -translate-y-1/2 pointer-events-none opacity-30 blur-[1px]">
          <span className="text-2xl text-slate-400 font-mono hidden md:block w-1/3 text-right pr-12 truncate">{prevWord}</span>
          <span className="text-2xl text-slate-400 font-mono hidden md:block w-1/3 text-left pl-12 truncate ml-auto">{nextWord}</span>
        </div>
      )}

      {!word ? (
        <div className="text-slate-500 text-lg font-medium animate-pulse">
          Ready to Read
        </div>
      ) : (
        <div className={`flex items-baseline font-mono select-none relative z-10 ${isTechnical ? 'text-5xl md:text-6xl lg:text-7xl' : 'text-6xl md:text-7xl lg:text-8xl'}`}>
          <span className="text-slate-100 text-right w-[45vw] sm:w-[300px] md:w-[400px]">
            {leftPart}
          </span>
          <span className="text-red-500 font-bold mx-0.5 transform scale-110 inline-block">
            {pivotChar}
          </span>
          <span className="text-slate-100 text-left w-[45vw] sm:w-[300px] md:w-[400px]">
            {rightPart}
          </span>
        </div>
      )}

      {/* Technical Mode Indicator */}
      {isTechnical && (
        <div className="absolute top-4 right-4 text-xs font-mono text-indigo-400 border border-indigo-500/30 px-2 py-1 rounded bg-indigo-900/20">
          TECHNICAL MODE
        </div>
      )}

      {/* Hover Overlay Icon */}
      <div className={`absolute inset-0 bg-black/10 flex items-center justify-center transition-opacity duration-200 ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
        {isPlaying ? (
           <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
    </div>
  );
};