import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';

export async function GET() {
  try {
    // Test database connection
    const connectionTest = await databaseService.testConnection();
    console.log('Database connection test:', connectionTest);

    // Check if cart tables exist
    const [cartTables] = await databaseService.query<any[]>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'crumbled_nextDB' AND table_name IN ('carts', 'cart_items', 'cart_item_flavors')"
    );
    console.log('Cart tables found:', cartTables);

    // Check cart table structure
    const [cartStructure] = await databaseService.query<any[]>(
      "DESCRIBE carts"
    );
    console.log('Carts table structure:', cartStructure);

    const [cartItemsStructure] = await databaseService.query<any[]>(
      "DESCRIBE cart_items"
    );
    console.log('Cart items table structure:', cartItemsStructure);

    // Check if there are any carts
    const [carts] = await databaseService.query<any[]>(
      "SELECT * FROM carts"
    );
    console.log('All carts:', carts);

    // Check if there are any cart items
    const [cartItems] = await databaseService.query<any[]>(
      "SELECT * FROM cart_items"
    );
    console.log('All cart items:', cartItems);

    // Check if there are any products
    const [products] = await databaseService.query<any[]>(
      "SELECT id, name, is_pack FROM products LIMIT 5"
    );
    console.log('Sample products:', products);

    return NextResponse.json({
      success: true,
      connectionTest,
      cartTables: cartTables.map((t: any) => t.table_name),
      cartStructure,
      cartItemsStructure,
      cartsCount: carts.length,
      cartItemsCount: cartItems.length,
      sampleProducts: products
    });
  } catch (error) {
    console.error('Error testing cart:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 