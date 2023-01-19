import { DesignHome, HeroHome, ServicesHome } from "@/views/Home";

import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="flex flex-col w-full">
      <HeroHome />
      {/*<BestSellersHome />*/}
      <ServicesHome />
      <DesignHome />

      {/* <BannerHome /> */}
    </div>
  );
};

export default Home;
