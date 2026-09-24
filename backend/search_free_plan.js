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
        const planId = new mongoose.Types.ObjectId("69a581d52612549633a4b360");
        const scrappers = await db.collection('scrappers').find({ 
            $or: [
                { "subscription.planId": planId },
                { "marketSubscription.planId": planId }
            ]
        }).toArray();
        console.log('Scrappers with Free Plan:', JSON.stringify(scrappers.map(s => ({ phone: s.phone, name: s.name })), null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
