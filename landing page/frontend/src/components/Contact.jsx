import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const Contact = () => {
    return (
        <section id="contact" className="section container">
            <div className="section-header">
                <span className="section-tag">Get in Touch</span>
                <h2 className="section-title">Support & Inquiries</h2>
                <p style={{ color: 'var(--text-muted)' }}>Have questions? Our team is here to help you.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem' }}>
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="glass-card"
                    style={{ padding: '3rem' }}
                >
                    <form style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Full Name</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Email Address</label>
                                <input
                                    type="email"
                                    placeholder="john@example.com"
                                    style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Subject</label>
                            <input
                                type="text"
                                placeholder="How can we help?"
                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Message</label>
                            <textarea
                                rows="5"
                                placeholder="Tell us more about your inquiry..."
                                style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', resize: 'none' }}
                            ></textarea>
                        </div>

                        <button className="btn btn-primary" type="button" style={{ width: '100%' }}>
                            <Send size={18} />
                            Send Message
                        </button>
                    </form>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}
                >
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div style={{ padding: '15px', background: '#f0fdf4', color: 'var(--primary)', borderRadius: '15px', height: 'fit-content' }}>
                            <Phone size={24} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Call Us</h4>
                            <p style={{ color: 'var(--text-muted)' }}>Mon-Fri from 9am to 6pm.</p>
                            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '0.5rem' }}>+1 (555) 000-0000</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div style={{ padding: '15px', background: '#f0fdf4', color: 'var(--primary)', borderRadius: '15px', height: 'fit-content' }}>
                            <Mail size={24} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Email Us</h4>
                            <p style={{ color: 'var(--text-muted)' }}>Our team is here to help.</p>
                            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '0.5rem' }}>support@junkar.com</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div style={{ padding: '15px', background: '#f0fdf4', color: 'var(--primary)', borderRadius: '15px', height: 'fit-content' }}>
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Visit Us</h4>
                            <p style={{ color: 'var(--text-muted)' }}>Come say hello at our office.</p>
                            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginTop: '0.5rem' }}>123 Recycling Way, Green City, ECO 54321</p>
                        </div>
                    </div>

                    {/* Map Placeholder */}
                    <div style={{
                        marginTop: 'auto',
                        width: '100%',
                        height: '200px',
                        background: '#e2e8f0',
                        borderRadius: '20px',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b'
                    }}>
                        <p>Google Maps Embed</p>
                    </div>
                </motion.div>
            </div>

            <style>{`
        @media (max-width: 991px) {
          section#contact > div { grid-template-columns: 1fr; }
        }
      `}</style>
        </section>
    );
};

export default Contact;
