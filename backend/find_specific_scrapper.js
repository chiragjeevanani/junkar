import mongoose from 'mongoose';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function check() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://bhatiabhishek597_db_user:bhatiabhishek597_db_user@cluster0.dee9aem.mongodb.net/junkar';
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        const scrappers = await db.collection('scrappers').find({ 
            $or: [
                { name: /Sagar/i },
                { phone: "9521073590" }
            ]
        }).toArray();

        fs.writeFileSync('specific_scrapper_debug.json', JSON.stringify(scrappers, null, 2));
        console.log('Data written to specific_scrapper_debug.json');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
