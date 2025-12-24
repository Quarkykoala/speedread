import React, { useState } from 'react';
import { extractTextFromPDF } from '../services/pdfService';
import { analyzeText, askQuestion } from '../services/geminiService';
import { DocumentMapItem, PDFMetadata, AIAnalysis, ReadingMode } from '../types';
import { PDFPageViewer } from './PDFPageViewer';

interface SidebarProps {
  onLoadDocument: (metadata: PDFMetadata) => void;
  currentText: string;
  mode: ReadingMode;
  currentPDFData: ArrayBuffer | null;
  currentPage: number;
  mapItems: DocumentMapItem[];
  onRequestPage: (page: number) => void;
  onClearPageOverride: () => void;
}

type Tab = 'upload' | 'context' | 'ai' | 'map';

export const Sidebar: React.FC<SidebarProps> = ({ 
  onLoadDocument, 
  currentText, 
  mode,
  currentPDFData,
  currentPage,
  mapItems,
  onRequestPage,
  onClearPageOverride
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  // 'fit' means auto-width, otherwise a specific number like 1.5 (150%)
  const [zoomLevel, setZoomLevel] = useState<number | 'fit'>('fit');

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
      onLoadDocument(metadata);
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

  const handleChatSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const question = chatInput.trim();
    if (!question || !currentText || isChatting) return;

    setChatInput('');
    setIsChatting(true);
    setChatMessages((prev) => [...prev, { role: 'user', content: question }]);
    try {
      const response = await askQuestion(currentText, question, mode);
      setChatMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } finally {
      setIsChatting(false);
    }
  };

  const renderChatContent = (content: string) => {
    const blocks = content
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);

    return blocks.map((block, blockIndex) => {
      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      const isList = lines.length > 1 && lines.every((line) => /^[-*]\s+/.test(line));

      if (isList) {
        return (
          <ul key={`list-${blockIndex}`} className="list-disc list-inside space-y-1">
            {lines.map((line, lineIndex) => (
              <li key={`list-${blockIndex}-${lineIndex}`}>{line.replace(/^[-*]\s+/, '')}</li>
            ))}
          </ul>
        );
      }

      return (
        <p key={`para-${blockIndex}`} className="leading-relaxed">
          {block}
        </p>
      );
    });
  };

  const adjustZoom = (delta: number) => {
    setZoomLevel(prev => {
      let current = prev === 'fit' ? 1.0 : prev;
      const next = Math.max(0.5, Math.min(3.0, current + delta));
      return next;
    });
  };

  const handleExpandClose = () => {
    setIsExpanded(false);
    setZoomLevel('fit'); // Reset zoom on close
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
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'map' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Map
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'ai' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            AI Brief
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 relative">
        
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
                   <div className="flex items-center space-x-2">
                      <span className="text-xs text-indigo-400 cursor-pointer hover:underline" onClick={() => setIsExpanded(true)}>
                        Expand View
                      </span>
                      <span className="bg-slate-700 px-2 py-0.5 rounded text-white">Page {currentPage}</span>
                   </div>
                 </div>
                 
                 {/* Sidebar Preview */}
                 <div className="flex-1 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden relative group cursor-pointer shadow-md transition-shadow hover:shadow-indigo-500/20" onClick={() => setIsExpanded(true)}>
                   <div className="absolute inset-0 overflow-auto flex items-start justify-center p-4 no-scrollbar">
                     <PDFPageViewer 
                        fileData={currentPDFData} 
                        pageNumber={currentPage} 
                        scale='fit'
                        className="w-full h-auto bg-slate-900 flex justify-center p-2 rounded-lg"
                     />
                   </div>
                   
                   {/* Hover Overlay */}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="bg-slate-900/90 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center shadow-xl border border-slate-700 backdrop-blur-sm transform transition-transform group-hover:scale-105">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        Click to Expand
                      </div>
                   </div>
                 </div>
                 <p className="text-xs text-slate-500 text-center mt-2">
                   This view automatically syncs with the word currently being read.
                 </p>
              </div>
            )}
          </div>
        )}

        {/* TAB: MAP */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            {!mapItems.length ? (
              <div className="text-slate-500 text-sm text-center mt-6">
                Upload a PDF to generate a skim map.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs uppercase tracking-wide font-bold text-slate-400">
                  <span>Skim Map</span>
                  <button
                    onClick={onClearPageOverride}
                    className="text-indigo-400 hover:underline text-xs"
                  >
                    Follow Reader
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Spend 60 seconds scanning headings and figures before you start. Click any item to jump the viewer.
                </p>
                <div className="space-y-2">
                  {mapItems.slice(0, 20).map((item, idx) => (
                    <button
                      key={`${item.type}-${item.page}-${idx}`}
                      onClick={() => {
                        onRequestPage(item.page);
                        setActiveTab('context');
                      }}
                      className="w-full text-left bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 hover:border-indigo-500/50 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="uppercase tracking-wide">{item.type}</span>
                        <span>Page {item.page}</span>
                      </div>
                      <div className="text-sm text-slate-200 mt-1 truncate">{item.text}</div>
                    </button>
                  ))}
                </div>
              </>
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

            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Ask the document
                </h4>
                <span className="text-xs text-slate-500">Chat uses current PDF text</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-3 h-48 overflow-y-auto space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="text-slate-500 text-xs text-center mt-6 italic">
                    Ask a question about this document and get a concise answer.
                  </div>
                ) : (
                  chatMessages.map((message, idx) => (
                    <div
                      key={`${message.role}-${idx}`}
                      className={`text-sm ${message.role === 'user' ? 'text-slate-200 text-right' : 'text-slate-300'}`}
                    >
                      <span className={`inline-block rounded-lg px-3 py-2 space-y-2 ${message.role === 'user' ? 'bg-indigo-600/30 border border-indigo-500/40' : 'bg-slate-800 border border-slate-700'}`}>
                        {message.role === 'assistant' ? renderChatContent(message.content) : message.content}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleChatSubmit} className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder={currentText ? "Ask a question..." : "Upload a PDF to chat"}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                  disabled={!currentText || isChatting}
                />
                <button
                  type="submit"
                  disabled={!currentText || isChatting}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isChatting ? "Asking..." : "Ask"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

       {/* EXPANDED MODAL OVERLAY */}
       {isExpanded && currentPDFData && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-fadeIn" onClick={handleExpandClose}>
            <div 
              className="relative w-full max-w-6xl h-full max-h-full bg-slate-900 rounded-xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col"
              onClick={(e) => e.stopPropagation()} 
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-850 shrink-0">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                     Page {currentPage}
                  </h3>
                  
                  {/* Zoom Controls */}
                  <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
                    <button 
                      onClick={() => adjustZoom(-0.25)}
                      className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                      title="Zoom Out"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="px-3 text-xs font-mono text-slate-300 min-w-[3rem] text-center">
                      {zoomLevel === 'fit' ? 'Auto' : `${Math.round(zoomLevel * 100)}%`}
                    </span>
                    <button 
                      onClick={() => adjustZoom(0.25)}
                      className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                      title="Zoom In"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <div className="w-px h-4 bg-slate-700 mx-1"></div>
                    <button 
                      onClick={() => setZoomLevel('fit')}
                      className={`px-2 py-1 text-xs font-medium rounded ${zoomLevel === 'fit' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Fit Width
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleExpandClose}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* PDF Content - Scrollable Area */}
              <div className="flex-1 overflow-auto bg-slate-950 relative">
                 <div className={`min-h-full p-8 flex flex-col items-center ${zoomLevel === 'fit' ? 'w-full' : 'w-max min-w-full'}`}>
                    <PDFPageViewer
                      fileData={currentPDFData}
                      pageNumber={currentPage}
                      scale={zoomLevel}
                      className="flex justify-center bg-slate-950 shadow-2xl max-w-none shrink-0"
                    />
                 </div>
              </div>
            </div>
         </div>
       )}
    </div>
  );
};

