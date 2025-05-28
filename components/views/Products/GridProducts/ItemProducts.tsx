// components/views/Products/GridProducts/ItemProducts.tsx
import Anchor from "@/modules/Anchor";
import { motion } from "framer-motion";
import SafeImage from "../../../../utils/SafeImage";

const ItemProducts = ({ item, showDescription = false }: { item: any, showDescription?: boolean }) => {
  const getDescriptions = (description: string) => {
    //get text before first break tag
    const text = description.split("<br>")[0];
    const stripped = text.replace(/(<([^>]+)>)/ig, "").replace(/&nbsp;/g, "");
    return stripped + "...";
  }

  if (!item) {
    return (
      <div className="flex flex-col w-full max-w-sm mx-auto group cursor-pointer border-slate-800 border-[1px] p-4 h-full shadow-md">
        <div className="w-full pt-[100%] relative">
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        </div>
        <div className="text-xl px-3 py-1.5 font-light flex justify-center">
          <h3 className="text-xl font-semibold">Loading...</h3>
        </div>
      </div>
    );
  }

  return (
    <Anchor href={`/products/${item.id}`}>
      <div className="flex flex-col w-full max-w-sm mx-auto group cursor-pointer border-slate-800 border-[1px] p-4 h-full shadow-md">
        <motion.div className="w-full pt-[100%] relative transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <SafeImage
              src={item.image}
              alt={item.slug || item.name || "Product image"}
              width={300}
              height={300}
              className="scale-75 group-hover:scale-[0.8] transition-all object-contain"
            />
          </div>
        </motion.div>
        <div className="text-xl px-3 py-1.5 font-light flex justify-center gap-12">
          <h3 className="text-xl font-semibold"><b>{item.name || item.title}</b></h3>
        </div>
        {showDescription && <div className="text-center">
          <span className="text-xs font-semibold text-slate-700">
            {item.description && getDescriptions(item.description)}
          </span>
        </div>}
      </div>
    </Anchor>
  );
};

export default ItemProducts;