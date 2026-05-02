require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function verifyAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const email = 'admin@skillconnect.com';
    const password = 'Admin@1234';

    let user = await User.findOne({ email, isDeleted: false });

    if (user) {
      console.log('Admin user found. Checking password...');
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (isMatch) {
        console.log('Password is correct. Credentials should work.');
        console.log('User Role:', user.role);
        if (user.role !== 'admin') {
          console.log('Role is NOT admin. Fixing role...');
          user.role = 'admin';
          await user.save();
          console.log('Role fixed to admin.');
        }
      } else {
        console.log('Password does NOT match. Updating password...');
        user.passwordHash = password; // Pre-save hook will hash it
        user.role = 'admin';
        await user.save();
        console.log('Password updated successfully.');
      }
    } else {
      console.log('Admin user not found. Creating new admin...');
      user = new User({
        email,
        passwordHash: password, // Pre-save hook will hash it
        firstName: 'System',
        lastName: 'Admin',
        role: 'admin',
        isVerified: true
      });
      await user.save();
      console.log('Admin account created successfully.');
    }

    mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

verifyAdmin();
