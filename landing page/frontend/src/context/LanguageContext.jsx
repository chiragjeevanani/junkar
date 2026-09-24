import React, { createContext, useState, useContext } from 'react';

const translations = {
    en: {
        nav_home: "Home",
        nav_about: "About",
        nav_contact: "Contact",
        nav_app: "App",
        nav_get_app: "Get App",

        hero_badge: "Direct Doorstep Pickup",
        hero_title_turn: "Turn Your",
        hero_title_trash: "Trash",
        hero_title_into: "into",
        hero_title_cash: "Cash!",
        hero_subtitle: "Sell your scrap easily with real-time market rates and hassle-free doorstep pickup. Join the green revolution today!",
        hero_download: "Download App",
        hero_sellers: "Active Sellers",
        hero_scrappers: "Verified Scrappers",
        hero_cash: "Cash Paid Out",

        // Live Prices
        live_badge: "Live Market Rates",
        live_title: "Transparent Pricing",
        live_subtitle: "We provide the best market rates based on daily fluctuations.",
        price_plastic: "Plastic",
        price_metal: "Metal",
        price_paper: "Paper",
        price_copper: "Copper",
        price_electronics: "Electronics",
        price_aluminium: "Aluminium",

        // Categories
        cat_title: "Scrap Categories",
        cat_subtitle: "What are you looking to recycle today?",
        cat_desc_plastic: "PET bottles, HDPE containers, LDPE films",
        cat_desc_metal: "Iron rods, tin cans, engine parts",
        cat_desc_paper: "Newspapers, cardboard boxes, magazines",
        cat_desc_electronics: "PCBs, mobile phones, chargers",
        cat_desc_copper: "Electrical wires, pipes, utensils",
        cat_desc_aluminium: "Soda cans, window frames, foil",
        cat_desc_steel: "Kitchenware, industrial scrap",
        cat_desc_brass: "Fittings, valves, ornaments",

        // How It Works
        how_title: "Simple & Efficient",
        how_subtitle: "How Junkar works for you",
        step1_title: "Select Scrap",
        step1_desc: "Choose the categories of scrap you want to sell.",
        step2_title: "Schedule",
        step2_desc: "Pick a convenient time for doorstep pickup.",
        step3_title: "Collection",
        step3_desc: "Our verified scrapper collects the material.",
        step4_title: "Get Paid",
        step4_desc: "Receive instant payments securely on the spot.",

        // Features / Why Choose Junkar
        feat_title: "Why Choose Junkar?",
        feat_subtitle: "Building a cleaner future, one pickup at a time.",
        feat1_title: "Free Pickup",
        feat1_desc: "No hidden charges for pickups at your location.",
        feat2_title: "Verified Scrappers",
        feat2_desc: "All collectors are background verified for your safety.",
        feat3_title: "Cash on Pickup",
        feat3_desc: "Instant digital or cash payments as per your preference.",

        // About
        about_title: "Our Mission",
        about_desc: "Junkar is a digital platform that connects households with verified scrap collectors. The goal is to make recycling easy, transparent, and profitable while helping the environment. We believe that what is 'junk' to one can be a resource for another, and our mission is to facilitate that transition seamlessly.",
        about_btn: "Learn More About Sustainability",

        // App Section
        app_title: "Download the Junkar App",
        app_desc: "Track live prices, schedule recurring pickups, and manage your earnings all in one place. Your digital companion for a cleaner tomorrow.",

        // Testimonials
        test_title: "What Our Users Say",
        test_subtitle: "Hear from people who have turned their trash into cash.",
        test1_desc: "\"Junkar made it so easy to get rid of old electronics. The pickup was on time and I got paid instantly!\"",
        test2_desc: "\"Transparent pricing is what I like most. No more bargaining with local scrappers. Very professional service.\"",
        test3_desc: "\"A great initiative for the environment. Easy to use app and reliable staff. Highly recommended!\"",
        test_homeowner: "Homeowner",
        test_shopowner: "Shop Owner",
        test_environ: "Environmentalist",

        // Contact
        contact_title: "Get in Touch",
        contact_subtitle: "Have questions? We're here to help you start your recycling journey.",
        contact_phone: "Phone",
        contact_email: "Email",
        contact_office: "Office",
        contact_name: "Name",
        contact_name_ph: "Your Name",
        contact_email_ph: "Your Email",
        contact_msg: "Message",
        contact_msg_ph: "How can we help?",
        contact_send: "Send Message",

        // Footer
        footer_desc: "Making recycling transparent, easy, and rewarding for everyone.",
        footer_quicklinks: "Quick Links",
        footer_support: "Support",
        footer_stay: "Stay Updated",
        footer_join: "Join",
        footer_privacy: "Privacy Policy",
        footer_terms: "Terms of Service",
        footer_help: "Help Center",
        footer_faq: "FAQs",
        footer_copyright: "© 2026 Junkar Technologies. All rights reserved. Made with ❤️ for the Planet."
    },
    hi: {
        nav_home: "होम",
        nav_about: "हमारे बारे में",
        nav_contact: "संपर्क करें",
        nav_app: "ऐप",
        nav_get_app: "ऐप प्राप्त करें",

        hero_badge: "सीधे दरवाजे पर पिकअप",
        hero_title_turn: "अपने",
        hero_title_trash: "कचरे",
        hero_title_into: "को बदलें",
        hero_title_cash: "कैश में!",
        hero_subtitle: "वास्तविक बाजार दरों और परेशानी मुक्त दरवाजे पर पिकअप के साथ अपना कबाड़ आसानी से बेचें। आज ही हरित क्रांति से जुड़ें!",
        hero_download: "ऐप डाउनलोड करें",
        hero_sellers: "सक्रिय विक्रेता",
        hero_scrappers: "सत्यापित स्क्रैपर्स",
        hero_cash: "कैश भुगतान",

        live_badge: "लाइव बाजार दरें",
        live_title: "पारदर्शी कीमत",
        live_subtitle: "हम दैनिक उतार-चढ़ाव के आधार पर सर्वोत्तम बाजार दरें प्रदान करते हैं।",
        price_plastic: "प्लास्टिक",
        price_metal: "धातु (लोहा)",
        price_paper: "कागज",
        price_copper: "तांबा (कॉपर)",
        price_electronics: "इलेक्ट्रॉनिक्स",
        price_aluminium: "एल्युमिनियम",

        // Categories
        cat_title: "स्क्रैप श्रेणियां",
        cat_subtitle: "आप आज क्या रीसायकल करना चाहते हैं?",
        cat_desc_plastic: "पीईटी बोतलें, एचडीपीई कंटेनर, प्लास्टिक",
        cat_desc_metal: "लोहे की छड़ें, टिन के डिब्बे, ऑटो पार्ट्स",
        cat_desc_paper: "अखबार, कार्डबोर्ड बॉक्स, पत्रिकाएं",
        cat_desc_electronics: "पीसीबी, मोबाइल फोन, चार्जर",
        cat_desc_copper: "बिजली के तार, पाइप, बर्तन",
        cat_desc_aluminium: "सोडा के डिब्बे, खिड़की के फ्रेम, पन्नी",
        cat_desc_steel: "रसोई के बर्तन, औद्योगिक स्क्रैप",
        cat_desc_brass: "फिटिंग, वाल्व, आभूषण",

        // How It Works
        how_title: "सरल और प्रभावी",
        how_subtitle: "जुनकार आपके लिए कैसे काम करता है",
        step1_title: "स्क्रैप चुनें",
        step1_desc: "आप जो भी कबाड़ बेचना चाहते हैं, उसे चुनें।",
        step2_title: "समय तय करें",
        step2_desc: "घर से पिकअप के लिए सुविधाजनक समय चुनें।",
        step3_title: "कलेक्शन",
        step3_desc: "हमारा सत्यापित स्क्रैपर माल लेगा।",
        step4_title: "भुगतान पाएं",
        step4_desc: "मौके पर ही सुरक्षित रूप से तुरंत नकद प्राप्त करें।",

        // Features
        feat_title: "जुनकार क्यों चुनें?",
        feat_subtitle: "हर पिकअप के साथ एक स्वच्छ भविष्य का निर्माण।",
        feat1_title: "मुफ्त पिकअप",
        feat1_desc: "आपके स्थान से पिकअप के लिए कोई छिपी हुई फीस नहीं।",
        feat2_title: "सत्यापित स्क्रैपर्स",
        feat2_desc: "आपकी सुरक्षा के लिए सभी कलेक्टरों का वेरिफिकेशन किया गया है।",
        feat3_title: "तुरंत कैश",
        feat3_desc: "आपकी पसंद के अनुसार तत्काल डिजिटल या नकद भुगतान।",

        // About
        about_title: "हमारा मिशन",
        about_desc: "जुनकार एक डिजिटल प्लेटफॉर्म है जो घरों को सत्यापित कबाड़ी वालों से जोड़ता है। हमारा लक्ष्य रिसाइकलिंग को आसान, पारदर्शी और लाभदायक बनाना है। हमारा मानना ​​है कि जो एक के लिए 'कचरा' है वह दूसरे के लिए संसाधन हो सकता है।",
        about_btn: "स्थिरता के बारे में और जानें",

        // App Section
        app_title: "जुनकार ऐप डाउनलोड करें",
        app_desc: "लाइव कीमतें ट्रैक करें, नियमित पिकअप शेड्यूल करें और अपनी कमाई को एक ही जगह मैनेज करें। एक स्वच्छ कल के लिए आपका डिजिटल साथी।",

        // Testimonials
        test_title: "हमारे यूजर्स क्या कहते हैं",
        test_subtitle: "उन लोगों से सुनें जिन्होंने अपने कचरे को कैश में बदला है।",
        test1_desc: "\"जुनकार ने पुराने इलेक्ट्रॉनिक्स से छुटकारा पाना बहुत आसान कर दिया। पिकअप समय पर हुआ!\"",
        test2_desc: "\"मुझे पारदर्शी मूल्य निर्धारण सबसे ज्यादा पसंद है। कबाड़ी वालों से कोई मोलभाव नहीं।\"",
        test3_desc: "\"पर्यावरण के लिए एक शानदार पहल। इस्तेमाल में आसान ऐप और भरोसेमंद लोग।\"",
        test_homeowner: "मकान मालिक",
        test_shopowner: "दुकानदार",
        test_environ: "पर्यावरण प्रेमी",

        // Contact
        contact_title: "संपर्क करें",
        contact_subtitle: "कोई सवाल? आप अपनी रीसायकल यात्रा शुरू करने के लिए हमसे संपर्क कर सकते हैं।",
        contact_phone: "फ़ोन",
        contact_email: "ईमेल",
        contact_office: "ऑफिस",
        contact_name: "नाम",
        contact_name_ph: "आपका नाम",
        contact_email_ph: "आपका ईमेल",
        contact_msg: "संदेश",
        contact_msg_ph: "हम कैसे मदद कर सकते हैं?",
        contact_send: "संदेश भेजें",

        // Footer
        footer_desc: "रीसाइक्लिंग को सभी के लिए पारदर्शी, आसान और फायदेमंद बनाना।",
        footer_quicklinks: "क्विक लिंक",
        footer_support: "सपोर्ट",
        footer_stay: "अपडेट रहें",
        footer_join: "जुड़ें",
        footer_privacy: "गोपनीयता नीति",
        footer_terms: "सेवा की शर्तें",
        footer_help: "सहायता केंद्र",
        footer_faq: "अक्सर पूछे जाने वाले प्रश्न",
        footer_copyright: "© 2026 Junkar Technologies. सर्वाधिकार सुरक्षित।"
    }
};

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    const t = (key) => {
        return translations[language]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
