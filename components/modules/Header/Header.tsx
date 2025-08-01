import NavHeader from "./NavHeader";
import { FiUser, FiShoppingCart, FiSearch } from "react-icons/fi";
import Snackbar from "./Snackbar/Snackbar";
import { useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import HoverWrapper from "context/HoverWrapper";
import { AnimatePresence } from "framer-motion";
import ProductMenuHeader from "./MenuHeader/ProductMenuHeader/ProductMenuHeader";
import Logo from "../Logo";
import Cart from "../Cart";
import { CartContext } from "context/CartWrapper";
import { Category } from "types/products";
import { BsSearch } from "react-icons/bs";
import Link from "next/link";

const Header = ({ categories }: { categories: Category[] }) => {
  const [hover, setHover] = useState<string | null>(null);
  const { open: cartOpen, toggleCart, items } = useContext(CartContext);
  const router = useRouter();

  // Reset hover state on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setHover(null); // Reset hover state when route changes
    };

    // Listen for route changes
    router.events.on('routeChangeStart', handleRouteChange);
    router.events.on('routeChangeComplete', handleRouteChange);

    // Cleanup
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <>
    <HoverWrapper hook={{ hover, setHover }}>
      <div className="w-full fixed top-0 bg-white z-50" 
  style={{
    background: 'linear-gradient(to bottom, white 0%, white 50%, rgba(255, 255, 255, 0.8) 80%, rgba(255, 255, 255, 0) 100%)',
    borderBottom: 'none',
    paddingBottom: '30px',
    transition: 'all 0.3s ease-in-out' // Add smooth transition
  }}onMouseLeave={() => setHover(null)}>
        <div className="wrapper relative w-full px-6 z-30">
          <div className="flex items-center gap-8 py-2 overflow-hidden ">
            <div className="w-1/5 lg:hidden flex items-center justify-start">
              <Cart open={cartOpen} handleClose={toggleCart} />

              <div className="relative flex items-center  lg:hidden text-2xl">
                {items.length > 0 && (
                  <div className="absolute top-0 right-0 text-xs py-0.5 px-2 bg-black text-white rounded-full ">
                    {items.length}
                  </div>
                )}
                <FiSearch
                  onClick={() => {
                    router.push("/products/search");
                  }}
                  className="text-xl mr-2 hover:bg-slate-100 hover:cursor-pointer rounded-full h-full"
                />
                <FiShoppingCart onClick={toggleCart} className="text-xl p-3" />
              </div>
            </div>

            <div className="lg:w-full flex self-center w-3/5 justify-center lg:justify-start  ">
              <Logo />
            </div>

            <div className="w-full justify-center hidden lg:flex z-30 ">
              <NavHeader />
            </div>

            <div className="lg:w-full w-1/5 justify-end flex lg:hidden items-center">
              <Snackbar />
            </div>

            <div className="w-full text-2xl gap-2 justify-end hidden lg:flex">
              <div className="flex relative">
                {items.length > 0 && (
                  <div className="absolute top-0 right-0 text-xs py-0.5 px-2 bg-black text-white rounded-full ">
                    {items.length}
                  </div>
                )}
                <button
                  onClick={() => {
                    router.push("/products/search");
                  }}
                  className="py-2 bg-yellow-400 hover:text-yellow-400 shadow-sm border font-semibold hover:border-yellow-400 text-black text-sm rounded-lg mx-5"
                >
                  Search
                </button>
                <FiShoppingCart
                  onClick={toggleCart}
                  className="text-xl hover:text-primary hover:cursor-pointer font-bold  h-full w-full p-2"
                />
              </div>

              <Cart open={cartOpen} handleClose={toggleCart} />
            </div>
          </div>
        </div>

        <AnimatePresence>
          {hover === "Products" && (
            <ProductMenuHeader categories={categories} />
          )}
        </AnimatePresence>
      </div>
    </HoverWrapper>
      <div style={{ height: "90px", width: "100%" }} />
    </>
  );
};

export default Header;