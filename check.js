import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({path: './backend/.env'});
import Scrapper from './backend/models/Scrapper.js';

mongoose.connect(process.env.MONGODB_URI).then(async ()=>{
    const s = await Scrapper.find({ phone: { $in: ['9827223585', '9575500329'] } })
        .select('phone isOnline receptionMode kyc.status name');
    console.log(JSON.stringify(s, null, 2));
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
