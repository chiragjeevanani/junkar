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
        
        const scrappers = await db.collection('scrappers').find({}).toArray();
        console.log(`Total scrappers: ${scrappers.length}`);
        
        const target = "9521073590";
        const found = scrappers.filter(s => {
            const phone = String(s.phone || "");
            return phone.includes(target) || target.includes(phone);
        });
        
        if (found.length > 0) {
            console.log('Found scrappers:', JSON.stringify(found, null, 2));
        } else {
            console.log('Not found in scrappers.');
            // Check users too
            const users = await db.collection('users').find({}).toArray();
            const foundUsers = users.filter(u => {
                const phone = String(u.phone || "");
                return phone.includes(target) || target.includes(phone);
            });
            if (foundUsers.length > 0) {
                console.log('Found users:', JSON.stringify(foundUsers, null, 2));
            } else {
                console.log('Not found in users either.');
            }
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
