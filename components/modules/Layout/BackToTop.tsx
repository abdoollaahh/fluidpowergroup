// components/BackToTop.tsx
import { useState, useEffect } from 'react';
import { FiArrowUp } from 'react-icons/fi';

const BackToTop = () => {
  console.log("BackToTop component rendered");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Function to handle scroll event
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Add event listener
    window.addEventListener('scroll', toggleVisibility);
    
    // Initial check in case page is already scrolled
    toggleVisibility();
    
    // Clean up event listener on component unmount
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
        onClick={scrollToTop}
        className="fixed bottom-6 left-6 bg-yellow-400 hover:bg-yellow-500 text-black p-3 rounded-full shadow-lg z-50 transition-all duration-300 opacity-80 hover:opacity-100"
        aria-label="Back to top"
      >
        <FiArrowUp className="text-xl" />
      </button>
      )}
    </>
  );
};

export default BackToTop;