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
                Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                Incidunt possimus, accusamus id similique unde saepe quia, error
                temporibus nam exercitationem.
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
        {/*<button className="btn-tertiary py-1.5">Learn More </button>*/}
      </motion.div>
      <Image
        src="https://images.unsplash.com/photo-1502014822147-1aedfb0676e0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
        placeholder="blur"
        alt="item"
        layout="fill"
        blurDataURL="https://images.unsplash.com/photo-1502014822147-1aedfb0676e0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=870&q=80"
      />
    </div>
  );
};

export default ItemDesignHome;
