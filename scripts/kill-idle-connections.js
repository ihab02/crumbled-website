const mysql = require('mysql2/promise');

// Create a temporary connection to manage other connections
const adminConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Goodmorning@1',
  database: 'crumbled_nextDB'
});

async function killIdleConnections() {
  try {
    console.log('🔍 Finding idle connections...\n');

    // Find idle connections (sleeping for more than 30 seconds)
    const [idleConnections] = await adminConnection.execute(`
      SELECT 
        ID,
        USER,
        HOST,
        COMMAND,
        TIME,
        STATE
      FROM information_schema.PROCESSLIST 
      WHERE DB = 'crumbled_nextDB'
        AND COMMAND = 'Sleep'
        AND TIME > 30
        AND USER != 'root'  -- Don't kill root connections
    `);

    console.log(`📊 Found ${idleConnections.length} idle connections to kill:\n`);

    if (idleConnections.length === 0) {
      console.log('✅ No idle connections found to kill.');
      return;
    }

    // Kill each idle connection
    for (const connection of idleConnections) {
      try {
        await adminConnection.execute(`KILL ${connection.ID}`);
        console.log(`✅ Killed connection ID: ${connection.ID} (User: ${connection.USER}, Time: ${connection.TIME}s)`);
      } catch (error) {
        console.log(`❌ Failed to kill connection ID: ${connection.ID} - ${error.message}`);
      }
    }

    console.log(`\n🎯 Successfully killed ${idleConnections.length} idle connections.`);

    // Show remaining connections
    const [remainingConnections] = await adminConnection.execute(`
      SELECT COUNT(*) as total_connections
      FROM information_schema.PROCESSLIST 
      WHERE DB = 'crumbled_nextDB'
    `);

    console.log(`📊 Remaining connections: ${remainingConnections[0].total_connections}`);

  } catch (error) {
    console.error('❌ Error killing idle connections:', error);
  } finally {
    await adminConnection.end();
  }
}

// Run the script
killIdleConnections();
