import nodemailer from 'nodemailer';
import { databaseService } from './databaseService';
import { RowDataPacket } from 'mysql2';

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

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private static instance: EmailService;
  private settings: EmailSettings | null = null;
  private transporter: nodemailer.Transporter | null = null;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private async loadSettings() {
    if (this.settings) return;

    const [settings] = await databaseService.query<EmailSettings[]>(
      'SELECT * FROM email_settings WHERE is_active = true ORDER BY id DESC LIMIT 1'
    );

    if (settings.length === 0) {
      throw new Error('No active email settings found');
    }

    const emailSettings = settings[0];
    this.settings = emailSettings;

    if (emailSettings.use_ssl) {
      this.transporter = nodemailer.createTransport({
        host: emailSettings.smtp_host,
        port: emailSettings.smtp_port,
        secure: true, // SSL requires secure to be true
        auth: {
          user: emailSettings.smtp_username,
          pass: emailSettings.smtp_password
        },
        tls: {
          rejectUnauthorized: true,
          ciphers: 'SSLv3'
        }
      });
    } else if (emailSettings.use_tls) {
      this.transporter = nodemailer.createTransport({
        host: emailSettings.smtp_host,
        port: emailSettings.smtp_port,
        secure: false, // TLS doesn't use secure
        auth: {
          user: emailSettings.smtp_username,
          pass: emailSettings.smtp_password
        },
        tls: {
          rejectUnauthorized: true,
          ciphers: 'SSLv3'
        }
      });
    } else {
      // Unencrypted connection (not recommended)
      this.transporter = nodemailer.createTransport({
        host: emailSettings.smtp_host,
        port: emailSettings.smtp_port,
        secure: false,
        auth: {
          user: emailSettings.smtp_username,
          pass: emailSettings.smtp_password
        }
      });
    }
  }

  public async sendEmail(options: EmailOptions) {
    try {
      await this.loadSettings();

      if (!this.transporter || !this.settings) {
        throw new Error('Email service not properly initialized');
      }

      const mailOptions = {
        from: `"${this.settings.from_name}" <${this.settings.from_email}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  public async sendVerificationEmail(to: string, token: string) {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    
    await this.sendEmail({
      to,
      subject: 'Verify Your Email Address',
      html: `
        <h1>Welcome to Crumbled!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <p>
          <a href="${verificationUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #ec4899;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
          ">
            Verify Email Address
          </a>
        </p>
        <p>If you did not create an account, you can safely ignore this email.</p>
        <hr>
        <p><small>This is an automated message, please do not reply.</small></p>
      `
    });
  }

  public async sendPasswordResetEmail(to: string, token: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    
    await this.sendEmail({
      to,
      subject: 'Reset Your Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to proceed:</p>
        <p>
          <a href="${resetUrl}" style="
            display: inline-block;
            padding: 12px 24px;
            background-color: #ec4899;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
          ">
            Reset Password
          </a>
        </p>
        <p>If you did not request a password reset, you can safely ignore this email.</p>
        <hr>
        <p><small>This is an automated message, please do not reply.</small></p>
      `
    });
  }

  public async sendOrderConfirmationEmail(to: string, orderId: string, orderDetails: any) {
    await this.sendEmail({
      to,
      subject: `Order Confirmation - Order #${orderId}`,
      html: `
        <h1>Thank You for Your Order!</h1>
        <p>Your order has been received and is being processed.</p>
        <h2>Order Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">Item</th>
            <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Price</th>
            <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Quantity</th>
            <th style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">Total</th>
          </tr>
          ${orderDetails.items.map((item: any) => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
              <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">$${item.price.toFixed(2)}</td>
              <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
              <td style="text-align: right; padding: 8px; border-bottom: 1px solid #ddd;">$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="3" style="text-align: right; padding: 8px; font-weight: bold;">Subtotal:</td>
            <td style="text-align: right; padding: 8px;">$${orderDetails.subtotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: right; padding: 8px; font-weight: bold;">Shipping:</td>
            <td style="text-align: right; padding: 8px;">$${orderDetails.shipping.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align: right; padding: 8px; font-weight: bold;">Total:</td>
            <td style="text-align: right; padding: 8px; font-weight: bold;">$${orderDetails.total.toFixed(2)}</td>
          </tr>
        </table>
        <p>We'll notify you when your order ships.</p>
        <hr>
        <p><small>This is an automated message, please do not reply.</small></p>
      `
    });
  }
}

export const emailService = EmailService.getInstance(); 