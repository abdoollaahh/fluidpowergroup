import withLayout from "@/hoc/withLayout";
import { HeaderContact, ItemsContact } from "@/views/Contact";
import BannerHome from "@/views/Home/BannerHome/BannerHome";
import { NextPage } from "next";

const ContactPage: NextPage = () => {
  return (
    <div className="">
      <div className="wrapper px-8 md:px-12 py-6 sm:py-12 lg:py-16  flex flex-col gap-6 sm:gap-16">
        <HeaderContact />

        <ItemsContact />
      </div>
    </div>
  );
};

export default ContactPage;
