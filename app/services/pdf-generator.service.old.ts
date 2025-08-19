import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';

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
    private browser: Browser | null = null;

    private constructor() { }

    public static getInstance(): PDFGeneratorService {
        if (!PDFGeneratorService.instance) {
            PDFGeneratorService.instance = new PDFGeneratorService();
        }
        return PDFGeneratorService.instance;
    }

    /**
     * Initialize the browser instance
     */
    private async initBrowser(): Promise<Browser> {
        // Check if browser exists and is connected
        if (this.browser && this.browser.isConnected()) {
            return this.browser;
        }

        // Clean up disconnected browser
        if (this.browser && !this.browser.isConnected()) {
            try {
                await this.browser.close();
            } catch (error) {
                console.warn('Error closing disconnected browser:', error);
            }
            this.browser = null;
        }

        // Launch new browser instance
        try {
            console.log('Launching new browser instance...');
            this.browser = await puppeteer.launch({
                headless: true, // Use headless mode
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ],
                timeout: 30000
            });

            console.log('Browser launched successfully');

            // Add error handlers to detect disconnections
            this.browser.on('disconnected', () => {
                console.log('Browser disconnected, will create new instance on next request');
                this.browser = null;
            });

            return this.browser;
        } catch (error) {
            console.error('Failed to launch browser:', error);
            this.browser = null;
            throw new Error('Failed to initialize browser: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    /**
     * Generate PDF from HTML content
     */
    public async generatePDF(options: PDFGenerationOptions): Promise<PDFGenerationResult> {
        let page: Page | null = null;
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
            try {
                const browser = await this.initBrowser();
                page = await browser.newPage();

                // Set viewport if provided
                if (options.viewport) {
                    await page.setViewport(options.viewport);
                }

                // Set content with timeout
                await page.setContent(options.html, {
                    waitUntil: 'networkidle0',
                    timeout: 15000
                });

                // Wait for specific selector if provided
                if (options.waitForSelector) {
                    await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
                }

                // Wait for additional timeout if provided
                if (options.waitForTimeout) {
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

                // Generate PDF
                const buffer = await page.pdf(pdfOptions);

                return {
                    success: true,
                    buffer: Buffer.from(buffer)
                };

            } catch (error) {
                console.error(`PDF generation error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);

                // Clean up page
                if (page) {
                    try {
                        // await page.close();
                    } catch (closeError) {
                        console.warn('Error closing page:', closeError);
                    }
                    page = null;
                }

                // If it's a connection error and we have retries left, try again
                if (retryCount < maxRetries && (
                    error instanceof Error && (
                        error.message.includes('Connection closed') ||
                        error.message.includes('Protocol error') ||
                        error.message.includes('Session closed')
                    )
                )) {
                    retryCount++;
                    console.log(`Retrying PDF generation (attempt ${retryCount + 1}/${maxRetries + 1})`);

                    // Clean up browser instance to force new connection
                    if (this.browser) {
                        try {
                            await this.browser.close();
                        } catch (closeError) {
                            console.warn('Error closing browser for retry:', closeError);
                        }
                        this.browser = null;
                    }

                    continue;
                }

                // If we've exhausted retries or it's not a connection error, return failure
                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                };
            } finally {
                // Clean up page if it still exists
                if (page) {
                    try {
                        // await page.close();
                    } catch (closeError) {
                        console.warn('Error closing page in finally block:', closeError);
                    }
                }
            }
        }

        // This should never be reached, but just in case
        return {
            success: false,
            error: 'Maximum retry attempts reached'
        };
    }

    /**
     * Generate PDF from URL
     */
    public async generatePDFFromURL(url: string, options?: PDFOptions): Promise<PDFGenerationResult> {
        let page: Page | null = null;
        let retryCount = 0;
        const maxRetries = 2;

        while (retryCount <= maxRetries) {
            try {
                const browser = await this.initBrowser();
                page = await browser.newPage();

                await page.goto(url, {
                    waitUntil: 'networkidle0',
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
                const buffer = await page.pdf(pdfOptions);

                return {
                    success: true,
                    buffer: Buffer.from(buffer)
                };

            } catch (error) {
                console.error(`PDF generation from URL error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);

                // Clean up page
                if (page) {
                    try {
                        await page.close();
                    } catch (closeError) {
                        console.warn('Error closing page:', closeError);
                    }
                    page = null;
                }

                // If it's a connection error and we have retries left, try again
                if (retryCount < maxRetries && (
                    error instanceof Error && (
                        error.message.includes('Connection closed') ||
                        error.message.includes('Protocol error') ||
                        error.message.includes('Session closed')
                    )
                )) {
                    retryCount++;
                    console.log(`Retrying URL PDF generation (attempt ${retryCount + 1}/${maxRetries + 1})`);

                    // Clean up browser instance to force new connection
                    if (this.browser) {
                        try {
                            await this.browser.close();
                        } catch (closeError) {
                            console.warn('Error closing browser for retry:', closeError);
                        }
                        this.browser = null;
                    }

                    continue;
                }

                return {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error occurred'
                };
            } finally {
                if (page) {
                    try {
                        await page.close();
                    } catch (closeError) {
                        console.warn('Error closing page in finally block:', closeError);
                    }
                }
            }
        }

        return {
            success: false,
            error: 'Maximum retry attempts reached'
        };
    }

    /**
     * Close the browser instance
     */
    public async cleanup(): Promise<void> {
        if (this.browser) {
            try {
                await this.browser.close();
            } catch (error) {
                console.warn('Error during browser cleanup:', error);
            }
            this.browser = null;
        }
    }

    /**
     * Force restart the browser instance
     */
    public async restartBrowser(): Promise<void> {
        console.log('Restarting browser instance...');
        await this.cleanup();
        // Browser will be recreated on next request
        console.log('Browser instance cleaned up, will create new instance on next request');
    }

    /**
     * Get browser status
     */
    public getBrowserStatus(): { connected: boolean; isConnected: boolean } {
        const connected = this.browser !== null;
        let isConnected = false;

        if (this.browser) {
            try {
                isConnected = this.browser.isConnected();
            } catch (error) {
                console.warn('Error checking browser connection status:', error);
                isConnected = false;
            }
        }

        return {
            connected,
            isConnected
        };
    }
}

// Export singleton instance
export const pdfGeneratorService = PDFGeneratorService.getInstance();
