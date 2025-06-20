import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const settings = await request.json();
    const { test_email } = settings;

    if (!test_email) {
      return NextResponse.json(
        { error: 'Test email address is required' },
        { status: 400 }
      );
    }

    // Validate required settings
    const requiredFields = ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'from_email', 'from_name'];
    const missingFields = requiredFields.filter(field => !settings[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: `The following fields are required: ${missingFields.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Create a transporter
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.use_ssl,
      auth: {
        user: settings.smtp_username,
        pass: settings.smtp_password
      },
      tls: settings.use_tls ? {
        rejectUnauthorized: true,
        ciphers: 'SSLv3'
      } : undefined
    });

    // Verify SMTP connection
    try {
      await transporter.verify();
    } catch (error) {
      console.error('SMTP connection error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to connect to SMTP server',
          details: error instanceof Error ? error.message : 'Unknown connection error'
        },
        { status: 500 }
      );
    }

    // Send test email
    try {
      await transporter.sendMail({
        from: `"${settings.from_name}" <${settings.from_email}>`,
        to: test_email,
        subject: 'Test Email from Crumbled Admin Panel',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #8B4513; margin-bottom: 10px;">Test Email</h1>
              <p style="color: #666; font-size: 16px;">This is a test email to verify your email settings are working correctly.</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="color: #8B4513; margin-top: 0;">Email Configuration Details</h2>
              <p><strong>SMTP Host:</strong> ${settings.smtp_host}</p>
              <p><strong>SMTP Port:</strong> ${settings.smtp_port}</p>
              <p><strong>Security:</strong> ${settings.use_ssl ? 'SSL' : settings.use_tls ? 'TLS' : 'None'}</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #8B4513; font-weight: bold;">If you received this email, your email configuration is working properly.</p>
            </div>
            
            <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
              <p>This is an automated message from the Crumbled Admin Panel.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        `
      });

      return NextResponse.json({
        message: 'Test email sent successfully',
        details: `Email was sent to ${test_email}`
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      return NextResponse.json(
        { 
          error: 'Failed to send test email',
          details: error instanceof Error ? error.message : 'Unknown error while sending email'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test email route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 