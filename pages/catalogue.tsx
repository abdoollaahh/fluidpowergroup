import withLayout from "@/hoc/withLayout";
import { ProductSlider } from "@/views/Catalogue";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Category } from "types/products";
import Loading from "@/modules/Loading";

const CataloguePage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Don't run until router is ready
    if (!router.isReady) return;

    const fetchCategories = async () => {
      try {
        console.log('Fetching categories...');
        const cat = await axios.get(`/api/getCategories`);
        console.log('Categories fetched:', cat.data.categories?.length || 0);
        setCategories(cat.data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [router.isReady]);

  // Handle router events for debugging
  useEffect(() => {
    const handleRouteStart = (url: string) => {
      console.log('Route changing from /catalogue to:', url);
    };
    
    const handleRouteComplete = (url: string) => {
      console.log('Route change complete to:', url);
      // Force refresh categories if returning to /catalogue
      if (url === '/catalogue' && router.isReady) {
        setLoading(true);
        setCategories([]); // Clear existing data
      }
    };

    router.events.on('routeChangeStart', handleRouteStart);
    router.events.on('routeChangeComplete', handleRouteComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteStart);
      router.events.off('routeChangeComplete', handleRouteComplete);
    };
  }, [router.events, router.isReady]);

  // Show loading while router is not ready or while fetching
  if (!router.isReady || loading) {
    return <Loading />;
  }

  // Show loading if categories is null/undefined (keep your existing check)
  if (categories === null || categories === undefined) {
    return <Loading />;
  }

  return (
    <div className="wrapper px-8 md:px-12  flex flex-col gap-10 mb-32">
      <div className="text-[4rem] md:text-[6rem] lg:text-[8rem] xl:text-[10rem] font-semibold text-slate-200/50 ">
        Products
      </div>
      <div className="flex flex-col gap-12">
        {categories.map((category: Category, i) => (
          <ProductSlider
            products={category.subCategories}
            title={category.title}
            btn={{
              title: "View All",
              href: `/products?category=${category.slug}`,
            }}
            key={i}
            description={category.description}
          />
        ))}
      </div>
    </div>
  );
};

export default CataloguePage;