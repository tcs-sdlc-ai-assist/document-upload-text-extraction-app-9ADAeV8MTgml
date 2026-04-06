import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { UploadPage } from './UploadPage';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import { STORAGE_KEYS } from '../constants';
import { uploadAndExtract } from '../services/DocumentService';
import type { UploadProgress } from '../services/DocumentService';

vi.mock('../services/DocumentService', () => ({
  uploadAndExtract: vi.fn(),
  getHistory: vi.fn(() => []),
  getDocumentById: vi.fn(() => null),
  deleteDocument: vi.fn(() => false),
  clearHistory: vi.fn(),
}));

const mockUploadAndExtract = uploadAndExtract as Mock;

function createFile(name: string, size: number, type: string): File {
  const content = new Uint8Array(size > 0 ? size : 0);
  return new File([content], name, { type });
}

function setupAuthenticatedUser() {
  const users = [{ username: 'testuser', passwordHash: 'hash123' }];
  const session = { username: 'testuser', token: 'token123', loginTime: Date.now() };
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}

function renderUploadPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <NotificationProvider>
          <UploadPage />
        </NotificationProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('UploadPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setupAuthenticatedUser();
  });

  it('renders the upload page with heading and drop zone', () => {
    renderUploadPage();

    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(
      screen.getByText(/Upload a PDF, DOCX, or TXT file to extract its text content/)
    ).toBeInTheDocument();
  });

  it('triggers upload flow when a file is selected', async () => {
    mockUploadAndExtract.mockImplementation(
      async (
        _file: File,
        _userId: string,
        onProgress?: (progress: UploadProgress) => void
      ) => {
        if (onProgress) {
          onProgress({ status: 'validating', progress: 10, message: 'Validating file...' });
          onProgress({ status: 'extracting', progress: 50, message: 'Extracting text...' });
          onProgress({ status: 'cleaning', progress: 80, message: 'Cleaning text...' });
          onProgress({ status: 'complete', progress: 100, message: 'Upload complete!' });
        }
        return {
          success: true,
          document: {
            metadata: {
              id: 'doc-123',
              fileName: 'test.pdf',
              fileType: 'application/pdf',
              fileSize: 1024,
              timestamp: Date.now(),
              userId: 'testuser',
            },
            extractedText: 'Extracted content from the PDF file.',
          },
        };
      }
    );

    renderUploadPage();

    const file = createFile('test.pdf', 1024, 'application/pdf');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();

    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(mockUploadAndExtract).toHaveBeenCalledTimes(1);
      expect(mockUploadAndExtract).toHaveBeenCalledWith(
        expect.any(File),
        'testuser',
        expect.any(Function)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Extracted Text')).toBeInTheDocument();
      expect(screen.getByText(/Extracted content from the PDF file/)).toBeInTheDocument();
    });
  });

  it('shows progress indicator during upload', async () => {
    let resolveUpload: (value: unknown) => void;
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve;
    });

    mockUploadAndExtract.mockImplementation(
      async (
        _file: File,
        _userId: string,
        onProgress?: (progress: UploadProgress) => void
      ) => {
        if (onProgress) {
          onProgress({ status: 'validating', progress: 10, message: 'Validating file...' });
          onProgress({ status: 'extracting', progress: 50, message: 'Extracting text...' });
        }
        await uploadPromise;
        return {
          success: true,
          document: {
            metadata: {
              id: 'doc-456',
              fileName: 'progress.pdf',
              fileType: 'application/pdf',
              fileSize: 2048,
              timestamp: Date.now(),
              userId: 'testuser',
            },
            extractedText: 'Some text.',
          },
        };
      }
    );

    renderUploadPage();

    const file = createFile('progress.pdf', 2048, 'application/pdf');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(
        screen.getByText(/Please wait while your document is being processed/)
      ).toBeInTheDocument();
    });

    resolveUpload!(undefined);

    await waitFor(() => {
      expect(screen.getByText('Extracted Text')).toBeInTheDocument();
    });
  });

  it('displays error message on upload failure', async () => {
    mockUploadAndExtract.mockImplementation(
      async (
        _file: File,
        _userId: string,
        onProgress?: (progress: UploadProgress) => void
      ) => {
        if (onProgress) {
          onProgress({ status: 'validating', progress: 10, message: 'Validating file...' });
          onProgress({ status: 'error', progress: 0, message: 'Unsupported file type.' });
        }
        return {
          success: false,
          error: 'Unsupported file type.',
        };
      }
    );

    renderUploadPage();

    const file = createFile('bad.exe', 1024, 'application/x-msdownload');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
      expect(screen.getByText('Upload Different File')).toBeInTheDocument();
    });
  });

  it('shows success state with extracted text preview and action buttons', async () => {
    mockUploadAndExtract.mockImplementation(
      async (
        _file: File,
        _userId: string,
        onProgress?: (progress: UploadProgress) => void
      ) => {
        if (onProgress) {
          onProgress({ status: 'complete', progress: 100, message: 'Upload complete!' });
        }
        return {
          success: true,
          document: {
            metadata: {
              id: 'doc-789',
              fileName: 'success.txt',
              fileType: 'text/plain',
              fileSize: 512,
              timestamp: Date.now(),
              userId: 'testuser',
            },
            extractedText: 'This is the successfully extracted text content.',
          },
        };
      }
    );

    renderUploadPage();

    const file = createFile('success.txt', 512, 'text/plain');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Extracted Text')).toBeInTheDocument();
      expect(
        screen.getByText(/This is the successfully extracted text content/)
      ).toBeInTheDocument();
    });

    expect(screen.getByText('View Document')).toBeInTheDocument();
    expect(screen.getByText('Upload Another')).toBeInTheDocument();
    expect(screen.getByText('View History')).toBeInTheDocument();
    expect(screen.getByText('Copy Text')).toBeInTheDocument();
  });

  it('retry button re-triggers the upload flow', async () => {
    let callCount = 0;

    mockUploadAndExtract.mockImplementation(
      async (
        _file: File,
        _userId: string,
        onProgress?: (progress: UploadProgress) => void
      ) => {
        callCount += 1;

        if (callCount === 1) {
          if (onProgress) {
            onProgress({ status: 'error', progress: 0, message: 'Extraction failed.' });
          }
          return {
            success: false,
            error: 'Extraction failed.',
          };
        }

        if (onProgress) {
          onProgress({ status: 'complete', progress: 100, message: 'Upload complete!' });
        }
        return {
          success: true,
          document: {
            metadata: {
              id: 'doc-retry',
              fileName: 'retry.pdf',
              fileType: 'application/pdf',
              fileSize: 1024,
              timestamp: Date.now(),
              userId: 'testuser',
            },
            extractedText: 'Retry succeeded with extracted text.',
          },
        };
      }
    );

    renderUploadPage();

    const file = createFile('retry.pdf', 1024, 'application/pdf');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    await userEvent.click(retryButton);

    await waitFor(() => {
      expect(mockUploadAndExtract).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Extracted Text')).toBeInTheDocument();
      expect(screen.getByText(/Retry succeeded with extracted text/)).toBeInTheDocument();
    });
  });

  it('upload another button resets the page to initial state', async () => {
    mockUploadAndExtract.mockImplementation(
      async (
        _file: File,
        _userId: string,
        onProgress?: (progress: UploadProgress) => void
      ) => {
        if (onProgress) {
          onProgress({ status: 'complete', progress: 100, message: 'Upload complete!' });
        }
        return {
          success: true,
          document: {
            metadata: {
              id: 'doc-reset',
              fileName: 'reset.pdf',
              fileType: 'application/pdf',
              fileSize: 1024,
              timestamp: Date.now(),
              userId: 'testuser',
            },
            extractedText: 'Text to be cleared.',
          },
        };
      }
    );

    renderUploadPage();

    const file = createFile('reset.pdf', 1024, 'application/pdf');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Extracted Text')).toBeInTheDocument();
    });

    const uploadAnotherButton = screen.getByText('Upload Another');
    await userEvent.click(uploadAnotherButton);

    await waitFor(() => {
      expect(screen.queryByText('Extracted Text')).not.toBeInTheDocument();
      expect(screen.getByText('Upload Document')).toBeInTheDocument();
    });
  });

  it('handles upload different file button from error state', async () => {
    mockUploadAndExtract.mockImplementation(
      async (
        _file: File,
        _userId: string,
        onProgress?: (progress: UploadProgress) => void
      ) => {
        if (onProgress) {
          onProgress({ status: 'error', progress: 0, message: 'File too large.' });
        }
        return {
          success: false,
          error: 'File too large.',
        };
      }
    );

    renderUploadPage();

    const file = createFile('large.pdf', 1024, 'application/pdf');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('Upload Different File')).toBeInTheDocument();
    });

    const uploadDifferentButton = screen.getByText('Upload Different File');
    await userEvent.click(uploadDifferentButton);

    await waitFor(() => {
      expect(screen.getByText('Upload Document')).toBeInTheDocument();
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });
  });
});