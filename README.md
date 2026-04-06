# Docupex

**Document Upload & Text Extraction Platform**

Docupex is a client-side document management application built with React and TypeScript. Upload PDF, DOCX, and TXT files, extract their text content automatically, and browse your document history — all without a backend server.

---

## Features

- **Document Upload** — Drag-and-drop or file picker interface for uploading documents
- **Text Extraction** — Automatic text extraction from PDF, DOCX, and TXT files
- **Document History** — Browse, search, and manage previously uploaded documents
- **Document Detail View** — View full extracted text with metadata for any document
- **User Authentication** — Local signup/login system with hashed password storage
- **Progress Tracking** — Real-time upload and extraction progress indicators
- **Notifications** — Toast notifications for success, error, warning, and info events
- **Responsive Design** — Fully responsive layout with collapsible sidebar and mobile support
- **Dark Mode Ready** — Tailwind dark mode class strategy configured
- **Client-Side Storage** — All data persisted in localStorage (no backend required)

---

## Tech Stack

| Category        | Technology                          |
| --------------- | ----------------------------------- |
| Framework       | React 18                            |
| Language        | TypeScript 5                        |
| Build Tool      | Vite 5                              |
| Styling         | Tailwind CSS 3                      |
| Routing         | React Router DOM 6                  |
| PDF Extraction  | pdfjs-dist 4                        |
| DOCX Extraction | mammoth.js 1                        |
| UUID Generation | uuid 10                             |
| Testing         | Vitest + React Testing Library      |
| Deployment      | Vercel                              |

---

## Folder Structure

```
docupex/
├── public/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── DocumentCard.tsx
│   │   ├── DropZone.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Header.tsx
│   │   ├── MainLayout.tsx
│   │   ├── NotificationToast.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── Sidebar.tsx
│   │   └── UploadProgress.tsx
│   ├── context/             # React context providers
│   │   ├── AuthContext.tsx
│   │   └── NotificationContext.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useErrorNotification.ts
│   │   └── useLocalStorage.ts
│   ├── pages/               # Route page components
│   │   ├── DashboardPage.tsx
│   │   ├── DocumentDetailPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── SignupPage.tsx
│   │   └── UploadPage.tsx
│   ├── services/            # Business logic and data services
│   │   ├── DocxExtractor.ts
│   │   ├── DocumentRepository.ts
│   │   ├── DocumentService.ts
│   │   ├── ExtractorFactory.ts
│   │   ├── FileValidator.ts
│   │   ├── PdfExtractor.ts
│   │   ├── TextCleaner.ts
│   │   └── TxtExtractor.ts
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Application entry point
│   ├── constants.ts         # Application-wide constants
│   ├── types.ts             # Centralized TypeScript types
│   ├── index.css            # Global styles with Tailwind
│   ├── setup-tests.ts       # Test environment setup
│   └── vite-env.d.ts        # Vite type declarations
├── .env.example             # Environment variable template
├── index.html               # HTML entry point
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── vercel.json              # Vercel deployment config
├── CHANGELOG.md
└── DEPLOYMENT.md
```

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later (or equivalent package manager)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd docupex

# Install dependencies
npm install
```

### Environment Variables

Copy the example environment file and adjust values as needed:

```bash
cp .env.example .env
```

| Variable                 | Default   | Description                                      |
| ------------------------ | --------- | ------------------------------------------------ |
| `VITE_APP_TITLE`         | `Docupex` | Application title shown in the header and tab    |
| `VITE_MAX_FILE_SIZE_MB`  | `10`      | Maximum allowed file size for uploads (MB)       |
| `VITE_MAX_HISTORY_ENTRIES` | `50`    | Maximum number of documents retained in history  |

### Development

```bash
# Start the development server
npm run dev
```

The application will open at [http://localhost:5173](http://localhost:5173).

### Build

```bash
# Type-check and build for production
npm run build
```

The production build output is written to the `dist/` directory.

### Preview

```bash
# Preview the production build locally
npm run preview
```

### Testing

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch
```

Tests are written with [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/). The test environment uses jsdom.

---

## Supported File Formats

| Format | MIME Type                                                                  | Extension |
| ------ | -------------------------------------------------------------------------- | --------- |
| PDF    | `application/pdf`                                                          | `.pdf`    |
| DOCX   | `application/vnd.openxmlformats-officedocument.wordprocessingml.document`  | `.docx`   |
| TXT    | `text/plain`                                                               | `.txt`    |

Files are validated by both MIME type and file extension. If the MIME type is missing or unrecognized, the extension is used as a fallback.

---

## Deployment to Vercel

The project includes a `vercel.json` configuration that rewrites all routes to `index.html` for client-side routing support.

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Deploy
vercel
```

Alternatively, connect the repository to [Vercel](https://vercel.com) for automatic deployments on push. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Build Settings on Vercel

| Setting           | Value          |
| ----------------- | -------------- |
| Framework Preset  | Vite           |
| Build Command     | `npm run build`|
| Output Directory  | `dist`         |
| Install Command   | `npm install`  |

Set the environment variables listed above in the Vercel project settings under **Settings → Environment Variables**.

---

## Demo Limitations

This application is a client-side demo and has the following limitations:

- **No backend server** — All data is stored in the browser's `localStorage`. Data does not persist across browsers or devices.
- **No real authentication** — User credentials are stored locally with a simple hash. This is not suitable for production security.
- **Storage limits** — `localStorage` is typically limited to 5–10 MB depending on the browser. Large documents or many uploads may exceed this limit.
- **Extraction accuracy** — Text extraction quality depends on the source document. Scanned PDFs (image-based) will not yield text content; only text-based PDFs are supported.
- **No server-side processing** — All file parsing happens in the browser. Very large files may cause performance issues.
- **Single-tab usage** — While `localStorage` events are listened to, the application is primarily designed for single-tab use.

---

## Scripts Reference

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start Vite development server            |
| `npm run build`    | Type-check with tsc and build for production |
| `npm run preview`  | Preview the production build locally     |
| `npm test`         | Run all tests once                       |
| `npm run test:watch` | Run tests in watch mode                |

---

## License

This project is **private** and not licensed for public distribution. All rights reserved.