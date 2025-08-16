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
          {/* Rest of your header code remains the same */}
          <div className="flex items-center gap-8 py-2 overflow-hidden ">
            <div className="w-1/5 lg:hidden flex items-center justify-start">
              <Cart open={cartOpen} handleClose={toggleCart} />

<<<<<<< HEAD
=======
              {/* FIXED Mobile Search and Cart Section - Simplified for Mobile */}
>>>>>>> feature/add-hose-builder-app
              <div className="relative flex items-center lg:hidden text-2xl">
                {items.length > 0 && (
                  <div className="absolute -top-1 -right-1 text-xs py-0.5 px-1.5 bg-black text-white rounded-full z-10">
                    {items.length}
                  </div>
                )}
                
                {/* Simplified Mobile Search Icon */}
                <FiSearch
                  onClick={() => {
                    router.push("/products/search");
                  }}
                  className="text-xl mr-3 hover:cursor-pointer p-1"
                  style={{
                    color: "#333",
                    transition: "color 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "rgb(250, 204, 21)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#333";
                  }}
                />
                
                {/* Simplified Mobile Cart Icon */}
                <FiShoppingCart 
                  onClick={toggleCart} 
                  className="text-xl hover:cursor-pointer p-1"
                  style={{
                    color: "#333",
                    transition: "color 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "rgb(250, 204, 21)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#333";
                  }}
                />
              </div>
            </div>

            <div className="lg:w-full flex self-center w-3/5 justify-center lg:justify-start">
              <Logo />
            </div>

            <div className="w-full justify-center hidden lg:flex z-30 ">
              <NavHeader />
            </div>

            <div className="lg:w-full w-1/5 justify-end flex lg:hidden items-center">
              <Snackbar />
            </div>

            <div className="w-full text-2xl gap-2 justify-end hidden lg:flex pr-4">
              {items.length > 0 && (
                <div className="absolute top-0 right-0 text-xs py-0.5 px-2 bg-black text-white rounded-full z-10 mr-6">
                  {items.length}
                </div>
              )}
              
              {/* Actions Container - Same styling as NavHeader */}
              <div 
                style={{
                  background: "rgba(0, 0, 0, 0.15)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "50px",
                  padding: "8px 12px 12px 12px",
                  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.1)"
                }}
              >
                <div className="flex items-center gap-1">
                  {/* Search Button - Same styling as nav tabs */}
                  <a
                    onClick={() => {
                      router.push("/products/search");
                    }}
                    className="relative overflow-hidden"
                    style={{
                      // Override global button/anchor styles - SAME AS NAV TABS
                      all: "unset",
                      cursor: "pointer",
                      display: "inline-block",
                      padding: "6px 16px",
                      borderRadius: "40px",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      color: "#333",
                      textDecoration: "none",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      whiteSpace: "nowrap",
                      minWidth: "max-content",
                      // Base background with gradients - SAME AS NAV TABS
                      background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`,
                      backdropFilter: "blur(15px)",
                      border: "1px solid rgba(255, 255, 255, 0.4)",
                      boxShadow: `
                        0 4px 15px rgba(0, 0, 0, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.6),
                        inset 0 2px 8px rgba(255, 255, 255, 0.2),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                      `
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                      e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`;
                      e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                      e.currentTarget.style.color = "#000";
                      e.currentTarget.style.boxShadow = `
                        0 10px 30px rgba(250, 204, 21, 0.6),
                        inset 0 2px 0 rgba(255, 255, 255, 0.8),
                        inset 0 3px 10px rgba(255, 255, 255, 0.4),
                        inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                      `;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0px) scale(1)";
                      e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.3) 20%, rgba(255, 255, 255, 0.15) 70%, rgba(240, 240, 240, 0.2) 100%), rgba(255, 255, 255, 0.15)`;
                      e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.4)";
                      e.currentTarget.style.color = "#333";
                      e.currentTarget.style.boxShadow = `
                        0 4px 15px rgba(0, 0, 0, 0.1),
                        inset 0 1px 0 rgba(255, 255, 255, 0.6),
                        inset 0 2px 8px rgba(255, 255, 255, 0.2),
                        inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                      `;
                    }}
                  >
                    {/* Glass shine effect - SAME AS NAV TABS */}
                    <span
                      style={{
                        position: "absolute",
                        top: "1px",
                        left: "8px",
                        right: "8px",
                        height: "50%",
                        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                        borderRadius: "40px 40px 20px 20px",
                        pointerEvents: "none",
                        transition: "all 0.4s ease"
                      }}
                    />
                    Search
                  </a>

                  {/* Cart Icon - REVERTED TO ORIGINAL */}
                  <div className="relative group" style={{ perspective: "1000px" }}>
                    <FiShoppingCart
                      onClick={toggleCart}
                      className="hover:cursor-pointer font-bold transition-colors duration-300 relative z-10"
                      style={{
                        width: "35px",
                        height: "35px",
                        padding: "8px",
                        background: "rgba(255, 255, 255, 0.15)",
                        backdropFilter: "blur(15px)",
                        border: "1px solid rgba(255, 255, 255, 0.25)",
                        borderRadius: "50%",
                        color: "#333",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
                        e.currentTarget.style.background = "rgba(250, 204, 21, 0.3)";
                        e.currentTarget.style.border = "1px solid rgba(250, 204, 21, 0.4)";
                        e.currentTarget.style.color = "rgb(250, 204, 21)";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(250, 204, 21, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0px) scale(1)";
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
                        e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.25)";
                        e.currentTarget.style.color = "#333";
                        e.currentTarget.style.boxShadow = "";
                      }}
                    />
                    {/* Original liquid animation background */}
                    <div 
                      className="absolute inset-0 rounded-full border-2 border-transparent transition-all duration-400 ease-out transform scale-0 opacity-0 z-0 group-hover:border-yellow-400 group-hover:bg-black group-hover:scale-110 group-hover:opacity-100"
                      style={{
                        top: "-2px",
                        left: "-2px", 
                        right: "-2px",
                        bottom: "-2px",
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                    ></div>
                  </div>
<<<<<<< HEAD
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
                  className="text-xl hover:text-primary hover:cursor-pointer font-bold h-full w-full p-2"
                />
=======
                </div>
>>>>>>> feature/add-hose-builder-app
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