import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { checkExpiredSubscriptions } from './services/subscriptionService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function runUpdate() {
    const uri = process.env.MONGODB_URI;
    try {
        await mongoose.connect(uri);
        console.log('Running checkExpiredSubscriptions...');
        const result = await checkExpiredSubscriptions();
        console.log('Result:', result);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
runUpdate();
