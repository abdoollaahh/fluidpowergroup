import { ProductSlider } from "@/views/Catalogue";
import db from "db";

const BestSellersHome = () => {
  return (
    <div className=" wrapper  px-8 md:px-12 overflow-hidden py-12 border ">
      <ProductSlider
        products={db.categories[0].subCategories}
        title={"Best Sellers"}
        btn={{
          title: "View All",
          href: `/products?sorts=bestsellers`,
        }}
        description="uidem at officiis explicabo, fugit delectus, voluptate solut recusandae cumque. Praesentium non quidem nisi delectus!"
      />
    </div>
  );
};

export default BestSellersHome;
