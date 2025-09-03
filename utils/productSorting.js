// utils/productSorting.js
export const sortProductsAlphanumerically = (products) => {
    return products.sort((a, b) => {
      // Get the name/title from either product format
      const nameA = a.name || a.title || '';
      const nameB = b.name || b.title || '';
      
      // Define category order for hydraulic adaptors with exact matching patterns
      const categoryOrder = [
        { name: 'Straight', keywords: ['straight'] },
        { name: 'Elbow - 45°', keywords: ['elbow', '45'] },
        { name: 'Elbow - 90°', keywords: ['elbow', '90'] },
        { name: 'TEEs', keywords: ['tee', 'tees'] },
        { name: 'BulkHeads', keywords: ['bulkhead', 'bulkheads'] },
        { name: 'Cross - X', keywords: ['cross'] },
        { name: 'Nuts & Sleeves', keywords: ['nuts', 'sleeves'] },
        { name: 'Nuts & Rings', keywords: ['nuts', 'rings'] },
        { name: 'Caps & Plugs', keywords: ['caps', 'plugs'] }
      ];
      
      // Check if these are category names (not FPG- product codes)
      const getCategoryOrderIndex = (name) => {
        const lowerName = name.toLowerCase();
        
        // Find the category that matches this name
        for (let i = 0; i < categoryOrder.length; i++) {
          const category = categoryOrder[i];
          
          // Check if all keywords for this category are present in the name
          const hasAllKeywords = category.keywords.every(keyword => 
            lowerName.includes(keyword.toLowerCase())
          );
          
          if (hasAllKeywords) {
            return i;
          }
        }
        
        return -1;
      };
      
      const orderA = getCategoryOrderIndex(nameA);
      const orderB = getCategoryOrderIndex(nameB);
      
      // If both items are in the predefined category order, sort by that order
      if (orderA !== -1 && orderB !== -1) {
        return orderA - orderB;
      }
      
      // If only one is in the category order, prioritize it
      if (orderA !== -1) return -1;
      if (orderB !== -1) return 1;
      
      // For FPG- products or other alphanumeric codes, use the original logic
      const extractSortKey = (name) => {
        // Handle patterns like "FPG-1J9", "FPG-2SCCS", etc.
        const match = name.match(/FPG-(.+)$/i);
        if (match) {
          return match[1]; // Return everything after "FPG-"
        }
        return name; // Fallback to full name if pattern doesn't match
      };
      
      const keyA = extractSortKey(nameA);
      const keyB = extractSortKey(nameB);
      
      // Custom alphanumeric comparison
      const compareAlphanumeric = (str1, str2) => {
        // Split into segments of letters and numbers
        const segmentize = (str) => {
          return str.match(/(\d+|\D+)/g) || [str];
        };
        
        const segmentsA = segmentize(str1.toLowerCase());
        const segmentsB = segmentize(str2.toLowerCase());
        
        const maxLength = Math.max(segmentsA.length, segmentsB.length);
        
        for (let i = 0; i < maxLength; i++) {
          const segA = segmentsA[i] || '';
          const segB = segmentsB[i] || '';
          
          // If both segments are numeric, compare numerically
          if (/^\d+$/.test(segA) && /^\d+$/.test(segB)) {
            const numA = parseInt(segA);
            const numB = parseInt(segB);
            if (numA !== numB) {
              return numA - numB;
            }
          } else {
            // Otherwise, compare lexicographically
            if (segA !== segB) {
              return segA.localeCompare(segB);
            }
          }
        }
        
        return 0;
      };
      
      return compareAlphanumeric(keyA, keyB);
    });
  };