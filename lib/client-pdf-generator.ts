// Local Order interface that matches the page component
interface Order {
  id: number;
  total: number;
  status: string;
  order_status?: string;
  created_at: string;
  payment_method: string;
  guest_otp: string | null;
  otp_verified: boolean;
  customer_id: number | null;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_zone: string | null;
  zone: string | null;
  delivery_fee: number | null;
  subtotal: number | null;
  customer_name: string | null;
  customer_email: string | null;
  delivery_days?: number | null;
  delivery_time_slot_name?: string | null;
  from_hour?: string | null;
  to_hour?: string | null;
  expected_delivery_date?: string | null;
  delivery_man_id?: number | null;
  delivery_man_name?: string | null;
  delivery_man_phone?: string | null;
  items: Array<{
    id: number;
    quantity: number;
    unit_price: number;
    product_name: string;
    product_type: string;
    pack_size?: string;
    flavors?: Array<{
      flavor_name: string;
      size_name: string;
      quantity: number;
      image_url?: string;
    }>;
    flavor_details?: Array<{
      flavor_name?: string;
      name?: string;
      size_name?: string;
      size?: string;
      quantity: number;
      image_url?: string;
    }> | string;
  }>;
  promo_code_id?: number | null;
  promo_code?: string | null;
  discount_amount?: number | null;
  total_after_discount?: number | null;
  total_amount?: number | null;
  customer_note?: string | null;
  admin_note?: string | null;
}

export class ClientPDFGenerator {
  // Logo URL for client-side PDF generation (using absolute URL)
  private static readonly LOGO_URL = 'https://crumbled-eg.com/logo-no-bg.png';



  /**
   * Generate the exact same HTML format as server-side Puppeteer
   * This ensures identical quality across all platforms
   */
  static generateOrderHTML(order: Order): string {
    const orderDate = new Date(order.created_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const deliveryDate = order.expected_delivery_date 
      ? new Date(order.expected_delivery_date).toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : 'Not specified';

    const subtotal = Number(order.subtotal) || 0;
    const deliveryFee = Number(order.delivery_fee) || 0;
    const discount = Number(order.discount_amount) || 0;
    const total = subtotal + deliveryFee - discount;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Order #${order.id} - Crumbled</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.3;
              color: #1f2937;
              background: #fff;
              font-size: 10px;
            }
            
            .container {
              max-width: 100%;
              margin: 0 auto;
              padding: 10px;
            }
            
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #be185d;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            
            .logo-section {
              display: flex;
              align-items: flex-end;
              gap: 15px;
            }
            
            .logo {
              width: 120px;
              height: auto;
            }
            
            .brand-info h1 {
              font-size: 20px;
              font-weight: bold;
              color: #be185d;
              margin-bottom: 2px;
            }
            
            .brand-info p {
              font-size: 9px;
              color: #6b7280;
            }
            
            .order-info {
              text-align: right;
            }
            
            .order-number {
              font-size: 14px;
              color: #374151;
              font-weight: 600;
              margin-bottom: 2px;
            }
            
            .order-date {
              font-size: 9px;
              color: #9ca3af;
            }
            
            .main-content {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 15px;
            }
            
            .section {
              background: #fdf2f8;
              border: 1px solid #fbcfe8;
              border-radius: 6px;
              padding: 10px;
            }
            
            .section-title {
              font-size: 11px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 8px;
              padding-bottom: 3px;
              border-bottom: 1px solid #be185d;
            }
            
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
              border-bottom: 1px solid #fbcfe8;
              font-size: 9px;
            }
            
            .info-label {
              font-weight: 600;
              color: #374151;
            }
            
            .info-value {
              color: #6b7280;
            }
            
            .items-section {
              grid-column: 1 / -1;
              margin-bottom: 15px;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9px;
            }
            
            .items-table th {
              background: #be185d;
              color: white;
              padding: 6px 4px;
              text-align: left;
              font-weight: 600;
              font-size: 8px;
            }
            
            .items-table td {
              padding: 6px 4px;
              border-bottom: 1px solid #fbcfe8;
            }
            
            .items-table tr:nth-child(even) {
              background: #fdf2f8;
            }
            
            .flavor-details {
              font-size: 8px;
              color: #6b7280;
              margin-top: 2px;
              padding-left: 8px;
            }
            
            .flavor-item {
              display: flex;
              align-items: center;
              margin: 1px 0;
            }
            
            .flavor-dot {
              width: 3px;
              height: 3px;
              background: #be185d;
              border-radius: 50%;
              margin-right: 4px;
            }
            
            .price-section {
              grid-column: 1 / -1;
              background: #fdf2f8;
              padding: 12px;
              border-radius: 6px;
              border-left: 3px solid #be185d;
            }
            
