import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function check() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined in environment');
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        const scrapper = await db.collection('scrappers').findOne({ phone: '9876543210' });

        fs.writeFileSync('ujjwal_full.json', JSON.stringify(scrapper, null, 2));
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('ujjwal_full.json', JSON.stringify({ error: e.message }));
        process.exit(1);
    }
}
check();
