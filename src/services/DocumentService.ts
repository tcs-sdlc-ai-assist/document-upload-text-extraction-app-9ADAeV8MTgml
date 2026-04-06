import { validateFile } from './FileValidator';
import { extractText } from './ExtractorFactory';
import { cleanText } from './TextCleaner';
import { documentRepository } from './DocumentRepository';
import { UploadStatus } from '../types';
import type { DocumentEntry, ExtractionResult } from '../types';

export interface UploadProgress {
  status: UploadStatus;
  message: string;
}

export interface UploadResult {
  success: boolean;
  document: DocumentEntry | null;
  error?: string;
}

type ProgressCallback = (progress: UploadProgress) => void;

const MAX_EXTRACTION_RETRIES = 2;

function reportProgress(
  onProgress: ProgressCallback | undefined,
  status: UploadStatus,
  message: string,
): void {
  if (onProgress) {
    onProgress({ status, message });
  }
}

async function attemptExtraction(
  file: File,
  retries: number,
): Promise<ExtractionResult> {
  let lastError = '';

  for (let attempt = 0; attempt <= retries; attempt++) {
    const result = await extractText(file);

    if (result.success) {
      return result;
    }

    lastError = result.error || 'Unknown extraction error';

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  return {
    success: false,
    text: '',
    error: lastError,
  };
}

export async function uploadAndExtract(
  file: File,
  userId: string,
  onProgress?: ProgressCallback,
): Promise<UploadResult> {
  try {
    // Stage 1: Validation
    reportProgress(onProgress, UploadStatus.Validating, 'Validating file...');

    const validationResult = validateFile(file);
    if (!validationResult.valid) {
      reportProgress(onProgress, UploadStatus.Error, validationResult.error || 'Validation failed.');
      return {
        success: false,
        document: null,
        error: validationResult.error,
      };
    }

    // Stage 2: Extraction
    reportProgress(onProgress, UploadStatus.Extracting, `Extracting text from "${file.name}"...`);

    let extractionResult: ExtractionResult;
    try {
      extractionResult = await attemptExtraction(file, MAX_EXTRACTION_RETRIES);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during extraction.';
      reportProgress(onProgress, UploadStatus.Error, message);
      return {
        success: false,
        document: null,
        error: message,
      };
    }

    if (!extractionResult.success) {
      const errorMessage = extractionResult.error || 'Text extraction failed.';
      reportProgress(onProgress, UploadStatus.Error, errorMessage);
      return {
        success: false,
        document: null,
        error: errorMessage,
      };
    }

    // Stage 3: Cleaning
    reportProgress(onProgress, UploadStatus.Cleaning, 'Cleaning extracted text...');

    const cleanedText = cleanText(extractionResult.text);

    // Stage 4: Saving
    reportProgress(onProgress, UploadStatus.Saving, 'Saving document...');

    let savedDocument: DocumentEntry;
    try {
      savedDocument = documentRepository.saveDocument(
        file.name,
        file.type as DocumentEntry['metadata']['fileType'],
        file.size,
        userId,
        cleanedText,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to save document to storage.';
      reportProgress(onProgress, UploadStatus.Error, message);
      return {
        success: false,
        document: null,
        error: message,
      };
    }

    // Stage 5: Complete
    reportProgress(onProgress, UploadStatus.Complete, 'Document processed successfully.');

    return {
      success: true,
      document: savedDocument,
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unexpected error occurred during document processing.';
    reportProgress(onProgress, UploadStatus.Error, message);
    return {
      success: false,
      document: null,
      error: message,
    };
  }
}

export function getHistory(userId: string): DocumentEntry[] {
  return documentRepository.getDocuments(userId);
}

export function getDocumentById(id: string, userId: string): DocumentEntry | null {
  return documentRepository.getDocumentById(id, userId);
}

export function deleteDocument(id: string, userId: string): boolean {
  return documentRepository.deleteDocument(id, userId);
}

export function clearHistory(userId: string): void {
  documentRepository.clearUserDocuments(userId);
}