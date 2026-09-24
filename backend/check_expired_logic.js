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
        const now = new Date();
        
        console.log('Checking for scrappers with expired expiryDate but active status...');
        const scrappers = await db.collection('scrappers').find({
            'subscription.status': 'active',
            'subscription.expiryDate': { $lt: now }
        }).toArray();
        
        console.log(`Found ${scrappers.length} scrappers that should be expired but are active.`);
        if (scrappers.length > 0) {
            scrappers.forEach(s => {
                console.log(`Name: ${s.name}, Phone: ${s.phone}, Expiry: ${s.subscription.expiryDate}`);
            });
        }
        
        console.log('\nChecking for scrappers with expired status...');
        const expiredScrappers = await db.collection('scrappers').find({
            'subscription.status': 'expired'
        }).toArray();
        console.log(`Found ${expiredScrappers.length} scrappers with status "expired".`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