            .price-item {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 10px;
            }
            
            .price-total {
              font-size: 14px;
              font-weight: bold;
              color: #be185d;
              border-top: 1px solid #fbcfe8;
              padding-top: 6px;
              margin-top: 6px;
            }
            
            .footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #fbcfe8;
              color: #6b7280;
              font-size: 8px;
            }
            
            .status-ribbon {
              position: absolute;
              top: 0;
              right: 0;
              width: 120px;
              height: 120px;
              overflow: hidden;
              z-index: 10;
            }
            
            .status-ribbon::before {
              content: '';
              position: absolute;
              top: 0;
              right: 0;
              width: 0;
              height: 0;
              border-style: solid;
              border-width: 0 60px 60px 0;
            }
            
            .status-ribbon.delivered::before {
              border-color: transparent #10b981 transparent transparent;
            }
            
            .status-ribbon.cancelled::before {
              border-color: transparent #ef4444 transparent transparent;
            }
            
            .status-ribbon-text {
              position: absolute;
              top: 15px;
              right: -25px;
              transform: rotate(45deg);
              color: white;
              font-size: 10px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            }
            
            .container {
              position: relative;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${((order.status?.toLowerCase().trim() === 'delivered' || order.status?.toLowerCase().trim() === 'cancelled') || (order.order_status?.toLowerCase().trim() === 'delivered' || order.order_status?.toLowerCase().trim() === 'cancelled')) ? `
              <div class="status-ribbon ${(order.status || order.order_status)?.toLowerCase().trim()}">
                <div class="status-ribbon-text">${(order.status || order.order_status)?.toLowerCase().trim()}</div>
              </div>
            ` : `<!-- No ribbon for status: "${order.status}" order_status: "${order.order_status}" -->`}
            <div class="header">
              <div class="logo-section">
                <img src="${ClientPDFGenerator.LOGO_URL}" alt="Crumbled Logo" class="logo">
                <div class="brand-info">
                  <p>Delicious Cookies & Desserts</p>
                </div>
              </div>
              <div class="order-info">
                <div class="order-number">Order #${order.id}</div>
                <div class="order-date">${orderDate}</div>
              </div>
            </div>
            
            <div class="main-content">
              <div class="section">
                <div class="section-title">Order Information</div>
                <div class="info-item">
                  <span class="info-label">Payment:</span>
                  <span class="info-value">${order.payment_method || 'Cash on Delivery'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Delivery Date:</span>
                  <span class="info-value">${deliveryDate}</span>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Customer Information</div>
                <div class="info-item">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${order.customer_name || 'Guest User'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${order.customer_phone || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${order.customer_email || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Address:</span>
                  <span class="info-value">${order.delivery_address || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">City/Zone:</span>
                  <span class="info-value">${order.delivery_city || 'N/A'} - ${order.delivery_zone || 'N/A'}</span>
                </div>
              </div>
              
              ${(order.customer_note || order.admin_note) ? `
                <div class="section">
                  <div class="section-title">Notes</div>
                  ${order.customer_note ? `
                    <div class="info-item">
                      <span class="info-label">Customer Note:</span>
                      <span class="info-value">${order.customer_note}</span>
                    </div>
                  ` : ''}
                  ${order.admin_note ? `
                    <div class="info-item">
                      <span class="info-label">Crumbled Note:</span>
                      <span class="info-value">${order.admin_note}</span>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
            
            <div class="items-section">
              <div class="section-title">Order Items</div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items.map(item => `
                    <tr>
                      <td>
                        <div><strong>${item.product_name}</strong></div>
                        ${(() => {
                          let flavorList = [];
                          
                          // Check for flavors array first
                          if (item.flavors && item.flavors.length > 0) {
                            flavorList = item.flavors;
                          }
                          // Check for flavor_details (could be array or JSON string)
                          else if (item.flavor_details) {
                            if (Array.isArray(item.flavor_details)) {
                              // Already an array
                              flavorList = item.flavor_details;
                            } else if (typeof item.flavor_details === 'string') {
                              // JSON string that needs parsing
                              try {
                                const parsedFlavors = JSON.parse(item.flavor_details);
                                if (Array.isArray(parsedFlavors)) {
                                  flavorList = parsedFlavors;
                                }
                              } catch (e) {
                                console.warn('Failed to parse flavor_details:', e);
                              }
                            }
                          }
                          
                          return flavorList.length > 0 ? `
                            <div class="flavor-details">
                              ${flavorList.map(flavor => `
                                <div class="flavor-item">
                                  <div class="flavor-dot"></div>
                                  ${flavor.flavor_name || flavor.name} (${flavor.quantity}x) - ${flavor.size_name || flavor.size || ''}
                                </div>
                              `).join('')}
                            </div>
                          ` : '';
                        })()}
                      </td>
                      <td>${item.product_type}</td>
                      <td>${item.quantity}</td>
                      <td>EGP ${Number(item.unit_price).toFixed(2)}</td>
                      <td>EGP ${(Number(item.unit_price) * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="price-section">
              <div class="price-item">
                <span>Subtotal:</span>
                <span>EGP ${subtotal.toFixed(2)}</span>
              </div>
              <div class="price-item">
                <span>Delivery Fee:</span>
                <span>EGP ${deliveryFee.toFixed(2)}</span>
              </div>
              ${discount > 0 ? `
                <div class="price-item">
                  <span>Discount ${order.promo_code ? `(${order.promo_code})` : ''}:</span>
                  <span>-EGP ${discount.toFixed(2)}</span>
                </div>
              ` : ''}
              <div class="price-item price-total">
                <span>Total to Collect:</span>
                <span>EGP ${total.toFixed(2)}</span>
              </div>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing Crumbled! | Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate HTML for multiple orders - identical to server-side format
   */
  static generateBulkOrdersHTML(orders: Order[]): string {
    const ordersHTML = orders.map((order, index) => {
      const orderDate = new Date(order.created_at).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const subtotal = Number(order.subtotal) || 0;
      const deliveryFee = Number(order.delivery_fee) || 0;
      const discount = Number(order.discount_amount) || 0;
      const total = subtotal + deliveryFee - discount;

      return `
        <div class="order-section" style="page-break-after: always; position: relative;">
          ${((order.status?.toLowerCase().trim() === 'delivered' || order.status?.toLowerCase().trim() === 'cancelled') || (order.order_status?.toLowerCase().trim() === 'delivered' || order.order_status?.toLowerCase().trim() === 'cancelled')) ? `
            <div class="status-ribbon ${(order.status || order.order_status)?.toLowerCase().trim()}">
              <div class="status-ribbon-text">${(order.status || order.order_status)?.toLowerCase().trim()}</div>
            </div>
          ` : `<!-- No ribbon for status: "${order.status}" order_status: "${order.order_status}" -->`}
          <div class="header">
            <div class="logo-section">
              <img src="${ClientPDFGenerator.LOGO_URL}" alt="Crumbled Logo" class="logo">
              <div class="brand-info">
                <p>Delicious Cookies & Desserts</p>
              </div>
            </div>
            <div class="order-info">
              <div class="order-number">Order #${order.id}</div>
              <div class="order-date">${orderDate}</div>
            </div>
          </div>
          
          <div class="main-content">
            <div class="section">
              <div class="section-title">Order Information</div>
              <div class="info-item">
                <span class="info-label">Payment:</span>
                <span class="info-value">${order.payment_method || 'Cash on Delivery'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Delivery Date:</span>
                <span class="info-value">${order.expected_delivery_date 
                  ? new Date(order.expected_delivery_date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })
                  : 'Not specified'}</span>
              </div>
            </div>
            
            <div class="section">
              <div class="section-title">Customer Information</div>
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span class="info-value">${order.customer_name || 'Guest User'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Phone:</span>
                <span class="info-value">${order.customer_phone || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${order.customer_email || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Address:</span>
                <span class="info-value">${order.delivery_address || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">City/Zone:</span>
                <span class="info-value">${order.delivery_city || 'N/A'} - ${order.delivery_zone || 'N/A'}</span>
              </div>
            </div>
            
            ${(order.customer_note || order.admin_note) ? `
              <div class="section">
                <div class="section-title">Notes</div>
                ${order.customer_note ? `
                  <div class="info-item">
                    <span class="info-label">Customer Note:</span>
                    <span class="info-value">${order.customer_note}</span>
                  </div>
                ` : ''}
                ${order.admin_note ? `
                  <div class="info-item">
                    <span class="info-label">Crumbled Note:</span>
                    <span class="info-value">${order.admin_note}</span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          
          <div class="items-section">
            <div class="section-title">Order Items</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>
                      <div><strong>${item.product_name}</strong></div>
                      ${(() => {
                        let flavorList = [];
                        
                        // Check for flavors array first
                        if (item.flavors && item.flavors.length > 0) {
                          flavorList = item.flavors;
                        }
                        // Check for flavor_details (could be array or JSON string)
                        else if (item.flavor_details) {
                          if (Array.isArray(item.flavor_details)) {
                            // Already an array
                            flavorList = item.flavor_details;
                          } else if (typeof item.flavor_details === 'string') {
                            // JSON string that needs parsing
                            try {
                              const parsedFlavors = JSON.parse(item.flavor_details);
                              if (Array.isArray(parsedFlavors)) {
                                flavorList = parsedFlavors;
                              }
                            } catch (e) {
                              console.warn('Failed to parse flavor_details:', e);
                            }
                          }
                        }
                        
                        return flavorList.length > 0 ? `
                          <div class="flavor-details">
                            ${flavorList.map(flavor => `
                              <div class="flavor-item">
                                <div class="flavor-dot"></div>
                                ${flavor.flavor_name || flavor.name} (${flavor.quantity}x) - ${flavor.size_name || flavor.size || ''}
                              </div>
                            `).join('')}
                          </div>
                        ` : '';
                      })()}
                    </td>
                    <td>${item.product_type}</td>
                    <td>${item.quantity}</td>
                    <td>EGP ${Number(item.unit_price).toFixed(2)}</td>
                    <td>EGP ${(Number(item.unit_price) * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="price-section">
            <div class="price-item">
              <span>Subtotal:</span>
              <span>EGP ${subtotal.toFixed(2)}</span>
            </div>
            <div class="price-item">
              <span>Delivery Fee:</span>
              <span>EGP ${deliveryFee.toFixed(2)}</span>
            </div>
            ${discount > 0 ? `
              <div class="price-item">
                <span>Discount ${order.promo_code ? `(${order.promo_code})` : ''}:</span>
                <span>-EGP ${discount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="price-item price-total">
              <span>Total to Collect:</span>
              <span>EGP ${total.toFixed(2)}</span>
            </div>
          </div>
          
          ${index < orders.length - 1 ? '<div style="page-break-after: always;"></div>' : ''}
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Bulk Orders - Crumbled</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.3;
              color: #1f2937;
              background: #fff;
              font-size: 10px;
            }
            
            .container {
              max-width: 100%;
              margin: 0 auto;
              padding: 10px;
            }
            
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 2px solid #be185d;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            
            .logo-section {
              display: flex;
              align-items: flex-end;
              gap: 15px;
            }
            
            .logo {
              width: 120px;
              height: auto;
            }
            
            .brand-info h1 {
              font-size: 20px;
              font-weight: bold;
              color: #be185d;
              margin-bottom: 2px;
            }
            
            .brand-info p {
              font-size: 9px;
              color: #6b7280;
            }
            
            .order-info {
              text-align: right;
            }
            
            .order-number {
              font-size: 14px;
              color: #374151;
              font-weight: 600;
              margin-bottom: 2px;
            }
            
            .order-date {
              font-size: 9px;
              color: #9ca3af;
            }
            
            .main-content {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 15px;
            }
            
            .section {
              background: #fdf2f8;
              border: 1px solid #fbcfe8;
              border-radius: 6px;
              padding: 10px;
            }
            
            .section-title {
              font-size: 11px;
              font-weight: bold;
              color: #374151;
              margin-bottom: 8px;
              padding-bottom: 3px;
              border-bottom: 1px solid #be185d;
            }
            
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
              border-bottom: 1px solid #fbcfe8;
              font-size: 9px;
            }
            
            .info-label {
              font-weight: 600;
              color: #374151;
            }
            
            .info-value {
              color: #6b7280;
            }
            
            .items-section {
              grid-column: 1 / -1;
              margin-bottom: 15px;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 9px;
            }
            
            .items-table th {
              background: #be185d;
              color: white;
              padding: 6px 4px;
              text-align: left;
              font-weight: 600;
              font-size: 8px;
            }
            
            .items-table td {
              padding: 6px 4px;
              border-bottom: 1px solid #fbcfe8;
            }
            
            .items-table tr:nth-child(even) {
              background: #fdf2f8;
            }
            
            .flavor-details {
              font-size: 8px;
              color: #6b7280;
              margin-top: 2px;
              padding-left: 8px;
            }
            
            .flavor-item {
              display: flex;
              align-items: center;
              margin: 1px 0;
            }
            
            .flavor-dot {
              width: 3px;
              height: 3px;
              background: #be185d;
              border-radius: 50%;
              margin-right: 4px;
            }
            
            .price-section {
              grid-column: 1 / -1;
              background: #fdf2f8;
              padding: 12px;
              border-radius: 6px;
              border-left: 3px solid #be185d;
            }
            
            .price-item {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 10px;
            }
            
            .price-total {
              font-size: 14px;
              font-weight: bold;
              color: #be185d;
              border-top: 1px solid #fbcfe8;
              padding-top: 6px;
              margin-top: 6px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${ordersHTML}
          </div>
        </body>
      </html>
    `;
  }
}
