import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const seedDefaultUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const userData = {
            name: 'Default User',
            email: 'user6260491554@junkar.in',
            phone: '6260491554',
            password: 'User@123',
            role: 'user',
            isActive: true,
            isVerified: true,
            isPhoneVerified: true
        };

        // Check if user already exists
        let user = await User.findOne({ phone: userData.phone });

        if (user) {
            console.log('⚠️  User already exists! Updating...');
            user.name = userData.name;
            user.email = userData.email;
            user.password = userData.password;
            user.role = userData.role;
            user.isActive = true;
            user.isVerified = true;
            user.isPhoneVerified = true;
            await user.save();
        } else {
            console.log('🆕 Creating new default user...');
            user = await User.create(userData);
        }

        console.log('✅ Default user processed successfully!');
        console.log('   Phone:', user.phone);
        console.log('   Role:', user.role);
        console.log('   Status: Verified & Active');
        console.log('\n📱 OTP: 123456 (Bypass enabled in code)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding default user:', error);
        process.exit(1);
    }
};

seedDefaultUser();
