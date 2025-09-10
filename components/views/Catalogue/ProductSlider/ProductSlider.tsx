import Anchor from "@/modules/Anchor";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import getProducts from "../../../../pages/api/getProducts"; // ✅ adjust if needed

// 🔑 In-memory cache shared across renders
const productCache: Record<string, any[]> = {};

// ✅ Keep your existing HTML stripper
const stripHtml = (html: string) => {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

const ProductSlider = ({ categoryId }: { categoryId: string }) => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
  
    const loadProducts = async () => {
      // 1. If cached, use that
      if (productCache[categoryId]) {
        setProducts(productCache[categoryId]);
        setLoading(false);
        return;
      }
  
      try {
        // 2. Call your API endpoint
        const res = await fetch(`/api/getProducts?category=${categoryId}`);
        const data = await res.json();
  
        if (mounted) {
          setProducts(data || []);
          productCache[categoryId] = data; // cache it
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setLoading(false);
      }
    };
  
    loadProducts();
    return () => {
      mounted = false;
    };
  }, [categoryId]);
  

  if (loading) {
    return <div className="text-center py-6">Loading products…</div>;
  }

  if (!products.length) {
    return <div className="text-center py-6">No products found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex space-x-4">
        {products.map((product, i) => {
          const cleanTitle = stripHtml(
            product.title?.replace(/ORing/g, "O-Ring") || ""
          );
          const cleanSubtitle = product.subtitle
            ? stripHtml(product.subtitle)
            : "";
          const cleanDescription = product.description
            ? stripHtml(product.description)
            : "";

          return (
            <motion.div
              key={product.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Anchor href={`/catalogue/${categoryId}/${product.slug}`}>
                <div className="w-64 h-80 flex-shrink-0 rounded-2xl shadow-md hover:shadow-lg transition-shadow bg-white">
                  <div className="relative w-full h-40">
                    <Image
                      src={product.image || "/placeholder.png"}
                      alt={cleanTitle}
                      layout="fill" // ✅ use layout instead of fill
                      className="object-cover rounded-t-2xl"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold truncate">
                      {cleanTitle}
                    </h3>
                    {cleanSubtitle && (
                      <p className="text-sm text-gray-500 truncate">
                        {cleanSubtitle}
                      </p>
                    )}
                    {cleanDescription && (
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {cleanDescription}
                      </p>
                    )}
                  </div>
                </div>
              </Anchor>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductSlider;
