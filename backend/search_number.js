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
        
        const targetStr = "9521073590";
        const targetNum = 9521073590;
        
        console.log(`Searching for string "${targetStr}" and number ${targetNum}...`);
        
        const scrappers = await db.collection('scrappers').find({ 
            $or: [
                { phone: targetStr },
                { phone: targetNum },
                { phone: "+91" + targetStr }
            ]
        }).toArray();
        
        if (scrappers.length > 0) {
            console.log('Found in scrappers:', JSON.stringify(scrappers, null, 2));
        } else {
            console.log('Not found in scrappers.');
        }
        
        const users = await db.collection('users').find({ 
            $or: [
                { phone: targetStr },
                { phone: targetNum },
                { phone: "+91" + targetStr }
            ]
        }).toArray();
        
        if (users.length > 0) {
            console.log('Found in users:', JSON.stringify(users, null, 2));
        } else {
            console.log('Not found in users.');
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
