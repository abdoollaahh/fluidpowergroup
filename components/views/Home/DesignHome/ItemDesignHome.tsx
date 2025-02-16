import {
  AnimatePresence,
  AnimateSharedLayout,
  LayoutGroup,
  motion,
} from "framer-motion";
import Image from "next/image";
import { useState } from "react";

interface ItemDesignHomeProps {
  title: string;
}
const ItemDesignHome = ({ title }: ItemDesignHomeProps) => {
  const [hover, setHover] = useState(false);
  return (
    <div className="col-span-2  aspect-square rounded-md relative overflow-hidden  hover:shadow-2xl hover:shadow-slate-200">
      <motion.div
        layout
        onMouseEnter={() => {
          setHover(true);
        }}
        onMouseLeave={() => {
          setHover(false);
        }}
        className="absolute top-0 left-0 w-full bg-black/30  backdrop-grayscale-[0.3] hover:backdrop-grayscale-0 cursor-pointer transition-all duration-200  h-full z-20 text-white  font-semibold p-8 flex flex-col justify-end gap-4 "
      >
        <LayoutGroup>
          <motion.h2 layout="position" className="text-2xl xl:text-3xl">
            {title}
          </motion.h2>
          <AnimatePresence exitBeforeEnter>
            {hover && (
              <motion.div
                className="text-lg xl:text-xl font-light hidden lg:block"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { duration: 0.3 } }}
                exit={{ y: 50, opacity: 0, transition: { duration: 0.05 } }}
              >
                We can design, build and install the right hydraulic systems
                according to your needs.
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
        {/*<button className="btn-tertiary py-1.5">Learn More </button>*/}
      </motion.div>
      <Image
        src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/hydraulicSystemDesign.jpeg`}
        alt="Hydraulic System Design"
        layout="fill"
        objectFit="cover"
        priority
        quality={100}
        loader={({ src }) => src}  // Adding the same loader that worked for logo
      />
    </div>
  );
};
const ItemDesignsHome = ({ title }: ItemDesignHomeProps) => {
  const [hover, setHover] = useState(false);
  return (
    <div className="col-span-2  aspect-square rounded-md relative overflow-hidden  hover:shadow-2xl hover:shadow-slate-200">
      <motion.div
        layout
        onMouseEnter={() => {
          setHover(true);
        }}
        onMouseLeave={() => {
          setHover(false);
        }}
        className="absolute top-0 left-0 w-full bg-black/30  backdrop-grayscale-[0.3] hover:backdrop-grayscale-0 cursor-pointer transition-all duration-200  h-full z-20 text-white  font-semibold p-8 flex flex-col justify-end gap-4 "
      >
        <LayoutGroup>
          <motion.h2 layout="position" className="text-2xl xl:text-3xl">
            {title}
          </motion.h2>
          <AnimatePresence exitBeforeEnter>
            {hover && (
              <motion.div
                className="text-lg xl:text-xl font-light hidden lg:block"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1, transition: { duration: 0.3 } }}
                exit={{ y: 50, opacity: 0, transition: { duration: 0.05 } }}
              >
                Our engineers can bring your ideas to life.<br></br>We are using
                the latest 3D softwares for our design and drafting.<br></br>
                Talk to us if you want anything to build.
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
        {/*<button className="btn-tertiary py-1.5">Learn More </button>*/}
      </motion.div>
      <Image
        src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/drafting.jpeg`}
        alt="Design and Drafting"
        layout="fill"
        objectFit="cover"
        priority
        quality={100}
        loader={({ src }) => src}  // Adding the same loader that worked for logo
      />
    </div>
  );
};

export default ItemDesignHome;
export { ItemDesignsHome };
