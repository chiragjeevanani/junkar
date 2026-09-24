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
        const client = await mongoose.connect(uri);
        const admin = mongoose.connection.db.admin();
        const dbsList = await admin.listDatabases();
        
        for (const dbInfo of dbsList.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;
            
            console.log(`\nScanning DB: ${dbName}`);
            const db = client.connection.useDb(dbName);
            const collections = await db.db.listCollections().toArray();
            
            for (const col of collections) {
                if (col.name === 'users' || col.name === 'scrappers') {
                    const count = await db.db.collection(col.name).countDocuments({
                        $or: [
                            { name: /Sagar/i },
                            { phone: "9521073590" }
                        ]
                    });
                    console.log(`  Collection ${col.name}: Found ${count} matches`);
                    if (count > 0) {
                        const docs = await db.db.collection(col.name).find({
                            $or: [
                                { name: /Sagar/i },
                                { phone: "9521073590" }
                            ]
                        }).toArray();
                        console.log(`  Matches in ${dbName}.${col.name}:`, JSON.stringify(docs.map(d => ({ name: d.name, phone: d.phone, kycStatus: d.kyc?.status })), null, 2));
                    }
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
