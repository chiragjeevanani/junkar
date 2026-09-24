import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const TermsOfService = () => {
    return (
        <div className="landing-page-container">
            <Navbar />
            <main style={{ paddingTop: '100px', paddingBottom: '60px' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800 }}>Terms of Service</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Last Updated: March 2026</p>

                    <div style={{ lineHeight: '1.8', color: 'var(--text-main)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', fontWeight: 700 }}>1. Introduction</h2>
                        <p>Junkar (“Platform”, “We”, “Us”) is a technology platform that connects users with independent scrap collectors (“Scrappers”) for scrap material collection services. By using Junkar, you agree to these Terms & Conditions.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', fontWeight: 700 }}>2. Junkar’s Role</h2>
                        <p>Junkar is only a facilitator and does not purchase or sell scrap, handle payments directly for scrap, or transport/store scrap material. All scrap transactions occur directly between the user and the independent scrapper.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', fontWeight: 700 }}>3. User Obligations</h2>
                        <p>Users must provide accurate information about the scrap material and their location. Users should be present during the weighing and collection process.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', fontWeight: 700 }}>4. Scrap Pricing & Weighing</h2>
                        <p>Prices shown on the platform are indicative. The final price is determined by the scrapper after weighing and inspecting the material using their own equipment. Junkar is not liable for price disputes.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', fontWeight: 700 }}>5. Payments</h2>
                        <p>Payments for scrap are made directly by the scrapper to the user. Junkar does not handle these payments and is not liable for any payment disputes.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', fontWeight: 700 }}>6. Limitation of Liability</h2>
                        <p>Junkar’s total liability shall not exceed ₹1,000 or the last service fee paid, whichever is lower. We are not responsible for any direct or indirect damages arising from the use of our platform.</p>

                        <h2 style={{ fontSize: '1.5rem', marginTop: '2rem', marginBottom: '1rem', fontWeight: 700 }}>7. Governing Law</h2>
                        <p>These terms are governed by the laws of India and are subject to the exclusive jurisdiction of the courts in Jaipur, Rajasthan.</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TermsOfService;
