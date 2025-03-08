import HoverWrapper from "context/HoverWrapper";
import { Children } from "types/general";
import React from "react"
import Header from "../Header";
import Footer from "../Footer/Footer";

interface ILayoutProps {
  children: Children;
  categories?: any;
  seriesList?: any;
}
const Layout = ({ children}: ILayoutProps) => {
  return (
    <div>
      {//<Header />
      }
        {children}
      <Footer />
    </div>
  );
};

export default Layout;