import React, { useEffect, useRef, useState } from 'react';

interface PDFPageViewerProps {
  fileData: ArrayBuffer | null;
  pageNumber: number;
  className?: string;
  onClick?: () => void;
  scale?: number | 'fit'; // 'fit' is default if undefined
}

export const PDFPageViewer: React.FC<PDFPageViewerProps> = ({ 
  fileData, 
  pageNumber, 
  className, 
  onClick,
  scale = 'fit' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  // Force re-render on window resize if in fit mode
  const [resizeTrigger, setResizeTrigger] = useState(0);

  // 1. Load the PDF Document only when fileData changes
  useEffect(() => {
    if (!fileData) {
      setPdfDoc(null);
      return;
    }

    const loadPdf = async () => {
      try {
        // Clone the buffer to prevent detachment issues
        const dataCopy = fileData.slice(0);
        
        const loadingTask = window.pdfjsLib.getDocument({ data: dataCopy });
        const pdf = await loadingTask.promise;
        setPdfDoc(pdf);
      } catch (err) {
        console.error("Error loading PDF document:", err);
      }
    };

    loadPdf();
  }, [fileData]);

  // Handle Resize
  useEffect(() => {
    if (scale !== 'fit') return;
    
    const handleResize = () => {
      // Debounce slightly or just update state to trigger render
      setResizeTrigger(prev => prev + 1);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [scale]);

  // 2. Render the specific page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel();
        }

        const safePageNum = Math.min(Math.max(1, pageNumber), pdfDoc.numPages);
        const page = await pdfDoc.getPage(safePageNum);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // --- High DPI Rendering Logic ---
        const dpr = window.devicePixelRatio || 1;
        
        // Get unscaled viewport to measure aspect ratio
        const unscaledViewport = page.getViewport({ scale: 1 });
        
        let displayScale = 1;

        if (scale === 'fit') {
          // Calculate scale to fit container width
          const containerWidth = canvas.parentElement?.clientWidth || 300;
          displayScale = containerWidth / unscaledViewport.width;
        } else if (typeof scale === 'number') {
          displayScale = scale;
        }

        // The critical fix: Render at high resolution (scale * dpr), display at CSS size (scale)
        const outputScale = displayScale * dpr;
        const viewport = page.getViewport({ scale: outputScale });

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        // Force CSS to match the logical display size (undoing the dpr multiplication)
        canvas.style.width = `${Math.floor(viewport.width / dpr)}px`;
        canvas.style.height = `${Math.floor(viewport.height / dpr)}px`;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          // Optional: Improve text rendering quality
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (error: any) {
        if (error.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', error);
        }
      }
    };

    // Timeout ensures the container has settled its layout width
    const timeoutId = setTimeout(renderPage, 10);
    return () => clearTimeout(timeoutId);

  }, [pdfDoc, pageNumber, scale, resizeTrigger]);

  if (!fileData) return null;

  return (
    <div 
      className={className || "w-full bg-slate-900 flex justify-center p-2 rounded-lg border border-slate-700 overflow-hidden"}
      onClick={onClick}
    >
      <canvas ref={canvasRef} className="shadow-lg" />
    </div>
  );
};