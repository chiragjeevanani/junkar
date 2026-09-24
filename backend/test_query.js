import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Order from './models/Order.js';

async function run() {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const lat = 22.6344;
        const lng = 75.8079;
        const RADIUS_KM = 10;
        
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
        console.log('Orders found:', orders.length);

        console.log('Let us try without distance filter:');
        delete publicMatch.location;
        const ordersNoDist = await Order.find(publicMatch);
        console.log('Orders without distance found:', ordersNoDist.length);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}
run();
