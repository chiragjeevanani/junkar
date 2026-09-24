import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const PrivacyPolicy = () => {
    return (
        <div className="landing-page-container">
            <Navbar />
            <main style={{ paddingTop: '100px', paddingBottom: '60px' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800 }}>Privacy Policy</h1>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Last Updated: March 2026</p>

                    <div style={{ lineHeight: '1.8', color: 'var(--text-main)' }}>
                        <p>At Junkar, accessible from www.junkar.in, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Junkar and how we use it.</p>

                        <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 700 }}>1. Information We Collect</h2>
                        <p>The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.</p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li>Registration Information (Name, Phone number, Address)</li>
                            <li>Booking details and Scrap material information</li>
                            <li>Location data (for pickup coordination)</li>
                        </ul>

                        <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 700 }}>2. How We Use Your Information</h2>
                        <p>We use the information we collect in various ways, including to:</p>
                        <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                            <li>Provide, operate, and maintain our platform</li>
                            <li>Improve, personalize, and expand our platform</li>
                            <li>Understand and analyze how you use our platform</li>
                            <li>Process your pickup requests and connect you with scrappers</li>
                            <li>Communicate with you, either directly or through one of our partners</li>
                        </ul>

                        <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 700 }}>3. Log Files</h2>
                        <p>Junkar follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics.</p>

                        <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 700 }}>4. Third Party Privacy Policies</h2>
                        <p>Junkar's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information.</p>

                        <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontWeight: 700 }}>5. Contact Us</h2>
                        <p>If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us at Support@junkar.in.</p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
