import React from 'react';
import { motion } from 'framer-motion';
import {
    Dribbble,
    Monitor,
    Container,
    Layers,
    Cpu,
    Wind,
    HardDrive,
    Gem,
    Trash2,
    Table as TableIcon
} from 'lucide-react';

const categories = [
    { name: 'Plastic', icon: <Container size={32} />, color: '#10b981' },
    { name: 'Metal', icon: <Layers size={32} />, color: '#3b82f6' },
    { name: 'Paper', icon: <Monitor size={32} />, color: '#f59e0b' },
    { name: 'Electronics', icon: <Cpu size={32} />, color: '#8b5cf6' },
    { name: 'Copper', icon: <Gem size={32} />, color: '#ef4444' },
    { name: 'Aluminium', icon: <Wind size={32} />, color: '#64748b' },
    { name: 'Steel', icon: <HardDrive size={32} />, color: '#0f172a' },
    { name: 'Brass', icon: <Trash2 size={32} />, color: '#d97706' },
];

const Categories = () => {
    return (
        <section id="categories" className="section container">
            <div className="section-header">
                <span className="section-tag">Materials</span>
                <h2 className="section-title">What can you sell?</h2>
                <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
                    We accept a wide range of scrap materials. Select a category to see current market rates and details.
                </p>
            </div>

            <div className="categories-grid">
                {categories.map((cat, i) => (
                    <motion.div
                        key={cat.name}
                        className="category-card glass-card"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <div className="category-icon" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                            {cat.icon}
                        </div>
                        <h3 className="category-name">{cat.name}</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Select to view rates
                        </p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default Categories;
