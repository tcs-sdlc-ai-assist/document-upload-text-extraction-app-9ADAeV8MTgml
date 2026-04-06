import { ExtractionResult } from '../types';

export const TxtExtractor = {
  async extract(file: File): Promise<ExtractionResult> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const text = decoder.decode(arrayBuffer);

      return {
        success: true,
        text,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown error occurred while reading text file.';

      return {
        success: false,
        text: '',
        error: `Failed to extract text from TXT file: ${message}`,
      };
    }
  },
};