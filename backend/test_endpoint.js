import axios from 'axios';

async function testKyc() {
    console.log('--- Testing KYC Endpoint ---');
    try {
        // We'll just try to hit the endpoint with an empty POST to see if it responds (it should 401 if protect is working, or 400 if bad data)
        const res = await axios.post('http://localhost:7000/api/v1/kyc', {}, {
            validateStatus: () => true
        });
        console.log('Status:', res.status);
        console.log('Data:', res.data);
    } catch (e) {
        console.log('Error:', e.message);
    }
    console.log('--- Test Complete ---');
}

testKyc();
