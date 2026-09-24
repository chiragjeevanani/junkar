import mongoose from 'mongoose';
import fs from 'fs';

async function check() {
    const uri = 'mongodb+srv://bhatiabhishek597_db_user:bhatiabhishek597_db_user@cluster0.dee9aem.mongodb.net/junkar';
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        const scrapper = await db.collection('scrappers').findOne({ phone: '9876543210' });

        if (scrapper) {
            const data = {
                name: scrapper.name,
                phone: scrapper.phone,
                scrapperType: scrapper.scrapperType, // This is the key field!
                isOnline: scrapper.isOnline,
                kycStatus: scrapper.kyc?.status,
                hasCoords: !!scrapper.businessLocation?.coordinates,
                coords: scrapper.businessLocation?.coordinates
            };
            fs.writeFileSync('scripts/scrapper_check.json', JSON.stringify(data, null, 2));
            console.log('Found scrapper');
        } else {
            fs.writeFileSync('scripts/scrapper_check.json', '{"error": "Not found"}');
            console.log('Scrapper not found');
        }
        process.exit(0);
    } catch (e) {
        fs.writeFileSync('scripts/scrapper_check.json', JSON.stringify({ error: e.message }));
        process.exit(1);
    }
}
check();
