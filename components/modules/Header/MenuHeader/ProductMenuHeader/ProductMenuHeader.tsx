import { motion } from "framer-motion";
import React, { useState } from "react";
import { v4 as uuid } from "uuid";
import Categories from "./Categories";
import SubCategories from "./SubCategories";

import db from "db";
import { Category } from "types/products";

const ProductMenuHeader = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category>(
    db.categories[0]
  );

  return (
    <motion.div className="absolute w-full left-0 z-40 ">
      <motion.div
        className="  bg-white border   py-16 px-10 xl:px-28  w-full z-30"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
        exit={{ opacity: 0, y: -50, transition: { duration: 0.2 } }}
      >
        <div className="wrapper flex   ">
          <Categories
            categories={db.categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />

          <SubCategories subCategories={selectedCategory.subCategories} />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProductMenuHeader;
