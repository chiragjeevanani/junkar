import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, CheckCircle, Smartphone } from 'lucide-react';

const VendorHowItWorks = () => {
    const steps = [
        {
            title: 'Register as Vendor',
            desc: 'Create your account and complete the verification process.',
            icon: <UserPlus size={32} />
        },
        {
            title: 'Get Approved',
            desc: 'Our team will verify your details and activate your profile.',
            icon: <CheckCircle size={32} />
        },
        {
            title: 'Receive Pickup Requests',
            desc: 'Start getting nearby scrap pickup notifications on your dashboard.',
            icon: <Smartphone size={32} />
        }
    ];

    return (
        <section id="how-it-works" className="section container" style={{ margin: 0, paddingTop: '4rem' }}>
            <div className="section-header">
                <span className="section-tag" style={{ color: '#059669' }}>The Process</span>
                <h2 className="section-title">How To Start?</h2>
                <p style={{ color: 'var(--text-muted)' }}>Three simple steps to join our network.</p>
            </div>

            <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
                {steps.map((step, i) => (
                    <motion.div
                        key={i}
                        className="step-card"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2 }}
                        style={{ textAlign: 'center', position: 'relative' }}
                    >
                        <div className="step-number" style={{ background: '#10b981', margin: '0 auto 1.5rem', width: '50px', height: '50px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                        <div className="category-icon" style={{ marginBottom: '1rem', width: '60px', height: '60px', margin: '0 auto 1rem', background: '#d1fae5', color: '#059669' }}>
                            {step.icon}
                        </div>
                        <h3 className="step-title" style={{ fontSize: '1.25rem', marginBottom: '0.8rem' }}>{step.title}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>{step.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default VendorHowItWorks;
