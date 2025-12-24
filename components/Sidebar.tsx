import React, { useState } from 'react';
import { extractTextFromPDF } from '../services/pdfService';
import { analyzeText } from '../services/geminiService';
import { PDFMetadata, AIAnalysis, ReadingMode } from '../types';

interface SidebarProps {
  onLoadText: (text: string) => void;
  currentText: string;
  mode: ReadingMode;
}

export const Sidebar: React.FC<SidebarProps> = ({ onLoadText, currentText, mode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setFileName(file.name);

    try {
      const metadata: PDFMetadata = await extractTextFromPDF(file);
      onLoadText(metadata.content);
    } catch (err) {
      setError('Failed to extract text from PDF. It might be password protected or an image scan.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!currentText) return;
    setIsAnalyzing(true);
    try {
      // Pass the current mode to the analysis service
      const result = await analyzeText(currentText, mode);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full lg:w-96 bg-slate-800 border-l border-slate-700 p-6 flex flex-col h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-white mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        HyperRead AI
      </h2>

      {/* Upload Section */}
      <div className="mb-8">
        <label className="block mb-2 text-sm font-medium text-slate-300">Upload Document</label>
        <div className="relative border-2 border-dashed border-slate-600 rounded-lg p-6 hover:border-indigo-500 transition-colors bg-slate-800/50 text-center">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={handleFileUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          {isLoading ? (
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-8 w-8 text-indigo-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm text-slate-400">Extracting text...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-sm text-slate-400 font-medium">{fileName || "Drop PDF or Click"}</span>
            </div>
          )}
        </div>
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {/* AI Analysis Section */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
            {mode === 'technical' ? 'Technical Brief' : 'AI Summary'}
          </h3>
          <button 
            onClick={handleAIAnalysis}
            disabled={!currentText || isAnalyzing}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-1 rounded-full transition-colors flex items-center"
          >
             {isAnalyzing ? (
               <>Processing...</>
             ) : (
               <>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.886-.632l4-12a1 1 0 011.253-.633zM5 7a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1zm0 6a1 1 0 011-1h12a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                 </svg>
                 Analyze
               </>
             )}
          </button>
        </div>

        <div className="flex-1 bg-slate-900/50 rounded-lg p-4 border border-slate-700 overflow-y-auto">
          {!analysis ? (
             <div className="text-slate-500 text-sm text-center mt-10 italic">
               Upload a document and select {mode === 'technical' ? 'Technical' : 'Normal'} mode, then analyze.
             </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <h4 className="text-indigo-400 text-xs font-bold uppercase mb-1">
                   {mode === 'technical' ? 'Abstract & Scope' : 'Executive Summary'}
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
              </div>
              
              <div>
                <h4 className="text-indigo-400 text-xs font-bold uppercase mb-1">
                  {mode === 'technical' ? 'Methodology & Hypotheses' : 'Key Concepts'}
                </h4>
                <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
                  {analysis.keyPoints.map((point, idx) => (
                    <li key={idx} className="leading-snug">{point}</li>
                  ))}
                </ul>
              </div>

               <div className="pt-2 border-t border-slate-700/50">
                <span className="text-xs text-slate-500">Est. Time: {analysis.estimatedReadingTime}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-4 text-xs text-slate-600 text-center">
        Powered by Gemini 3 Flash & pdf.js
      </div>
    </div>
  );
};