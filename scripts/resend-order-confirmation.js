// TEST SCRIPT ONLY: Minimal HTML email with just the logo
const Module = require('module');
const path = require('path');
const nodemailer = require('nodemailer');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request === '@/lib/db') {
    return originalRequire.call(this, path.join(__dirname, '../lib/db.js'));
  }
  if (request === '@/lib/email-service') {
    return originalRequire.call(this, path.join(__dirname, '../lib/email-service.js'));
  }
  return originalRequire.call(this, request);
};

let pool = require('../lib/db');
if (pool.default) pool = pool.default;

(async () => {
  try {
    const orderId = 64; // Change this to test a different order
    // Fetch customer email by joining orders and customers
    const [customerRows] = await pool.query('SELECT c.email FROM orders AS o, customers AS c WHERE o.id = ? AND c.id = o.customer_id', [orderId]);
    let customerEmail = '';
    if (customerRows && customerRows.length > 0) customerEmail = customerRows[0].email;
    console.log('Order customer_email:', customerEmail);
    if (!customerEmail) {
      console.error('❌ No customer_email found for this order. Cannot send email.');
      process.exit(1);
    }
    // Fetch SMTP settings from the database
    const [settingsRows] = await pool.query('SELECT * FROM email_settings WHERE is_active = 1 LIMIT 1');
    if (!settingsRows || settingsRows.length === 0) {
      console.error('❌ No email settings found.');
      process.exit(1);
    }
    const settings = settingsRows[0];
    const transporter = nodemailer.createTransport({
      host: settings.smtp_host,
      port: settings.smtp_port,
      secure: settings.use_ssl === 1,
      auth: {
        user: settings.smtp_username,
        pass: settings.smtp_password,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    // Minimal HTML with just the logo
    const logoUrl = 'https://crumbled-eg.com/images/logo-no-background.png';
    const mailOptions = {
      from: `"${settings.from_name}" <${settings.from_email}>`,
      to: customerEmail,
      subject: 'Test: Minimal Logo Email',
      html: `<div style="text-align:center; padding:40px; background:#fff;">
        <img src="${logoUrl}" alt="Crumbled Logo" width="180" height="auto" style="display:block; margin:auto; border-radius:12px;" />
        <p style="color:#d72660; font-size:1.2rem; margin-top:24px;">If you see the logo above, image loading works!</p>
      </div>`
    };
    await transporter.sendMail(mailOptions);
    console.log('✅ Minimal logo test email sent to', customerEmail);
    process.exit(0);
  } catch (err) {
    console.error('Error sending minimal logo test email:', err);
    process.exit(1);
  }
})();
