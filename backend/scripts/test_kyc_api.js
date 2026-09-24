import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

// This is a dummy test script to verify endpoint presence and response format
// It will likely fail if no scrapper token is provided, but helps check logic if run in a dev env.

async function testKycUpload() {
  const token = 'YOUR_TEST_TOKEN'; // Replace with a valid scrapper token if testing live
  const url = 'http://localhost:5000/api/kyc';

  const form = new FormData();
  form.append('aadhaarNumber', '123456789012');
  // Simulating sending only one file to test incremental logic
  // form.append('aadhaar', fs.createReadStream('./test_image.jpg')); 

  try {
    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.log('Error Status:', error.response?.status);
    console.log('Error Data:', error.response?.data);
  }
}

// testKycUpload();
console.log('Test script ready. Modify with real token to run.');
