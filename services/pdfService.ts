import { PDFMetadata, WordItem } from '../types';

// Regex patterns to identify technical chunks that should stick together
const PATTERNS = {
  // Matches numbers with units (e.g., "50 mg", "100 km/h", "5 %")
  NUMBER_UNIT: /^[\d,.]+\s*(mg|g|kg|ml|l|mm|cm|m|km|s|ms|h|Hz|kHz|MHz|GHz|V|A|W|J|N|Pa|%|°C|°F)$/i,
  // Matches currency (e.g., "$ 50", "€ 100")
  CURRENCY: /^[$€£¥]\s*[\d,.]+$/,
  // Matches references (e.g., "Fig. 1", "Table 2", "Ref. [3]")
  REFERENCE: /^(Fig\.|Figure|Tab\.|Table|Ref\.|Eq\.)\s*\d+[a-z]?$/i,
  // Matches bracketed citations like [1] or [12-14]
  CITATION: /^\[\s*[\d,\-]+\s*\]$/,
  // Matches simple math/logic operators inside words (e.g., "p<0.05")
  MATH: /[<>=≈]/
};

const tokenizeText = (text: string, pageNum: number): WordItem[] => {
  // 1. Initial split by spaces
  const rawTokens = text.replace(/\s+/g, ' ').trim().split(' ');
  const processed: WordItem[] = [];

  let i = 0;
  while (i < rawTokens.length) {
    let current = rawTokens[i];
    let merged = false;

    // Look ahead to merge patterns
    if (i + 1 < rawTokens.length) {
      const next = rawTokens[i + 1];
      const combined = `${current} ${next}`;

      // Check for Number + Unit grouping (e.g., "10" + "mg")
      // Check for Figure/Table grouping (e.g., "Fig." + "1")
      // Check for Currency grouping (e.g., "$" + "100")
      if (
        (!isNaN(parseFloat(current.replace(/,/g, ''))) && /^(mg|kg|cm|%|mm|s)$/i.test(next)) || // Simple number + unit
        /^(Fig\.|Figure|Table|Tab\.|Eq\.|Equation)$/i.test(current) || // Reference header
        /^[$€£]$/.test(current) // Currency symbol
      ) {
        processed.push({ text: combined, page: pageNum });
        i += 2;
        merged = true;
        continue;
      }
    }

    if (!merged) {
      processed.push({ text: current, page: pageNum });
      i++;
    }
  }

  return processed;
};

export const extractTextFromPDF = async (file: File): Promise<PDFMetadata> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          reject(new Error("Failed to read file"));
          return;
        }

        // Clone the buffer before passing to pdf.js
        // pdf.js worker interactions can detach/transfer the buffer, making the original unusable.
        const bufferClone = arrayBuffer.slice(0);

        const loadingTask = window.pdfjsLib.getDocument({ data: bufferClone });
        const pdf = await loadingTask.promise;
        
        let allWords: WordItem[] = [];
        let fullRawText = '';
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Join items with space, but respect basic layout flow
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          // Tokenize this page specifically
          const pageWords = tokenizeText(pageText, i);
          
          allWords = [...allWords, ...pageWords];
          fullRawText += pageText + ' ';
        }

        // Clean up full raw text for AI
        fullRawText = fullRawText.replace(/\s+/g, ' ').trim();

        resolve({
          title: file.name.replace('.pdf', ''),
          totalPages: totalPages,
          words: allWords,
          rawContent: fullRawText,
          fileData: arrayBuffer // Return the original, intact buffer
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};