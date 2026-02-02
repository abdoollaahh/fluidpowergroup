import withLayout from "@/hoc/withLayout";
import {
  HeaderAbout,
  HeroAbout,
  HighlightsAbout,
  LocationAbout,
  TeamAbout,
} from "@/views/About";
import { NextPage } from "next";

const AboutPage: NextPage = () => {
  return (
    <>
      <div className="wrapper px-8 md:px-12 pt-6 pb-10 sm:py-12 lg:py-16  flex flex-col items-center gap-16">
        <div className="flex lg:flex-row flex-col gap-8 lg:gap-16    w-full">
          <HeaderAbout />
          <HeroAbout />
        </div>
      </div>
      {/*<HighlightsAbout /> */}
      <div className="wrapper px-8 md:px-12 pt-8 pb-12 sm:pt-12 sm:pb-20 flex flex-col gap-12">
        <TeamAbout />
        <LocationAbout />
      </div>
    </>
  );
};

export default AboutPage;
