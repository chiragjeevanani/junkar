import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Scrapper from './backend/models/Scrapper.js';
import { connectDB } from './backend/config/database.js';

dotenv.config();

const migrateScrappers = async () => {
    try {
        await connectDB();
        console.log('Connected to DB...');

        const scrappers = await Scrapper.find({
            $or: [
                { 'businessLocation.city': { $exists: false } },
                { 'businessLocation.city': '' }
            ]
        });

        console.log(`Found ${scrappers.length} scrappers to migrate.`);

        for (const scrapper of scrappers) {
            const address = scrapper.businessLocation.address;
            if (!address) continue;

            // Simple parsing logic as fallback for existing data
            // Usually Google Maps address is: "Locality, City, State Pincode, Country"
            const parts = address.split(',').map(p => p.trim());

            // Very basic heuristic:
            // State is usually 2nd from last (before Country)
            // City is usually 3rd from last
            let city = '';
            let state = '';

            if (parts.length >= 3) {
                state = parts[parts.length - 2].split(' ')[0]; // Handle "Bihar 800001"
                city = parts[parts.length - 3];
            } else if (parts.length === 2) {
                city = parts[0];
                state = parts[1].split(' ')[0];
            }

            console.log(`Migrating ${scrapper.name}: "${address}" -> City: ${city}, State: ${state}`);

            scrapper.businessLocation.city = city;
            scrapper.businessLocation.state = state;
            await scrapper.save();
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateScrappers();
