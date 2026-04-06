import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  uploadAndExtract,
  getHistory,
  getDocumentById,
  deleteDocument,
  clearHistory,
} from './DocumentService';
import type { UploadProgress } from './DocumentService';
import { UploadStatus } from '../types';
import { STORAGE_KEYS } from '../constants';

vi.mock('./ExtractorFactory', () => ({
  extractText: vi.fn(),
}));

vi.mock('./PdfExtractor', () => ({
  PdfExtractor: {
    extract: vi.fn(),
  },
}));

vi.mock('./DocxExtractor', () => ({
  DocxExtractor: {
    extract: vi.fn(),
  },
}));

import { extractText } from './ExtractorFactory';

const mockExtractText = extractText as Mock;

function createFile(name: string, size: number, type: string): File {
  const content = new Uint8Array(size > 0 ? size : 0);
  return new File([content], name, { type });
}

describe('DocumentService', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};

    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
    });

    mockExtractText.mockReset();
  });

  describe('uploadAndExtract', () => {
    it('processes a valid PDF file through the full pipeline', async () => {
      const file = createFile('report.pdf', 5000, 'application/pdf');
      mockExtractText.mockResolvedValue({
        success: true,
        text: '  Hello   World  \n\n\n\n  Paragraph two.  ',
      });

      const result = await uploadAndExtract(file, 'user1');

      expect(result.success).toBe(true);
      expect(result.document).not.toBeNull();
      expect(result.document!.metadata.fileName).toBe('report.pdf');
      expect(result.document!.metadata.fileType).toBe('application/pdf');
      expect(result.document!.metadata.fileSize).toBe(5000);
      expect(result.document!.metadata.userId).toBe('user1');
      expect(result.document!.metadata.id).toBeTruthy();
      expect(result.document!.metadata.timestamp).toBeGreaterThan(0);
      // Text should be cleaned
      expect(result.document!.extractedText).toBe('Hello World\n\nParagraph two.');
    });

    it('processes a valid TXT file through the full pipeline', async () => {
      const file = createFile('notes.txt', 100, 'text/plain');
      mockExtractText.mockResolvedValue({
        success: true,
        text: 'Simple text content',
      });

      const result = await uploadAndExtract(file, 'user1');

      expect(result.success).toBe(true);
      expect(result.document).not.toBeNull();
      expect(result.document!.metadata.fileName).toBe('notes.txt');
      expect(result.document!.extractedText).toBe('Simple text content');
    });

    it('processes a valid DOCX file through the full pipeline', async () => {
      const file = createFile(
        'document.docx',
        2000,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      mockExtractText.mockResolvedValue({
        success: true,
        text: 'DOCX extracted content',
      });

      const result = await uploadAndExtract(file, 'user1');

      expect(result.success).toBe(true);
      expect(result.document).not.toBeNull();
      expect(result.document!.metadata.fileType).toBe(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      expect(result.document!.extractedText).toBe('DOCX extracted content');
    });

    it('persists the document to localStorage after successful upload', async () => {
      const file = createFile('test.pdf', 1024, 'application/pdf');
      mockExtractText.mockResolvedValue({
        success: true,
        text: 'Persisted text',
      });

      await uploadAndExtract(file, 'user1');

      const raw = store[STORAGE_KEYS.documents];
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].metadata.fileName).toBe('test.pdf');
      expect(parsed[0].extractedText).toBe('Persisted text');
    });

    it('rejects an unsupported file type', async () => {
      const file = createFile('image.jpg', 5000, 'image/jpeg');

      const result = await uploadAndExtract(file, 'user1');

      expect(result.success).toBe(false);
      expect(result.document).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Unsupported file type');
      expect(mockExtractText).not.toHaveBeenCalled();
    });

    it('rejects a file that exceeds the size limit', async () => {
      const file = createFile('huge.pdf', 11 * 1024 * 1024, 'application/pdf');

      const result = await uploadAndExtract(file, 'user1');

      expect(result.success).toBe(false);
      expect(result.document).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('MB');
      expect(mockExtractText).not.toHaveBeenCalled();
    });

    it('rejects an empty file', async () => {
      const file = createFile('empty.pdf', 0, 'application/pdf');

      const result = await uploadAndExtract(file, 'user1');

      expect(result.success).toBe(false);
      expect(result.document).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('empty');
      expect(mockExtractText).not.toHaveBeenCalled();
    });

    it('returns error when extraction fails after retries', async () => {
      const file = createFile('bad.pdf', 1024, 'application/pdf');
      mockExtractText.mockResolvedValue({
        success: false,
        text: '',
        error: 'Corrupted PDF data',
      });

      const result = await uploadAndExtract(file, 'user1');

      expect(result.success).toBe(false);
      expect(result.document).toBeNull();
      expect(result.error).toBe('Corrupted PDF data');
      // Should have been called 3 times (1 initial + 2 retries)
      expect(mockExtractText).toHaveBeenCalledTimes(3);
    });

    it('succeeds on retry after initial extraction failure', async () => {
      const file = createFile('flaky.pdf', 1024, 'application/pdf');
      mockExtractText
        .mockResolvedValueOnce({
          success: false,
          text: '',
          error: 'Temporary failure',
        })
        .mockResolvedValueOnce({
          success: true,
          text: 'Extracted on retry',
        });

      const result = await uploadAndExtract(file, 'user1');

      expect(result.success).toBe(true);
      expect(result.document).not.toBeNull();
      expect(result.document!.extractedText).toBe('Extracted on retry');
      expect(mockExtractText).toHaveBeenCalledTimes(2);
    });

    it('handles extraction throwing an exception', async () => {
      const file = createFile('crash.pdf', 1024, 'application/pdf');
      mockExtractText.mockRejectedValue(new Error('Unexpected crash'));

      const result = await uploadAndExtract(file, 'user1');

      expect(result.success).toBe(false);
      expect(result.document).toBeNull();
      expect(result.error).toContain('Unexpected crash');
    });
  });

  describe('progress callback', () => {
    it('invokes progress callback through all stages on success', async () => {
      const file = createFile('progress.pdf', 1024, 'application/pdf');
      mockExtractText.mockResolvedValue({
        success: true,
        text: 'Progress test text',
      });

      const progressUpdates: UploadProgress[] = [];
      const onProgress = (progress: UploadProgress) => {
        progressUpdates.push({ ...progress });
      };

      await uploadAndExtract(file, 'user1', onProgress);

      expect(progressUpdates.length).toBeGreaterThanOrEqual(5);

      const statuses = progressUpdates.map((p) => p.status);
      expect(statuses).toContain(UploadStatus.Validating);
      expect(statuses).toContain(UploadStatus.Extracting);
      expect(statuses).toContain(UploadStatus.Cleaning);
      expect(statuses).toContain(UploadStatus.Saving);
      expect(statuses).toContain(UploadStatus.Complete);
    });

    it('invokes progress callback with error status on validation failure', async () => {
      const file = createFile('bad.exe', 1024, 'application/x-msdownload');

      const progressUpdates: UploadProgress[] = [];
      const onProgress = (progress: UploadProgress) => {
        progressUpdates.push({ ...progress });
      };

      await uploadAndExtract(file, 'user1', onProgress);

      const statuses = progressUpdates.map((p) => p.status);
      expect(statuses).toContain(UploadStatus.Validating);
      expect(statuses).toContain(UploadStatus.Error);
    });

    it('invokes progress callback with error status on extraction failure', async () => {
      const file = createFile('fail.pdf', 1024, 'application/pdf');
      mockExtractText.mockResolvedValue({
        success: false,
        text: '',
        error: 'Extraction failed',
      });

      const progressUpdates: UploadProgress[] = [];
      const onProgress = (progress: UploadProgress) => {
        progressUpdates.push({ ...progress });
      };

      await uploadAndExtract(file, 'user1', onProgress);

      const statuses = progressUpdates.map((p) => p.status);
      expect(statuses).toContain(UploadStatus.Extracting);
      expect(statuses).toContain(UploadStatus.Error);
    });

    it('works correctly without a progress callback', async () => {
      const file = createFile('noprogress.pdf', 1024, 'application/pdf');
      mockExtractText.mockResolvedValue({
        success: true,
        text: 'No progress callback',
      });

      const result = await uploadAndExtract(file, 'user1');

      expect(result.success).toBe(true);
      expect(result.document).not.toBeNull();
    });
  });

  describe('getHistory', () => {
    it('returns an empty array when no documents exist', () => {
      const history = getHistory('user1');
      expect(history).toEqual([]);
    });

    it('returns documents for the specified user after uploads', async () => {
      const file1 = createFile('file1.pdf', 1024, 'application/pdf');
      const file2 = createFile('file2.txt', 512, 'text/plain');

      mockExtractText.mockResolvedValue({ success: true, text: 'Text content' });

      await uploadAndExtract(file1, 'user1');
      await uploadAndExtract(file2, 'user1');

      const history = getHistory('user1');
      expect(history).toHaveLength(2);
      expect(history.every((d) => d.metadata.userId === 'user1')).toBe(true);
    });

    it('does not return documents from other users', async () => {
      const file1 = createFile('user1file.pdf', 1024, 'application/pdf');
      const file2 = createFile('user2file.pdf', 1024, 'application/pdf');

      mockExtractText.mockResolvedValue({ success: true, text: 'Text' });

      await uploadAndExtract(file1, 'user1');
      await uploadAndExtract(file2, 'user2');

      const user1History = getHistory('user1');
      const user2History = getHistory('user2');

      expect(user1History).toHaveLength(1);
      expect(user1History[0].metadata.fileName).toBe('user1file.pdf');
      expect(user2History).toHaveLength(1);
      expect(user2History[0].metadata.fileName).toBe('user2file.pdf');
    });

    it('returns documents sorted by timestamp descending', async () => {
      mockExtractText.mockResolvedValue({ success: true, text: 'Text' });

      await uploadAndExtract(createFile('first.pdf', 100, 'application/pdf'), 'user1');
      await uploadAndExtract(createFile('second.pdf', 100, 'application/pdf'), 'user1');

      const history = getHistory('user1');
      expect(history).toHaveLength(2);
      expect(history[0].metadata.timestamp).toBeGreaterThanOrEqual(history[1].metadata.timestamp);
    });
  });

  describe('getDocumentById', () => {
    it('retrieves a document by its id', async () => {
      const file = createFile('findme.pdf', 1024, 'application/pdf');
      mockExtractText.mockResolvedValue({ success: true, text: 'Find me text' });

      const uploadResult = await uploadAndExtract(file, 'user1');
      const docId = uploadResult.document!.metadata.id;

      const found = getDocumentById(docId, 'user1');
      expect(found).not.toBeNull();
      expect(found!.metadata.id).toBe(docId);
      expect(found!.metadata.fileName).toBe('findme.pdf');
      expect(found!.extractedText).toBe('Find me text');
    });

    it('returns null for a non-existent document id', () => {
      const found = getDocumentById('nonexistent-id', 'user1');
      expect(found).toBeNull();
    });

    it('returns null when requesting another user\'s document', async () => {
      const file = createFile('private.pdf', 1024, 'application/pdf');
      mockExtractText.mockResolvedValue({ success: true, text: 'Private text' });

      const uploadResult = await uploadAndExtract(file, 'user1');
      const docId = uploadResult.document!.metadata.id;

      const found = getDocumentById(docId, 'user2');
      expect(found).toBeNull();
    });
  });

  describe('deleteDocument', () => {
    it('deletes an existing document and returns true', async () => {
      const file = createFile('deleteme.pdf', 1024, 'application/pdf');
      mockExtractText.mockResolvedValue({ success: true, text: 'Delete me' });

      const uploadResult = await uploadAndExtract(file, 'user1');
      const docId = uploadResult.document!.metadata.id;

      const result = deleteDocument(docId, 'user1');
      expect(result).toBe(true);

      const found = getDocumentById(docId, 'user1');
      expect(found).toBeNull();
    });

    it('returns false when deleting a non-existent document', () => {
      const result = deleteDocument('nonexistent-id', 'user1');
      expect(result).toBe(false);
    });

    it('returns false when trying to delete another user\'s document', async () => {
      const file = createFile('protected.pdf', 1024, 'application/pdf');
      mockExtractText.mockResolvedValue({ success: true, text: 'Protected' });

      const uploadResult = await uploadAndExtract(file, 'user1');
      const docId = uploadResult.document!.metadata.id;

      const result = deleteDocument(docId, 'user2');
      expect(result).toBe(false);

      const found = getDocumentById(docId, 'user1');
      expect(found).not.toBeNull();
    });

    it('does not affect other documents when deleting one', async () => {
      mockExtractText.mockResolvedValue({ success: true, text: 'Text' });

      const result1 = await uploadAndExtract(createFile('keep.pdf', 100, 'application/pdf'), 'user1');
      const result2 = await uploadAndExtract(createFile('remove.pdf', 100, 'application/pdf'), 'user1');

      deleteDocument(result2.document!.metadata.id, 'user1');

      const history = getHistory('user1');
      expect(history).toHaveLength(1);
      expect(history[0].metadata.fileName).toBe('keep.pdf');

      const kept = getDocumentById(result1.document!.metadata.id, 'user1');
      expect(kept).not.toBeNull();
    });
  });

  describe('clearHistory', () => {
    it('removes all documents for the specified user', async () => {
      mockExtractText.mockResolvedValue({ success: true, text: 'Text' });

      await uploadAndExtract(createFile('file1.pdf', 100, 'application/pdf'), 'user1');
      await uploadAndExtract(createFile('file2.pdf', 100, 'application/pdf'), 'user1');

      clearHistory('user1');

      const history = getHistory('user1');
      expect(history).toHaveLength(0);
    });

    it('does not affect other users\' documents', async () => {
      mockExtractText.mockResolvedValue({ success: true, text: 'Text' });

      await uploadAndExtract(createFile('user1file.pdf', 100, 'application/pdf'), 'user1');
      await uploadAndExtract(createFile('user2file.pdf', 100, 'application/pdf'), 'user2');

      clearHistory('user1');

      expect(getHistory('user1')).toHaveLength(0);
      expect(getHistory('user2')).toHaveLength(1);
    });
  });

  describe('text cleaning integration', () => {
    it('cleans extracted text with null bytes and extra whitespace', async () => {
      const file = createFile('dirty.pdf', 1024, 'application/pdf');
      mockExtractText.mockResolvedValue({
        success: true,
        text: '  Hello\0   World  \r\n\r\n\r\n\r\n  End.  ',
      });

      const result = await uploadAndExtract(file, 'user1');

      expect(result.success).toBe(true);
      expect(result.document!.extractedText).toBe('Hello World\n\nEnd.');
    });

    it('handles extraction returning only whitespace', async () => {
      const file = createFile('whitespace.pdf', 1024, 'application/pdf');
      mockExtractText.mockResolvedValue({
        success: true,
        text: '   \n\n\t\t   ',
      });

      const result = await uploadAndExtract(file, 'user1');

      expect(result.success).toBe(true);
      expect(result.document!.extractedText).toBe('');
    });
  });
});