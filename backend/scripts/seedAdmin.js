import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Admin credentials
    const adminEmail = 'junkarindia@gmail.com';
    const adminPhone = '9214142700';
    const adminPassword = 'junkar@123';
    const adminName = 'Junkar Admin';

    // Remove all other admins to ensure only one admin exists
    const deleteResult = await User.deleteMany({
      role: 'admin',
      email: { $ne: adminEmail }
    });
    if (deleteResult.deletedCount > 0) {
      console.log(`🗑️ Removed ${deleteResult.deletedCount} other admin accounts.`);
    }

    // Check if current target admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('⚠️  Target admin user already exists!');
      console.log('🔄 Updating existing admin with latest credentials...');

      // Update existing admin
      existingAdmin.name = adminName;
      existingAdmin.phone = adminPhone;
      existingAdmin.password = adminPassword; // Will be auto-hashed by pre-save hook
      existingAdmin.role = 'admin';
      existingAdmin.isActive = true;
      existingAdmin.isVerified = true;
      existingAdmin.isPhoneVerified = true;

      await existingAdmin.save();

      console.log('✅ Admin user updated successfully!');
    } else {
      // Create new admin user
      await User.create({
        name: adminName,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword, // Will be auto-hashed by User model's pre-save hook
        role: 'admin',
        isActive: true,
        isVerified: true,
        isPhoneVerified: true
      });
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📝 Login credentials:');
    console.log('   Email:', adminEmail);
    console.log('   Password:', adminPassword);
    console.log('\n🔐 Admin uses PASSWORD-BASED login (not OTP)');
    console.log('   Login endpoint: POST /api/auth/login');
    console.log('   Body: { "email": "' + adminEmail + '", "password": "' + adminPassword + '" }');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();




