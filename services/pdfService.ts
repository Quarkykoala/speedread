import { PDFMetadata } from '../types';

export const extractTextFromPDF = async (file: File): Promise<PDFMetadata> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer) {
          reject(new Error("Failed to read file"));
          return;
        }

        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        const totalPages = pdf.numPages;

        // Process pages safely
        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += pageText + ' ';
        }

        // Basic clean up of text
        fullText = fullText.replace(/\s+/g, ' ').trim();

        resolve({
          title: file.name.replace('.pdf', ''),
          totalPages: totalPages,
          content: fullText
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
