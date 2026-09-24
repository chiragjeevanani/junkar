import React from 'react';
import '../../styles/landing-global.css';
import '../../styles/landing-main.css';
import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import Categories from '../../components/Categories';
import Partners from '../../components/Partners';
import HowItWorks from '../../components/HowItWorks';
import Features from '../../components/Features';
import About from '../../components/About';
import AppSection from '../../components/AppSection';
import Testimonials from '../../components/Testimonials';
import Contact from '../../components/Contact';
import Footer from '../../components/Footer';

const UserLanding = () => {
    return (
        <div className="landing-page-container">
            <div className="app-container">
                <Navbar />
                <main>
                    <Hero />
                    <Partners />
                    <Categories />
                    <HowItWorks />
                    <Features />
                    <About />
                    <AppSection />
                    <Testimonials />
                    <Contact />
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default UserLanding;
