import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

dotenv.config();

async function diagnose() {
    console.log('--- Junkar Backend Diagnostics ---');
    console.log('Timestamp:', new Date().toISOString());

    // 1. Env Variables
    const envVars = [
        'MONGODB_URI',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
        'JWT_SECRET'
    ];

    envVars.forEach(v => {
        console.log(`${v}: ${process.env[v] ? 'LOADED' : 'MISSING'}`);
    });

    // 2. Cloudinary Config
    if (process.env.CLOUDINARY_CLOUD_NAME) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        try {
            const result = await cloudinary.api.ping();
            console.log('Cloudinary Ping:', result.status === 'ok' ? '✅ SUCCESS' : '❌ FAILED');
        } catch (e) {
            console.log('Cloudinary Ping: ❌ ERROR -', e.message);
        }
    }

    // 3. MongoDB Connection
    if (process.env.MONGODB_URI) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('MongoDB Connection: ✅ SUCCESS');
            await mongoose.connection.close();
        } catch (e) {
            console.log('MongoDB Connection: ❌ ERROR -', e.message);
        }
    }

    console.log('--- End of Diagnostics ---');
    process.exit(0);
}

diagnose();
