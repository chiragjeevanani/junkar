import mongoose from 'mongoose';
import Scrapper from './backend/models/Scrapper.js';

async function testQuery() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/junkar');
        console.log('Connected to DB');
        const scrappers = await Scrapper.find({
            status: 'active',
            $and: [
                { $or: [{ isOnline: true }, { receptionMode: true }] },
                { $or: [{ 'kyc.status': 'verified' }, { receptionMode: true }] }
            ]
        }).select('name phone isOnline receptionMode kyc.status');
        console.log('Filtered Scrappers:', JSON.stringify(scrappers, null, 2));

        const allScrappers = await Scrapper.find({ phone: '9827223585' }).select('name phone isOnline receptionMode kyc.status status');
        console.log('Test Scrapper info:', JSON.stringify(allScrappers, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
testQuery();
