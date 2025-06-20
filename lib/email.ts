import nodemailer from "nodemailer"

// Create a transporter object
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "crumbledeg@gmail.com",
    pass: "kowa noxh hxmu hvzd",
  },
})

// Email template for order confirmation
export const sendOrderConfirmationEmail = async (
  to: string,
  orderDetails: {
    orderId: number
    trackingId: string
    customerName: string
    totalAmount: number
    items: any[]
  },
) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const trackingUrl = `${baseUrl}/track-order?email=${encodeURIComponent(to)}&tracking=${orderDetails.trackingId}`

  try {
    const result = await transporter.sendMail({
      from: '"Crumbled Cookies" <crumbledeg@gmail.com>',
      to,
      subject: `Order Confirmation #${orderDetails.orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #8B4513;">Thank You for Your Order!</h1>
            <p style="font-size: 16px;">Hi ${orderDetails.customerName},</p>
            <p style="font-size: 16px;">Your order has been received and is being processed.</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #8B4513; margin-top: 0;">Order Summary</h2>
            <p><strong>Order ID:</strong> #${orderDetails.orderId}</p>
            <p><strong>Tracking ID:</strong> ${orderDetails.trackingId}</p>
            <p><strong>Total Amount:</strong> $${orderDetails.totalAmount.toFixed(2)}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #8B4513;">Order Items</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f0f0f0;">
                  <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Item</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Quantity</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderDetails.items
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">${item.quantity}</td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #ddd;">$${typeof item.price === "number" ? item.price.toFixed(2) : item.price}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${trackingUrl}" style="background-color: #8B4513; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Your Order</a>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p>If you have any questions, please contact our customer service.</p>
            <p>Thank you for shopping with Crumbled Cookies!</p>
          </div>
        </div>
      `,
    })

    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to send email" }
  }
}

// Email template for order status updates
export const sendOrderStatusUpdateEmail = async (
  to: string,
  orderDetails: {
    orderId: number
    trackingId: string
    customerName: string
    status: string
  },
) => {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const trackingUrl = `${baseUrl}/track-order?email=${encodeURIComponent(to)}&tracking=${orderDetails.trackingId}`

  let statusMessage = ""
  let statusColor = ""

  switch (orderDetails.status.toLowerCase()) {
    case "processing":
      statusMessage = "Your order is now being processed."
      statusColor = "#FFA500" // Orange
      break
    case "shipped":
      statusMessage = "Your order has been shipped!"
      statusColor = "#4CAF50" // Green
      break
    case "delivered":
      statusMessage = "Your order has been delivered!"
      statusColor = "#2196F3" // Blue
      break
    default:
      statusMessage = `Your order status has been updated to: ${orderDetails.status}`
      statusColor = "#8B4513" // Default brown
  }

  try {
    const result = await transporter.sendMail({
      from: '"Crumbled Cookies" <crumbledeg@gmail.com>',
      to,
      subject: `Order #${orderDetails.orderId} Status Update`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: ${statusColor};">Order Status Update</h1>
            <p style="font-size: 16px;">Hi ${orderDetails.customerName},</p>
            <p style="font-size: 16px;">${statusMessage}</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #8B4513; margin-top: 0;">Order Details</h2>
            <p><strong>Order ID:</strong> #${orderDetails.orderId}</p>
            <p><strong>Tracking ID:</strong> ${orderDetails.trackingId}</p>
            <p><strong>Current Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${orderDetails.status}</span></p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${trackingUrl}" style="background-color: #8B4513; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Track Your Order</a>
          </div>
          
          <div style="margin-top: 30px; text-align: center; color: #666; font-size: 14px;">
            <p>If you have any questions, please contact our customer service.</p>
            <p>Thank you for shopping with Crumbled Cookies!</p>
          </div>
        </div>
      `,
    })

    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Failed to send email" }
  }
}

export default {
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
}
