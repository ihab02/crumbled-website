import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT || '587'),
  secure: SMTP_PORT === '465',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendOrderConfirmationEmail(
  email: string,
  orderId: number,
  orderDetails: any
): Promise<void> {
  const subject = `Order Confirmation - #${orderId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Order Confirmed!</h1>
      <p>Thank you for your order. Your order number is #${orderId}</p>
      
      <h2 style="color: #4F46E5; margin-top: 24px;">Order Details</h2>
      <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px;">
        <p><strong>Order Status:</strong> ${orderDetails.status}</p>
        <p><strong>Order Date:</strong> ${new Date(orderDetails.created_at).toLocaleDateString()}</p>
        <p><strong>Total Amount:</strong> EGP ${orderDetails.total_amount.toFixed(2)}</p>
      </div>

      <h2 style="color: #4F46E5; margin-top: 24px;">Delivery Information</h2>
      <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px;">
        <p><strong>Address:</strong> ${orderDetails.delivery_address}</p>
        <p><strong>City:</strong> ${orderDetails.city_name}</p>
        <p><strong>Zone:</strong> ${orderDetails.zone_name}</p>
      </div>

      <h2 style="color: #4F46E5; margin-top: 24px;">Order Items</h2>
      <div style="background-color: #F9FAFB; padding: 16px; border-radius: 8px;">
        ${orderDetails.items
          .map(
            (item: any) => `
          <div style="margin-bottom: 12px;">
            <p><strong>${item.product_name}</strong></p>
            ${item.flavor_name ? `<p>Flavor: ${item.flavor_name}</p>` : ''}
            <p>Quantity: ${item.quantity}</p>
            <p>Price: EGP ${(item.price * item.quantity).toFixed(2)}</p>
          </div>
        `
          )
          .join('')}
      </div>

      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
        <p><strong>Subtotal:</strong> EGP ${(
          orderDetails.total_amount - orderDetails.delivery_fee
        ).toFixed(2)}</p>
        <p><strong>Delivery Fee:</strong> EGP ${orderDetails.delivery_fee.toFixed(2)}</p>
        <p style="font-size: 18px; font-weight: bold;">
          <strong>Total:</strong> EGP ${orderDetails.total_amount.toFixed(2)}
        </p>
      </div>

      <div style="margin-top: 32px; text-align: center;">
        <a
          href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}"
          style="
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
          "
        >
          Track Your Order
        </a>
      </div>
    </div>
  `;

  await sendEmail({ to: email, subject, html });
}

export async function sendOrderStatusUpdateEmail(
  email: string,
  orderId: number,
  status: string
): Promise<void> {
  const subject = `Order Status Update - #${orderId}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Order Status Update</h1>
      <p>Your order #${orderId} status has been updated to: <strong>${status}</strong></p>
      
      <div style="margin-top: 32px; text-align: center;">
        <a
          href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}"
          style="
            background-color: #4F46E5;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            display: inline-block;
          "
        >
          Track Your Order
        </a>
      </div>
    </div>
  `;

  await sendEmail({ to: email, subject, html });
}

async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error('Email configuration is missing');
  }

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
} 