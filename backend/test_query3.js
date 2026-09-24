import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Order from './models/Order.js';

async function run() {
    let output = '';
    const log = (msg) => { output += msg + '\n'; console.log(msg); };

    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        log('Connected to DB');

        const lat = 0;
        const lng = 0;
        const RADIUS_KM = 50000;
        
        const publicMatch = {
             status: 'pending',
             assignmentStatus: 'unassigned',
             quantityType: 'small',
             forwardedBy: null,
             location: {
                $nearSphere: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    $maxDistance: RADIUS_KM * 1000
                }
             }
        };

        const orders = await Order.find(publicMatch);
        log('Orders matching 50k radius from 0,0: ' + orders.length);

        if (orders.length > 0) {
            log('Matches include user order: ' + orders.some(o => o._id.toString() === '69d268655ff997ca1b653351'));
        }

        fs.writeFileSync('./DB_TEST_RESULT_3.txt', output);
    } catch (e) {
        fs.writeFileSync('./DB_TEST_RESULT_3.txt', 'Error: ' + e.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();
