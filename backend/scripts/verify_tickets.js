
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import HelpTicket from '../models/HelpTicket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const verifyNumbers = async () => {
    await connectDB();
    
    const scrapperPhone = "7777777777";
    const userPhone = "6260491554";

    console.log(`\n--- Searching for Tickets ---`);
    
    // Find users first to get their IDs
    const users = await User.find({ phone: { $in: [scrapperPhone, userPhone] } });
    const userIds = users.map(u => u._id);
    const userMap = {};
    users.forEach(u => {
        userMap[u._id.toString()] = { name: u.name, phone: u.phone, role: u.role };
        console.log(`Found User: ${u.name} | Phone: ${u.phone} | Role: ${u.role} | ID: ${u._id}`);
    });

    // Find tickets by user/scrapper ID OR by email/name/phone if stored in ticket
    // Although the HelpTicket model doesn't have a phone field directly, 
    // it has name and email. Let's look for user/scrapper references.
    
    const tickets = await HelpTicket.find({
        $or: [
            { user: { $in: userIds } },
            { scrapper: { $in: userIds } },
            { email: { $in: users.map(u => u.email) } }
        ]
    }).sort({ createdAt: -1 });

    if (tickets.length === 0) {
        console.log("\n❌ No tickets found in Database for these test numbers.");
        console.log("This is expected if no tickets were submitted via the NEW API-based system yet.");
    } else {
        console.log(`\n✅ Found ${tickets.length} tickets in Database:`);
        tickets.forEach((t, i) => {
            console.log(`[${i+1}] ID: ${t._id} | Subject: ${t.subject} | Status: ${t.status} | Role: ${t.role} | Created: ${t.createdAt}`);
            console.log(`    Message: ${t.message.substring(0, 50)}${t.message.length > 50 ? '...' : ''}`);
        });
    }

    console.log(`\n--- Admin Retrieval Logic Check ---`);
    // Simulate what the admin controller does
    const totalTickets = await HelpTicket.countDocuments();
    console.log(`Total tickets in system: ${totalTickets}`);
    
    // Check if there are any tickets with 'guest' role that might match these numbers
    const guestTickets = await HelpTicket.find({ role: 'guest' });
    if (guestTickets.length > 0) {
        console.log(`Found ${guestTickets.length} guest tickets. Checking for name/email matches...`);
        // ... list if any match
    }

    process.exit();
};

verifyNumbers();
