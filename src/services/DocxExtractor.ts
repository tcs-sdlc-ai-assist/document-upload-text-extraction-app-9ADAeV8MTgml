import mammoth from 'mammoth';
import type { ExtractionResult } from '../types';

export const DocxExtractor = {
  async extract(file: File): Promise<ExtractionResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });

      return {
        success: true,
        text: result.value,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during DOCX extraction';

      return {
        success: false,
        text: '',
        error: `Failed to extract text from DOCX file "${file.name}": ${message}`,
      };
    }
  },
};