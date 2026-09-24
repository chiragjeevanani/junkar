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
        const scrapper = await db.collection('scrappers').findOne({ phone: "9521073590" });

        if (scrapper) {
            console.log('Scrapper found:', JSON.stringify(scrapper, null, 2));
            
            // Calculate new expiry date
            const currentExpiry = scrapper.subscription.expiryDate ? new Date(scrapper.subscription.expiryDate) : new Date();
            const newExpiry = new Date(currentExpiry);
            newExpiry.setMonth(newExpiry.getMonth() + 2);
            
            console.log('Current Expiry:', currentExpiry);
            console.log('New Expiry:', newExpiry);

            // Update both subscription and marketSubscription if they are being used
            const updateDoc = {
                $set: {
                    'subscription.expiryDate': newExpiry,
                    'subscription.status': 'active',
                    'marketSubscription.expiryDate': newExpiry,
                    'marketSubscription.status': 'active'
                }
            };

            const result = await db.collection('scrappers').updateOne({ _id: scrapper._id }, updateDoc);
            console.log('Update result:', result);
        } else {
            console.log('Scrapper with phone 9521073590 not found');
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
