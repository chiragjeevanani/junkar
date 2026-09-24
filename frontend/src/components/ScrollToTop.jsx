import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        // If there is a hash, let the browser handle scrolling to the element
        if (hash) {
            const element = document.getElementById(hash.replace('#', ''));
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // Otherwise, scroll to the top of the page
            window.scrollTo(0, 0);
        }
    }, [pathname, hash]);











    
    return null;
};

export default ScrollToTop;
