import { LayoutGroup, motion } from "framer-motion";
import SelectSortProducts from "./SelectSortProducts";

const SortProducts = () => {
  return (
    <LayoutGroup>
      <motion.div className=" flex justify-end text-lg items-center gap-6 ">
        <motion.div layout="position"> Sort By:</motion.div>{" "}
        <SelectSortProducts />
      </motion.div>
    </LayoutGroup>
  );
};

export default SortProducts;
