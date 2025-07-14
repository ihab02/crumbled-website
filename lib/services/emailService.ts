import nodemailer from 'nodemailer';
import pool from '@/lib/db';

export interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
  use_ssl: boolean;
  use_tls: boolean;
}

export class EmailService {
  private static async getEmailSettings(): Promise<EmailSettings | null> {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM email_settings WHERE is_active = 1 LIMIT 1'
      );
      
      if (Array.isArray(rows) && rows.length > 0) {
        const settings = rows[0] as any;
        return {
          smtp_host: settings.smtp_host,
          smtp_port: settings.smtp_port,
          smtp_username: settings.smtp_username,
          smtp_password: settings.smtp_password,
          from_email: settings.from_email,
          from_name: settings.from_name,
          use_ssl: settings.use_ssl === 1,
          use_tls: settings.use_tls === 1
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting email settings:', error);
      return null;
    }
  }

  private static async createTransporter() {
    const settings = await this.getEmailSettings();
    
    if (!settings) {
      throw new Error('Email settings not configured');
    }

    return nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.use_ssl,
      auth: {
        user: settings.smtp_username,
        pass: settings.smtp_password,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  static async sendEmailVerification(email: string, token: string, customerName: string) {
    try {
      const transporter = await this.createTransporter();
      const settings = await this.getEmailSettings();
      
      if (!settings) {
        throw new Error('Email settings not configured');
      }

      const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/verify-email?token=${token}`;
      
      const mailOptions = {
        from: `"${settings.from_name}" <${settings.from_email}>`,
        to: email,
        subject: 'Verify Your Email - Crumbled',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Crumbled</h1>
              <p style="color: white; margin: 5px 0 0 0;">Delicious Cookies Delivered</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${customerName}!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Thank you for registering with Crumbled! To complete your registration and start enjoying our delicious cookies, 
                please verify your email address by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              
              <p style="color: #007bff; word-break: break-all; margin-bottom: 25px;">
                ${verificationUrl}
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                This verification link will expire in 24 hours. If you didn't create an account with Crumbled, 
                you can safely ignore this email.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #999; font-size: 14px; text-align: center;">
                Best regards,<br>
                The Crumbled Team
              </p>
            </div>
          </div>
        `
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Email verification sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email verification:', error);
      throw error;
    }
  }

  static async sendPasswordReset(email: string, token: string, customerName: string) {
    try {
      const transporter = await this.createTransporter();
      const settings = await this.getEmailSettings();
      
      if (!settings) {
        throw new Error('Email settings not configured');
      }

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/reset-password?token=${token}`;
      
      const mailOptions = {
        from: `"${settings.from_name}" <${settings.from_email}>`,
        to: email,
        subject: 'Reset Your Password - Crumbled',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Crumbled</h1>
              <p style="color: white; margin: 5px 0 0 0;">Delicious Cookies Delivered</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${customerName}!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                We received a request to reset your password for your Crumbled account. 
                Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" 
                   style="background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              
              <p style="color: #007bff; word-break: break-all; margin-bottom: 25px;">
                ${resetUrl}
              </p>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                This password reset link will expire in 1 hour. If you didn't request a password reset, 
                you can safely ignore this email and your password will remain unchanged.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #999; font-size: 14px; text-align: center;">
                Best regards,<br>
                The Crumbled Team
              </p>
            </div>
          </div>
        `
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Password reset email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  static async sendPasswordChanged(email: string, customerName: string) {
    try {
      const transporter = await this.createTransporter();
      const settings = await this.getEmailSettings();
      
      if (!settings) {
        throw new Error('Email settings not configured');
      }

      const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/auth/login`;
      
      const mailOptions = {
        from: `"${settings.from_name}" <${settings.from_email}>`,
        to: email,
        subject: 'Password Changed Successfully - Crumbled',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Crumbled</h1>
              <p style="color: white; margin: 5px 0 0 0;">Delicious Cookies Delivered</p>
            </div>
            
            <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-bottom: 20px;">Hello ${customerName}!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
                Your password has been successfully changed. If you made this change, you can safely ignore this email.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" 
                   style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 15px 30px; 
                          text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold;">
                  Login to Your Account
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
                If you didn't change your password, please contact our support team immediately as your account may be compromised.
              </p>
              
              <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
              
              <p style="color: #999; font-size: 14px; text-align: center;">
                Best regards,<br>
                The Crumbled Team
              </p>
            </div>
          </div>
        `
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Password changed notification sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending password changed notification:', error);
      throw error;
    }
  }
} 