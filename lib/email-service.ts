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

  static async sendOrderConfirmation(email: string, order: any) {
    const transporter = await this.createTransporter();
    const settings = await this.getEmailSettings();
    if (!settings) throw new Error('Email settings not configured');

    // Extract and calculate
    const subtotal = Number(order.subtotal ?? 0);
    const deliveryFee = Number(order.delivery_fee ?? 0);
    const discount = Number(order.discount || order.discount_amount || 0);
    const promoCode = order.promoCode || order.promo_code || '';
    const total = subtotal + deliveryFee - discount;
    
    console.log('🔍 [DEBUG] Email Service - Raw order data:', {
      id: order.id,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      discount: order.discount,
      discount_amount: order.discount_amount,
      promoCode: order.promoCode,
      promo_code: order.promo_code
    });
    const status = order.status || 'pending';
    const paymentMethod = order.paymentMethod || 'Cash on Delivery';
    const createdAt = order.created_at ? new Date(order.created_at) : new Date();
    const formattedDate = createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    
    console.log('🔍 [DEBUG] Email Service - Order data:', {
      id: order.id,
      subtotal,
      deliveryFee,
      discount,
      promoCode,
      total,
      itemsCount: order.items?.length || 0
    });
    
    // Process order items to ensure flavors are properly parsed
    const processedItems = order.items.map((item: any) => {
      let flavors = [];
      
      // Handle flavor_details - it could be JSON string or already an array
      if (item.flavor_details) {
        if (typeof item.flavor_details === 'string') {
          try {
            flavors = JSON.parse(item.flavor_details);
          } catch {
            flavors = [];
          }
        } else if (Array.isArray(item.flavor_details)) {
          flavors = item.flavor_details;
        }
      } else if (item.flavors && Array.isArray(item.flavors)) {
        flavors = item.flavors;
      }
      
      console.log('🔍 [DEBUG] Email Service - Processed item:', {
        name: item.product_name || item.name,
        product_type: item.product_type,
        flavors: flavors,
        flavorsLength: flavors.length
      });
      
      return {
        ...item,
        flavors: flavors
      };
    });

    console.log('🔍 [DEBUG] Email Service - Final processed items:', processedItems.map(item => ({
      name: item.product_name || item.name,
      product_type: item.product_type,
      flavors: item.flavors,
      flavorsLength: item.flavors?.length || 0
    })));

    // Debug delivery information
    console.log('🔍 [DEBUG] Email Service - Delivery information:', {
      delivery_time: order.delivery_time,
      delivery_slot: order.delivery_slot,
      expected_delivery_date: order.expected_delivery_date,
      delivery_address: order.delivery_address,
      delivery_city: order.delivery_city,
      delivery_zone: order.delivery_zone
    });

    const mailOptions = {
      from: `"${settings.from_name}" <${settings.from_email}>`,
      to: email,
      subject: `Your Crumbled Order is Confirmed! - #${order.id}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation - Crumbled</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8f9fa;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa;">
            <tr>
              <td align="center" style="padding: 20px 0;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%); padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🍪 Crumbled 🍪</h1>
                      <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Delicious Cookies Delivered</p>
                    </td>
                  </tr>
                  
                  <!-- Order Confirmation -->
                  <tr>
                    <td style="padding: 30px 20px; text-align: center;">
                      <h2 style="color: #ec4899; margin: 0 0 10px 0; font-size: 24px;">Thank You for Your Order! 🎉</h2>
                      <p style="color: #6b7280; margin: 0 0 20px 0; font-size: 16px;">Your cookies are being prepared with love!</p>
                    </td>
                  </tr>
                  
                  <!-- Order Details -->
                  <tr>
                    <td style="padding: 0 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef7f7; border-radius: 8px; margin-bottom: 20px;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="color: #ec4899; margin: 0 0 15px 0; font-size: 18px;">Order #${order.id}</h3>
                            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Date:</strong> ${formattedDate}</p>
                            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Status:</strong> ${status}</p>
                            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Payment:</strong> ${paymentMethod}</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Order Items -->
                  <tr>
                    <td style="padding: 0 20px;">
                      <h3 style="color: #ec4899; margin: 0 0 15px 0; font-size: 18px;">Order Items</h3>
                      ${processedItems.map((item: any) => `
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 15px;">
                          <tr>
                            <td style="padding: 15px;">
                              <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="vertical-align: top;">
                                    <h4 style="color: #ec4899; margin: 0 0 8px 0; font-size: 16px;">${item.product_name || item.name}</h4>
                                    ${item.product_type === 'pack' && item.flavors && item.flavors.length > 0 ? `
                                      <p style="color: #6b7280; margin: 5px 0; font-size: 13px;"><strong>Flavors:</strong></p>
                                      ${item.flavors.map((f: any) =>
                                        Number(f.price) > 0
                                          ? `<p style=\"color: #6b7280; margin: 2px 0; font-size: 13px; padding-left: 15px;\">• ${f.name || f.flavor_name} (${f.size || f.size_name || ''}) x${f.quantity} (+${Number(f.price).toFixed(2)} EGP)</p>`
                                          : `<p style=\"color: #6b7280; margin: 2px 0; font-size: 13px; padding-left: 15px;\">• ${f.name || f.flavor_name} (${f.size || f.size_name || ''}) x${f.quantity}</p>`
                                      ).join('')}
                                    ` : ''}
                                    <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Quantity:</strong> ${item.quantity}</p>
                                  </td>
                                  <td style="vertical-align: top; text-align: right;">
                                    <p style="color: #ec4899; margin: 0; font-size: 16px; font-weight: bold;">${Number(item.unit_price || item.price || 0).toFixed(2)} EGP</p>
                                    ${item.product_type === 'pack' && item.flavors && item.flavors.length > 0 ? `
                                      <p style="color: #6b7280; margin: 2px 0; font-size: 12px;">Base: ${Number(item.unit_price || item.price || 0).toFixed(2)} EGP</p>
                                      <p style="color: #6b7280; margin: 2px 0; font-size: 12px;">Addons: ${item.flavors.reduce((sum: number, f: any) => sum + (Number(f.price) * Number(f.quantity)), 0).toFixed(2)} EGP</p>
                                    ` : ''}
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      `).join('')}
                    </td>
                  </tr>
                  
                  <!-- Order Summary -->
                  <tr>
                    <td style="padding: 0 20px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef7f7; border-radius: 8px; margin-bottom: 20px;">
                        <tr>
                          <td style="padding: 20px;">
                            <h3 style="color: #ec4899; margin: 0 0 15px 0; font-size: 18px;">Order Summary</h3>
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Subtotal:</td>
                                <td style="padding: 5px 0; color: #6b7280; font-size: 14px; text-align: right;">${subtotal.toFixed(2)} EGP</td>
                              </tr>
                              <tr>
                                <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Delivery Fee:</td>
                                <td style="padding: 5px 0; color: #6b7280; font-size: 14px; text-align: right;">${deliveryFee.toFixed(2)} EGP</td>
                              </tr>
                              ${promoCode ? `
                                <tr>
                                  <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Promo Code:</td>
                                  <td style="padding: 5px 0; color: #6b7280; font-size: 14px; text-align: right;">${promoCode}</td>
                                </tr>
                              ` : ''}
                              ${discount > 0 ? `
                                <tr>
                                  <td style="padding: 5px 0; color: #059669; font-size: 14px;">Discount:</td>
                                  <td style="padding: 5px 0; color: #059669; font-size: 14px; text-align: right;">-${discount.toFixed(2)} EGP</td>
                                </tr>
                              ` : ''}
                              <tr style="border-top: 1px solid #e5e7eb;">
                                <td style="padding: 10px 0 5px 0; color: #ec4899; font-size: 16px; font-weight: bold;">Total:</td>
                                <td style="padding: 10px 0 5px 0; color: #ec4899; font-size: 16px; font-weight: bold; text-align: right;">${total.toFixed(2)} EGP</td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Delivery Information -->
                  <tr>
                    <td style="padding: 0 20px;">
                      <h3 style="color: #ec4899; margin: 0 0 15px 0; font-size: 18px;">Delivery Information</h3>
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef7f7; border-radius: 8px; margin-bottom: 20px;">
                        <tr>
                          <td style="padding: 20px;">
                            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Name:</strong> ${order.customerInfo?.name || order.customer_name || ''}</p>
                            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Address:</strong> ${order.delivery_address || ''}</p>
                            ${order.additional_info ? `<p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Additional Info:</strong> ${order.additional_info}</p>` : ''}
                            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Location:</strong> ${order.delivery_city || ''}, ${order.delivery_zone || ''}</p>
                            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> ${order.customerInfo?.phone || order.customer_phone || ''}</p>
                            <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${order.customerInfo?.email || order.customer_email || ''}</p>
                            ${order.delivery_time ? `<p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Delivery Date:</strong> ${order.delivery_time}</p>` : ''}
                            ${order.delivery_slot ? `<p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Delivery Time Slot:</strong> ${order.delivery_slot}</p>` : ''}
                            ${order.expected_delivery_date ? `<p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Expected Delivery:</strong> ${order.expected_delivery_date}</p>` : ''}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px; text-align: center; background-color: #fef7f7; border-radius: 0 0 10px 10px;">
                      <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Thank you for choosing Crumbled!</p>
                      <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">For support, contact us at <a href="mailto:support@crumbled-eg.com" style="color: #ec4899;">support@crumbled-eg.com</a></p>
                      <p style="color: #ec4899; margin: 10px 0 0 0; font-size: 14px; font-weight: bold;">Crumbled Cookies © ${new Date().getFullYear()}</p>
                      <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  }

  static async sendOrderStatusUpdate(email: string, order: any) {
    try {
      const transporter = await this.createTransporter();
      const settings = await this.getEmailSettings();
      
      if (!settings) {
        throw new Error('Email settings not configured');
      }

      const statusMessages: { [key: string]: { message: string; color: string } } = {
        'pending': { message: 'Your order has been received and is being processed.', color: '#f59e0b' },
        'confirmed': { message: 'Your order has been confirmed and is being prepared.', color: '#3b82f6' },
        'preparing': { message: 'Your order is being prepared in our kitchen.', color: '#8b5cf6' },
        'ready': { message: 'Your order is ready for delivery!', color: '#10b981' },
        'out_for_delivery': { message: 'Your order is out for delivery!', color: '#06b6d4' },
        'delivered': { message: 'Your order has been delivered!', color: '#059669' },
        'cancelled': { message: 'Your order has been cancelled.', color: '#ef4444' }
      };

      const statusInfo = statusMessages[order.status?.toLowerCase()] || 
        { message: `Your order status has been updated to: ${order.status}`, color: '#6b7280' };

      const mailOptions = {
        from: `"${settings.from_name}" <${settings.from_email}>`,
        to: email,
        subject: `Order #${order.id} Status Update - Crumbled`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Status Update</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #fef7f7;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef7f7;">
              <tr>
                <td align="center" style="padding: 20px 0;">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #ec4899, #be185d); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Crumbled</h1>
                        <p style="color: white; margin: 5px 0 0 0; font-size: 16px;">Order Status Update</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 30px;">
                        <h2 style="color: #ec4899; margin: 0 0 20px 0; font-size: 24px;">Hello ${order.customer_name || 'Valued Customer'}!</h2>
                        
                        <div style="background-color: ${statusInfo.color}15; border-left: 4px solid ${statusInfo.color}; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                          <h3 style="color: ${statusInfo.color}; margin: 0 0 10px 0; font-size: 20px;">${order.status?.toUpperCase()}</h3>
                          <p style="color: #6b7280; margin: 0; font-size: 16px; line-height: 1.5;">${statusInfo.message}</p>
                        </div>
                        
                        <div style="background-color: #fef7f7; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                          <h3 style="color: #ec4899; margin: 0 0 15px 0; font-size: 18px;">Order Details</h3>
                          <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Order ID:</strong> #${order.id}</p>
                          <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Status:</strong> <span style="color: ${statusInfo.color}; font-weight: bold;">${order.status?.toUpperCase()}</span></p>
                          <p style="color: #6b7280; margin: 5px 0; font-size: 14px;"><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/orders/${order.id}" 
                             style="background: linear-gradient(135deg, #ec4899, #be185d); color: white; padding: 15px 30px; 
                                    text-decoration: none; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 16px;">
                            View Order Details
                          </a>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 20px; text-align: center; background-color: #fef7f7; border-radius: 0 0 10px 10px;">
                        <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Thank you for choosing Crumbled!</p>
                        <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">For support, contact us at <a href="mailto:support@crumbled-eg.com" style="color: #ec4899;">support@crumbled-eg.com</a></p>
                        <p style="color: #ec4899; margin: 10px 0 0 0; font-size: 14px; font-weight: bold;">Crumbled Cookies © ${new Date().getFullYear()}</p>
                        <p style="color: #9ca3af; margin: 10px 0 0 0; font-size: 12px;">This is an automated message, please do not reply to this email.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Order status update email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
  } catch (error) {
      console.error('❌ Failed to send order status update email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
    }
  }
} 

// Export a default instance
export const emailService = EmailService;