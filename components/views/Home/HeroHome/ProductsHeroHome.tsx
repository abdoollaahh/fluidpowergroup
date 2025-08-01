import index from "@/modules/Loading";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type Props = {};

const ProductsHeroHome = (props: Props) => {
  const images = useMemo(() => [
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/frontA.png`,
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/frontB.png`,
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/frontC.png`,
    `${process.env.NEXT_PUBLIC_BASE_URL || ''}/frontD.png`
  ], []); // Empty dependency array since these values never change

  const [selectedImage, setSelectedImage] = useState(images[0]);

  const [direction, setDirection] = useState(true);

  const variants = {
    enter: {
      opacity: 0,
      scale: 1.05,
    },
    center: {
      zIndex: 1,
      opacity: 1,
      scale: 1,
    },
    exit: {
      zIndex: 0,
      opacity: 0,
      scale: 0.95,
    },
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedImage(
        (selectedImage) =>
          images[
            images.indexOf(selectedImage) + 1 <= images.length - 1
              ? images.indexOf(selectedImage) + 1
              : 0
          ]
      );
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [images]);

  return (
    <div className="md:max-w-full md:w-1/2 w-full h-full flex items-center justify-center mx-auto relative">
      <AnimatePresence exitBeforeEnter initial={false}>
        <motion.div
          variants={variants}
          className="sm:w-[85%] w-full max-w-md sm:max-w-full aspect-square gap-8 overflow-hidden border rounded-2xl border-slate-200"
          key={selectedImage}
          custom={direction}
          transition={{
            duration: 0.8,
            ease: "easeInOut"
          }}
          initial="enter"
          animate="center"
          exit="exit"
        >
          <div className="relative p-4 w-full h-full -z-20 overflow-hidden">
            <Image
              src={selectedImage}
              width={600}
              height={600}
              className="object-cover w-full h-full"
              priority
              quality={100}
              unoptimized
              alt="hero"
            />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute h-full bottom-0 left-0 w-full items-end justify-center pb-12 gap-4 hidden sm:flex">
        {images.map((item, i) => (
          <div
            onClick={() => {
              setDirection(i >= images.indexOf(selectedImage));
              setSelectedImage(item);
            }}
            className={clsx(
              "w-3 aspect-square rounded-full cursor-pointer",
              item === selectedImage ? "bg-black/60" : "bg-slate-200"
            )}
            key={i}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default ProductsHeroHome;