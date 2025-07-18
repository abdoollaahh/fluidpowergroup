import Footer from "@/modules/Footer";
import Header from "@/modules/Header";
import { useEffect, useState } from "react";
import { useRouter } from 'next/router';
import CartWrapper from "context/CartWrapper";
import { AnimatePresence, motion } from "framer-motion";
import type { AppProps } from "next/app";
import Head from "next/head";
import "styles/globals.css";
import axios from "axios";
import { Category } from "types/products";

function MyApp({ Component, pageProps, router }: AppProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const nextRouter = useRouter(); // Get router instance for logging

  useEffect(() => {
    const categories = async () => {
      let cat;
      do {
        cat = await axios.get(
          `/api/getCategories`
        );
      } while (cat.data.categories[0].subCategories.length === 0);
      return cat;
    };

    categories().then((result: any) => {
      setCategories(result.data.categories);
    });
  }, [Component]);

  // Add payment debug logging
  useEffect(() => {
    // Only log if we're in the browser (not during SSR)
    if (typeof window !== 'undefined') {
      console.log('=== PAYMENT DEBUG INFO ===');
      console.log('Full URL:', window.location.href);
      console.log('Pathname:', nextRouter.pathname);
      console.log('AsPath:', nextRouter.asPath);
      console.log('Query params:', nextRouter.query);
      console.log('Query keys:', Object.keys(nextRouter.query));
      console.log('Query values:', Object.values(nextRouter.query));
      console.log('URL search params:', window.location.search);
      console.log('URL hash:', window.location.hash);
      console.log('========================');
    }
  }, [nextRouter.asPath, nextRouter.query, nextRouter.pathname]);

  // Log when routes change
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      console.log('=== ROUTE CHANGED ===');
      console.log('New URL:', url);
      console.log('==================');
    };

    nextRouter.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      nextRouter.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [nextRouter.events]);

  return (
    <div className="flex flex-col">
      <CartWrapper>
        <Header categories={categories} />
        <div>
          <Head>
            <title>FluidPower Group</title>
          </Head>

          <AnimatePresence
            exitBeforeEnter
            onExitComplete={() => window.scrollTo(0, 0)}
          >
            <motion.div
              key={router.route}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Component {...pageProps} />
            </motion.div>
          </AnimatePresence>
        </div>
      </CartWrapper>
      <Footer />
    </div>
  );
}

export default MyApp;