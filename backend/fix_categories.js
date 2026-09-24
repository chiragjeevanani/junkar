import mongoose from 'mongoose';
import Price from './models/Price.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: `${__dirname}/.env` });

const fixes = {
    "Bettry": "Battery",
    "Leptop": "Laptop",
    "Human haire": "Human Hair",
    "Iran / MS Scrap / Lokhand": "Iron / MS Scrap", // Or "Iron / Lokhand"
    "Iran / MS Scrap / Lokhan": "Iron / MS Scrap",
    "Ac": "AC",
    "Fridge Defridge": "Fridge / Deep Freezer",
    "2 Wheelers Bike and Scooty": "2 Wheelers (Bike/Scooty)",
    "2 Wheelers Bike and Scooter": "2 Wheelers (Bike/Scooter)",
    "3 Wheelers Riksha / Tempo": "3 Wheelers (Auto/Tempo)",
    "4 Wheelers Comercial Vehicles": "Commercial Vehicles",
    "4 Wheelers comercial vehicle": "Commercial Vehicles",
    "4 Wheelers vehicles / cars": "4 Wheelers (Cars)",
    "4 Wheelers Vehicles / Cars": "4 Wheelers (Cars)",
    "Carton / Craft / Pustha": "Carton / Paper (Pustha)",
    "Carton / craft / pustha": "Carton / Paper (Pustha)",
    "Brass / pitale": "Brass / Pital",
    "Brass / Pitale": "Brass / Pital",
    "Metal items scrap": "Metal Scrap"
};

async function fixCategories() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");
        
        const prices = await Price.find({});
        let updatedCount = 0;
        
        for (const p of prices) {
            let cat = p.category;
            // Handle partial matches or exact matches
            for (const [wrong, right] of Object.entries(fixes)) {
                if (cat.toLowerCase().includes(wrong.toLowerCase()) || cat === wrong) {
                    // Update only if exactly matches or contains the wrong string
                    // Actually let's do exact match or very close
                    console.log(`Updating "${cat}" -> "${right}"`);
                    p.category = right;
                    await p.save();
                    updatedCount++;
                    break;
                }
            }
            
            // Also fix 'Iran' dynamically if not caught
            if (p.category.toLowerCase().includes('iran / ms')) {
                console.log(`Updating "${p.category}" -> "Iron / MS Scrap"`);
                p.category = "Iron / MS Scrap";
                await p.save();
                updatedCount++;
            }
             if (p.category === 'Ac') {
                p.category = 'AC';
                await p.save();
                updatedCount++;
            }
             if (p.category.includes('Bettry')) {
                 p.category = p.category.replace('Bettry', 'Battery');
                 await p.save();
                 updatedCount++;
             }
             if (p.category.includes('Leptop')) {
                 p.category = p.category.replace('Leptop', 'Laptop');
                 await p.save();
                 updatedCount++;
             }
             if (p.category.includes('Human haire')) {
                 p.category = p.category.replace('Human haire', 'Human Hair');
                 await p.save();
                 updatedCount++;
             }
             if (p.category.includes('Fridge Defridge')) {
                 p.category = "Fridge / Deep Freezer";
                 await p.save();
                 updatedCount++;
             }
        }
        
        console.log(`Updated ${updatedCount} prices.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixCategories();
