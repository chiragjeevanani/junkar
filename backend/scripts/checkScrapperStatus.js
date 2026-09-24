import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const scrapperSchema = new mongoose.Schema({
    phone: String,
    name: String,
    scrapperType: String,
    isOnline: Boolean,
    kyc: {
        status: String
    },
    businessLocation: {
        type: { type: String, default: 'Point' },
        coordinates: [Number],
        address: String
    }
}, { timestamps: true });

const Scrapper = mongoose.model('Scrapper', scrapperSchema);

async function checkStatus() {
    const logFile = path.join(__dirname, 'status_output.txt');
    let output = '';

    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        log('Starting status check...');
        if (!process.env.MONGODB_URI) {
            log('Error: MONGODB_URI not found in environment');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        log('Connected to MongoDB');

        const scrapper = await Scrapper.findOne({ phone: '9876543210' });

        if (!scrapper) {
            log('Scrapper not found with phone: 9876543210');
            const all = await Scrapper.find({}).limit(10);
            log('First 10 scrappers: ' + JSON.stringify(all.map(s => ({ name: s.name, phone: s.phone })), null, 2));
        } else {
            log('Scrapper Data found:');
            log(JSON.stringify(scrapper, null, 2));
        }

        fs.writeFileSync(logFile, output, 'utf8');
        process.exit(0);
    } catch (error) {
        log('Error: ' + error.message);
        fs.writeFileSync(logFile, output, 'utf8');
        process.exit(1);
    }
}

checkStatus();
