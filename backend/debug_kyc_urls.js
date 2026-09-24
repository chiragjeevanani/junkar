import mongoose from 'mongoose';
import fs from 'fs';
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
        const scrappers = await db.collection('scrappers').find({ 'kyc.status': 'pending' }).toArray();

        const data = scrappers.map(s => ({
            name: s.name,
            phone: s.phone,
            kyc: s.kyc
        }));

        fs.writeFileSync('kyc_debug_data.json', JSON.stringify(data, null, 2));
        console.log('Data written to kyc_debug_data.json');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
