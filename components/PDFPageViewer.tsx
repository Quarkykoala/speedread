import React, { useEffect, useRef, useState } from 'react';

interface PDFPageViewerProps {
  fileData: ArrayBuffer | null;
  pageNumber: number;
}

export const PDFPageViewer: React.FC<PDFPageViewerProps> = ({ fileData, pageNumber }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // 1. Load the PDF Document only when fileData changes
  useEffect(() => {
    if (!fileData) {
      setPdfDoc(null);
      return;
    }

    const loadPdf = async () => {
      try {
        // Clone the buffer to prevent detachment issues if this component remounts
        // or if pdf.js transfers the buffer to a worker.
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

  // 2. Render the specific page when pdfDoc or pageNumber changes
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    const renderPage = async () => {
      try {
        // Cancel previous render if existing
        if (renderTaskRef.current) {
          await renderTaskRef.current.cancel();
        }

        // Ensure page number is valid
        const safePageNum = Math.min(Math.max(1, pageNumber), pdfDoc.numPages);
        const page = await pdfDoc.getPage(safePageNum);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Calculate scale to fit width of container
        const containerWidth = canvas.parentElement?.clientWidth || 300;
        const viewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
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

    renderPage();
  }, [pdfDoc, pageNumber]);

  if (!fileData) return null;

  return (
    <div className="w-full bg-slate-900 flex justify-center p-2 rounded-lg border border-slate-700 overflow-hidden">
      <canvas ref={canvasRef} className="max-w-full h-auto shadow-lg" />
    </div>
  );
};