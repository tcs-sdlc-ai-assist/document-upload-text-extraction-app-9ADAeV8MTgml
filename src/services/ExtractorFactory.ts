import { PdfExtractor } from './PdfExtractor';
import { DocxExtractor } from './DocxExtractor';
import { TxtExtractor } from './TxtExtractor';
import { FILE_TYPE_LABELS, SUPPORTED_FILE_EXTENSIONS } from '../constants';
import type { ExtractionResult, SupportedFileType } from '../types';

type Extractor = {
  extract(file: File): Promise<ExtractionResult>;
};

const extractorMap: Record<SupportedFileType, Extractor> = {
  'application/pdf': PdfExtractor,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': DocxExtractor,
  'text/plain': TxtExtractor,
};

const extensionToMimeMap: Record<string, SupportedFileType> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
};

function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }
  return fileName.slice(lastDotIndex).toLowerCase();
}

function resolveExtractor(file: File): Extractor | null {
  const mimeType = file.type as SupportedFileType;
  if (mimeType && extractorMap[mimeType]) {
    return extractorMap[mimeType];
  }

  const extension = getFileExtension(file.name);
  if (extension && extensionToMimeMap[extension]) {
    return extractorMap[extensionToMimeMap[extension]];
  }

  return null;
}

function getSupportedTypesLabel(): string {
  const labels = Object.values(FILE_TYPE_LABELS);
  return labels.join(', ');
}

function getSupportedExtensionsLabel(): string {
  return (SUPPORTED_FILE_EXTENSIONS as readonly string[]).join(', ');
}

export function getExtractor(file: File): Extractor {
  const extractor = resolveExtractor(file);
  if (!extractor) {
    throw new Error(
      `Unsupported file type "${file.type || getFileExtension(file.name) || 'unknown'}". ` +
        `Supported types: ${getSupportedTypesLabel()} (${getSupportedExtensionsLabel()}).`,
    );
  }
  return extractor;
}

export async function extractText(file: File): Promise<ExtractionResult> {
  const extractor = getExtractor(file);
  return extractor.extract(file);
}