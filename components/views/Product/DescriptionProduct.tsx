import { FiCheck, FiSquare } from "react-icons/fi";

const DescriptionProduct = ({ series } : {series: any}) => {
  return (
    <div className="col-span-full lg:col-span-6  xl:col-span-5   lg:px-12 flex flex-col gap-8 justify-center ">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl xl:text-4xl font-semibold">
          {series.name}
        </h1>
        <h2 className="text-xl lg:text-2xl bg-gradient-to-r text-black/60 font-semibold">
          Description for the Series
        </h2>
      </div>

      {/*<div className="flex gap-4">
        {Array(3)
          .fill({})
          .map((_, i) => (
            <div
              className="w-full     bg-gradient-to-r from-amber-500 to-amber-900 bg-clip-text text-transparent text-3xl font-semibold items-center justify-center flex flex-col"
              key={i}
            >
              50%
              <div className="text-xl text-black/70">Faster</div>
            </div>
          ))}
      </div>
          */}
      <ul className="flex flex-col gap-2.5">
        {series.description.length !== 0 &&
          <li className="flex items-center gap-1 text-lg xl:text-xl">
            <FiCheck /> {series.description}
          </li>
        }
        {/*series.description.split(".").map((line: string, i: number) => {
          if (line.length !== 0) {
            return (<li className="flex items-center gap-2 text-lg xl:text-xl" key={i}>
              <FiCheck /> {line}
            </li>
            )
          }
        })*/}
        
      </ul>

      <button>Learn More</button>
    </div>
  );
};

export default DescriptionProduct;
