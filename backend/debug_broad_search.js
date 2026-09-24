import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function check() {
    const uri = process.env.MONGODB_URI || 'mongodb+srv://bhatiabhishek597_db_user:bhatiabhishek597_db_user@cluster0.dee9aem.mongodb.net/junkar';
    try {
        await mongoose.connect(uri);
        const admin = mongoose.connection.db.admin();
        const dbsList = await admin.listDatabases();
        
        let allResults = [];

        for (const dbInfo of dbsList.databases) {
            const dbName = dbInfo.name;
            if (['admin', 'local', 'config'].includes(dbName)) continue;
            
            const db = mongoose.connection.useDb(dbName);
            const collections = await db.db.listCollections().toArray();
            
            for (const col of collections) {
                if (col.name === 'users' || col.name === 'scrappers') {
                    const docs = await db.db.collection(col.name).find({
                        $or: [
                            { name: /Nagori/i },
                            { phone: /9521/ }
                        ]
                    }).toArray();
                    
                    if (docs.length > 0) {
                        docs.forEach(doc => {
                            allResults.push({
                                db: dbName,
                                collection: col.name,
                                name: doc.name,
                                phone: doc.phone,
                                kyc: doc.kyc
                            });
                        });
                    }
                }
            }
        }

        fs.writeFileSync('broad_search_results.json', JSON.stringify(allResults, null, 2));
        console.log(`Found ${allResults.length} matches across all DBs.`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
