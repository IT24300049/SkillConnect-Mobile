require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function testLogin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const email = 'admin@skillconnect.com';
    const password = 'Admin@1234';

    const user = await User.findOne({ email, isDeleted: false });
    if (!user) {
      console.log('User not found.');
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log('Login Result:', isMatch ? 'SUCCESS' : 'FAILED');
    console.log('User Role:', user.role);

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

testLogin();
