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
        const users = await db.collection('users').find({}).toArray();
        users.forEach(u => {
            console.log(`Name: ${u.name}, Phone: ${u.phone}, Role: ${u.role}`);
        });
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
