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

    const settings = await databaseService.query<EmailSettings[]>(
      'SELECT * FROM email_settings WHERE is_active = true ORDER BY id DESC LIMIT 1'
    );

    if (!Array.isArray(settings) || settings.length === 0) {
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
    const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/logo-with-background.jpg`;
    
    await this.sendEmail({
      to,
      subject: `Order Confirmation - Order #${orderId}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #fdf2f8;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white; 
              border-radius: 12px; 
              overflow: hidden; 
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); 
              padding: 30px; 
              text-align: center; 
              color: white;
            }
            .logo { 
              max-width: 200px; 
              height: auto; 
              margin-bottom: 20px;
            }
            .content { 
              padding: 40px 30px; 
            }
            .order-number { 
              background: #fdf2f8; 
              padding: 20px; 
              border-radius: 8px; 
              text-align: center; 
              margin-bottom: 30px;
              border-left: 4px solid #ec4899;
            }
            .order-number h2 { 
              margin: 0; 
              color: #ec4899; 
              font-size: 24px;
            }
            .order-number p { 
              margin: 5px 0 0 0; 
              color: #666; 
              font-size: 14px;
            }
            .section { 
              margin-bottom: 30px; 
            }
            .section h3 { 
              color: #ec4899; 
              border-bottom: 2px solid #fdf2f8; 
              padding-bottom: 10px; 
              margin-bottom: 20px;
            }
            .item { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              padding: 15px 0; 
              border-bottom: 1px solid #f3f4f6;
            }
            .item:last-child { 
              border-bottom: none; 
            }
            .item-details { 
              flex: 1; 
            }
            .item-name { 
              font-weight: 600; 
              color: #1f2937; 
              margin-bottom: 5px;
            }
            .item-description { 
              color: #6b7280; 
              font-size: 14px; 
              margin-bottom: 5px;
            }
            .item-price { 
              font-weight: 600; 
              color: #ec4899; 
              text-align: right;
            }
            .totals { 
              background: #fdf2f8; 
              padding: 20px; 
              border-radius: 8px; 
              margin-top: 20px;
            }
            .total-row { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 10px; 
            }
            .total-row:last-child { 
              margin-bottom: 0; 
              padding-top: 10px; 
              border-top: 1px solid #e5e7eb; 
              font-weight: 600; 
              font-size: 18px; 
              color: #ec4899;
            }
            .delivery-info { 
              background: #f0f9ff; 
              padding: 20px; 
              border-radius: 8px; 
              border-left: 4px solid #0ea5e9;
            }
            .delivery-info h4 { 
              margin: 0 0 10px 0; 
              color: #0ea5e9; 
            }
            .delivery-info p { 
              margin: 5px 0; 
              color: #374151;
            }
            .footer { 
              background: #f9fafb; 
              padding: 30px; 
              text-align: center; 
              color: #6b7280;
            }
            .footer a { 
              color: #ec4899; 
              text-decoration: none;
            }
            .status-badge { 
              display: inline-block; 
              padding: 4px 12px; 
              border-radius: 20px; 
              font-size: 12px; 
              font-weight: 600; 
              text-transform: uppercase;
            }
            .status-confirmed { 
              background: #dcfce7; 
              color: #166534;
            }
            .status-pending { 
              background: #fef3c7; 
              color: #92400e;
            }
            .payment-method { 
              display: inline-block; 
              padding: 4px 12px; 
              border-radius: 20px; 
              font-size: 12px; 
              font-weight: 600; 
              text-transform: uppercase;
            }
            .payment-cod { 
              background: #fef3c7; 
              color: #92400e;
            }
            .payment-paymob { 
              background: #dcfce7; 
              color: #166534;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="${logoUrl}" alt="Crumbled Logo" class="logo">
              <h1 style="margin: 0; font-size: 28px;">Thank You for Your Order!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your order has been received and is being processed</p>
            </div>
            
            <div class="content">
              <div class="order-number">
                <h2>Order #${orderId}</h2>
                <p>Placed on ${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
                <span class="status-badge status-${orderDetails.status === 'confirmed' ? 'confirmed' : 'pending'}">
                  ${orderDetails.status}
                </span>
                <span class="payment-method payment-${orderDetails.paymentMethod === 'cod' ? 'cod' : 'paymob'}">
                  ${orderDetails.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>

              <div class="section">
                <h3>Order Items</h3>
                ${orderDetails.items.map((item: any) => `
                  <div class="item">
                    <div class="item-details">
                      <div class="item-name">${item.name}</div>
                      ${item.flavorDetails ? `<div class="item-description">${item.flavorDetails}</div>` : ''}
                      <div class="item-description">Quantity: ${item.quantity}</div>
                    </div>
                    <div class="item-price">${Number(item.total).toFixed(2)} EGP</div>
                  </div>
                `).join('')}
              </div>

              <div class="totals">
                <div class="total-row">
                  <span>Subtotal:</span>
                  <span>${Number(orderDetails.subtotal).toFixed(2)} EGP</span>
                </div>
                <div class="total-row">
                  <span>Delivery Fee:</span>
                  <span>${Number(orderDetails.deliveryFee).toFixed(2)} EGP</span>
                </div>
                <div class="total-row">
                  <span>Total:</span>
                  <span>${Number(orderDetails.total).toFixed(2)} EGP</span>
                </div>
              </div>

              <div class="section">
                <h3>Delivery Information</h3>
                <div class="delivery-info">
                  <h4>${orderDetails.customerInfo.name}</h4>
                  <p><strong>Address:</strong> ${orderDetails.deliveryAddress.street_address}</p>
                  ${orderDetails.deliveryAddress.additional_info ? `<p><strong>Additional Info:</strong> ${orderDetails.deliveryAddress.additional_info}</p>` : ''}
                  <p><strong>Location:</strong> ${orderDetails.deliveryAddress.city_name}, ${orderDetails.deliveryAddress.zone_name}</p>
                  <p><strong>Phone:</strong> ${orderDetails.customerInfo.phone}</p>
                  <p><strong>Email:</strong> ${orderDetails.customerInfo.email}</p>
                  <p><strong>Delivery Fee:</strong> ${Number(orderDetails.deliveryFee).toFixed(2)} EGP</p>
                  ${orderDetails.deliveryRules ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                      <h5 style="margin: 0 0 10px 0; color: #0ea5e9;">Delivery Details</h5>
                      <p><strong>Delivery Time:</strong> ${orderDetails.deliveryRules.formattedDeliveryDate ? 
                        `Expected delivery on ${orderDetails.deliveryRules.formattedDeliveryDate}` : 
                        orderDetails.deliveryRules.deliveryDays === 0 ? 'Same day' :
                        orderDetails.deliveryRules.deliveryDays === 1 ? 'Next day' :
                        `${orderDetails.deliveryRules.deliveryDays} days`}</p>
                      ${orderDetails.deliveryRules.timeSlot ? `
                        <p><strong>Time Slot:</strong> ${orderDetails.deliveryRules.timeSlot.name} (${orderDetails.deliveryRules.timeSlot.fromHour} - ${orderDetails.deliveryRules.timeSlot.toHour})</p>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              </div>

              ${orderDetails.paymentMethod === 'cod' ? `
                <div class="section">
                  <h3>Payment Information</h3>
                  <p>You have chosen <strong>Cash on Delivery</strong> as your payment method. Please have the exact amount ready when your order arrives.</p>
                  <p><strong>Total Amount Due:</strong> ${Number(orderDetails.total).toFixed(2)} EGP</p>
                </div>
              ` : `
                <div class="section">
                  <h3>Payment Information</h3>
                  <p>Your payment has been processed successfully through our secure payment gateway.</p>
                  <p><strong>Payment Status:</strong> <span class="status-badge status-confirmed">Paid</span></p>
                </div>
              `}

              <div class="section">
                <h3>Need to Cancel?</h3>
                <p>If you need to cancel your order, please click the button below. Orders can only be cancelled within 30 minutes of placement.</p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/orders/${orderId}/cancel?email=${encodeURIComponent(orderDetails.customerInfo.email)}" 
                     style="
                       display: inline-block;
                       padding: 12px 24px;
                       background: #ef4444;
                       color: white;
                       text-decoration: none;
                       border-radius: 8px;
                       font-weight: 600;
                       font-size: 14px;
                       box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                       transition: all 0.3s ease;
                     "
                     onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)'"
                     onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)'">
                    ❌ Cancel Order
                  </a>
                </div>
                <p style="font-size: 12px; color: #6b7280; text-align: center;">
                  <strong>Note:</strong> Cancellation is only available within 30 minutes of order placement.
                </p>
              </div>

              <div class="section">
                <h3>What's Next?</h3>
                <p>We'll notify you when your order is being prepared and when it's out for delivery. You can track your order status by clicking the button below or contacting our customer service.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/track-order?email=${encodeURIComponent(orderDetails.customerInfo.email)}&tracking=${orderId}" 
                     style="
                       display: inline-block;
                       padding: 15px 30px;
                       background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
                       color: white;
                       text-decoration: none;
                       border-radius: 8px;
                       font-weight: 600;
                       font-size: 16px;
                       box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                       transition: all 0.3s ease;
                     "
                     onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 12px rgba(0,0,0,0.15)'"
                     onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'">
                    📦 Track My Order
                  </a>
                </div>
                <p>If you have any questions about your order, please don't hesitate to contact us.</p>
              </div>
            </div>

            <div class="footer">
              <p>Thank you for choosing Crumbled!</p>
              <p>For support, contact us at <a href="mailto:support@crumbled.com">support@crumbled.com</a></p>
              <p style="font-size: 12px; margin-top: 20px;">
                This is an automated message, please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  }
}

export const emailService = EmailService.getInstance(); 