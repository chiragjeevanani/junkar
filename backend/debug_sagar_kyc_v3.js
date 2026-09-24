import mongoose from 'mongoose';
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
        
        console.log('Searching for scrappers with name containing "Sagar"...');
        const scrappers = await db.collection('scrappers').find({ 
            name: /Sagar/i 
        }).toArray();
        
        console.log(`Found ${scrappers.length} matches.`);

        scrappers.forEach(s => {
            console.log('\n-------------------');
            console.log(`Name: ${s.name}`);
            console.log(`Phone: ${s.phone}`);
            console.log(`ScrapperType: ${s.scrapperType}`);
            console.log('KYC Object:');
            if (s.kyc) {
                Object.keys(s.kyc).forEach(key => {
                    console.log(`  ${key}: ${s.kyc[key]}`);
                });
            } else {
                console.log('  KYC object is missing');
            }
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
