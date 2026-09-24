import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const adminEmail = 'junkarindia@gmail.com';
    const adminPassword = 'junkar@123';
    const adminName = 'Junkar Admin';
    const adminPhone = '9214142700';

    const existingAdmin = await User.findOne({ 
      $or: [
        { email: adminEmail },
        { role: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists:', existingAdmin.email);
      console.log('   Use seedAdmin.js to update existing admin.');
      process.exit(0);
      return;
    }

    // Get admin details from command line or use defaults
    const args = process.argv.slice(2);
    const email = args[0] || adminEmail;
    const password = args[1] || adminPassword;
    const name = args[2] || adminName;
    const phone = args[3] || adminPhone;

    // Create admin user
    const admin = await User.create({
      name,
      email,
      phone,
      password, // Will be auto-hashed by User model's pre-save hook
      role: 'admin',
      isActive: true,
      isVerified: true,
      isPhoneVerified: true
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Phone:', admin.phone);
    console.log('   Role:', admin.role);
    console.log('\n📝 Login credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('\n🔐 Admin uses PASSWORD-BASED login (not OTP)');
    console.log('   Login endpoint: POST /api/auth/login');
    console.log('   Body: { "email": "' + email + '", "password": "' + password + '" }');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('   Email or phone already exists. Please use a different email/phone.');
    }
    process.exit(1);
  }
};

createAdmin();
