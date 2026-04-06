import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS, MAX_HISTORY_ENTRIES } from '../constants';
import type { DocumentEntry, DocumentMetadata } from '../types';

export class DocumentRepository {
  private storageKey: string;

  constructor() {
    this.storageKey = STORAGE_KEYS.documents;
  }

  private readAll(): DocumentEntry[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        console.warn('DocumentRepository: corrupted data detected, resetting storage.');
        this.writeAll([]);
        return [];
      }
      return parsed.filter((entry): entry is DocumentEntry => this.isValidEntry(entry));
    } catch {
      console.warn('DocumentRepository: failed to parse stored data, resetting storage.');
      this.writeAll([]);
      return [];
    }
  }

  private isValidEntry(entry: unknown): entry is DocumentEntry {
    if (typeof entry !== 'object' || entry === null) {
      return false;
    }
    const obj = entry as Record<string, unknown>;
    if (typeof obj.extractedText !== 'string') {
      return false;
    }
    if (typeof obj.metadata !== 'object' || obj.metadata === null) {
      return false;
    }
    const meta = obj.metadata as Record<string, unknown>;
    return (
      typeof meta.id === 'string' &&
      typeof meta.fileName === 'string' &&
      typeof meta.fileType === 'string' &&
      typeof meta.fileSize === 'number' &&
      typeof meta.timestamp === 'number' &&
      typeof meta.userId === 'string'
    );
  }

  private writeAll(entries: DocumentEntry[]): void {
    try {
      const serialized = JSON.stringify(entries);
      localStorage.setItem(this.storageKey, serialized);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded(entries);
        return;
      }
      throw new Error('Failed to save document data to storage.');
    }
  }

  private handleQuotaExceeded(entries: DocumentEntry[]): void {
    const reduced = entries.slice(Math.floor(entries.length / 2));
    try {
      const serialized = JSON.stringify(reduced);
      localStorage.setItem(this.storageKey, serialized);
    } catch {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify([]));
      } catch {
        throw new Error('Storage quota exceeded and unable to recover.');
      }
    }
  }

  private enforceEntryCap(entries: DocumentEntry[], userId: string): DocumentEntry[] {
    const userEntries = entries.filter((e) => e.metadata.userId === userId);
    if (userEntries.length < MAX_HISTORY_ENTRIES) {
      return entries;
    }

    const sortedUserEntries = [...userEntries].sort(
      (a, b) => a.metadata.timestamp - b.metadata.timestamp,
    );
    const entriesToRemove = sortedUserEntries.length - MAX_HISTORY_ENTRIES + 1;
    const idsToRemove = new Set(
      sortedUserEntries.slice(0, entriesToRemove).map((e) => e.metadata.id),
    );

    return entries.filter((e) => !idsToRemove.has(e.metadata.id));
  }

  saveDocument(
    fileName: string,
    fileType: DocumentMetadata['fileType'],
    fileSize: number,
    userId: string,
    extractedText: string,
  ): DocumentEntry {
    const entries = this.readAll();

    const trimmedEntries = this.enforceEntryCap(entries, userId);

    const metadata: DocumentMetadata = {
      id: uuidv4(),
      fileName,
      fileType,
      fileSize,
      timestamp: Date.now(),
      userId,
    };

    const newEntry: DocumentEntry = {
      metadata,
      extractedText,
    };

    trimmedEntries.push(newEntry);
    this.writeAll(trimmedEntries);

    return newEntry;
  }

  getDocuments(userId: string): DocumentEntry[] {
    const entries = this.readAll();
    return entries
      .filter((e) => e.metadata.userId === userId)
      .sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
  }

  getDocumentById(id: string, userId: string): DocumentEntry | null {
    const entries = this.readAll();
    const found = entries.find(
      (e) => e.metadata.id === id && e.metadata.userId === userId,
    );
    return found ?? null;
  }

  deleteDocument(id: string, userId: string): boolean {
    const entries = this.readAll();
    const initialLength = entries.length;
    const filtered = entries.filter(
      (e) => !(e.metadata.id === id && e.metadata.userId === userId),
    );

    if (filtered.length === initialLength) {
      return false;
    }

    this.writeAll(filtered);
    return true;
  }

  clearUserDocuments(userId: string): void {
    const entries = this.readAll();
    const filtered = entries.filter((e) => e.metadata.userId !== userId);
    this.writeAll(filtered);
  }
}

export const documentRepository = new DocumentRepository();