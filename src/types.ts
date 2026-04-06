export interface User {
  username: string;
  passwordHash: string;
}

export interface Session {
  username: string;
  token: string;
  loginTime: number;
}

export interface DocumentMetadata {
  id: string;
  fileName: string;
  fileType: SupportedFileType;
  fileSize: number;
  timestamp: number;
  userId: string;
}

export interface DocumentEntry {
  metadata: DocumentMetadata;
  extractedText: string;
}

export enum UploadStatus {
  Idle = 'idle',
  Validating = 'validating',
  Extracting = 'extracting',
  Cleaning = 'cleaning',
  Complete = 'complete',
  Error = 'error',
}

export interface ErrorNotification {
  type: 'error' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: number;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  signup: (username: string, password: string) => boolean;
  logout: () => void;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface ExtractionResult {
  success: boolean;
  text: string;
  error?: string;
}

export type SupportedFileType = 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' | 'text/plain';