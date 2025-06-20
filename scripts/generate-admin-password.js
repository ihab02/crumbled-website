const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123'; // Default password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  console.log('Generated hash for password:', password);
  console.log('Hash:', hash);
}

generateHash().catch(console.error); 