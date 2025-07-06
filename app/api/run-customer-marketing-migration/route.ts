import { NextResponse } from 'next/server';
import { databaseService } from '@/lib/services/databaseService';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    console.log('Starting customer marketing attributes migration...');

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'add_customer_marketing_attributes.sql');
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
        // Check if it's a "column already exists" error (safe to ignore)
        if (error instanceof Error && error.message.includes('Duplicate column name')) {
          console.log(`Column already exists, skipping: ${statement.substring(0, 50)}...`);
          continue;
        }
        
        // Check if it's a "table already exists" error (safe to ignore)
        if (error instanceof Error && error.message.includes('already exists')) {
          console.log(`Table already exists, skipping: ${statement.substring(0, 50)}...`);
          continue;
        }

        // Check if it's a "trigger already exists" error (safe to ignore)
        if (error instanceof Error && error.message.includes('trigger already exists')) {
          console.log(`Trigger already exists, skipping: ${statement.substring(0, 50)}...`);
          continue;
        }

        console.error(`Error executing statement ${i + 1}:`, error);
        throw error;
      }
    }

    console.log('Customer marketing attributes migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Customer marketing attributes migration completed successfully',
      statementsExecuted: statements.length
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