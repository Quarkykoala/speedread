export type ReadingMode = 'normal' | 'technical';

export interface ReaderState {
  words: string[];
  currentIndex: number;
  isPlaying: boolean;
  wpm: number;
  chunkSize: number;
}

export interface PDFMetadata {
  title: string;
  totalPages: number;
  content: string; // Extracted raw text
}

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  estimatedReadingTime: string;
}

// PDF.js types for window object since we load via CDN
declare global {
  interface Window {
    pdfjsLib: any;
  }
}