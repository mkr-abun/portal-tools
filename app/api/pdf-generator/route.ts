import { NextRequest, NextResponse } from 'next/server';
import { pdfGeneratorService, PDFGenerationOptions } from '../../services/pdf-generator.service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.html && !body.url) {
            return NextResponse.json(
                { error: 'Either html content or url is required' },
                { status: 400 }
            );
        }

        let result;

        if (body.url) {
            // Generate PDF from URL
            result = await pdfGeneratorService.generatePDFFromURL(body.url, body.options);
        } else {
            // Generate PDF from HTML content
            const options: PDFGenerationOptions = {
                html: body.html,
                options: body.options || {},
                waitForSelector: body.waitForSelector,
                waitForTimeout: body.waitForTimeout,
                viewport: body.viewport
            };

            result = await pdfGeneratorService.generatePDF(options);
        }

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to generate PDF' },
                { status: 500 }
            );
        }

        // Return PDF as response
        return new Response(new Uint8Array(result.buffer!), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${body.filename || 'document.pdf'}"`,
                'Content-Length': result.buffer!.length.toString(),
            },
        });

    } catch (error) {
        console.error('PDF generation API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'restart') {
            // Restart browser service
            await pdfGeneratorService.restartBrowser();
            const status = pdfGeneratorService.getBrowserStatus();

            return NextResponse.json({
                service: 'PDF Generator',
                status: 'restarted',
                browser: status,
                message: 'Browser service restarted successfully'
            });
        }

        // Default health check
        const status = pdfGeneratorService.getBrowserStatus();

        return NextResponse.json({
            service: 'PDF Generator',
            status: 'healthy',
            browser: status
        });
    } catch (error) {
        console.error('Health check error:', error);
        return NextResponse.json(
            { error: 'Service unavailable' },
            { status: 503 }
        );
    }
}

// Cleanup on process termination
process.on('SIGINT', async () => {
    console.log('Shutting down PDF service...');
    await pdfGeneratorService.cleanup();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down PDF service...');
    await pdfGeneratorService.cleanup();
    process.exit(0);
});
