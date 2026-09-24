import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
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
        
        const scrappers = await db.collection('scrappers').find({ 
            name: /Sagar/i 
        }).toArray();
        
        const results = scrappers.map(s => ({
            name: s.name,
            phone: s.phone,
            scrapperType: s.scrapperType,
            kyc: s.kyc
        }));

        fs.writeFileSync('sagar_kyc_data.json', JSON.stringify(results, null, 2));
        console.log(`Saved ${results.length} results to sagar_kyc_data.json`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
