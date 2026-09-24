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
        
        console.log('Checking for market subscriptions that should be expired...');
        const scrappers = await db.collection('scrappers').find({
            'marketSubscription.status': 'active',
            'marketSubscription.expiryDate': { $lt: now }
        }).toArray();
        
        console.log(`Found ${scrappers.length} market subscriptions that should be expired.`);
        if (scrappers.length > 0) {
            const updateResult = await db.collection('scrappers').updateMany(
                {
                    'marketSubscription.status': 'active',
                    'marketSubscription.expiryDate': { $lt: now }
                },
                {
                    $set: { 'marketSubscription.status': 'expired' }
                }
            );
            console.log(`Updated ${updateResult.modifiedCount} market subscriptions to "expired".`);
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
