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
        
        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            const results = await db.collection(col.name).find({ $or: [
                { phone: "9521073590" },
                { phone: "+919521073590" },
                { "subscription.razorpaySubscriptionId": "9521073590" }, // Just in case
                { name: /9521073590/ }
            ] }).toArray();
            
            if (results.length > 0) {
                console.log(`Found in [${col.name}]:`, JSON.stringify(results, null, 2));
            }
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
