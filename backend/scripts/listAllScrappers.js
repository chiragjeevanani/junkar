import mongoose from 'mongoose';
import fs from 'fs';

async function check() {
    const uri = 'mongodb+srv://bhatiabhishek597_db_user:bhatiabhishek597_db_user@cluster0.dee9aem.mongodb.net/junkar';
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        const scrappers = await db.collection('scrappers').find({}).limit(100).toArray();

        const data = scrappers.map(s => ({
            name: s.name,
            phone: s.phone,
            scrapperType: s.scrapperType,
            isOnline: s.isOnline,
            kycStatus: s.kyc?.status,
            coords: s.businessLocation?.coordinates
        }));

        fs.writeFileSync('all_scrappers.json', JSON.stringify(data, null, 2));
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('all_scrappers.json', JSON.stringify({ error: e.message }));
        process.exit(1);
    }
}
check();
