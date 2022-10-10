import clsx from "clsx";
import React, { useState } from "react";
import { FiMinus, FiPlus } from "react-icons/fi";

type ICounter = {
  count: number;
  setCount: (val: number) => void;
  limit?: number;
};

const Counter = ({ count, setCount, limit }: ICounter) => {
  return (
    <div className="flex justify-between text-xl items-center max-w-full gap-2">
      <div
        className="p-1 hover:bg-slate-200/30 rounded-full cursor-pointer"
        onClick={() => {
          setCount(count > 0 ? count - 1 : count);
        }}
      >
        <FiMinus />
      </div>
      <input
        className={clsx(
          "flex focus:outline-none  w-8",
          count <= 9 ? "pl-2.5" : "pl-1.5"
        )}
        type={"number"}
        onWheel={(e: any) => {
          e.target.blur();
        }}
        onChange={({ target }) =>
          (limit === undefined || +target.value <= limit) &&
          setCount(+target.value)
        }
        value={+count}
      ></input>

      <div
        className="p-1 hover:bg-slate-200/30 rounded-full cursor-pointer"
        onClick={() => {
          (limit === undefined || count < limit) && setCount(count + 1);
        }}
      >
        <FiPlus />
      </div>
    </div>
  );
};

export default Counter;
