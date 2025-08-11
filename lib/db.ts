import mysql from 'mysql2/promise';

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Goodmorning@1',
  database: process.env.DB_NAME || 'crumbled_nextDB',
  waitForConnections: true,
  connectionLimit: 25, // Increased for better concurrent user support
  queueLimit: 30, // Increased queue for traffic spikes
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 seconds
  idleTimeout: 60000, // 60 seconds - good balance
  maxIdle: 12 // Increased for better connection reuse
});

// Add connection pool event listeners for monitoring
pool.on('connection', (connection) => {
  console.log('🔗 [DB] New connection established');
});

pool.on('acquire', (connection) => {
  console.log('🔗 [DB] Connection acquired from pool');
});

pool.on('release', (connection) => {
  console.log('🔗 [DB] Connection released back to pool');
});

pool.on('enqueue', () => {
  console.log('⚠️ [DB] Waiting for available connection slot');
});

// Test connection function
export async function testConnection() {
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query('SELECT NOW() as `current_time`, VERSION() as mysql_version');
    return {
      success: true,
      message: "Database connected successfully",
      timestamp: result[0].current_time,
      version: result[0].mysql_version,
    };
  } catch (error) {
    console.error("Database connection failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown connection error",
    };
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function saveOrder(orderData: any) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Check if orders table exists
    const [tableCheck] = await connection.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'crumbled_nextDB' AND table_name = 'orders'"
    );

    if (tableCheck[0].count === 0) {
      return { success: false, error: "Orders table does not exist. Please set up the database first." }
    }

    // Generate tracking ID if not provided
    if (!orderData.trackingId) {
      orderData.trackingId = `CC${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    }

    // Start transaction by inserting order first
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        customer_name, 
        customer_email, 
        customer_phone, 
        address, 
        city, 
        state, 
        zip_code, 
        total_amount,
        tracking_id,
        order_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        orderData.customerName, 
        orderData.customerEmail, 
        orderData.customerPhone, 
        orderData.address, 
        orderData.city, 
        orderData.state, 
        orderData.zipCode, 
        orderData.totalAmount,
        orderData.trackingId || `CC${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      ]
    );

    const orderId = orderResult.insertId;

    // Process each item and update stock
    for (const item of orderData.items) {
      // Insert order item
      await connection.query(
        `INSERT INTO order_items (
          order_id, 
          product_id, 
          product_name, 
          quantity, 
          price, 
          is_bundle, 
          bundle_size, 
          bundle_items
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId, 
          item.id, 
          item.name, 
          item.quantity, 
          item.price, 
          !!item.isBundle, 
          item.bundleSize || null, 
          item.bundleItems ? JSON.stringify(item.bundleItems) : null
        ]
      );

      // Update stock for individual items
      if (!item.isBundle) {
        // For regular items, reduce stock directly
        const [stockUpdate] = await connection.query(
          `UPDATE stock 
           SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
           WHERE product_id = ?
           RETURNING quantity`,
          [item.quantity, item.id]
        );

        // Check if stock went negative (optional warning)
        if (stockUpdate.length > 0 && stockUpdate[0].quantity < 0) {
          console.warn(
            `Warning: Stock for product ${item.name} (ID: ${item.id}) went negative: ${stockUpdate[0].quantity}`,
          )
        }
      } else {
        // For bundles, reduce stock for each bundled item
        if (item.bundleItems && Array.isArray(item.bundleItems)) {
          for (const bundleItem of item.bundleItems) {
            const [stockUpdate] = await connection.query(
              `UPDATE stock 
               SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP
               WHERE product_id = ?
               RETURNING quantity, product_name`,
              [item.quantity, bundleItem.id]
            );

            if (stockUpdate.length > 0 && stockUpdate[0].quantity < 0) {
              console.warn(
                `Warning: Stock for bundled product ${stockUpdate[0].product_name} (ID: ${bundleItem.id}) went negative: ${stockUpdate[0].quantity}`,
              )
            }
          }
        }
      }
    }

    return { success: true, orderId, trackingId: orderData.trackingId }
  } catch (error) {
    console.error("Error saving order:", error)
    return { success: false, error: error instanceof Error ? error.message : "Database operation failed" }
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function getOrders() {
  let connection;
  try {
    connection = await pool.getConnection();

    // Check if orders table exists
    const [tableCheck] = await connection.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'crumbled_nextDB' AND table_name = 'orders'"
    );

    if (tableCheck[0].count === 0) {
      return { success: false, error: "Orders table does not exist. Please set up the database first." }
    }

    const [orders] = await connection.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
    return { success: true, orders }
  } catch (error) {
    console.error("Error fetching orders:", error)
    return { success: false, error: error instanceof Error ? error.message : "Database connection failed" }
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function getOrderDetails(orderId: number) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [order] = await connection.query(
      "SELECT * FROM orders WHERE id = ?",
      [orderId]
    );

    if (order.length === 0) {
      return { success: false, error: "Order not found" }
    }

    const [items] = await connection.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [orderId]
    );

    return { success: true, order: order[0], items }
  } catch (error) {
    console.error("Error fetching order details:", error)
    return { success: false, error: error instanceof Error ? error.message : "Database operation failed" }
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function getOrderByTracking(trackingId: string, email: string) {
  let connection;
  try {
    connection = await pool.getConnection();

    // Use order id as tracking number and join with customers table to get email
    const [order] = await connection.query(
      `SELECT o.*, c.email as customer_email 
       FROM orders o 
       JOIN customers c ON o.customer_id = c.id 
       WHERE o.id = ? AND c.email = ?`,
      [trackingId, email]
    );

    if (order.length === 0) {
      return { success: false, error: "Order not found or email doesn't match" }
    }

    const [items] = await connection.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [order[0].id]
    );

    // Convert numeric fields to numbers for frontend compatibility
    const processedOrder = {
      ...order[0],
      total: parseFloat(order[0].total_amount || 0),
      delivery_fee: parseFloat(order[0].delivery_fee || 0),
      subtotal: parseFloat(order[0].subtotal || 0)
    };

    // Process items to convert price to number
    const processedItems = items.map((item: any) => ({
      ...item,
      price: parseFloat(item.price || 0)
    }));

    return { success: true, order: processedOrder, items: processedItems }
  } catch (error) {
    console.error("Error fetching order by tracking:", error)
    return { success: false, error: error instanceof Error ? error.message : "Database operation failed" }
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function updateOrderStatus(orderId: number, status: string) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.query(
      "UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, orderId]
    );
    return { success: true, message: "Order status updated successfully" }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { success: false, error: error instanceof Error ? error.message : "Database operation failed" }
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Export the pool as default
export default pool;
