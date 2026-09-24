import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const scrapperSchema = new mongoose.Schema({
  name: String,
  phone: String,
  kyc: {
    status: String,
    aadhaarNumber: String,
    aadhaarPhotoUrl: String,
    aadhaarBackPhotoUrl: String,
    selfieUrl: String,
    panNumber: String,
    panPhotoUrl: String,
    shopLicenseUrl: String,
    shopPhotoUrl: String,
    gstNumber: String,
    gstCertificateUrl: String,
    submittedAt: Date
  }
}, { strict: false });

const Scrapper = mongoose.model('Scrapper', scrapperSchema);

async function checkKyc() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const scrappers = await Scrapper.find({});
    console.log(`Found ${scrappers.length} scrappers.`);

    const report = [];

    for (const s of scrappers) {
      const kyc = s.kyc || {};
      const status = {
        id: s._id,
        name: s.name,
        phone: s.phone,
        kycStatus: kyc.status || 'not_started',
        hasAadhaarFront: !!kyc.aadhaarPhotoUrl,
        hasAadhaarBack: !!kyc.aadhaarBackPhotoUrl,
        hasSelfie: !!kyc.selfieUrl,
        hasPan: !!kyc.panPhotoUrl,
        hasShopLicense: !!kyc.shopLicenseUrl,
        hasShopPhoto: !!kyc.shopPhotoUrl,
        hasGst: !!kyc.gstCertificateUrl,
        urls: {
          aadhaarFront: kyc.aadhaarPhotoUrl,
          aadhaarBack: kyc.aadhaarBackPhotoUrl,
          selfie: kyc.selfieUrl
        }
      };

      // Check for broken URLs (local paths instead of Cloudinary)
      const issues = [];
      ['aadhaarPhotoUrl', 'aadhaarBackPhotoUrl', 'selfieUrl', 'panPhotoUrl', 'shopLicenseUrl', 'shopPhotoUrl', 'gstCertificateUrl'].forEach(field => {
        const url = kyc[field];
        if (url && !url.startsWith('http')) {
          issues.push(`${field} is a local path: ${url}`);
        }
      });

      if (issues.length > 0) {
        status.issues = issues;
      }

      report.push(status);
    }

    // Sort by status
    report.sort((a, b) => a.kycStatus.localeCompare(b.kycStatus));

    // Save report to file
    const reportPath = path.join(__dirname, 'kyc_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`Report generated at: ${reportPath}`);

    // Print summary
    const summary = {
      total: report.length,
      verified: report.filter(r => r.kycStatus === 'verified').length,
      pending: report.filter(r => r.kycStatus === 'pending').length,
      rejected: report.filter(r => r.kycStatus === 'rejected').length,
      resend_required: report.filter(r => r.kycStatus === 'resend_required').length,
      not_started: report.filter(r => r.kycStatus === 'not_started' || !r.kycStatus).length,
      withIssues: report.filter(r => r.issues).length
    };
    console.log('Summary:', summary);

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkKyc();
