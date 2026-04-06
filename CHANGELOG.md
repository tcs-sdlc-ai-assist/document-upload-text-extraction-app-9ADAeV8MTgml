# Changelog

All notable changes to the Docupex project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-09-15

### Added

- **User Authentication**
  - User signup with username and password validation
  - User login with credential verification
  - User logout with session cleanup
  - Password rules enforcement (minimum 8 characters, uppercase, lowercase, and number required)
  - Session persistence via localStorage
  - Protected routes requiring authentication

- **Document Upload**
  - Drag-and-drop file upload area with visual feedback
  - Click-to-browse file picker as an alternative upload method
  - File type validation supporting PDF, DOCX, and TXT formats
  - File size validation with configurable maximum (default 10 MB)
  - Upload progress indicator with status messages
  - Retry mechanism for failed extractions

- **Text Extraction**
  - PDF text extraction powered by pdf.js
  - DOCX text extraction powered by mammoth.js
  - Plain text file reading with UTF-8 decoding
  - Extractor factory for automatic format detection based on MIME type and file extension
  - Post-extraction text cleaning (control character removal, whitespace normalization)

- **Document History**
  - Persistent document storage in localStorage
  - Document history listing with search functionality
  - Document detail view with full extracted text
  - Document deletion with confirmation dialog
  - Copy extracted text to clipboard
  - Configurable maximum history entries (default 50)
  - Per-user document isolation

- **Dashboard**
  - Overview of total documents, file type breakdown, and total storage used
  - Recent uploads section with quick access to document details
  - Quick navigation to upload and history pages

- **Responsive UI**
  - Header with application branding and user controls
  - Collapsible sidebar navigation with route links
  - Mobile-friendly layout with hamburger menu toggle
  - Tailwind CSS utility-first styling with custom color palette
  - Dark mode support via class-based toggling
  - Fade-in and slide animations for smooth transitions

- **Error Handling & Notifications**
  - Global error boundary for React rendering errors
  - Toast notification system with support for error, warning, info, and success types
  - Auto-dismissing notifications with configurable duration
  - Form-level validation error messages on login and signup pages

- **Developer Experience**
  - TypeScript strict mode with centralized type definitions
  - Vite-powered development server with hot module replacement
  - Vitest test suite with jsdom environment and React Testing Library
  - Path alias (`@/`) for clean imports
  - Environment variable configuration via `.env` files
  - Vercel deployment configuration with SPA rewrites