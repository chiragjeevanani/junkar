// Initialize Lucide Icons
lucide.createIcons();

// Sticky Navbar effect
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Active link highlighting on scroll
const sections = document.querySelectorAll('section');
const navItems = document.querySelectorAll('.nav-links a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 100)) {
            current = section.getAttribute('id');
        }
    });

    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === `#${current}`) {
            item.classList.add('active');
        }
    });
});

// Smooth scroll for nav links (Standard browser behavior is enabled via CSS, 
// but we can add more controlled JS behavior if needed)
navItems.forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for reveal animations
const revealOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
        }
    });
};

const observer = new IntersectionObserver(revealCallback, revealOptions);

// Add reveal classes to elements we want to animate
const elementsToAnimate = [
    '.category-card',
    '.step-item',
    '.benefit-card',
    '.testimonial-card',
    '.price-card',
    '.section-header'
];

elementsToAnimate.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
        el.classList.add('reveal-on-scroll');
        observer.observe(el);
    });
});

// Mobile Menu Toggle (Basic implementation)
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        // Toggle logic here (could inject a modal or just toggle height)
        alert('Mobile menu clicked! In a full implementation, this would open a slide-out menu.');
    });
}

// Pricing update simulation (every 5 seconds)
const priceValues = document.querySelectorAll('.price-card .value');
setInterval(() => {
    priceValues.forEach(val => {
        const currentVal = parseInt(val.innerText.replace('₹', '').replace('/kg', ''));
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        const newVal = Math.max(10, currentVal + change);
        
        // Add a small shimmer effect
        val.style.opacity = '0.5';
        setTimeout(() => {
            val.innerText = `₹${newVal}${val.innerText.includes('/kg') ? '/kg' : '/kg'}`;
            val.style.opacity = '1';
        }, 100);
    });
}, 5000);
