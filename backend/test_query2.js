import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Order from './models/Order.js';
import Scrapper from './models/Scrapper.js';

async function run() {
    let output = '';
    const log = (msg) => { output += msg + '\n'; console.log(msg); };

    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        log('Connected to DB');

        const scrapperPhone = '90000000000'; // test Scrapper phone provided by user
        let scrapper = await Scrapper.findOne({ phone: scrapperPhone });
        if (!scrapper) scrapper = await Scrapper.findOne({ phone: '9000000000' });
        
        log('Scrapper: ' + (scrapper ? JSON.stringify({id: scrapper._id, type: scrapper.scrapperType, services: scrapper.services}) : 'Not found'));
        
        const services = scrapper ? (scrapper.services || ['scrap_pickup']) : ['scrap_pickup'];
        const allowedOrderTypes = [];
        if (services.includes('scrap_pickup')) {
             allowedOrderTypes.push(null, undefined, 'scrap_pickup', 'scrap', 'scrap_sell');
        }
        
        // 1. the exact publicMatch from orderController
        const publicMatch = {
            status: 'pending',
            assignmentStatus: { $in: ['unassigned', null] }, // From OrderService findOneAndUpdate
            scrapper: { $ne: scrapper ? scrapper._id : null },
            orderType: { $in: allowedOrderTypes }
        };
        publicMatch.quantityType = 'small';
        publicMatch.forwardedBy = null;

        let orders = await Order.find(publicMatch);
        log('Match without distance: ' + orders.length);

        // 2. what if we remove orderType filter
        const matchNoType = { ...publicMatch };
        delete matchNoType.orderType;
        orders = await Order.find(matchNoType);
        log('Match without orderType filter: ' + orders.length);

        // 3. What if we include assignmentStatus: 'unassigned' exactly like the controller
        const matchExactController = {
             status: 'pending',
             assignmentStatus: 'unassigned',
             scrapper: { $ne: scrapper ? scrapper._id : null },
             orderType: { $in: allowedOrderTypes },
             quantityType: 'small',
             forwardedBy: null
        };
        orders = await Order.find(matchExactController);
        log('Match exact from controller: ' + orders.length);
        if (orders.length > 0) {
             log('First matching order in exact controller: ' + orders[0]._id);
        }

        const userOrder = await Order.findOne({ user: '69d267525ff997ca1b65309c' }).sort({createdAt: -1});
        if (userOrder) {
            log('User Order: ' + JSON.stringify({
               id: userOrder._id,
               status: userOrder.status,
               assign: userOrder.assignmentStatus,
               qType: userOrder.quantityType,
               fwd: userOrder.forwardedBy
            }));
        }

        fs.writeFileSync('./DB_TEST_RESULT2.txt', output);
    } catch (e) {
        fs.writeFileSync('./DB_TEST_RESULT2.txt', 'Error: ' + e.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();
