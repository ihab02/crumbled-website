// TEST SCRIPT ONLY: CommonJS for compatibility with node
const { EmailService } = require('../lib/email-service');
const pool = require('../lib/db');

(async () => {
  try {
    const orderId = 64; // Change this to test a different order
    // Fetch order
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (!orders || orders.length === 0) {
      console.error('Order not found');
      process.exit(1);
    }
    const order = orders[0];
    // Fetch order items
    const [items] = await pool.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
    // For each item, use flavor_details for pack flavors
    for (const item of items) {
      if (item.flavor_details) {
        try {
          item.flavors = JSON.parse(item.flavor_details);
        } catch {
          item.flavors = [];
        }
      }
      // Ensure unit_price is present
      if (typeof item.unit_price === 'undefined') {
        item.unit_price = item.price || 0;
      }
    }
    // Fetch promo code string if present
    let promoCode = '';
    if (order.promo_code_id) {
      const [promoRows] = await pool.query('SELECT code FROM promo_codes WHERE id = ?', [order.promo_code_id]);
      if (promoRows && promoRows.length > 0) promoCode = promoRows[0].code;
    }
    // Build order object for email
    const orderObj = {
      id: order.id,
      items,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      discount: order.discount_amount,
      promo_code: promoCode,
      created_at: order.created_at,
      delivery_address: order.delivery_address,
      delivery_city: order.delivery_city,
      delivery_zone: order.delivery_zone,
      status: order.status,
      paymentMethod: order.payment_method,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      customer_email: order.customer_email,
      additional_info: order.additional_info,
      delivery_time: order.delivery_time,
      delivery_slot: order.delivery_slot
    };
    await EmailService.sendOrderConfirmation(order.customer_email, orderObj);
    console.log('✅ Test order confirmation email sent to', order.customer_email);
    process.exit(0);
  } catch (err) {
    console.error('Error sending test order confirmation email:', err);
    process.exit(1);
  }
})(); 