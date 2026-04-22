const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'test123';
  const hash = await bcrypt.hash(password, 12);
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nUse this hash in seed data and login with password: test123');
}

generateHash().catch(console.error);