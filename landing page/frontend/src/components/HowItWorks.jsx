import React from 'react';
import { motion } from 'framer-motion';
import { MousePointerClick, CalendarCheck, Truck, Wallet } from 'lucide-react';

const steps = [
    {
        title: 'Select Scrap Type',
        desc: 'Choose from various categories like plastic, metal, electronics, etc.',
        icon: <MousePointerClick size={32} />
    },
    {
        title: 'Schedule Pickup',
        desc: 'Pick a date and time that works best for you.',
        icon: <CalendarCheck size={32} />
    },
    {
        title: 'Doorstep Collection',
        desc: 'Our verified scrapper will arrive at your location for collection.',
        icon: <Truck size={32} />
    },
    {
        title: 'Get Paid Instantly',
        desc: 'Receive immediate payment via cash or UPI after weighing.',
        icon: <Wallet size={32} />
    }
];

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="section container">
            <div className="section-header">
                <span className="section-tag">Process</span>
                <h2 className="section-title">How It Works</h2>
                <p style={{ color: 'var(--text-muted)' }}>Four simple steps to turn your junk into cash.</p>
            </div>

            <div className="steps-grid">
                <div style={{ position: 'absolute', top: '25px', left: '10%', right: '10%', height: '2px', background: 'dashed #e2e8f0', zIndex: 0, border: '1px dashed #cbd5e1' }} className="hide-mobile"></div>
                {steps.map((step, i) => (
                    <motion.div
                        key={i}
                        className="step-card"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2 }}
                    >
                        <div className="step-number">{i + 1}</div>
                        <div className="category-icon" style={{ marginBottom: '1rem', width: '60px', height: '60px' }}>
                            {step.icon}
                        </div>
                        <h3 className="step-title">{step.title}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{step.desc}</p>
                    </motion.div>
                ))}
            </div>

            <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none; }
        }
      `}</style>
        </section>
    );
};

export default HowItWorks;
