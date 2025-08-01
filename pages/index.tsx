import { HeroHome } from "@/views/Home";
import CompanyNewsBanner from "../components/CompanyNewsBanner";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Google Sheets Banner - Replace YOUR_SHEET_ID with actual ID */}
      <CompanyNewsBanner sheetId="1SU_ZgDtJ0iAx95Bey0J-KfjuBMafs0vviuarjZtZSYk" />
      
      {/* Existing Homepage Content */}
      <HeroHome />
    </div>
  );
};

export default Home;