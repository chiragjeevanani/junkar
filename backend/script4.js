import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const OrderDataString = fs.readFileSync('./models/Order.js', 'utf8');

import User from './models/User.js';
import Scrapper from './models/Scrapper.js';
import Order from './models/Order.js';

async function run() {
    let output = '';
    const log = (msg) => { output += msg + '\n'; console.log(msg); };
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        log('Connected to DB');

        const scrapper = await Scrapper.findOne({ phone: { $in: ['9000000000', '90000000000', '+9190000000000', '+919000000000'] } });
        log('Scrapper: ' + (scrapper ? JSON.stringify({
            id: scrapper._id, phone: scrapper.phone, type: scrapper.scrapperType,
            dealCategories: scrapper.dealCategories, loc: scrapper.liveLocation
        }) : 'NotFound'));

        const user = await User.findOne({ phone: '6268455485' });
        log('User: ' + (user ? user._id : 'NotFound'));

        if (user) {
            const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(2);
            log('Orders: ' + JSON.stringify(orders.map(o => ({
                id: o._id, assignment: o.assignmentStatus, qType: o.quantityType,
                cats: o.scrapItems.map(si => si.category), loc: o.location
            }))));
        }

        fs.writeFileSync('./DB_TEST_RESULT.txt', output);
    } catch (e) {
        fs.writeFileSync('./DB_TEST_RESULT.txt', 'Error: ' + e.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();
