import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/User.js';
import Scrapper from './models/Scrapper.js';
import Order from './models/Order.js';

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const userPhone = '6268455485';
        const scrapperPhone = '9000000000'; 
        const scrapperPhone2 = '90000000000'; 
        const scrapperPhone3 = '90000000000'; // 11 zeros? '9000000000' is 10 digits. User wrote '90000000000' which is 11.

        const scrapper = await Scrapper.findOne({ phone: { $in: [scrapperPhone, scrapperPhone2, '90000000000'] } });
        console.log('Scrapper:', scrapper ? { id: scrapper._id, phone: scrapper.phone, type: scrapper.scrapperType, dealCategories: scrapper.dealCategories, services: scrapper.services } : 'Not found');

        const user = await User.findOne({ phone: userPhone });
        console.log('User:', user ? { id: user._id, phone: user.phone } : 'Not found');

        if (user) {
            const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(2);
            console.log('Latest Orders by User:', JSON.stringify(orders.map(o => ({
                id: o._id,
                status: o.status,
                assignmentStatus: o.assignmentStatus,
                quantityType: o.quantityType,
                orderType: o.orderType,
                targetedScrappers: o.targetedScrappers,
                categories: o.scrapItems.map(si => si.category),
                createdAt: o.createdAt
            })), null, 2));
        }

        if (scrapper) {
           const ordersForScrapper = await Order.find({ targetedScrappers: scrapper._id });
           console.log('Targeted orders for exactly this scrapper:', ordersForScrapper.length);

           const publicMatches = await Order.find({ status: 'pending', assignmentStatus: 'unassigned' }).sort({createdAt: -1}).limit(5);
           console.log('Recent public matches:', JSON.stringify(publicMatches.map(o => ({id: o._id, qty: o.quantityType, type: o.orderType, cats: o.scrapItems.map(c => c.category)})), null, 2));
        }

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}
run();
