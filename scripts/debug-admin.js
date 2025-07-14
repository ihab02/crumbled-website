const mysql = require('mysql2/promise');

async function debugAdmin() {
  let connection;
  
  try {
    console.log('Debugging admin user...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Goodmorning@1',
      database: 'crumbled_nextDB'
    });
    
    // Check admin users
    console.log('\n1. Admin users:');
    const [adminUsers] = await connection.execute('SELECT id, username, email FROM admin_users');
    console.log('Admin users:', adminUsers);
    
    // Check if there are any admin users with 'admin' in email
    const adminWithAdminEmail = adminUsers.filter(user => user.email && user.email.includes('admin'));
    console.log('\n2. Admin users with "admin" in email:', adminWithAdminEmail);
    
    // Check current session/authentication
    console.log('\n3. Testing admin detection logic:');
    adminUsers.forEach(user => {
      const isAdmin = user.id && user.email && user.email.includes('admin');
      console.log(`User ${user.username} (${user.email}): isAdmin = ${isAdmin}`);
    });
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the debug
debugAdmin(); 