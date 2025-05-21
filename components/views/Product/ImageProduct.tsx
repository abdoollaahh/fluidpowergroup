import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import SafeImage from "../../../utils/SafeImage";

type Props = {
  images: string[];
};

const ImageProduct = ({ images = [] }: Props) => {
  const safeImages = useMemo(() => images || [], [images]);
  const [selectedImage, setSelectedImage] = useState(safeImages.length > 0 ? safeImages[0] : '');
  const [direction, setDirection] = useState(true);

  const variants = {
    enter: {
      x: 100,
      opacity: 0,
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: {
      zIndex: 0,
      x: -100,
      opacity: 0,
    },
  };

  if (safeImages.length === 0 || !selectedImage) {
    return (
      <div className="relative col-span-full lg:col-span-6 xl:col-span-7 w-full border rounded-3xl h-full">
        <div className="h-full w-full flex items-center justify-center">
          <div className="text-gray-400">Loading image...</div>
        </div>
      </div>
    );
  }

  const imageIndex = safeImages.indexOf(selectedImage);

  return (
    <div className="relative col-span-full lg:col-span-6 xl:col-span-7 w-full border rounded-3xl h-full overflow-hidden">
      {/* This container maintains aspect ratio in both portrait and landscape */}
      <div className="w-full h-full min-h-[300px] flex items-center justify-center p-4">
        <AnimatePresence exitBeforeEnter>
          <motion.div
            variants={variants}
            className="w-full h-full flex items-center justify-center"
            key={selectedImage}
            custom={direction}
            transition={{
              opacity: { duration: 0.2 },
            }}
            initial="enter"
            animate="center"
            exit="exit">
            <SafeImage
              src={selectedImage}
              alt="Product"
              width={800}
              height={800}
              className="object-contain max-w-full max-h-full"
              useContainMode={true}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Navigation arrows */}
      {safeImages.length > 1 && (
        <>
          <div className="absolute h-full top-0 left-0 flex flex-col justify-center">
            <div
              className="p-2 hover:bg-slate-300/20 rounded-full cursor-pointer z-10 m-2 group"
              onClick={() => {
                setDirection(false);
                setSelectedImage(
                  safeImages[
                    (imageIndex > 0 ? imageIndex - 1 : safeImages.length - 1) %
                      safeImages.length
                  ]
                );
              }}>
              <FiChevronLeft className="text-3xl text-black/60 group-hover:text-black group-hover:scale-110 transition-all duration-200" />
            </div>
          </div>

          <div className="absolute h-full top-0 right-0 flex flex-col justify-center">
            <div
              className="p-2 hover:bg-slate-300/20 rounded-full cursor-pointer z-10 m-2 group"
              onClick={() => {
                setDirection(true);
                setSelectedImage(
                  safeImages[(imageIndex + 1) % safeImages.length]
                );
              }}>
              <FiChevronRight className="text-3xl text-black/60 group-hover:text-black group-hover:scale-110 transition-all duration-200" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full flex items-end justify-center pb-6 gap-4">
            {safeImages.map((item, i) => (
              <div
                onClick={() => {
                  setDirection(i >= safeImages.indexOf(selectedImage));
                  setSelectedImage(item);
                }}
                className={clsx(
                  'w-3 aspect-square rounded-full cursor-pointer',
                  item === selectedImage ? 'bg-black/60' : 'bg-slate-200'
                )}
                key={i}></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageProduct;