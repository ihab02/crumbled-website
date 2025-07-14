import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    console.log('Starting soft delete views migration...');

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'add_soft_delete_views.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip DELIMITER statements and empty statements
      if (statement.startsWith('DELIMITER') || statement.trim() === '') {
        continue;
      }

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 100)}...`);
        await databaseService.query(statement);
      } catch (error) {
        // Check if it's a "table already exists" error (safe to ignore)
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`Table/view already exists, skipping: ${statement.substring(0, 50)}...`);
          continue;
        }
        
        // Check if it's a "column already exists" error (safe to ignore)
        if (error instanceof Error && error.message.includes('Duplicate column name')) {
          console.log(`Column already exists, skipping: ${statement.substring(0, 50)}...`);
          continue;
        }

        // Check if it's a "constraint already exists" error (safe to ignore)
        if (error instanceof Error && error.message.includes('Duplicate key name')) {
          console.log(`Constraint already exists, skipping: ${statement.substring(0, 50)}...`);
          continue;
        }

        // Check if it's a "procedure already exists" error (safe to ignore)
        if (error instanceof Error && error.message.includes('procedure already exists')) {
          console.log(`Procedure already exists, skipping: ${statement.substring(0, 50)}...`);
          continue;
        }

        console.error(`Error executing statement ${i + 1}:`, error);
        throw error;
      }
    }

    console.log('Soft delete views migration completed successfully!');

    // Verify the migration by checking if views exist
    const viewsToCheck = [
      'active_products',
      'all_products', 
      'active_flavors',
      'all_flavors',
      'active_product_types',
      'all_product_types',
      'active_product_instances',
      'all_product_instances'
    ];

    const verificationResults = [];
    for (const viewName of viewsToCheck) {
      try {
        await databaseService.query(`SELECT 1 FROM ${viewName} LIMIT 1`);
        verificationResults.push({ view: viewName, status: 'exists' });
      } catch (error) {
        verificationResults.push({ view: viewName, status: 'missing', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    // Check if admin_view_preferences table exists
    try {
      await databaseService.query('SELECT 1 FROM admin_view_preferences LIMIT 1');
      verificationResults.push({ table: 'admin_view_preferences', status: 'exists' });
    } catch (error) {
      verificationResults.push({ table: 'admin_view_preferences', status: 'missing', error: error instanceof Error ? error.message : 'Unknown error' });
    }

    return NextResponse.json({
      success: true,
      message: 'Soft delete views migration completed successfully',
      statementsExecuted: statements.length,
      verification: verificationResults
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 