# PDF Generator Service

A powerful PDF generation service built with Next.js and Puppeteer that converts HTML content or web pages to PDF documents.

## Features

- 🔄 Convert HTML content to PDF
- 🌐 Generate PDF from URLs
- ⚙️ Customizable PDF options (format, margins, backgrounds)
- 📱 Responsive design support
- 🎯 Viewport configuration
- ⏱️ Wait for elements or timeouts
- 🔧 Singleton browser instance for performance
- 🏥 Health check endpoint
- 🧹 Automatic cleanup on shutdown

## Installation

The service uses Puppeteer which is already installed:

```bash
pnpm install
```

## API Endpoints

### POST /api/pdf-generator

Generate a PDF from HTML content or URL.

#### Request Body

```typescript
{
  html?: string;           // HTML content to convert
  url?: string;            // URL to convert (alternative to html)
  filename?: string;       // Output filename (default: document.pdf)
  options?: {              // PDF generation options
    format?: 'A4' | 'A3' | 'Letter' | ...;
    printBackground?: boolean;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
  };
  waitForSelector?: string;  // CSS selector to wait for
  waitForTimeout?: number;   // Additional timeout in ms
  viewport?: {              // Browser viewport
    width: number;
    height: number;
  };
}
```

#### Response

Returns the PDF file as a binary stream with appropriate headers.

#### Examples

**Generate PDF from HTML:**

```javascript
const response = await fetch('/api/pdf-generator', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    html: '<h1>Hello World</h1><p>This is a PDF document.</p>',
    filename: 'hello-world.pdf',
    options: {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    },
  }),
})

const blob = await response.blob()
// Handle download...
```

**Generate PDF from URL:**

```javascript
const response = await fetch('/api/pdf-generator', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com',
    filename: 'webpage.pdf',
    viewport: {
      width: 1920,
      height: 1080,
    },
  }),
})
```

### GET /api/pdf-generator

Health check endpoint that returns service status and browser information.

#### Response

```json
{
  "service": "PDF Generator",
  "status": "healthy",
  "browser": {
    "connected": true,
    "isConnected": true
  }
}
```

## Service Architecture

### PDFGeneratorService

The core service class that manages PDF generation:

- **Singleton Pattern**: Single browser instance shared across requests
- **Browser Management**: Automatic browser initialization and cleanup
- **Error Handling**: Comprehensive error handling with detailed messages
- **Performance**: Reuses browser instance for better performance

### Key Components

1. **PDF Generator Service** (`app/services/pdf-generator.service.ts`)

   - Core PDF generation logic
   - Browser instance management
   - Error handling and cleanup

2. **API Route** (`app/api/pdf-generator/route.ts`)

   - HTTP request handling
   - Input validation
   - Response formatting

3. **Utilities** (`app/utils/pdf.utils.ts`)

   - Type definitions
   - Helper functions
   - Default configurations

4. **Demo Component** (`app/components/PDFGeneratorDemo.tsx`)
   - Interactive UI for testing
   - Usage examples
   - Error handling demonstration

## Configuration

### Default PDF Options

```typescript
{
  format: 'A4',
  printBackground: true,
  margin: {
    top: '20px',
    right: '20px',
    bottom: '20px',
    left: '20px'
  }
}
```

### Viewport Presets

```typescript
{
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
}
```

### Browser Launch Options

The service launches Puppeteer with optimized options for server environments:

```typescript
{
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu'
  ]
}
```

## Usage Examples

### Basic HTML to PDF

```typescript
import { pdfGeneratorService } from './app/services/pdf-generator.service'

const result = await pdfGeneratorService.generatePDF({
  html: '<h1>My Document</h1><p>Content here...</p>',
  options: {
    format: 'A4',
    printBackground: true,
  },
})

if (result.success && result.buffer) {
  // Save or return the PDF buffer
  fs.writeFileSync('output.pdf', result.buffer)
}
```

### URL to PDF with Wait Conditions

```typescript
const result = await pdfGeneratorService.generatePDF({
  html: complexHTMLContent,
  waitForSelector: '.content-loaded',
  waitForTimeout: 2000,
  viewport: { width: 1200, height: 800 },
  options: {
    format: 'A4',
    printBackground: true,
    margin: { top: '1in', bottom: '1in', left: '0.5in', right: '0.5in' },
  },
})
```

## Error Handling

The service provides comprehensive error handling:

```typescript
const result = await pdfGeneratorService.generatePDF(options)

if (!result.success) {
  console.error('PDF generation failed:', result.error)
  // Handle error appropriately
} else {
  // Process successful result
  const pdfBuffer = result.buffer
}
```

## Performance Considerations

1. **Browser Reuse**: The service uses a singleton pattern to reuse the browser instance
2. **Memory Management**: Pages are properly closed after each generation
3. **Cleanup**: Automatic browser cleanup on process termination
4. **Timeouts**: Configurable timeouts to prevent hanging requests

## Deployment Notes

### Environment Variables

No additional environment variables are required. The service works out of the box.

### Server Requirements

- Node.js with sufficient memory for Puppeteer
- System dependencies for Chromium (usually pre-installed in most environments)

### Docker Deployment

If deploying with Docker, ensure Chromium dependencies are installed:

```dockerfile
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    && rm -rf /var/lib/apt/lists/*
```

## Development

Start the development server:

```bash
pnpm dev
```

The demo interface will be available at `http://localhost:3000`.

## Testing

Test the service health:

```bash
curl http://localhost:3000/api/pdf-generator
```

Generate a test PDF:

```bash
curl -X POST http://localhost:3000/api/pdf-generator \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test</h1>","filename":"test.pdf"}' \
  --output test.pdf
```

## Troubleshooting

### Common Issues

1. **Browser Launch Fails**: Ensure system has required dependencies
2. **Memory Issues**: Increase Node.js memory limit if processing large documents
3. **Timeout Errors**: Increase timeout values for complex pages
4. **Font Issues**: Ensure required fonts are available in the system

### Debug Mode

Enable debug logging by setting NODE_ENV to development and checking console output.

## License

This project is part of the IRSE Portal Tools and follows the project's licensing terms.
