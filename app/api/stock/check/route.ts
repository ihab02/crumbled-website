import { type NextRequest, NextResponse } from "next/server"
import mysql from 'mysql2/promise';
import pool from '@/lib/db';
import { databaseService } from '@/lib/services/databaseService';

export async function POST(request: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();

    const { items } = await request.json()

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid items data",
        },
        { status: 400 },
      )
    }

    const stockIssues = []

    for (const item of items) {
      if (!item.isBundle) {
        // Check stock for regular items
        const [stockCheck] = await connection.query(
          "SELECT quantity, product_name FROM stock WHERE product_id = ?",
          [item.id]
        );

        if (stockCheck.length === 0) {
          stockIssues.push({
            productId: item.id,
            productName: item.name,
            issue: "Product not found in stock",
            available: 0,
            requested: item.quantity,
          })
        } else if (stockCheck[0].quantity < item.quantity) {
          stockIssues.push({
            productId: item.id,
            productName: item.name,
            issue: "Insufficient stock",
            available: stockCheck[0].quantity,
            requested: item.quantity,
          })
        }
      } else {
        // Check stock for bundle items
        if (item.bundleItems && Array.isArray(item.bundleItems)) {
          for (const bundleItem of item.bundleItems) {
            const [stockCheck] = await connection.query(
              "SELECT quantity, product_name FROM stock WHERE product_id = ?",
              [bundleItem.id]
            );

            if (stockCheck.length === 0) {
              stockIssues.push({
                productId: bundleItem.id,
                productName: bundleItem.name,
                issue: "Bundle item not found in stock",
                available: 0,
                requested: item.quantity,
                bundleName: item.name,
              })
            } else if (stockCheck[0].quantity < item.quantity) {
              stockIssues.push({
                productId: bundleItem.id,
                productName: bundleItem.name,
                issue: "Insufficient stock for bundle item",
                available: stockCheck[0].quantity,
                requested: item.quantity,
                bundleName: item.name,
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: stockIssues.length === 0,
      stockIssues,
      message: stockIssues.length === 0 ? "All items are in stock" : "Some items have stock issues",
    })
  } catch (error) {
    console.error("Error checking stock:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Failed to check stock: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get all flavors with their stock information
    const [result] = await databaseService.query(
      `SELECT 
        id,
        name,
        description,
        stock_quantity_mini,
        stock_quantity_medium,
        stock_quantity_large,
        allow_out_of_stock_order,
        is_active,
        is_available
      FROM flavors 
      WHERE is_active = true AND is_enabled = true AND deleted_at IS NULL
      ORDER BY name`
    );

    if (!Array.isArray(result)) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch stock data'
      }, { status: 500 });
    }

    // Format the response with stock status
    const stockData = result.map((flavor: any) => {
      const miniStock = flavor.stock_quantity_mini || 0;
      const mediumStock = flavor.stock_quantity_medium || 0;
      const largeStock = flavor.stock_quantity_large || 0;
      
      const getStockStatus = (quantity: number) => {
        if (quantity === 0) return 'out_of_stock';
        if (quantity <= 5) return 'low_stock';
        return 'in_stock';
      };

      return {
        id: flavor.id,
        name: flavor.name,
        description: flavor.description,
        stock: {
          mini: {
            quantity: miniStock,
            status: getStockStatus(miniStock)
          },
          medium: {
            quantity: mediumStock,
            status: getStockStatus(mediumStock)
          },
          large: {
            quantity: largeStock,
            status: getStockStatus(largeStock)
          }
        },
        allow_out_of_stock_order: Boolean(flavor.allow_out_of_stock_order),
        is_active: Boolean(flavor.is_active),
        is_available: Boolean(flavor.is_available),
        total_stock: miniStock + mediumStock + largeStock
      };
    });

    // Calculate summary statistics
    const totalFlavors = stockData.length;
    const availableFlavors = stockData.filter(f => f.is_available).length;
    const outOfStockFlavors = stockData.filter(f => 
      f.stock.mini.quantity === 0 && 
      f.stock.medium.quantity === 0 && 
      f.stock.large.quantity === 0
    ).length;
    const lowStockFlavors = stockData.filter(f => 
      f.stock.mini.status === 'low_stock' || 
      f.stock.medium.status === 'low_stock' || 
      f.stock.large.status === 'low_stock'
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        flavors: stockData,
        summary: {
          total_flavors: totalFlavors,
          available_flavors: availableFlavors,
          out_of_stock_flavors: outOfStockFlavors,
          low_stock_flavors: lowStockFlavors
        }
      }
    });

  } catch (error) {
    console.error('Error checking stock:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to check stock'
    }, { status: 500 });
  }
}
