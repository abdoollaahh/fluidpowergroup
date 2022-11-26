import { FiMail, FiMapPin } from "react-icons/fi";
import Logo from "../Logo";

const InfoFooter = () => {
  return (
    <div className="flex flex-col gap-4  items-center md:items-start ">
      <Logo type="footer" />

      <div className=" text-lg flex items-center gap-2">
        <FiMail className=" hidden sm:block" />{" "}
        <a href="mailto:info@fluidpowergroup.com.au">
          info@fluidpowergroup.com.au
        </a>
      </div>
      <div className=" text-lg flex   gap-2 text-center sm:text-left">
        <FiMapPin className="mt-1 hidden sm:block" />
        <div>Unit 6, 13 Newman Street, Wangaratta VIC 3677</div>
      </div>
    </div>
  );
};

export default InfoFooter;
