import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function check() {
    const uri = process.env.MONGODB_URI;
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        
        // Search for any document where the phone field contains these digits
        const digits = "9521073590";
        const regex = new RegExp(digits.split('').join('.*'));
        
        console.log(`Searching for regex: ${regex}`);
        
        const scrappers = await db.collection('scrappers').find({ phone: regex }).toArray();
        if (scrappers.length > 0) {
            console.log('Found in scrappers:', JSON.stringify(scrappers, null, 2));
        } else {
            console.log('Not found in scrappers.');
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
