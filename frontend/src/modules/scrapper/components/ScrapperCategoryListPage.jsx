import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { motion } from 'framer-motion';

const ScrapperCategoryListPage = () => {
    const { getTranslatedText } = usePageTranslation(["Select Categories", "Done"]);
    const navigate = useNavigate();
    const location = useLocation();

    // The data passed from SellScrapPage
    const initialState = location.state || {
        categories: [],             // initially selected category ids
        categoryWeights: {},        // initially entered weights
        availableCategories: []     // all available categories for this scrapper
    };

    const [selectedCategories, setSelectedCategories] = useState(initialState.categories);
    const availableCategories = initialState.availableCategories;

    // Helper to render icon correctly
    const renderCategoryIcon = (iconStr, name) => {
        if (!iconStr) return <span>📦</span>;
        if (iconStr.startsWith('http') || iconStr.startsWith('/')) {
            return <img src={iconStr} alt={name || 'Category'} className="w-8 h-8 object-contain" />;
        }
        return <span>{iconStr}</span>;
    };

    const handleCategoryToggle = (catId) => {
        if (selectedCategories.includes(catId)) {
            setSelectedCategories(selectedCategories.filter(c => c !== catId));
        } else {
            setSelectedCategories([...selectedCategories, catId]);
        }
    };

    const handleSave = () => {
        // Prepare weights: if a category was deselected, it won't be used anyway.
        // If a new one was selected, we initialize it without a weight.
        const newWeights = { ...initialState.categoryWeights };
        selectedCategories.forEach(catId => {
            if (newWeights[catId] === undefined) {
                newWeights[catId] = '';
            }
        });

        // Pass back to SellScrapPage
        navigate('/scrapper/sell-scrap', {
            state: {
                categories: selectedCategories,
                categoryWeights: newWeights
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 p-3 pb-24">
            <header className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm">
                        ⬅️
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">{getTranslatedText("Select Categories")}</h1>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className="px-4 py-2 bg-sky-600 text-white text-sm font-semibold rounded-lg shadow-sm"
                >
                    {getTranslatedText("Done")}
                </motion.button>
            </header>

            <section className="bg-white p-4 rounded-xl shadow-sm">
                <div className="grid grid-cols-3 gap-3">
                    {availableCategories.map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategoryToggle(cat.id)}
                            className={`relative p-3 rounded-lg flex flex-col items-center gap-2 border-2 transition-all ${selectedCategories.includes(cat.id)
                                ? 'border-sky-500 bg-sky-50 text-sky-700'
                                : 'border-slate-200 bg-slate-50 text-slate-500'
                                }`}
                        >
                            <span className="text-3xl">{renderCategoryIcon(cat.icon, cat.name)}</span>
                            <span className="text-sm font-medium text-center leading-tight">{cat.name}</span>
                            
                            {/* Checkmark indicator for better UX */}
                            {selectedCategories.includes(cat.id) && (
                                <div className="absolute top-2 right-2 bg-sky-500 w-4 h-4 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default ScrapperCategoryListPage;
