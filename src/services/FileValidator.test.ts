import { describe, it, expect } from 'vitest';
import { validateFile, validateFileType, validateFileSize } from '../services/FileValidator';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '../constants';

function createFile(
  name: string,
  size: number,
  type: string,
): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

describe('FileValidator', () => {
  describe('validateFileType', () => {
    it('accepts a PDF file by MIME type', () => {
      const file = createFile('document.pdf', 1024, 'application/pdf');
      const result = validateFileType(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts a DOCX file by MIME type', () => {
      const file = createFile(
        'document.docx',
        1024,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      const result = validateFileType(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts a TXT file by MIME type', () => {
      const file = createFile('readme.txt', 1024, 'text/plain');
      const result = validateFileType(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts a PDF file by extension when MIME type is empty', () => {
      const file = createFile('document.pdf', 1024, '');
      const result = validateFileType(file);
      expect(result.valid).toBe(true);
    });

    it('accepts a DOCX file by extension when MIME type is empty', () => {
      const file = createFile('document.docx', 1024, '');
      const result = validateFileType(file);
      expect(result.valid).toBe(true);
    });

    it('accepts a TXT file by extension when MIME type is empty', () => {
      const file = createFile('notes.txt', 1024, '');
      const result = validateFileType(file);
      expect(result.valid).toBe(true);
    });

    it('accepts a file with uppercase extension', () => {
      const file = createFile('DOCUMENT.PDF', 1024, '');
      const result = validateFileType(file);
      expect(result.valid).toBe(true);
    });

    it('rejects an .exe file', () => {
      const file = createFile('malware.exe', 1024, 'application/x-msdownload');
      const result = validateFileType(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Unsupported file type');
    });

    it('rejects a .jpg file', () => {
      const file = createFile('photo.jpg', 1024, 'image/jpeg');
      const result = validateFileType(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('rejects a .png file', () => {
      const file = createFile('image.png', 1024, 'image/png');
      const result = validateFileType(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('rejects a .zip file', () => {
      const file = createFile('archive.zip', 1024, 'application/zip');
      const result = validateFileType(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('rejects a file with no extension and no MIME type', () => {
      const file = createFile('noextension', 1024, '');
      const result = validateFileType(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('rejects a file with unknown MIME type and unsupported extension', () => {
      const file = createFile('data.csv', 1024, 'text/csv');
      const result = validateFileType(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });
  });

  describe('validateFileSize', () => {
    it('accepts a file within the size limit', () => {
      const file = createFile('small.pdf', 1024, 'application/pdf');
      const result = validateFileSize(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts a file exactly at the size limit', () => {
      const file = createFile('exact.pdf', MAX_FILE_SIZE_BYTES, 'application/pdf');
      const result = validateFileSize(file);
      expect(result.valid).toBe(true);
    });

    it('rejects a file exceeding the size limit', () => {
      const file = createFile('large.pdf', MAX_FILE_SIZE_BYTES + 1, 'application/pdf');
      const result = validateFileSize(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain(`${MAX_FILE_SIZE_MB}MB`);
    });

    it('rejects an empty file (0 bytes)', () => {
      const file = createFile('empty.txt', 0, 'text/plain');
      const result = validateFileSize(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('empty');
    });
  });

  describe('validateFile', () => {
    it('accepts a valid PDF file', () => {
      const file = createFile('report.pdf', 5000, 'application/pdf');
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts a valid DOCX file', () => {
      const file = createFile(
        'report.docx',
        5000,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('accepts a valid TXT file', () => {
      const file = createFile('notes.txt', 100, 'text/plain');
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('rejects an unsupported file type before checking size', () => {
      const file = createFile('image.jpg', 100, 'image/jpeg');
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('rejects an oversized file of a supported type', () => {
      const file = createFile('huge.pdf', MAX_FILE_SIZE_BYTES + 1000, 'application/pdf');
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(`${MAX_FILE_SIZE_MB}MB`);
    });

    it('rejects an empty file of a supported type', () => {
      const file = createFile('empty.pdf', 0, 'application/pdf');
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('rejects an unsupported oversized file with type error', () => {
      const file = createFile('big.exe', MAX_FILE_SIZE_BYTES + 1, 'application/x-msdownload');
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('accepts a file with mixed-case extension and empty MIME', () => {
      const file = createFile('Document.TXT', 500, '');
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('accepts a 1-byte file', () => {
      const file = createFile('tiny.txt', 1, 'text/plain');
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('rejects a file with dots in name but unsupported final extension', () => {
      const file = createFile('my.document.backup.bak', 1024, '');
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unsupported file type');
    });

    it('accepts a file with dots in name and supported final extension', () => {
      const file = createFile('my.report.final.pdf', 1024, 'application/pdf');
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });
  });
});