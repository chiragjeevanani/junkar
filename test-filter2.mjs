import mongoose from 'mongoose';
import Scrapper from './backend/models/Scrapper.js';

async function testFilter() {
    try {
        await mongoose.connect('mongodb://localhost:27017/junkar');
        console.log("Connected to DB");

        const testUser = await Scrapper.findOne({ phone: '9827223585' }).select('name status isOnline receptionMode kyc.status type fcmTokens');
        console.log("Test User Details:", testUser);

        if (testUser) {
            console.log("Matches online filter?", testUser.isOnline === true || testUser.receptionMode === true);
            console.log("Matches KYC filter?", testUser.kyc?.status === 'verified' || testUser.receptionMode === true);
            console.log("Matches active filter?", testUser.status === 'active');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}
testFilter();
