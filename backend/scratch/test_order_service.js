import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import orderService from '../services/orderService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

async function test() {
    const uri = process.env.MONGODB_URI;
    try {
        console.log('Connecting to database...');
        await mongoose.connect(uri);
        console.log('Database connected successfully!');
        
        console.log('Running autoUnassignOverdueOrders...');
        const result = await orderService.autoUnassignOverdueOrders();
        console.log('Test completed successfully! Result:', result);
        
        process.exit(0);
    } catch (e) {
        console.error('Test failed with error:', e);
        process.exit(1);
    }
}
test();
