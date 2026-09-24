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
        
        console.log('Searching for 9521073590 in all collections...');
        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            const result = await db.collection(col.name).findOne({ phone: { $regex: "9521073590" } });
            if (result) {
                console.log(`Found in collection [${col.name}]:`, JSON.stringify(result, null, 2));
            }
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
