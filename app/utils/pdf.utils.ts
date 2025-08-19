import { PDFOptions } from 'puppeteer';

export interface PDFGenerationRequest {
    html?: string;
    url?: string;
    filename?: string;
    options?: PDFOptions;
    waitForSelector?: string;
    waitForTimeout?: number;
    viewport?: {
        width: number;
        height: number;
    };
}

export interface PDFGenerationResponse {
    success: boolean;
    error?: string;
    filename?: string;
}

export const DEFAULT_PDF_OPTIONS: PDFOptions = {
    format: 'A4',
    printBackground: true,
    margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
    }
};

export const VIEWPORT_PRESETS = {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 667 }
};

/**
 * Validate HTML content
 */
export function validateHTML(html: string): boolean {
    return html.trim().length > 0;
}

/**
 * Validate URL
 */
export function validateURL(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Generate safe filename
 */
export function generateSafeFilename(filename?: string): string {
    if (!filename) {
        return `document-${Date.now()}.pdf`;
    }

    // Remove unsafe characters and ensure .pdf extension
    const safeName = filename
        .replace(/[^\w\s\-\.]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();

    return safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`;
}

/**
 * Create HTML template wrapper
 */
export function createHTMLTemplate(content: string, title = 'PDF Document'): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 0;
        }
        
        p {
            margin-bottom: 1rem;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }
        
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>
  `.trim();
}
