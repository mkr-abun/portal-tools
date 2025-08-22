import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer-core'

export interface PDFGenerationOptions {
    html: string;
    options?: PDFOptions;
    waitForSelector?: string;
    waitForTimeout?: number;
    viewport?: {
        width: number;
        height: number;
    };
}

export interface PDFGenerationResult {
    success: boolean;
    buffer?: Buffer;
    error?: string;
}

export class PDFGeneratorService {
    private static instance: PDFGeneratorService;

    private constructor() { }

    public static getInstance(): PDFGeneratorService {
        if (!PDFGeneratorService.instance) {
            PDFGeneratorService.instance = new PDFGeneratorService();
        }
        return PDFGeneratorService.instance;
    }

    /**
     * Generate PDF from HTML content - using fresh browser for each request
     */
    public async generatePDF(options: PDFGenerationOptions): Promise<PDFGenerationResult> {
        let browser: Browser | null = null;
        let page: Page | null = null;

        try {
            console.log('Starting PDF generation...');

            // Create a fresh browser instance for each request to avoid connection issues
            browser = await puppeteer.launch({
                headless: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--no-first-run'
                ],
                timeout: 30000
            });

            console.log('Browser launched, creating page...');
            page = await browser.newPage();

            // Set viewport if provided
            if (options.viewport) {
                await page.setViewport(options.viewport);
            }

            console.log('Setting page content...');
            // Set content with timeout
            await page.setContent(options.html, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });

            // Wait for specific selector if provided
            if (options.waitForSelector) {
                console.log(`Waiting for selector: ${options.waitForSelector}`);
                await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
            }

            // Wait for additional timeout if provided
            if (options.waitForTimeout) {
                console.log(`Waiting for timeout: ${options.waitForTimeout}ms`);
                await new Promise(resolve => setTimeout(resolve, options.waitForTimeout));
            }

            // Default PDF options
            const defaultPDFOptions: PDFOptions = {
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            };

            // Merge with custom options
            const pdfOptions = { ...defaultPDFOptions, ...options.options };

            console.log('Generating PDF...');
            // Generate PDF
            const buffer = await page.pdf(pdfOptions);

            console.log('PDF generated successfully');
            return {
                success: true,
                buffer: Buffer.from(buffer)
            };

        } catch (error) {
            console.error('PDF generation error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        } finally {
            // Clean up page and browser
            try {
                if (page) {
                    console.log('Closing page...');
                    await page.close();
                }
                if (browser) {
                    console.log('Closing browser...');
                    await browser.close();
                }
            } catch (closeError) {
                console.warn('Error during cleanup:', closeError);
            }
        }
    }

    /**
     * Generate PDF from URL - using fresh browser for each request
     */
    public async generatePDFFromURL(url: string, options?: PDFOptions): Promise<PDFGenerationResult> {
        let browser: Browser | null = null;
        let page: Page | null = null;

        try {
            console.log('Starting PDF generation from URL:', url);

            // Create a fresh browser instance
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding',
                    '--no-first-run'
                ],
                timeout: 30000
            });

            console.log('Browser launched, creating page...');
            page = await browser.newPage();

            console.log('Navigating to URL...');
            await page.goto(url, {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            const defaultPDFOptions: PDFOptions = {
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '20px',
                    right: '20px',
                    bottom: '20px',
                    left: '20px'
                }
            };

            const pdfOptions = { ...defaultPDFOptions, ...options };

            console.log('Generating PDF from URL...');
            const buffer = await page.pdf(pdfOptions);

            console.log('PDF generated successfully from URL');
            return {
                success: true,
                buffer: Buffer.from(buffer)
            };

        } catch (error) {
            console.error('PDF generation from URL error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        } finally {
            // Clean up page and browser
            try {
                if (page) {
                    console.log('Closing page...');
                    await page.close();
                }
                if (browser) {
                    console.log('Closing browser...');
                    await browser.close();
                }
            } catch (closeError) {
                console.warn('Error during cleanup:', closeError);
            }
        }
    }

    /**
     * Get browser status - simplified since we don't maintain persistent browser
     */
    public getBrowserStatus(): { connected: boolean; isConnected: boolean } {
        return {
            connected: true, // Always true since we create fresh browsers
            isConnected: true // Always true since we create fresh browsers
        };
    }

    /**
     * Cleanup - no-op since we don't maintain persistent browser
     */
    public async cleanup(): Promise<void> {
        console.log('Cleanup called - no persistent browser to clean up');
    }

    /**
     * Restart browser - no-op since we don't maintain persistent browser
     */
    public async restartBrowser(): Promise<void> {
        console.log('Restart called - no persistent browser to restart');
    }
}

// Export singleton instance
export const pdfGeneratorService = PDFGeneratorService.getInstance();
