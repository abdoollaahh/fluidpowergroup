import Anchor from "@/modules/Anchor";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { Product, SubCategory } from "types/products";

interface IProductSliderProps {
  title: string;
  description: string;
  products: any[];
  btn: {
    title: string;
    href: string;
  };
}

const ProductSlider = ({
  title,
  description,
  products,
  btn,
}: IProductSliderProps) => {
  const scrollRef = useRef<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Helper function to strip HTML tags and clean text
  const stripHtml = (html: string) => {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
      .replace(/&amp;/g, '&')  // Replace &amp; with &
      .replace(/&lt;/g, '<')   // Replace &lt; with <
      .replace(/&gt;/g, '>')   // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/&#39;/g, "'")  // Replace &#39; with '
      .replace(/\s+/g, ' ')    // Replace multiple spaces with single space
      .trim();                 // Remove leading/trailing spaces
  };

  // Scroll to specific tile
  const scrollToTile = (index: number) => {
    if (scrollRef.current) {
      const tileWidth = 280; // 256px + 24px gap
      
      // Update state immediately for instant visual feedback
      setCurrentIndex(index);
      
      scrollRef.current.scrollTo({
        left: index * tileWidth,
        behavior: 'smooth'
      });
    }
  };

  // Improved scroll tracking with debouncing and better position calculation
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (scrollRef.current) {
        // Clear existing timeout
        clearTimeout(scrollTimeout);
        
        // Debounce the scroll calculation
        scrollTimeout = setTimeout(() => {
          const scrollLeft = scrollRef.current.scrollLeft;
          const tileWidth = 280;
          const containerWidth = scrollRef.current.clientWidth;
          
          // Better calculation that accounts for partial visibility
          let newIndex = Math.round(scrollLeft / tileWidth);
          
          // Handle edge case for last item
          const maxScrollLeft = scrollRef.current.scrollWidth - containerWidth;
          if (scrollLeft >= maxScrollLeft - 10) { // 10px tolerance
            newIndex = products.length - 1;
          }
          
          const boundedIndex = Math.max(0, Math.min(newIndex, products.length - 1));
          
          if (boundedIndex !== currentIndex) {
            setCurrentIndex(boundedIndex);
          }
        }, 100); // 100ms debounce
      }
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll, { passive: true });
      
      // Also listen for scrollend event if available (modern browsers)
      if ('onscrollend' in scrollElement) {
        scrollElement.addEventListener('scrollend', handleScroll, { passive: true });
      }
      
      return () => {
        scrollElement.removeEventListener('scroll', handleScroll);
        if ('onscrollend' in scrollElement) {
          scrollElement.removeEventListener('scrollend', handleScroll);
        }
        clearTimeout(scrollTimeout);
      };
    }
  }, [currentIndex, products.length]);

  return (
    <div className="w-full flex flex-col gap-8 lg:pl-16">
      {/* Mobile title - shows on small screens - Strip HTML from description */}
      <motion.div className="flex lg:hidden flex-col shrink-0 w-full justify-center gap-4 px-4">
        <h2 className="text-3xl font-semibold">{stripHtml(title)}</h2>
        <div>{stripHtml(description)}</div>
      </motion.div>

      {/* Desktop layout with working horizontal scroll */}
      <div className="w-full relative">
        {/* Scrollable container */}
        <div 
          ref={scrollRef}
          className="w-full overflow-x-auto hide-scrollbar"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {/* Content container */}
          <div 
            className="flex gap-4 pb-4 pl-1 pr-12 pt-16"
            style={{ width: 'max-content' }}
          >
            {/* Desktop title - first item in the flex - Strip HTML from both title and description */}
            <div className="hidden lg:flex flex-col shrink-0 w-56 h-72 justify-center py-4 gap-4 bg-white">
              <h2 className="text-3xl font-semibold">{stripHtml(title)}</h2>
              <div className="font-light">{stripHtml(description)}</div>
            </div>

            {/* Product cards with magnetic expandable effect */}
            {products.map((product, i) => {
              const isHovered = hoveredIndex === i;
              const isNeighbor = hoveredIndex !== null && Math.abs(hoveredIndex - i) === 1;
              const isDistant = hoveredIndex !== null && Math.abs(hoveredIndex - i) > 1;
              
              return (
                <Anchor
                  href={
                    product.price
                      ? `$/products/${product.slug}`
                      : `/products?subcategory=${product.slug}`
                  }
                  key={i}
                  className="hover:no-underline z-10"
                >
                  <div 
                    className={`
                      flex flex-col w-56 cursor-pointer border-slate-800 border-[1px] p-4 shadow-xl rounded-2xl 
                      transition-all duration-500 ease-out transform
                      ${isHovered ? 'hover:shadow-2xl hover:-translate-y-2 z-20 scale-110' : ''}
                      ${isNeighbor ? 'scale-95 opacity-80' : ''}
                      ${isDistant ? 'scale-90 opacity-60' : ''}
                    `}
                    style={{
                      height: '288px',
                      transformOrigin: 'bottom center'
                    }}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Image area */}
                    <motion.div className="w-full h-36 relative transition-all duration-300 mb-4 rounded-lg overflow-hidden">
                      <Image
                        layout="fill"
                        src={product.image || "/product-4.png"}
                        blurDataURL="/product-2.png"
                        placeholder="blur"
                        className="object-contain transition-all duration-300"
                        alt="product"
                      />
                    </motion.div>
                    
                    {/* Text content with expansion - Strip HTML from all text fields */}
                    <div className="flex-1 flex flex-col justify-center text-center">
                      {/* Main title - smart display based on hover and data availability */}
                      <h3 className={`font-bold transition-all duration-500 ${
                        isHovered ? 'text-lg' : 'text-base'
                      }`}>
                        {isHovered && product.shortTitle ? (
                          <div>
                            <div>{stripHtml(product.shortTitle)}</div>
                            <div className="text-sm font-normal text-gray-700 mt-1">
                              {(() => {
                                // Combine subtitle and description intelligently - Strip HTML from both
                                let combinedText = '';
                                let additionalDetail = '';
                                
                                if (product.subtitle) {
                                  // Remove parentheses from subtitle and add description - Strip HTML first
                                  const cleanSubtitle = stripHtml(product.subtitle).replace(/[()]/g, '');
                                  
                                  if (product.description) {
                                    // Filter out redundant parts from description and strip HTML
                                    let desc = stripHtml(product.description);
                                    desc = desc.replace(/.*\([A-Z]+\)\s*/g, ''); // Remove "O-Ring Flat Seal (ORFS)"
                                    desc = desc.replace(/^[A-Z]+\s+/g, ''); // Remove standalone acronyms
                                    desc = desc.trim();
                                    
                                    // Special handling for hose products - extract finish details
                                    if (product.shortTitle && stripHtml(product.shortTitle).includes('Wire Braided Hose')) {
                                      // Look for finish details like "Two Wire Wrap and Smooth Finish"
                                      const finishMatch = desc.match(/(Two Wire Wrap and Smooth Finish|Wire Wrap and Smooth Finish|Smooth Finish)/i);
                                      if (finishMatch) {
                                        additionalDetail = finishMatch[0];
                                        desc = desc.replace(finishMatch[0], '').replace(/\s+/g, ' ').trim();
                                      }
                                    }
                                    
                                    combinedText = `${cleanSubtitle} ${desc}`;
                                  } else {
                                    combinedText = cleanSubtitle;
                                  }
                                } else if (product.description) {
                                  combinedText = stripHtml(product.description);
                                }
                                
                                return (
                                  <div>
                                    <div>{combinedText}</div>
                                    {additionalDetail && (
                                      <div className="text-xs text-gray-600 mt-1">{additionalDetail}</div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        ) : (
                          <div className="truncate">
                            {/* Transform the display title to fix spelling and strip HTML */}
                            {stripHtml(product.title.replace(/ORing/g, 'O-Ring'))}
                          </div>
                        )}
                      </h3>
                      
                      {/* Price display only */}
                      {product.price && (
                        <div className="text-lg font-medium mt-2">
                          {stripHtml(product.price)}
                        </div>
                      )}
                    </div>
                  </div>
                </Anchor>
              );
            })}
          </div>
        </div>

        {/* Dots Indicator - Always visible, positioned under first tile */}
        <div className="flex items-center gap-3 mt-6 px-4 lg:px-4 lg:ml-80">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToTile(index)}
              className="flex items-center justify-center transition-all duration-300 flex-shrink-0"
              style={{ 
                width: '32px', 
                height: '32px',
                minWidth: '32px', 
                minHeight: '32px',
                transform: 'none',
                border: 'none',
                outline: 'none',
                padding: 0
              }}
              aria-label={`Go to slide ${index + 1}`}
            >
              <div
                className="rounded-full flex items-center justify-center transition-all duration-300"
                style={{ 
                  width: '30px',
                  height: '30px',
                  backgroundColor: index === currentIndex ? '#ffc100' : '#ffffff',
                  border: '2px solid #000',
                  transform: 'none'
                }}
              />
            </button>
          ))}
          
          {/* Progress text */}
          <span className="text-sm text-gray-600 ml-4">
            {currentIndex + 1} of {products.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductSlider;