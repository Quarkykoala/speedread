export type ReadingMode = 'normal' | 'technical';

export interface WordItem {
  text: string;
  page: number; // The PDF page this word belongs to
}

export interface ReaderState {
  words: WordItem[];
  currentIndex: number;
  isPlaying: boolean;
  wpm: number;
  chunkSize: number;
}

export interface PDFMetadata {
  title: string;
  totalPages: number;
  words: WordItem[]; // Changed from simple string to structured items
  rawContent: string; // For AI analysis
  fileData: ArrayBuffer; // To render the visual PDF
}

export interface AIAnalysis {
  summary: string;
  keyPoints: string[];
  estimatedReadingTime: string;
}

declare global {
  interface Window {
    pdfjsLib: any;
  }
}