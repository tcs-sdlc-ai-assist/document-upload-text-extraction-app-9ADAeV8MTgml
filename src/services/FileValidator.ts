import {
  SUPPORTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  SUPPORTED_FILE_EXTENSIONS,
  FILE_TYPE_LABELS,
} from '../constants';
import type { FileValidationResult, SupportedFileType } from '../types';

function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }
  return fileName.slice(lastDotIndex).toLowerCase();
}

function isSupportedMimeType(mimeType: string): mimeType is SupportedFileType {
  return (SUPPORTED_FILE_TYPES as readonly string[]).includes(mimeType);
}

function isSupportedExtension(extension: string): boolean {
  return (SUPPORTED_FILE_EXTENSIONS as readonly string[]).includes(extension as typeof SUPPORTED_FILE_EXTENSIONS[number]);
}

function getSupportedTypesLabel(): string {
  const labels = SUPPORTED_FILE_TYPES.map((type) => FILE_TYPE_LABELS[type] || type);
  return labels.join(', ');
}

export function validateFileType(file: File): FileValidationResult {
  const mimeType = file.type;
  const extension = getFileExtension(file.name);

  if (mimeType && isSupportedMimeType(mimeType)) {
    return { valid: true };
  }

  if (extension && isSupportedExtension(extension)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: `Unsupported file type. Please upload one of the following: ${getSupportedTypesLabel()}.`,
  };
}

export function validateFileSize(file: File): FileValidationResult {
  if (file.size <= 0) {
    return {
      valid: false,
      error: 'The selected file is empty. Please choose a file with content.',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowed size of ${MAX_FILE_SIZE_MB}MB.`,
    };
  }

  return { valid: true };
}

export function validateFile(file: File): FileValidationResult {
  const typeResult = validateFileType(file);
  if (!typeResult.valid) {
    return typeResult;
  }

  const sizeResult = validateFileSize(file);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  return { valid: true };
}