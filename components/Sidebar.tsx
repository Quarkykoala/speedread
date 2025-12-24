import React, { useState } from 'react';
import { extractTextFromPDF } from '../services/pdfService';
import { analyzeText } from '../services/geminiService';
import { PDFMetadata, AIAnalysis, ReadingMode } from '../types';
import { PDFPageViewer } from './PDFPageViewer';

interface SidebarProps {
  onLoadDocument: (words: any[], rawText: string, fileData: ArrayBuffer) => void;
  currentText: string;
  mode: ReadingMode;
  currentPDFData: ArrayBuffer | null;
  currentPage: number;
}

type Tab = 'upload' | 'context' | 'ai';

export const Sidebar: React.FC<SidebarProps> = ({ 
  onLoadDocument, 
  currentText, 
  mode,
  currentPDFData,
  currentPage
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
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
      onLoadDocument(metadata.words, metadata.rawContent, metadata.fileData);
      setActiveTab('context'); // Auto switch to context view
    } catch (err) {
      setError('Failed to extract text from PDF.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (!currentText) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeText(currentText, mode);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full lg:w-[450px] bg-slate-800 border-l border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-slate-700 bg-slate-850">
        <h2 className="text-xl font-bold text-white flex items-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          HyperRead AI
        </h2>
        
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-slate-900/50 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'upload' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Upload
          </button>
          <button 
            onClick={() => setActiveTab('context')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'context' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Doc View
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'ai' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            AI Brief
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        
        {/* TAB: UPLOAD */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <label className="block mb-2 text-sm font-medium text-slate-300">Upload Document</label>
            <div className="relative border-2 border-dashed border-slate-600 rounded-lg p-8 hover:border-indigo-500 transition-colors bg-slate-800/50 text-center">
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
                  <span className="text-sm text-slate-400">Processing Document...</span>
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
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload a PDF to enable Technical Mode features like graph visualization and intelligent data chunking.
            </p>
          </div>
        )}

        {/* TAB: CONTEXT (DOC VIEW) */}
        {activeTab === 'context' && (
          <div className="h-full flex flex-col">
            {!currentPDFData ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                <p>No document loaded.</p>
                <button onClick={() => setActiveTab('upload')} className="text-indigo-400 text-sm mt-2 hover:underline">Go to upload</button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-2">
                 <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wide font-bold">
                   <span>Visual Context</span>
                   <span className="bg-slate-700 px-2 py-0.5 rounded text-white">Page {currentPage}</span>
                 </div>
                 <div className="flex-1 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden relative">
                   <div className="absolute inset-0 overflow-auto flex items-start justify-center p-4">
                     <PDFPageViewer fileData={currentPDFData} pageNumber={currentPage} />
                   </div>
                 </div>
                 <p className="text-xs text-slate-500 text-center mt-2">
                   This view automatically syncs with the word currently being read.
                 </p>
              </div>
            )}
          </div>
        )}

        {/* TAB: AI ANALYSIS */}
        {activeTab === 'ai' && (
           <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
                Gemini Analysis
              </h3>
              <button 
                onClick={handleAIAnalysis}
                disabled={!currentText || isAnalyzing}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-1 rounded-full transition-colors flex items-center"
              >
                 {isAnalyzing ? "Processing..." : "Generate Brief"}
              </button>
            </div>

            <div className="flex-1 bg-slate-900/50 rounded-lg p-4 border border-slate-700 overflow-y-auto">
              {!analysis ? (
                 <div className="text-slate-500 text-sm text-center mt-10 italic">
                   Click "Generate Brief" to analyze the document structure, methodology, and key findings.
                 </div>
              ) : (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h4 className="text-indigo-400 text-xs font-bold uppercase mb-1">Summary</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">{analysis.summary}</p>
                  </div>
                  <div>
                    <h4 className="text-indigo-400 text-xs font-bold uppercase mb-1">Key Points</h4>
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
        )}

      </div>
    </div>
  );
};