import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const scrapperSchemaArr = new mongoose.Schema({
    kyc: {
        status: String,
        submittedAt: Date,
        aadhaarPhotoUrl: String
    }
}, { strict: false });

const Scrapper = mongoose.model('Scrapper', scrapperSchemaArr);

async function checkKyc() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const pendingCount = await Scrapper.countDocuments({
            'kyc.status': 'pending',
            'kyc.submittedAt': { $gte: today }
        });

        const verifiedCount = await Scrapper.countDocuments({
            'kyc.status': 'verified'
        });

        console.log('--- KYC Stats Today ---');
        console.log('Pending submissions today:', pendingCount);
        console.log('Total Verified scrappers:', verifiedCount);

        if (pendingCount > 0) {
            const latest = await Scrapper.find({ 'kyc.status': 'pending' })
                .sort({ 'kyc.submittedAt': -1 })
                .limit(1)
                .select('name phone kyc.submittedAt');
            console.log('Latest pending:', JSON.stringify(latest, null, 2));
        }

        await mongoose.connection.close();
    } catch (e) {
        console.error(e);
    }
}

checkKyc();
