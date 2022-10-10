import Footer from "@/modules/Footer";
import Header from "@/modules/Header";

import CartWrapper from "context/CartWrapper";
import { AnimatePresence, motion } from "framer-motion";
import type { AppProps } from "next/app";
import Head from "next/head";
import "styles/globals.css";

function MyApp({ Component, pageProps, router }: AppProps) {
  return (
    <div className="flex flex-col">
    
      <CartWrapper>
        <Header />
      <div>
        <Head>
          <title>Fluidpower Group</title>
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
