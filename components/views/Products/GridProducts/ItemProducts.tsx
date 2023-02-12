import Anchor from "@/modules/Anchor";
import { motion } from "framer-motion";
import Image from "next/image";

const ItemProducts = ({ item }: { item: any }) => {
  
  const getDescriptions = (description: string) => {
    const stripped = description.replace(/(<([^>]+)>)/ig, "").replace(/&nbsp;/g, "");
    const str = `${stripped.substring(0, 100)}${stripped.length > 100 ? "..." : ""}`;
    return str;
  }

  return (
    <Anchor href={`/products/${item.id}`}>
      <div className="flex flex-col w-full  max-w-sm    mx-auto group    cursor-pointer  ">
        <motion.div className="w-full  pt-[100%]  relative  transition-all duration-500 border rounded-2xl">
          <Image
            layout="fill"
            src={item.image}
            blurDataURL={item.image}
            placeholder="blur"
            alt={item.slug}
            className="scale-75 group-hover:scale-[0.8] transition-all"
            objectFit="contain"
          />
        </motion.div>
        <div className="text-xl px-3 py-1.5 font-light flex justify-center gap-12">
          <h3 className="text-xl font-semibold"><b>{item.name}</b></h3>
        </div>
        <div className="text-center">
          <span className="text-xs font-semibold text-slate-700">
            {item.description && getDescriptions(item.description)}
          </span>
        </div>
      </div>
    </Anchor>
  );
};

export default ItemProducts;
