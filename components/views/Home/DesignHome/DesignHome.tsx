import ItemDesignHome from "./ItemDesignHome";

import db from "db";

const DesignHome = () => {
  return (
    <div className="bg-white" id="design">
      <div className="wrapper pt-10 pb-14 px-8  md:px-12 w-full flex flex-col gap-3 ">
        <h2 className="text-4xl font-semibold">Design</h2>
        <h3 className="text-lg max-w-3xl font-light">
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Officiis,
          explicabo expedita saepe totam perferendis incidunt dignissimos
          dolorem ipsa a, veniam ab iusto labore tenetur, eaque est laboriosam
          doloribus exercitationem eveniet!
        </h3>
        {/* <button className="btn-secondary py-2 max-w-max">View All</button> */}

        <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-6 grid-flow-row  gap-8 mt-8">
          {db.design.map((item, i) => (
            <ItemDesignHome key={i} title={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesignHome;
