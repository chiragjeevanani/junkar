import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import Scrapper from './models/Scrapper.js';
import Order from './models/Order.js';

async function run() {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const userPhone = '6268455485';
        const scrapperPhone = '9000000000';
        const scrapperPhone2 = '90000000000'; // 11 zeros

        const scrapper = await Scrapper.findOne({ phone: { $in: [scrapperPhone, scrapperPhone2] } });
        console.log('Scrapper:', scrapper ? {
            id: scrapper._id,
            phone: scrapper.phone,
            type: scrapper.scrapperType,
            dealCategories: scrapper.dealCategories,
            services: scrapper.services,
            liveLocation: scrapper.liveLocation
        } : 'Scrapper Not found');

        const user = await User.findOne({ phone: userPhone });
        console.log('User:', user ? { id: user._id, phone: user.phone } : 'User Not found');

        if (user) {
            const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(3);
            console.log('Latest Orders by User:', JSON.stringify(orders.map(o => ({
                id: o._id,
                status: o.status,
                assignmentStatus: o.assignmentStatus,
                quantityType: o.quantityType,
                orderType: o.orderType,
                targetedScrappers: o.targetedScrappers,
                categories: o.scrapItems.map(si => si.category),
                location: o.location,
                createdAt: o.createdAt
            })), null, 2));
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected');
    }
}
run();
