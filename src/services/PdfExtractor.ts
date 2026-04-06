import * as pdfjsLib from 'pdfjs-dist';
import type { ExtractionResult } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString();

export const PdfExtractor = {
  async extract(file: File): Promise<ExtractionResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const numPages = pdf.numPages;
      const pageTexts: string[] = [];

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item): item is { str: string; hasEOL?: boolean; transform: number[] } => 'str' in item)
          .map((item) => item.str)
          .join(' ');
        pageTexts.push(pageText);
      }

      const fullText = pageTexts.join('\n\n');

      return {
        success: true,
        text: fullText,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? `PDF extraction failed: ${error.message}`
          : 'PDF extraction failed: An unknown error occurred.';

      return {
        success: false,
        text: '',
        error: message,
      };
    }
  },
};