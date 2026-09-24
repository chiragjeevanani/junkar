import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function check() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://bhatiabhishek597_db_user:bhatiabhishek597_db_user@cluster0.dee9aem.mongodb.net/junkar';
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        
        console.log('Searching for phone 9521073590 or name Sagar...');
        const scrappers = await db.collection('scrappers').find({ 
            $or: [
                { phone: /9521073590/ },
                { name: /Sagar/i }
            ]
        }).toArray();
        
        console.log('Found Scrappers:', JSON.stringify(scrappers.map(s => ({
            name: s.name,
            phone: s.phone,
            kycStatus: s.kyc?.status,
            kycKeys: s.kyc ? Object.keys(s.kyc).filter(k => k.toLowerCase().includes('url')) : []
        })), null, 2));

        if (scrappers.length > 0) {
            console.log('Detailed KYC for first match:', JSON.stringify(scrappers[0].kyc, null, 2));
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
