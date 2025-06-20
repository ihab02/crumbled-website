import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface EmailSettings extends RowDataPacket {
  id: number;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_ssl: boolean;
  use_tls: boolean;
  is_active: boolean;
}

export async function GET() {
  try {
    const result = await databaseService.query<EmailSettings[]>(
      'SELECT * FROM email_settings ORDER BY id DESC LIMIT 1'
    );

    return NextResponse.json({
      settings: result[0]?.[0] || null
    });
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const settings = await request.json();

    // Validate required fields
    const requiredFields = ['smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'from_email', 'from_name'];
    for (const field of requiredFields) {
      if (!settings[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Check if settings already exist
    const existingResult = await databaseService.query<EmailSettings[]>(
      'SELECT id FROM email_settings ORDER BY id DESC LIMIT 1'
    );
    const existingSettings = existingResult[0];

    let result;
    if (existingSettings && existingSettings.length > 0) {
      // Update existing settings
      result = await databaseService.query<ResultSetHeader>(
        `UPDATE email_settings 
         SET smtp_host = ?, smtp_port = ?, smtp_username = ?, 
             smtp_password = ?, from_email = ?, from_name = ?, 
             use_ssl = ?, use_tls = ?, is_active = ?
         WHERE id = ?`,
        [
          settings.smtp_host,
          settings.smtp_port,
          settings.smtp_username,
          settings.smtp_password,
          settings.from_email,
          settings.from_name,
          settings.use_ssl ? 1 : 0,
          settings.use_tls ? 1 : 0,
          settings.is_active ? 1 : 0,
          existingSettings[0].id
        ]
      );
    } else {
      // Insert new settings
      result = await databaseService.query<ResultSetHeader>(
        `INSERT INTO email_settings 
         (smtp_host, smtp_port, smtp_username, smtp_password, 
          from_email, from_name, use_ssl, use_tls, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settings.smtp_host,
          settings.smtp_port,
          settings.smtp_username,
          settings.smtp_password,
          settings.from_email,
          settings.from_name,
          settings.use_ssl ? 1 : 0,
          settings.use_tls ? 1 : 0,
          settings.is_active ? 1 : 0
        ]
      );
    }

    return NextResponse.json({
      message: 'Email settings saved successfully'
    });
  } catch (error) {
    console.error('Error saving email settings:', error);
    return NextResponse.json(
      { error: 'Failed to save email settings' },
      { status: 500 }
    );
  }
} 