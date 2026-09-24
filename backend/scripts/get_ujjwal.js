import mongoose from 'mongoose';
import fs from 'fs';

async function check() {
    const uri = 'mongodb+srv://bhatiabhishek597_db_user:bhatiabhishek597_db_user@cluster0.dee9aem.mongodb.net/junkar';
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        const scrapper = await db.collection('scrappers').findOne({ phone: '9876543210' });

        fs.writeFileSync('ujjwal_full.json', JSON.stringify(scrapper, null, 2));
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('ujjwal_full.json', JSON.stringify({ error: e.message }));
        process.exit(1);
    }
}
check();
