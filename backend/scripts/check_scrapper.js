import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const ScrapperSchema = new mongoose.Schema({}, { strict: false });
const Scrapper = mongoose.model('Scrapper', ScrapperSchema);

async function checkScrapper() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    const scrapperId = '69d25634d6130d4eb2b04b7d';
    const s = await Scrapper.findById(scrapperId);

    if (!s) {
        console.log('Scrapper not found!');
        process.exit(1);
    }

    console.log('--- SCRAPPER PROFILE ---');
    console.log(`Name: ${s.get('name')}`);
    console.log(`Phone: ${s.get('phone')}`);
    console.log(`Status: ${s.get('status')}`);
    console.log(`scrapperType: ${s.get('scrapperType')}`);
    console.log(`isOnline: ${s.get('isOnline')}`);
    console.log(`receptionMode: ${s.get('receptionMode')}`);
    console.log(`KYC Status: ${s.get('kyc')?.status}`);
    console.log(`Subscription Status: ${s.get('subscription')?.status}`);
    console.log(`Wallet Balance: ${s.get('wallet')?.balance}`);
    console.log(`Live Location: ${JSON.stringify(s.get('liveLocation'))}`);
    
    // Test the query conditions
    const query = {
        _id: new mongoose.Types.ObjectId(scrapperId),
        status: 'active',
        $and: [
            { $or: [{ isOnline: true }, { receptionMode: true }] },
            { $or: [{ 'kyc.status': 'verified' }, { receptionMode: true }] },
            { $or: [
                { 'subscription.status': 'active' },
                { 'wallet.balance': { $gte: 100 } }
            ]}
        ]
    };
    
    const matchesOld = await Scrapper.findOne(query);
    console.log('\n--- MATcHES BASE QUERY ---');
    console.log(matchesOld ? '✅ YES' : '❌ NO');

    const matchesFeriWala = await Scrapper.findOne({ ...query, scrapperType: { $in: ['feri_wala', 'small'] }});
    console.log('\n--- MATCHES scrapperType: feri_wala/small ---');
    console.log(matchesFeriWala ? '✅ YES' : '❌ NO');
    
    if (!matchesOld) {
        console.log('\nWhy it failed base query:');
        if (s.get('status') !== 'active') console.log('- status is not active');
        if (!s.get('isOnline') && !s.get('receptionMode')) console.log('- Not online and no receptionMode');
        if (s.get('kyc')?.status !== 'verified' && !s.get('receptionMode')) console.log('- KYC not verified and no receptionMode');
        if (s.get('subscription')?.status !== 'active' && (s.get('wallet')?.balance || 0) < 100) console.log('- No active sub and wallet < 100');
    }

    process.exit(0);
}

checkScrapper();
