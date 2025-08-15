import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/middleware/auth';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication using JWT token
    const adminToken = request.cookies.get('adminToken');
    
    if (!adminToken?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin token
    try {
      const decoded = verifyJWT(adminToken.value, 'admin');
      // If verifyJWT doesn't throw, it's a valid admin token
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { html, filename } = await request.json();

    if (!html) {
      return NextResponse.json({ 
        error: 'HTML content is required' 
      }, { status: 400 });
    }

    // Launch Puppeteer with stable settings
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });

    try {
      const page = await browser.newPage();
      
      // Set timeout and content with same settings as original
      await page.setDefaultTimeout(30000); // Increased timeout
      await page.setContent(html, {
        waitUntil: 'domcontentloaded'
      });

      // Wait a bit for content to fully render
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate PDF with same settings as original
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
        },
        printBackground: true
      });

      const pdfBuffer = Buffer.from(pdf);

      // Set response headers for PDF download
      const finalFilename = filename || `order-${new Date().toISOString().split('T')[0]}.pdf`;

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${finalFilename}"`,
          'Content-Length': pdfBuffer.length.toString()
        }
      });

    } catch (pageError) {
      console.error('Page error:', pageError);
      throw pageError;
    } finally {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Browser close error:', closeError);
      }
    }

  } catch (error) {
    console.error('Error generating PDF from HTML:', error);
    return NextResponse.json({ 
      error: 'Failed to generate PDF' 
    }, { status: 500 });
  }
}
