import NavHeader from "./NavHeader";
import { FiUser, FiShoppingCart, FiSearch } from "react-icons/fi";
import Snackbar from "./Snackbar/Snackbar";
import { useContext, useState } from "react";
import HoverWrapper from "context/HoverWrapper";
import { AnimatePresence } from "framer-motion";
import ProductMenuHeader from "./MenuHeader/ProductMenuHeader/ProductMenuHeader";
import Logo from "../Logo";
import Cart from "../Cart";
import { CartContext } from "context/CartWrapper";
import { Category } from "types/products";
import { BsSearch } from "react-icons/bs";

const Header = ({categories} : {categories: Category[]}) => {
  const [hover, setHover] = useState<string | null>(null);
  const { open: cartOpen, toggleCart, items } = useContext(CartContext);

  return (
    <HoverWrapper hook={{ hover, setHover }}>
      <div className="w-full" onMouseLeave={() => setHover(null)}>
        <div className="wrapper relative w-full px-6 z-30">
          <div className="flex items-center gap-8 py-2 overflow-hidden ">
            <div className="w-1/5 lg:hidden flex items-center justify-start">
              <Cart open={cartOpen} handleClose={toggleCart} />

              <div
                className="relative flex items-center  lg:hidden text-2xl"
              >
                {items.length > 0 && (
                  <div className="absolute top-0 right-0 text-xs py-0.5 px-2 bg-black text-white rounded-full ">
                    {items.length}
                  </div>
                )}
                <FiSearch className="text-3xl mr-2 hover:bg-slate-100 hover:cursor-pointer rounded-full h-full"/>
                <FiShoppingCart onClick={toggleCart} className="text-3xl" />
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
                <FiSearch className="text-3xl mr-5 hover:bg-slate-100 hover:cursor-pointer rounded-full h-full w-full p-2"/>
                <FiShoppingCart onClick={toggleCart} className="text-3xl hover:bg-slate-100 hover:cursor-pointer rounded-full h-full w-full p-2" />
              </div>

              <Cart open={cartOpen} handleClose={toggleCart} />

              {/*<div className="icon-btn">
                <FiUser />
                </div>*/}
            </div>
          </div>
        </div>

        <AnimatePresence exitBeforeEnter>
          {hover === "Products" && <ProductMenuHeader categories={ categories} />}
        </AnimatePresence>
      </div>
    </HoverWrapper>
  );
};

export default Header;
