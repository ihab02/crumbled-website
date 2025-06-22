const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'password';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Original password:', password);
  console.log('Hashed password:', hashedPassword);
  console.log('\nSQL command to update:');
  console.log(`UPDATE customers SET password = '${hashedPassword}' WHERE email = 'ihab02@gmail.com';`);
}

hashPassword().catch(console.error); 