import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BannerItem {
  id: string;
  type: 'announcement' | 'deal' | 'product';
  title: string;
  description: string;
  href: string;
  ctaText: string;
  target?: '_self' | '_blank';
  active: boolean;
  startDate: string;
  endDate: string;
}

interface CompanyNewsBannerProps {
  sheetId: string; // Google Sheet ID
}

const CompanyNewsBanner = ({ sheetId }: CompanyNewsBannerProps) => {
  const [bannerData, setBannerData] = useState<{
    announcements: BannerItem[];
    deals: BannerItem[];
    products: BannerItem[];
  }>({
    announcements: [],
    deals: [],
    products: []
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for current indices
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0);
  const [currentDeal, setCurrentDeal] = useState(0);
  const [currentProduct, setCurrentProduct] = useState(0);

  // Fetch data from Google Sheets
  useEffect(() => {
    const fetchBannerData = async () => {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('No data found in spreadsheet');
        }
        
        const rawData: BannerItem[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          // Better CSV parsing to handle commas in content
          const values: string[] = [];
          let current = '';
          let inQuotes = false;
          
          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim());
          
          // Skip empty rows
          if (!values[0] || values[0].trim() === '') {
            continue;
          }
          
          if (values.length >= 8) {
            const item: BannerItem = {
              id: `${values[0]}-${i}`,
              type: values[0] as 'announcement' | 'deal' | 'product',
              title: values[1],
              description: values[2],
              href: values[3],
              ctaText: values[4],
              active: values[5].toLowerCase() === 'true',
              startDate: values[6],
              endDate: values[7],
              target: '_self'
            };
            
            rawData.push(item);
          }
        }
        
        // Filter active items within date range
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        const activeItems = rawData.filter(item => {
          if (!item.active) return false;
          if (item.startDate && item.startDate > today) return false;
          if (item.endDate && item.endDate < today) return false;
          return true;
        });
        
        // Group by type
        const announcements = activeItems.filter(item => item.type === 'announcement');
        const deals = activeItems.filter(item => item.type === 'deal');
        const products = activeItems.filter(item => item.type === 'product');
        
        setBannerData({ announcements, deals, products });
        setLoading(false);
        
      } catch (err: any) {
        console.error('Error fetching banner data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load banner content';
        setError(`Failed to load banner content: ${errorMessage}`);
        setLoading(false);
      }
    };

    if (sheetId) {
      fetchBannerData();
      
      // Refresh data every 5 minutes
      const interval = setInterval(fetchBannerData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [sheetId]);

  // Auto-rotation effects
  useEffect(() => {
    if (bannerData.announcements.length > 1) {
      const interval = setInterval(() => {
        setCurrentAnnouncement(prev => (prev + 1) % bannerData.announcements.length);
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [bannerData.announcements.length]);

  useEffect(() => {
    if (bannerData.deals.length > 1) {
      const interval = setInterval(() => {
        setCurrentDeal(prev => (prev + 1) % bannerData.deals.length);
      }, 4500);
      return () => clearInterval(interval);
    }
  }, [bannerData.deals.length]);

  useEffect(() => {
    if (bannerData.products.length > 1) {
      const interval = setInterval(() => {
        setCurrentProduct(prev => (prev + 1) % bannerData.products.length);
      }, 7500);
      return () => clearInterval(interval);
    }
  }, [bannerData.products.length]);

  // Calculate section widths - UPDATED FOR EQUAL SPACING
  const hasAnnouncements = bannerData.announcements.length > 0;
  const hasDeals = bannerData.deals.length > 0;
  const hasProducts = bannerData.products.length > 0;

  const getSectionWidths = () => {
    const activeSections = [hasAnnouncements, hasDeals, hasProducts].filter(Boolean).length;
    
    if (activeSections === 3) {
      // Equal width for all three sections (33.33% each)
      return { announcements: 'lg:w-1/3', deals: 'lg:w-1/3', products: 'lg:w-1/3' };
    } else if (activeSections === 2) {
      // Equal width for two sections (50% each)
      return { announcements: 'lg:w-1/2', deals: 'lg:w-1/2', products: 'lg:w-1/2' };
    } else {
      // Full width for single section
      return { announcements: 'lg:w-full', deals: 'lg:w-full', products: 'lg:w-full' };
    }
  };

  const sectionWidths = getSectionWidths();

  // Render functions
  const renderCard = (item: BannerItem, sectionType: string, isMobile: boolean = false) => {
    const getIcon = () => {
      switch (item.type) {
        case 'announcement': return '📢';
        case 'deal': return '🎯';
        case 'product': return '⭐';
        default: return '📢';
      }
    };

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full flex items-center justify-between p-4 lg:p-6 absolute inset-0"
      >
        <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
          <span className="text-2xl lg:text-3xl flex-shrink-0" role="img" aria-label={item.type}>
            {getIcon()}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm lg:text-base truncate">
              {item.title}
            </h3>
            <p className="text-gray-300 text-xs lg:text-sm lg:whitespace-normal lg:leading-relaxed truncate lg:max-h-10 lg:overflow-hidden">
              {item.description}
            </p>
          </div>
        </div>

        {!isMobile && (
          <div className="hidden lg:block ml-4 flex-shrink-0">
            <a
              href={item.href}
              target={item.target || '_self'}
              className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-yellow-500 transition-colors duration-200 whitespace-nowrap"
            >
              {item.ctaText}
            </a>
          </div>
        )}
      </motion.div>
    );
  };

  const renderSection = (
    items: BannerItem[], 
    currentIndex: number, 
    setCurrentIndex: (index: number) => void,
    sectionType: string, 
    widthClass: string,
    title: string
  ) => {
    if (items.length === 0) return null;

    const currentItem = items[currentIndex];

    return (
      <div className={`${widthClass} h-full flex-shrink-0`}>
        <div className="lg:hidden flex items-center justify-between p-3 border-b border-gray-700">
          <span className="text-yellow-400 font-medium text-sm">{title}</span>
          {items.length > 1 && (
            <span className="text-gray-400 text-xs">
              {currentIndex + 1} of {items.length}
            </span>
          )}
        </div>

        <div className="relative h-[80px] lg:h-[100px] overflow-hidden">
          <a 
            href={currentItem.href} 
            target={currentItem.target || '_self'} 
            className="lg:hidden block h-full relative"
          >
            <AnimatePresence>
              {renderCard(currentItem, sectionType, true)}
            </AnimatePresence>
          </a>

          <div className="hidden lg:block h-full relative">
            <AnimatePresence>
              {renderCard(currentItem, sectionType, false)}
            </AnimatePresence>
          </div>

          {/* Enhanced Progress indicators - WHITE OUTER CIRCLES */}
          {items.length > 1 && (
            <div className="absolute bottom-1 lg:bottom-1 right-3 lg:right-4 flex gap-2 lg:gap-3 z-10">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className="flex items-center justify-center transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 flex-shrink-0 rounded-full"
                  style={{ 
                    width: '20px', 
                    height: '20px',
                    minWidth: '20px', 
                    minHeight: '20px',
                    backgroundColor: 'white', // WHITE OUTER CIRCLE
                    transform: 'none',
                    border: 'none',
                    outline: 'none',
                    padding: 0
                  }}
                  aria-label={`Go to ${sectionType} ${index + 1}`}
                >
                  <div
                    className="rounded-full transition-all duration-200"
                    style={{ 
                      width: '16px',
                      height: '16px',
                      backgroundColor: index === currentIndex ? '#facc15' : '#6b7280',
                      transform: 'none'
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:block absolute top-0 right-0 w-px h-full bg-gray-700"></div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full bg-gray-900 border-b border-gray-700 shadow-lg pt-10">
        <div className="wrapper">
          <div className="flex items-center justify-center h-[100px]">
            <div className="text-gray-400 text-sm">Loading banner content...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full bg-gray-900 border-b border-gray-700 shadow-lg pt-10">
        <div className="wrapper">
          <div className="flex items-center justify-center h-[100px]">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no content
  if (!hasAnnouncements && !hasDeals && !hasProducts) {
    return null;
  }

  return (
    <div className="w-full bg-gray-900 border-b border-gray-700 shadow-lg pt-10">
      <div className="wrapper">
        <div className="flex flex-col lg:flex-row min-h-[140px] lg:h-[100px] lg:gap-0 relative">
          {hasAnnouncements && renderSection(
            bannerData.announcements, 
            currentAnnouncement,
            setCurrentAnnouncement,
            'announcements', 
            sectionWidths.announcements,
            'Announcements'
          )}
          
          {hasDeals && renderSection(
            bannerData.deals, 
            currentDeal,
            setCurrentDeal,
            'deals', 
            sectionWidths.deals,
            'Deals'
          )}
          
          {hasProducts && renderSection(
            bannerData.products, 
            currentProduct,
            setCurrentProduct,
            'products', 
            sectionWidths.products,
            'New Products'
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyNewsBanner;