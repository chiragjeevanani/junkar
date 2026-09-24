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
        const target = "9521073590";
        
        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            const documents = await db.collection(col.name).find({}).toArray();
            for (const doc of documents) {
                const docStr = JSON.stringify(doc);
                if (docStr.includes(target)) {
                    console.log(`Found match in collection [${col.name}]:`, JSON.stringify(doc, null, 2));
                }
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
