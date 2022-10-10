import SortProducts from "./SortProducts/SortProducts";
import ItemProducts from "./ItemProducts";


type Props = {seriesList: any};

const GridProducts = ({ seriesList }: Props) => {
  return (
    <div className="col-span-12  sm:col-span-9 xl:col-span-10 flex flex-col gap-8  sm:gap-2  ">
      <SortProducts />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {seriesList.map((item: any) => (
          <ItemProducts item={item} key={ item.id} />
          ))}
      </div>
    </div>
  );
};

export default GridProducts;
