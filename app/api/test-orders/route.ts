import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    const results: any = {};

    // Check orders table
    try {
      const ordersStructure = await databaseService.query("DESCRIBE orders");
      const ordersCount = await databaseService.query("SELECT COUNT(*) as count FROM orders");
      results.orders = {
        exists: true,
        structure: ordersStructure,
        count: ordersCount[0]?.count || 0
      };
    } catch (error) {
      results.orders = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check order_items table
    try {
      const orderItemsStructure = await databaseService.query("DESCRIBE order_items");
      const orderItemsCount = await databaseService.query("SELECT COUNT(*) as count FROM order_items");
      results.orderItems = {
        exists: true,
        structure: orderItemsStructure,
        count: orderItemsCount[0]?.count || 0
      };
    } catch (error) {
      results.orderItems = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check order_item_flavors table
    try {
      const orderItemFlavorsStructure = await databaseService.query("DESCRIBE order_item_flavors");
      const orderItemFlavorsCount = await databaseService.query("SELECT COUNT(*) as count FROM order_item_flavors");
      results.orderItemFlavors = {
        exists: true,
        structure: orderItemFlavorsStructure,
        count: orderItemFlavorsCount[0]?.count || 0
      };
    } catch (error) {
      results.orderItemFlavors = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check products table
    try {
      const productsStructure = await databaseService.query("DESCRIBE products");
      const productsCount = await databaseService.query("SELECT COUNT(*) as count FROM products");
      results.products = {
        exists: true,
        structure: productsStructure,
        count: productsCount[0]?.count || 0
      };
    } catch (error) {
      results.products = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check product_types table
    try {
      const productTypesStructure = await databaseService.query("DESCRIBE product_types");
      const productTypesCount = await databaseService.query("SELECT COUNT(*) as count FROM product_types");
      results.productTypes = {
        exists: true,
        structure: productTypesStructure,
        count: productTypesCount[0]?.count || 0
      };
    } catch (error) {
      results.productTypes = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Check product_instance table
    try {
      const productInstanceStructure = await databaseService.query("DESCRIBE product_instance");
      const productInstanceCount = await databaseService.query("SELECT COUNT(*) as count FROM product_instance");
      results.productInstance = {
        exists: true,
        structure: productInstanceStructure,
        count: productInstanceCount[0]?.count || 0
      };
    } catch (error) {
      results.productInstance = {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Comprehensive orders test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Comprehensive orders test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 