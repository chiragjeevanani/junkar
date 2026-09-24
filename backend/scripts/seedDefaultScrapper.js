import mongoose from 'mongoose';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import { activateFirstMonthTrial } from '../services/subscriptionService.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const scrappersToSeed = [
    {
        name: 'Default Scrapper',
        email: 'scrapper7000000000@junkar.in',
        phone: '7000000000',
        password: 'Scrapper@123',
        role: 'scrapper',
        isActive: true,
        isVerified: true,
        isPhoneVerified: true,
        vehicleNumber: 'MP-00-SC-0000'
    },
    {
        name: 'Scrapper 9000000000',
        email: 'scrapper9000000000@junkar.in',
        phone: '9000000000',
        password: 'Scrapper@9000',
        role: 'scrapper',
        isActive: true,
        isVerified: true,
        isPhoneVerified: true,
        vehicleNumber: 'MP-00-SC-9000'
    }
];

const seedDefaultScrappers = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        for (const data of scrappersToSeed) {
            console.log(`\n🔄 Processing scrapper: ${data.phone}...`);
            
            const userData = { ...data };
            delete userData.vehicleNumber;

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
                console.log('🆕 Creating new scrapper user...');
                user = await User.create(userData);
            }

            // Check if scrapper profile exists
            let scrapper = await Scrapper.findById(user._id);
            if (!scrapper) {
                console.log('🆕 Creating scrapper profile...');
                const defaultVehicleInfo = {
                    type: 'bike',
                    number: data.vehicleNumber,
                    capacity: 100
                };

                scrapper = await Scrapper.create({
                    _id: user._id,
                    phone: user.phone,
                    name: user.name,
                    email: user.email,
                    vehicleInfo: defaultVehicleInfo,
                    status: 'active'
                });

                // Activate trial
                try {
                    await activateFirstMonthTrial(user._id);
                    console.log('✨ First month trial activated.');
                } catch (trialError) {
                    console.warn('⚠️  Trial activation failed:', trialError.message);
                }
            } else {
                console.log('✅ Scrapper profile already exists.');
                scrapper.status = 'active';
                await scrapper.save();
            }

            console.log(`✅ Scrapper ${data.phone} processed successfully!`);
        }

        console.log('\n📱 OTP for all bypass numbers: 123456');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding default scrappers:', error);
        process.exit(1);
    }
};

seedDefaultScrappers();
