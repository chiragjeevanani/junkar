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
        const scrapper = await db.collection('scrappers').findOne({});
        if (scrapper) {
            console.log('Fields in scrapper:', Object.keys(scrapper));
            console.log('Sample scrapper:', JSON.stringify(scrapper, null, 2));
        } else {
            console.log('No scrappers found');
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
