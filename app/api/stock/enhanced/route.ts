import { type NextRequest, NextResponse } from "next/server"
import { databaseService } from '@/lib/services/databaseService'

export async function GET() {
  try {
    // Check if enhanced_stock table exists
    const tableCheck = await databaseService.query(`
      SELECT COUNT(*) as count
      FROM information_schema.tables 
      WHERE table_schema = 'crumbled_nextDB' 
      AND table_name = 'enhanced_stock'
    `)

    if (tableCheck[0].count === 0) {
      return NextResponse.json({
        success: false,
        error: "Enhanced stock table does not exist. Please run database setup first.",
        fallback: true,
        stockInventory: [],
      })
    }

    // Get enhanced stock data with proper type casting
    const stockData = await databaseService.query(`
      SELECT 
        es.id,
        es.flavor_id,
        f.name as flavor_name,
        f.slug as flavor_slug,
        f.price,
        f.description,
        f.image_url,
        f.category,
        es.size_type,
        es.quantity,
        es.min_threshold,
        es.max_capacity,
        CASE 
          WHEN es.quantity <= es.min_threshold THEN 'low'
          WHEN es.quantity <= es.min_threshold * 2 THEN 'medium'
          ELSE 'good'
        END as stock_level,
        es.created_at,
        es.updated_at
      FROM enhanced_stock es
      JOIN flavors f ON es.flavor_id = f.id
      ORDER BY f.name, es.size_type
    `)

    // Group by flavor for easier frontend consumption
    const groupedStock = stockData.reduce((acc: any, item: any) => {
      const flavorKey = item.flavor_slug || `flavor-${item.flavor_id}`

      if (!acc[flavorKey]) {
        acc[flavorKey] = {
          id: item.flavor_id,
          name: item.flavor_name,
          slug: item.flavor_slug,
          price: item.price,
          description: item.description,
          image_url: item.image_url,
          category: item.category,
          stock: {},
        }
      }

      acc[flavorKey].stock[item.size_type] = {
        quantity: item.quantity,
        min_threshold: item.min_threshold,
        max_capacity: item.max_capacity,
        stock_level: item.stock_level,
      }

      return acc
    }, {})

    return NextResponse.json({
      success: true,
      stock: groupedStock,
      stockInventory: stockData,
    })
  } catch (error) {
    console.error("Error fetching enhanced stock:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch enhanced stock",
        stockInventory: [],
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { flavorId, sizeType, quantity } = await request.json()

    if (!flavorId || !sizeType || quantity === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: flavorId, sizeType, and quantity are required",
        },
        { status: 400 },
      )
    }

    // Validate size type
    if (!["mini", "large"].includes(sizeType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid size type. Must be 'mini' or 'large'",
        },
        { status: 400 },
      )
    }

    // Validate quantity
    if (quantity < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Quantity cannot be negative",
        },
        { status: 400 },
      )
    }

    // Get current stock data
    const currentStock = await databaseService.query(`
      SELECT 
        es.id,
        es.quantity,
        es.max_capacity,
        f.name as flavor_name
      FROM enhanced_stock es
      JOIN flavors f ON es.flavor_id = f.id
      WHERE es.flavor_id = ?
      AND es.size_type = ?
    `, [flavorId, sizeType])

    if (currentStock.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Stock entry not found for this flavor and size",
        },
        { status: 404 },
      )
    }

    // Validate against max capacity
    if (quantity > currentStock[0].max_capacity) {
      return NextResponse.json(
        {
          success: false,
          error: `Quantity exceeds maximum capacity of ${currentStock[0].max_capacity}`,
        },
        { status: 400 },
      )
    }

    // Update stock
    await databaseService.query(`
      UPDATE enhanced_stock
      SET 
        quantity = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE flavor_id = ?
      AND size_type = ?
    `, [quantity, flavorId, sizeType])

    // Record stock movement
    await databaseService.query(`
      INSERT INTO stock_movements (
        stock_inventory_id,
        movement_type,
        quantity_change,
        previous_quantity,
        new_quantity,
        reason,
        created_by
      )
      VALUES (?, 'adjustment', ?, ?, ?, 'Manual stock adjustment', 'admin')
    `, [currentStock[0].id, quantity - currentStock[0].quantity, currentStock[0].quantity, quantity])

    return NextResponse.json({
      success: true,
      message: `Stock updated for ${currentStock[0].flavor_name} (${sizeType})`,
      previousQuantity: currentStock[0].quantity,
      newQuantity: quantity,
    })
  } catch (error) {
    console.error("Error updating enhanced stock:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update enhanced stock",
      },
      { status: 500 },
    )
  }
}
