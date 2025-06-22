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

    console.log('🔍 Email settings query result:', result);
    console.log('🔍 Result type:', typeof result);
    console.log('🔍 Result is array:', Array.isArray(result));
    console.log('🔍 Result length:', Array.isArray(result) ? result.length : 'not array');

    // Handle the result structure properly
    let settings = null;
    if (Array.isArray(result) && result.length > 0) {
      settings = result[0];
    } else if (result && typeof result === 'object' && '0' in result) {
      // Handle case where result is { 0: [settings] }
      settings = result[0];
    }

    console.log('🔍 Extracted settings:', settings);

    return NextResponse.json({
      settings: settings || null
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

    console.log('💾 Saving email settings:', settings);

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

    // First, delete all existing settings to ensure only one record
    await databaseService.query('DELETE FROM email_settings');

    // Insert new settings
    const result = await databaseService.query<ResultSetHeader>(
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

    console.log('✅ Email settings saved successfully, ID:', result.insertId);

    return NextResponse.json({
      message: 'Email settings saved successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error saving email settings:', error);
    return NextResponse.json(
      { error: 'Failed to save email settings' },
      { status: 500 }
    );
  }
} 