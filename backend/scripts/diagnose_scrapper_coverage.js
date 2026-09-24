/**
 * DIAGNOSTIC SCRIPT: Check which scrappers will get notified under new filter
 * Run: node scripts/diagnose_scrapper_coverage.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const ScrapperSchema = new mongoose.Schema({}, { strict: false });
const Scrapper = mongoose.model('Scrapper', ScrapperSchema);

async function diagnose() {
    await mongoose.connect(MONGO_URI);
    console.log('\n✅ Connected to MongoDB\n');
    console.log('='.repeat(60));
    console.log('SCRAPPER COVERAGE DIAGNOSIS');
    console.log('='.repeat(60));

    // 1. Total scrappers
    const total = await Scrapper.countDocuments({});
    console.log(`\n📊 Total Scrappers: ${total}`);

    // 2. By scrapperType
    const byType = await Scrapper.aggregate([
        { $group: { _id: '$scrapperType', count: { $sum: 1 } } }
    ]);
    console.log('\n📋 By scrapperType:');
    byType.forEach(t => console.log(`  - ${t._id || 'NOT SET'}: ${t.count}`));

    // 3. Online scrappers
    const onlineCount = await Scrapper.countDocuments({ isOnline: true });
    const receptionCount = await Scrapper.countDocuments({ receptionMode: true });
    console.log(`\n🟢 isOnline=true: ${onlineCount}`);
    console.log(`📡 receptionMode=true: ${receptionCount}`);

    // 4. Active subscription
    const activeSub = await Scrapper.countDocuments({ 'subscription.status': 'active' });
    const walletOk = await Scrapper.countDocuments({ 'wallet.balance': { $gte: 100 } });
    console.log(`\n💳 Active subscription: ${activeSub}`);
    console.log(`💰 Wallet >= ₹100: ${walletOk}`);

    // 5. KYC verified
    const kycVerified = await Scrapper.countDocuments({ 'kyc.status': 'verified' });
    console.log(`\n✅ KYC Verified: ${kycVerified}`);

    // 6. Has real liveLocation (not 0,0)
    const hasRealLocation = await Scrapper.countDocuments({
        $and: [
            { 'liveLocation.coordinates.0': { $ne: 0 } },
            { 'liveLocation.coordinates.1': { $ne: 0 } }
        ]
    });
    const noLocation = await Scrapper.countDocuments({
        $or: [
            { 'liveLocation.coordinates.0': 0 },
            { 'liveLocation': { $exists: false } }
        ]
    });
    console.log(`\n📍 Has Real liveLocation (non-0,0): ${hasRealLocation}`);
    console.log(`❌ No Real liveLocation (0,0 or missing): ${noLocation}`);

    // 7. Who would be notified TODAY (small order, new filter)
    console.log('\n' + '='.repeat(60));
    console.log('🔔 WHO GETS NOTIFIED (Small Order, New Fix):');
    console.log('='.repeat(60));

    const wouldBeNotified = await Scrapper.find({
        status: 'active',
        scrapperType: { $in: ['feri_wala', 'small'] },
        $and: [
            { $or: [{ isOnline: true }, { receptionMode: true }] },
            { $or: [{ 'kyc.status': 'verified' }, { receptionMode: true }] },
            { $or: [{ 'subscription.status': 'active' }, { 'wallet.balance': { $gte: 100 } }] }
        ]
    }).select('name phone scrapperType isOnline receptionMode kyc.status subscription.status wallet.balance liveLocation');

    if (wouldBeNotified.length === 0) {
        console.log('\n🚨 WARNING: ZERO scrappers would be notified with new filter!');
        console.log('   Reason breakdown:');

        const activeStatus = await Scrapper.countDocuments({ status: 'active', scrapperType: { $in: ['feri_wala', 'small'] } });
        const onlineOrReception = await Scrapper.countDocuments({
            status: 'active',
            scrapperType: { $in: ['feri_wala', 'small'] },
            $or: [{ isOnline: true }, { receptionMode: true }]
        });
        const kycOk = await Scrapper.countDocuments({
            status: 'active',
            scrapperType: { $in: ['feri_wala', 'small'] },
            $or: [{ isOnline: true }, { receptionMode: true }],
            $or: [{ 'kyc.status': 'verified' }, { receptionMode: true }]
        });
        const subOk = await Scrapper.countDocuments({
            status: 'active',
            scrapperType: { $in: ['feri_wala', 'small'] },
            $or: [{ isOnline: true }, { receptionMode: true }],
            $or: [{ 'kyc.status': 'verified' }, { receptionMode: true }],
            $or: [{ 'subscription.status': 'active' }, { 'wallet.balance': { $gte: 100 } }]
        });

        console.log(`   • feri_wala/small + active: ${activeStatus}`);
        console.log(`   • + online/reception: ${onlineOrReception}`);
        console.log(`   • + kyc verified: ${kycOk}`);
        console.log(`   • + subscription/wallet: ${subOk}`);
    } else {
        console.log(`\n✅ ${wouldBeNotified.length} scrapper(s) would be notified:`);
        wouldBeNotified.forEach(s => {
            const hasLoc = s.liveLocation?.coordinates?.[0] !== 0;
            console.log(`  - ${s.name} (${s.phone}) | type:${s.scrapperType} | online:${s.isOnline} | reception:${s.receptionMode} | kyc:${s.kyc?.status} | sub:${s.subscription?.status} | wallet:₹${s.wallet?.balance} | GPS:${hasLoc ? '✅' : '❌ (0,0)'}`);
        });
    }

    // 8. WITHOUT subscription filter (old behavior comparison)
    console.log('\n' + '='.repeat(60));
    console.log('🔔 WHO GETS NOTIFIED (Old Fix, No type filter):');
    console.log('='.repeat(60));

    const oldWouldBeNotified = await Scrapper.find({
        status: 'active',
        $and: [
            { $or: [{ isOnline: true }, { receptionMode: true }] },
            { $or: [{ 'kyc.status': 'verified' }, { receptionMode: true }] }
        ]
    }).select('name phone scrapperType isOnline receptionMode kyc.status');

    console.log(`  → ${oldWouldBeNotified.length} scrappers (any type)`);
    oldWouldBeNotified.forEach(s => {
        console.log(`    - ${s.name} (${s.phone}) | type:${s.scrapperType || 'NOT SET'} | online:${s.isOnline}`);
    });

    // 9. Recommendation
    console.log('\n' + '='.repeat(60));
    console.log('💡 RECOMMENDATION:');
    console.log('='.repeat(60));

    if (wouldBeNotified.length === 0) {
        console.log(`
⚠️  The new filter is TOO STRICT for current data.
    
    ROOT CAUSES found:
    1. All scrappers may have scrapperType='feri_wala' (default) but check if 
       your real field-workers are correctly set
    2. Most scrappers may be isOnline=false (they need to go online)
    3. liveLocation=[0,0] — GPS not being updated
    
    SAFE FIX: Temporarily remove the subscription filter from notifyOnlineScrappers
    until you have enough active scrappers.
        `);
    } else {
        console.log(`✅ ${wouldBeNotified.length} scrappers will receive notifications correctly.`);
    }

    await mongoose.disconnect();
    console.log('\n✅ Done.\n');
}

diagnose().catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
});
