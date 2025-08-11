const mysql = require('mysql2/promise');

// Create a temporary connection to monitor
const monitorConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Goodmorning@1',
  database: 'crumbled_nextDB'
});

async function monitorConnections() {
  try {
    console.log('🔍 Monitoring database connections...\n');

    // Get current connection count
    const [connections] = await monitorConnection.execute(`
      SELECT 
        COUNT(*) as total_connections,
        COUNT(CASE WHEN Command = 'Sleep' THEN 1 END) as sleeping_connections,
        COUNT(CASE WHEN Command != 'Sleep' THEN 1 END) as active_connections,
        COUNT(CASE WHEN Time > 60 THEN 1 END) as long_running_connections
      FROM information_schema.PROCESSLIST 
      WHERE DB = 'crumbled_nextDB'
    `);

    console.log('📊 Connection Statistics:');
    console.log(`   Total Connections: ${connections[0].total_connections}`);
    console.log(`   Active Connections: ${connections[0].active_connections}`);
    console.log(`   Sleeping Connections: ${connections[0].sleeping_connections}`);
    console.log(`   Long Running (>60s): ${connections[0].long_running_connections}\n`);

    // Get detailed connection list
    const [processList] = await monitorConnection.execute(`
      SELECT 
        ID,
        USER,
        HOST,
        DB,
        COMMAND,
        TIME,
        STATE,
        INFO
      FROM information_schema.PROCESSLIST 
      WHERE DB = 'crumbled_nextDB'
      ORDER BY TIME DESC
    `);

    console.log('🔗 Active Connections:');
    processList.forEach(process => {
      console.log(`   ID: ${process.ID} | User: ${process.USER} | Command: ${process.COMMAND} | Time: ${process.TIME}s | State: ${process.STATE || 'N/A'}`);
      if (process.INFO) {
        console.log(`      Query: ${process.INFO.substring(0, 100)}${process.INFO.length > 100 ? '...' : ''}`);
      }
    });

    // Get MySQL variables
    const [variables] = await monitorConnection.execute(`
      SHOW VARIABLES LIKE 'max_connections'
    `);

    console.log(`\n⚙️ MySQL Configuration:`);
    console.log(`   Max Connections: ${variables[0].Value}`);

    // Check for connection issues
    if (connections[0].total_connections > 80) {
      console.log('\n⚠️ WARNING: High connection count detected!');
    }

    if (connections[0].long_running_connections > 0) {
      console.log('\n⚠️ WARNING: Long-running connections detected!');
    }

  } catch (error) {
    console.error('❌ Error monitoring connections:', error);
  } finally {
    await monitorConnection.end();
  }
}

// Run monitoring
monitorConnections();
