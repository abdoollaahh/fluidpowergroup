import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { v4 as uuid } from "uuid";
import Categories from "./Categories";
import SubCategories from "./SubCategories";
import { Category } from "types/products";

interface ProductMenuHeaderProps {
  categories: Category[];
  onClose?: () => void; // Add optional close handler
}

const ProductMenuHeader = ({ categories, onClose }: ProductMenuHeaderProps) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const router = useRouter();

  // Set initial category
  useEffect(() => {
    if (categories.length !== 0) {
      setSelectedCategory(categories[0]);
    }
  }, [categories]);

  // Close dropdown on route change (mobile navigation fix)
  useEffect(() => {
    const handleRouteChange = () => {
      // Close the dropdown when route changes
      if (onClose) {
        onClose();
      }
    };

    // Listen for route changes
    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteChange);

    // Cleanup
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events, onClose]);

  // Close dropdown when clicking outside or pressing escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      // Only close on mobile when clicking outside
      if (window.innerWidth <= 1024 && onClose) {
        const target = event.target as HTMLElement;
        // Check if click is outside the dropdown area
        if (!target.closest('[data-dropdown="product-menu"]')) {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  if (selectedCategory === null) {
    return null;
  }

  return (
    <motion.div 
      className="absolute w-full left-0 z-40"
      data-dropdown="product-menu"
    >
      <motion.div
        className="backdrop-blur-3xl py-16 px-10 xl:px-28 w-full z-30"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
        exit={{ opacity: 0, y: -50, transition: { duration: 0.2 } }}
      >
        <div className="wrapper flex">
          <Categories
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          <SubCategories subCategories={selectedCategory.subCategories} />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductMenuHeader;