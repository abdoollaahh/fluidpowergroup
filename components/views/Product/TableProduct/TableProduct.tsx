import Counter from "@/modules/Counter";
import { IItemCart } from "types/cart";
import { useState, useEffect } from "react";

type ITableProductProps = {
  items: IItemCart[];
  setItems: (val: any) => void;
};

const formathead = (title: string) => {
  const stringElements = title.split("_");
  if (stringElements.length === 1) {
    return `${title.charAt(0).toUpperCase()}${title.slice(1)}`;
  }
  let string = "";
  stringElements.forEach((word, i) => {
    if (i !== stringElements.length - 1) {
      if (word === "id" || word == "od") {
        string =
          string +
          word.split("")[0].toUpperCase() +
          "." +
          word.split("")[1].toUpperCase() +
          " ";
      } else {
        string = string + word.charAt(0).toUpperCase() + word.slice(1) + " ";
      }
    } else {
      if (word === "id" || word == "od") {
        string =
          string +
          word.split("")[0].toUpperCase() +
          "." +
          word.split("")[1].toUpperCase();
      } else if (word.length === 1) {
        string = string + '"' + word.toUpperCase() + '"';
      } else {
        string = string + "(" + word + ")";
      }
    }
  });
  return string;
};

const TableProduct = ({ items, setItems }: ITableProductProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className=" wrapper  px-8 md:px-12 overflow-scroll">
      <table className="table-auto w-full border select-none  ">
        <thead>
          <tr className="text-xl bg-[#191919] text-yellow-400 text-left">
            <th className="font-semibold py-2">Part Number</th>
            {Object.entries(items[0].attributes).map(([key, value]) => (
              <th className="font-semibold " key={key}>
                {formathead(key)}
              </th>
            ))}
            <th className="font-semibold ">Price</th>
            <th className="font-semibold ">Available Stock</th>
            <th className="font-semibold ">Quantity</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="whitespace-nowrap font-bold ">{item.name}</td>
              {Object.entries(item.attributes).map(([key, value]) => {
                if (typeof value === "string") {
                  return (
                    <td className="whitespace-nowrap" key={key}>
                      {value}
                    </td>
                  );
                } else {
                  return (
                    <td className="whitespace-nowrap " key={key}>
                      {"-"}
                    </td>
                  );
                }
              })}
              <td className="font-bold">{`$${item.price}`}</td>
              <td>{item.stock}</td>
              <td className=" w-28">
                {item.stock === 0 ? (
                  "Sold Out"
                ) : (
                  <Counter
                    limit={item.stock}
                    count={item.quantity}
                    setCount={(val: number) => {
                      setItems(
                        items.map((itemToAdd) =>
                          itemToAdd.id === item.id
                            ? { ...item, quantity: val }
                            : itemToAdd
                        )
                      );
                    }}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  {
    /*<div className=" wrapper  px-8 md:px-12 overflow-scroll">
      <table className="table-auto w-full border  select-none  ">
        <thead>
          <tr className="text-xl text-left">
            <th className="font-semibold py-2">Part Number</th>
            <th className="font-semibold" colSpan={2}>
              Hose ID
            </th>
            <th className="font-semibold">Hose OD</th>
            <th className="font-semibold " colSpan={2}>
              Working Pressure
            </th>
            <th className="font-semibold " colSpan={2}>
              Burst Pressure
            </th>
            <th className="font-semibold ">Min Bend Radius</th>
            <th className="font-semibold ">Price</th>
            <th className="font-semibold ">Available Stock</th>
            <th className="font-semibold ">Quantity</th>
          </tr>
          <tr className="text-xl text-left">
            <th className="font-semibold py-2">ID No</th>
            <th className="font-semibold">Inch</th>
            <th className="font-semibold">mm</th>
            <th className="font-semibold">mm</th>
            <th className="font-semibold">MPa</th>
            <th className="font-semibold">Psi</th>
            <th className="font-semibold">MPa</th>
            <th className="font-semibold">Psi</th>
            <th className="font-semibold">mm</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="whitespace-nowrap">{item.name}</td>
              <td>{ item.id_inch}</td>
              <td>{ item.id_mm}</td>
              <td>{item.od_mm }</td>
              <td>{ item.working_pressure_mpa}</td>
              <td>{ item.working_pressure_psi}</td>
              <td>{ item.burst_pressure_mpa}</td>
              <td>{ item.burst_pressure_psi}</td>
              <td>{ item.min_bend_radius_mm}</td>
              <td>{item.price}</td>
              <td>{item.stock}</td>
              <td className=" w-28 ">
                {item.stock === 0 ? (
                  "Sold Out"
                ) : (
                  <Counter
                    limit={item.stock}
                    count={item.quantity}
                    setCount={(val: number) => {
                      setItems(
                        items.map((itemToAdd) =>
                          itemToAdd.id === item.id
                            ? { ...item, quantity: val }
                            : itemToAdd
                        )
                      );
                    }}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
                  </div>*/
  }
};

export default TableProduct;
