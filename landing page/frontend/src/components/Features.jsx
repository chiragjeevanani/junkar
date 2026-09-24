import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, BarChart3, Clock, CreditCard } from 'lucide-react';

const features = [
    {
        title: 'Free Pickup',
        desc: 'No hidden charges for doorstep scrap collection.',
        icon: <Clock size={24} />
    },
    {
        title: 'Best Market Rates',
        desc: 'Get the most competitive prices based on live market data.',
        icon: <BarChart3 size={24} />
    },
    {
        title: 'Verified Scrappers',
        desc: 'Safety first! All our collectors are background checked.',
        icon: <ShieldCheck size={24} />
    },
    {
        title: 'Safe & Reliable',
        desc: 'Transparent weighing and secure transaction process.',
        icon: <Zap size={24} />
    },
    {
        title: 'Instant Cash',
        desc: 'Receive your payment immediately upon pickup completion.',
        icon: <CreditCard size={24} />
    }
];

const Features = () => {
    return (
        <section className="section" style={{ background: '#f8fafc' }}>
            <div className="container">
                <div className="section-header">
                    <span className="section-tag">Benefits</span>
                    <h2 className="section-title">Why Choose Junkar?</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Providing a seamless and trustworthy scrap selling experience.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            className="glass-card"
                            style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <div
                                style={{
                                    background: 'var(--primary)',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {f.icon}
                            </div>
                            <div>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{f.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
