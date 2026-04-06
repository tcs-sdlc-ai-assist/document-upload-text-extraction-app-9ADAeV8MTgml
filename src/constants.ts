export const APP_NAME = import.meta.env.VITE_APP_TITLE || 'Docupex';

export const MAX_FILE_SIZE_MB = Number(import.meta.env.VITE_MAX_FILE_SIZE_MB) || 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const MAX_HISTORY_ENTRIES = Number(import.meta.env.VITE_MAX_HISTORY_ENTRIES) || 50;

export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

export const SUPPORTED_FILE_EXTENSIONS = ['.pdf', '.docx', '.txt'] as const;

export const FILE_TYPE_MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
};

export const MIME_TO_EXTENSION_MAP: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
};

export const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'text/plain': 'TXT',
};

export const STORAGE_KEYS = {
  users: 'docupex_users',
  session: 'docupex_session',
  documents: 'docupex_documents',
} as const;

export const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: false,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/,
  message:
    'Password must be 8–128 characters and include at least one uppercase letter, one lowercase letter, and one number.',
} as const;

export const UPLOAD_STATES = {
  idle: 'idle',
  validating: 'validating',
  extracting: 'extracting',
  cleaning: 'cleaning',
  saving: 'saving',
  complete: 'complete',
  error: 'error',
} as const;

export const ROUTES = {
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
  upload: '/upload',
  history: '/history',
  documentDetail: '/documents/:id',
  notFound: '*',
} as const;

export const NOTIFICATION_DURATION_MS = 5000;