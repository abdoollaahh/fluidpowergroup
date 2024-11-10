import { FiMail, FiMapPin } from "react-icons/fi";

const InfoFooter = () => {
  return (
    <div className="flex flex-col gap-4  items-center md:items-start ">
      <img
        className="relative h-[90px] w-[220px] bg-transparent"
        src="/logoFooter.png"
      />

      <div className=" text-lg flex items-center gap-2">
        <FiMail className=" hidden sm:block" />{" "}
        <a href="mailto:info@fluidpowergroup.com.au">
          info@fluidpowergroup.com.au
        </a>
      </div>
      <div className=" text-lg flex   gap-2 text-center sm:text-left">
        <FiMapPin className="mt-1 hidden sm:block" />
        <div>44a Murrell Street, Wangaratta VIC 3677</div>
      </div>
    </div>
  );
};

export default InfoFooter;
