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
        
        const phone = "9521073590";
        
        const user = await db.collection('users').findOne({ phone });
        console.log('User found:', user ? { id: user._id, name: user.name, role: user.role } : 'Not found');
        
        const scrapper = await db.collection('scrappers').findOne({ phone });
        console.log('Scrapper found:', scrapper ? { id: scrapper._id, name: scrapper.name, kycStatus: scrapper.kyc?.status, kyc: scrapper.kyc } : 'Not found');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
