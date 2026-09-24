import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { usePageTranslation } from '../../hooks/usePageTranslation';

const testimonials = [
    {
        name: 'Rahul Sharma',
        role: 'Home Owner',
        text: 'Junkar made selling my old electronics so easy. The scrapper was polite, and I got a great price!',
        rating: 5,
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
        name: 'Priya Verma',
        role: 'Regular User',
        text: 'I love how transparent the prices are. No more haggling with local scrap dealers. Highly recommended!',
        rating: 5,
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
    },
    {
        name: 'Amit Patel',
        role: 'Business Owner',
        text: 'We use Junkar for our office scrap. It is reliable, fast, and the digital payment is very convenient.',
        rating: 4,
        avatar: 'https://randomuser.me/api/portraits/men/46.jpg'
    }
];

const Testimonials = () => {
    const { getTranslatedText } = usePageTranslation([
        "Reviews", "What Our Users Say", "Join thousands of happy customers who trust Junkar.",
        "Home Owner", "Regular User", "Business Owner",
        "Junkar made selling my old electronics so easy. The scrapper was polite, and I got a great price!",
        "I love how transparent the prices are. No more haggling with local scrap dealers. Highly recommended!",
        "We use Junkar for our office scrap. It is reliable, fast, and the digital payment is very convenient."
    ]);

    return (
        <section id="testimonials" className="section container">
            <div className="section-header">
                <span className="section-tag">{getTranslatedText("Reviews")}</span>
                <h2 className="section-title">{getTranslatedText("What Our Users Say")}</h2>
                <p style={{ color: 'var(--text-muted)' }}>{getTranslatedText("Join thousands of happy customers who trust Junkar.")}</p>
            </div>

            <div className="testimonials-grid">
                {testimonials.map((t, i) => (
                    <motion.div
                        key={i}
                        className="testimonial-card glass-card"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                            <Quote size={32} opacity={0.3} />
                        </div>
                        <p className="testimonial-text">"{getTranslatedText(t.text)}"</p>
                        <div style={{ display: 'flex', gap: '2px', marginBottom: '1.5rem' }}>
                            {[...Array(5)].map((_, index) => (
                                <Star
                                    key={index}
                                    size={16}
                                    fill={index < t.rating ? 'var(--accent)' : 'none'}
                                    color={index < t.rating ? 'var(--accent)' : '#cbd5e1'}
                                />
                            ))}
                        </div>
                        <div className="testimonial-user">
                            <img src={t.avatar} alt={t.name} className="user-avatar" />
                            <div>
                                <h4 style={{ fontSize: '1rem' }}>{t.name}</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getTranslatedText(t.role)}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Testimonials;
