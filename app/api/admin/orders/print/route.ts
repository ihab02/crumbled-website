import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { PDFGenerator } from '@/lib/pdf-generator';
import { databaseService } from '@/lib/services/databaseService';

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderIds, type } = await request.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ 
        error: 'Order IDs are required' 
      }, { status: 400 });
    }

    // Fetch orders with complete details
    const orders = await Promise.all(
      orderIds.map(async (orderId: number) => {
        const orderResult = await databaseService.query(`
          SELECT 
            o.*,
            c.first_name, c.last_name, c.email as customer_email,
            c.phone as customer_phone
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          WHERE o.id = ?
        `, [orderId]);

        if (!orderResult || !Array.isArray(orderResult) || orderResult.length === 0) {
          throw new Error(`Order ${orderId} not found`);
        }

        const order = orderResult[0];

        // Fetch order items with flavors
        const itemsResult = await databaseService.query(`
          SELECT 
            oi.*
          FROM order_items oi
          WHERE oi.order_id = ?
        `, [orderId]);

        const items = Array.isArray(itemsResult) ? itemsResult : [itemsResult];

        // Parse flavor details for each item
        for (const item of items) {
          if (item.flavor_details) {
            try {
              item.flavors = JSON.parse(item.flavor_details);
            } catch {
              item.flavors = [];
            }
          } else {
            item.flavors = [];
          }
        }

        return {
          ...order,
          items,
          customer_name: `${order.first_name || ''} ${order.last_name || ''}`.trim() || 'Guest User'
        };
      })
    );

    let pdfBuffer: Buffer;

    if (type === 'bulk' && orders.length > 1) {
      // Generate bulk PDF
      pdfBuffer = await PDFGenerator.generateBulkOrdersPDF(orders);
    } else {
      // Generate single order PDF
      pdfBuffer = await PDFGenerator.generateOrderPDF(orders[0]);
    }

    // Set response headers for PDF download
    const filename = type === 'bulk' 
      ? `orders-${orderIds.join('-')}-${new Date().toISOString().split('T')[0]}.pdf`
      : `order-${orderIds[0]}-${new Date().toISOString().split('T')[0]}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ 
      error: 'Failed to generate PDF' 
    }, { status: 500 });
  }
}
