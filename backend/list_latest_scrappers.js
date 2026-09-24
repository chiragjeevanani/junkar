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
        const scrappers = await db.collection('scrappers').find({}).sort({ createdAt: -1 }).limit(10).toArray();
        console.log('Last 10 scrappers:', JSON.stringify(scrappers.map(s => ({ phone: s.phone, name: s.name, createdAt: s.createdAt })), null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
