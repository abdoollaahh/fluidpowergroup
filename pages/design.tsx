import ItemDesignHome from "@/views/Home/DesignHome/ItemDesignHome";
import { ItemDesignsHome } from "@/views/Home/DesignHome/ItemDesignHome";
import db from "db";
import type { NextPage } from "next";

const Design: NextPage = () => {
  return (
    <div className="flex flex-col w-full">
      {/* Design Section - Moved from homepage */}
      <div className="bg-white">
        <div className="wrapper pt-10 pb-14 px-8 md:px-12 w-full flex flex-col gap-3">
          <h2 className="text-4xl font-semibold">Design</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-6 grid-flow-row gap-8 mt-8">
            {db.design_Hydraulic.map((item, i) => (
              <ItemDesignHome key={i} title={item} />
            ))}
            {db.design_Drafting.map((item, i) => (
              <ItemDesignsHome key={i} title={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Design;