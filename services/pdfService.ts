import { DocumentMapItem, PDFMetadata, WordItem } from '../types';

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

const FIGURE_LINE = /(Figure|Fig\.|Table|Tab\.)\s*([0-9]+[a-z]?)/i;

const groupLines = (items: any[]) => {
  const lines: Array<{ y: number; height: number; items: any[] }> = [];
  const tolerance = 2;

  const sorted = [...items].sort((a, b) => {
    const yDiff = b.transform[5] - a.transform[5];
    if (Math.abs(yDiff) > tolerance) return yDiff;
    return a.transform[4] - b.transform[4];
  });

  for (const item of sorted) {
    const y = item.transform[5];
    const height = item.height || 0;
    const existing = lines.find((line) => Math.abs(line.y - y) <= tolerance);
    if (existing) {
      existing.items.push(item);
      existing.height = Math.max(existing.height, height);
    } else {
      lines.push({ y, height, items: [item] });
    }
  }

  return lines.map((line) => {
    const text = line.items
      .sort((a, b) => a.transform[4] - b.transform[4])
      .map((item) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    return { text, height: line.height };
  });
};

const isLikelyHeading = (
  text: string,
  height: number,
  medianHeight: number,
  p75Height: number,
  p90Height: number
) => {
  if (!text || text.length < 4) return false;
  const wordCount = text.split(' ').length;
  if (wordCount > 12 || text.length > 90) return false;
  const letters = text.replace(/[^A-Za-z]/g, '');
  const upperRatio = text.replace(/[^A-Z]/g, '').length / Math.max(letters.length, 1);
  const looksUpper = upperRatio > 0.6;
  const looksTitle = /^[A-Z][A-Za-z0-9]/.test(text);
  const sizeBoost = height >= p90Height
    ? 2
    : height >= p75Height
      ? 1
      : 0;
  const isBig = height >= medianHeight * (sizeBoost ? 1.1 : 1.35);
  return isBig || (looksUpper && height >= medianHeight) || looksTitle;
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
        const mapItems: DocumentMapItem[] = [];
        const figureIndex: Record<string, number> = {};
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          
          // Join items with space, but respect basic layout flow
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');

          const itemHeights = textContent.items
            .map((item: any) => item.height)
            .filter((value: number) => value && value > 0)
            .sort((a: number, b: number) => a - b);
          const medianHeight =
            itemHeights.length > 0
              ? itemHeights[Math.floor(itemHeights.length / 2)]
              : 0;
          const p75Height =
            itemHeights.length > 0
              ? itemHeights[Math.floor(itemHeights.length * 0.75)]
              : medianHeight;
          const p90Height =
            itemHeights.length > 0
              ? itemHeights[Math.floor(itemHeights.length * 0.9)]
              : p75Height;

          const lines = groupLines(textContent.items);
          for (const line of lines) {
            if (!line.text) continue;
            const match = line.text.match(FIGURE_LINE);
            if (match) {
              const label = match[1].toLowerCase();
              const number = match[2];
              const type = label.startsWith('tab') ? 'table' : 'figure';
              mapItems.push({ type, text: line.text, page: i });
              if (!figureIndex[number]) {
                figureIndex[number] = i;
              }
              continue;
            }

            if (isLikelyHeading(line.text, line.height, medianHeight, p75Height, p90Height)) {
              mapItems.push({ type: 'heading', text: line.text, page: i });
            }
          }
          
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
          fileData: arrayBuffer, // Return the original, intact buffer
          mapItems,
          figureIndex
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
