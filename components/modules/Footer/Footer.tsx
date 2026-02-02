import { FiMail, FiMapPin } from "react-icons/fi";

import { BsFacebook, BsTwitter, BsInstagram } from "react-icons/bs";
import Anchor from "../Anchor";
import IconButton from "../IconButton";
import Logo from "../Logo";
import InfoFooter from "./InfoFooter";
import LinksFooter from "./LinksFooter/LinksFooter";

const Footer = () => {
  return (
    <div className="bg-black/90 py-16 border-t text-white px-10">
      <div className="wrapper  flex flex-col gap-8  ">
        <div className="flex xl:flex-row flex-col-reverse gap-12 md:gap-64  ">
          <InfoFooter />
          <LinksFooter />
        </div>

        <div className=" flex flex-col sm:flex-row justify-between items-center gap-8 ">
          <div className="text-center">
            All Rights Reserved - {new Date().getFullYear()} FluidPower Group
          </div>

          <div className="flex gap-2">
            <IconButton Icon={BsTwitter} />
            <IconButton Icon={BsFacebook} />
            <IconButton Icon={BsInstagram} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
