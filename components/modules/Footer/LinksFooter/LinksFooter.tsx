import React from "react";
import LinkFooter from "./LinkFooter";

type Props = {};

const LinksFooter = (props: Props) => {
  return (
    <div className="flex flex-col items-center md:items-start md:flex-row gap-8 md:gap-28 ">
      <div className="flex flex-col gap-3 items-center md:items-start">
        <h3 className="header-link-footer">Navigate</h3>
        <LinkFooter>Products</LinkFooter>
        <LinkFooter>Services</LinkFooter>
        <LinkFooter>Design</LinkFooter>
        <LinkFooter>About</LinkFooter>
      </div>
      <div className="flex flex-col gap-3 items-center md:items-start">
        <h3 className="header-link-footer">Need help?</h3>
        <LinkFooter>Contact us</LinkFooter>
        <LinkFooter>Customer service</LinkFooter>
      </div>
      <div className="flex flex-col gap-3 items-center md:items-start">
        <h3 className="header-link-footer">Legal</h3>
        <LinkFooter>Terms & Conditions</LinkFooter>
        <LinkFooter>Privacy Policy</LinkFooter>
      </div>
    </div>
  );
};

export default LinksFooter;
