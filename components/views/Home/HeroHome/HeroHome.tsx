import Header from "@/modules/Header";
import InfoHeroHome from "./InfoHeroHome";
import ProductsHeroHome from "./ProductsHeroHome";

const HeroHome = () => {
  return (
    <div className="flex flex-col md:h-screen md:min-h-[40rem] md:max-h-[50rem] wrapper w-full items-center  overflow-hidden">
      <div className="h-full flex flex-col-reverse md:flex-row max-w-4xl   xl:max-w-6xl px-8 pt-8 pb-10 lg:p-0 gap-8 md:gap-0 ">
        <InfoHeroHome />
        <ProductsHeroHome />
      </div>
    </div>
  );
};

export default HeroHome;
