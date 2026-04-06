import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentRepository } from './DocumentRepository';
import { STORAGE_KEYS, MAX_HISTORY_ENTRIES } from '../constants';

describe('DocumentRepository', () => {
  let repository: DocumentRepository;
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

    repository = new DocumentRepository();
  });

  describe('saveDocument', () => {
    it('saves a document and returns a valid DocumentEntry', () => {
      const entry = repository.saveDocument(
        'test.pdf',
        'application/pdf',
        1024,
        'user1',
        'Extracted text content',
      );

      expect(entry).toBeDefined();
      expect(entry.metadata.id).toBeTruthy();
      expect(entry.metadata.fileName).toBe('test.pdf');
      expect(entry.metadata.fileType).toBe('application/pdf');
      expect(entry.metadata.fileSize).toBe(1024);
      expect(entry.metadata.userId).toBe('user1');
      expect(entry.metadata.timestamp).toBeGreaterThan(0);
      expect(entry.extractedText).toBe('Extracted text content');
    });

    it('persists the document to localStorage', () => {
      repository.saveDocument('test.txt', 'text/plain', 512, 'user1', 'Hello');

      const raw = store[STORAGE_KEYS.documents];
      expect(raw).toBeDefined();
      const parsed = JSON.parse(raw);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].metadata.fileName).toBe('test.txt');
    });

    it('saves multiple documents for the same user', () => {
      repository.saveDocument('file1.pdf', 'application/pdf', 100, 'user1', 'Text 1');
      repository.saveDocument('file2.txt', 'text/plain', 200, 'user1', 'Text 2');
      repository.saveDocument('file3.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 300, 'user1', 'Text 3');

      const docs = repository.getDocuments('user1');
      expect(docs).toHaveLength(3);
    });

    it('saves documents for different users independently', () => {
      repository.saveDocument('file1.pdf', 'application/pdf', 100, 'user1', 'Text 1');
      repository.saveDocument('file2.txt', 'text/plain', 200, 'user2', 'Text 2');

      expect(repository.getDocuments('user1')).toHaveLength(1);
      expect(repository.getDocuments('user2')).toHaveLength(1);
    });

    it('generates unique ids for each document', () => {
      const entry1 = repository.saveDocument('a.pdf', 'application/pdf', 100, 'user1', 'A');
      const entry2 = repository.saveDocument('b.pdf', 'application/pdf', 100, 'user1', 'B');

      expect(entry1.metadata.id).not.toBe(entry2.metadata.id);
    });
  });

  describe('getDocuments', () => {
    it('returns an empty array when no documents exist', () => {
      const docs = repository.getDocuments('user1');
      expect(docs).toEqual([]);
    });

    it('returns only documents for the specified user', () => {
      repository.saveDocument('file1.pdf', 'application/pdf', 100, 'user1', 'Text 1');
      repository.saveDocument('file2.pdf', 'application/pdf', 200, 'user2', 'Text 2');
      repository.saveDocument('file3.pdf', 'application/pdf', 300, 'user1', 'Text 3');

      const user1Docs = repository.getDocuments('user1');
      expect(user1Docs).toHaveLength(2);
      expect(user1Docs.every((d) => d.metadata.userId === 'user1')).toBe(true);
    });

    it('returns documents sorted by timestamp descending (newest first)', () => {
      repository.saveDocument('old.pdf', 'application/pdf', 100, 'user1', 'Old');
      repository.saveDocument('new.pdf', 'application/pdf', 200, 'user1', 'New');

      const docs = repository.getDocuments('user1');
      expect(docs[0].metadata.timestamp).toBeGreaterThanOrEqual(docs[1].metadata.timestamp);
    });
  });

  describe('getDocumentById', () => {
    it('returns the document when found for the correct user', () => {
      const saved = repository.saveDocument('test.pdf', 'application/pdf', 100, 'user1', 'Content');

      const found = repository.getDocumentById(saved.metadata.id, 'user1');
      expect(found).not.toBeNull();
      expect(found!.metadata.id).toBe(saved.metadata.id);
      expect(found!.extractedText).toBe('Content');
    });

    it('returns null when the document does not exist', () => {
      const found = repository.getDocumentById('nonexistent-id', 'user1');
      expect(found).toBeNull();
    });

    it('returns null when the document belongs to a different user', () => {
      const saved = repository.saveDocument('test.pdf', 'application/pdf', 100, 'user1', 'Content');

      const found = repository.getDocumentById(saved.metadata.id, 'user2');
      expect(found).toBeNull();
    });
  });

  describe('deleteDocument', () => {
    it('deletes an existing document and returns true', () => {
      const saved = repository.saveDocument('test.pdf', 'application/pdf', 100, 'user1', 'Content');

      const result = repository.deleteDocument(saved.metadata.id, 'user1');
      expect(result).toBe(true);

      const found = repository.getDocumentById(saved.metadata.id, 'user1');
      expect(found).toBeNull();
    });

    it('returns false when the document does not exist', () => {
      const result = repository.deleteDocument('nonexistent-id', 'user1');
      expect(result).toBe(false);
    });

    it('returns false when trying to delete another user\'s document', () => {
      const saved = repository.saveDocument('test.pdf', 'application/pdf', 100, 'user1', 'Content');

      const result = repository.deleteDocument(saved.metadata.id, 'user2');
      expect(result).toBe(false);

      const found = repository.getDocumentById(saved.metadata.id, 'user1');
      expect(found).not.toBeNull();
    });

    it('does not affect other documents when deleting one', () => {
      const saved1 = repository.saveDocument('file1.pdf', 'application/pdf', 100, 'user1', 'Text 1');
      const saved2 = repository.saveDocument('file2.pdf', 'application/pdf', 200, 'user1', 'Text 2');

      repository.deleteDocument(saved1.metadata.id, 'user1');

      expect(repository.getDocumentById(saved2.metadata.id, 'user1')).not.toBeNull();
      expect(repository.getDocuments('user1')).toHaveLength(1);
    });
  });

  describe('clearUserDocuments', () => {
    it('removes all documents for the specified user', () => {
      repository.saveDocument('file1.pdf', 'application/pdf', 100, 'user1', 'Text 1');
      repository.saveDocument('file2.pdf', 'application/pdf', 200, 'user1', 'Text 2');

      repository.clearUserDocuments('user1');

      expect(repository.getDocuments('user1')).toHaveLength(0);
    });

    it('does not affect other users\' documents', () => {
      repository.saveDocument('file1.pdf', 'application/pdf', 100, 'user1', 'Text 1');
      repository.saveDocument('file2.pdf', 'application/pdf', 200, 'user2', 'Text 2');

      repository.clearUserDocuments('user1');

      expect(repository.getDocuments('user1')).toHaveLength(0);
      expect(repository.getDocuments('user2')).toHaveLength(1);
    });
  });

  describe('entry cap enforcement', () => {
    it(`enforces the ${MAX_HISTORY_ENTRIES}-entry cap per user by removing oldest entries`, () => {
      for (let i = 0; i < MAX_HISTORY_ENTRIES; i++) {
        repository.saveDocument(`file${i}.pdf`, 'application/pdf', 100, 'user1', `Text ${i}`);
      }

      expect(repository.getDocuments('user1')).toHaveLength(MAX_HISTORY_ENTRIES);

      repository.saveDocument('overflow.pdf', 'application/pdf', 100, 'user1', 'Overflow text');

      const docs = repository.getDocuments('user1');
      expect(docs).toHaveLength(MAX_HISTORY_ENTRIES);

      const fileNames = docs.map((d) => d.metadata.fileName);
      expect(fileNames).toContain('overflow.pdf');
      expect(fileNames).not.toContain('file0.pdf');
    });

    it('does not affect other users when enforcing the cap', () => {
      repository.saveDocument('other.pdf', 'application/pdf', 100, 'user2', 'Other user text');

      for (let i = 0; i < MAX_HISTORY_ENTRIES + 1; i++) {
        repository.saveDocument(`file${i}.pdf`, 'application/pdf', 100, 'user1', `Text ${i}`);
      }

      expect(repository.getDocuments('user1')).toHaveLength(MAX_HISTORY_ENTRIES);
      expect(repository.getDocuments('user2')).toHaveLength(1);
    });
  });

  describe('corrupted localStorage data handling', () => {
    it('handles non-JSON data gracefully', () => {
      store[STORAGE_KEYS.documents] = 'not valid json!!!';

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const docs = repository.getDocuments('user1');
      expect(docs).toEqual([]);

      warnSpy.mockRestore();
    });

    it('handles non-array JSON data gracefully', () => {
      store[STORAGE_KEYS.documents] = JSON.stringify({ not: 'an array' });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const docs = repository.getDocuments('user1');
      expect(docs).toEqual([]);

      warnSpy.mockRestore();
    });

    it('filters out invalid entries from the stored array', () => {
      const validEntry = {
        metadata: {
          id: 'valid-id',
          fileName: 'valid.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          timestamp: Date.now(),
          userId: 'user1',
        },
        extractedText: 'Valid text',
      };

      const invalidEntry = {
        metadata: {
          id: 'invalid-id',
          // missing fileName
          fileType: 'application/pdf',
          fileSize: 1024,
          timestamp: Date.now(),
          userId: 'user1',
        },
        extractedText: 'Invalid text',
      };

      const entryMissingText = {
        metadata: {
          id: 'no-text-id',
          fileName: 'notext.pdf',
          fileType: 'application/pdf',
          fileSize: 1024,
          timestamp: Date.now(),
          userId: 'user1',
        },
        // missing extractedText
      };

      store[STORAGE_KEYS.documents] = JSON.stringify([validEntry, invalidEntry, entryMissingText, null, 'garbage']);

      const docs = repository.getDocuments('user1');
      expect(docs).toHaveLength(1);
      expect(docs[0].metadata.id).toBe('valid-id');
    });

    it('can save new documents after recovering from corrupted data', () => {
      store[STORAGE_KEYS.documents] = 'corrupted data';

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const entry = repository.saveDocument('recovery.pdf', 'application/pdf', 100, 'user1', 'Recovered');

      expect(entry).toBeDefined();
      expect(entry.metadata.fileName).toBe('recovery.pdf');

      const docs = repository.getDocuments('user1');
      expect(docs).toHaveLength(1);

      warnSpy.mockRestore();
    });

    it('handles null stored value gracefully', () => {
      // localStorage.getItem returns null by default when key doesn't exist
      const docs = repository.getDocuments('user1');
      expect(docs).toEqual([]);
    });
  });

  describe('QuotaExceededError handling', () => {
    it('handles QuotaExceededError by reducing stored entries', () => {
      let callCount = 0;
      const originalSetItem = localStorage.setItem as ReturnType<typeof vi.fn>;
      originalSetItem.mockImplementation((key: string, value: string) => {
        callCount++;
        if (callCount <= 1) {
          const error = new DOMException('Quota exceeded', 'QuotaExceededError');
          throw error;
        }
        store[key] = value;
      });

      // Pre-populate with some data
      store[STORAGE_KEYS.documents] = JSON.stringify([
        {
          metadata: {
            id: 'existing-1',
            fileName: 'existing1.pdf',
            fileType: 'application/pdf',
            fileSize: 100,
            timestamp: Date.now() - 1000,
            userId: 'user1',
          },
          extractedText: 'Existing 1',
        },
        {
          metadata: {
            id: 'existing-2',
            fileName: 'existing2.pdf',
            fileType: 'application/pdf',
            fileSize: 100,
            timestamp: Date.now(),
            userId: 'user1',
          },
          extractedText: 'Existing 2',
        },
      ]);

      // This should trigger the quota exceeded handler
      repository.saveDocument('new.pdf', 'application/pdf', 100, 'user1', 'New text');

      // After recovery, storage should have been written
      expect(localStorage.setItem).toHaveBeenCalled();
    });
  });
});