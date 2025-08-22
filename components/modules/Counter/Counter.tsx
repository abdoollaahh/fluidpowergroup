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
      {/* Minus Button with 3D Glass Effect */}
      <div
        className="cursor-pointer transition-all duration-200 ease-out"
        style={{
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          // Normal state - White glass
          background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 20%, rgba(255, 255, 255, 0.7) 70%, rgba(240, 240, 240, 0.8) 100%), rgba(255, 255, 255, 0.8)`,
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: `
            0 4px 15px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 2px 8px rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.05)
          `,
          color: "#333"
        }}
        onClick={() => {
          setCount(count > 0 ? count - 1 : count);
        }}
        onMouseEnter={(e) => {
          // Hover state - Yellow glass
          e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`;
          e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
          e.currentTarget.style.color = "#000";
          e.currentTarget.style.transform = "translateY(-1px) scale(1.05)";
          e.currentTarget.style.boxShadow = `
            0 6px 20px rgba(250, 204, 21, 0.4),
            inset 0 2px 0 rgba(255, 255, 255, 0.8),
            inset 0 3px 10px rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(255, 215, 0, 0.4)
          `;
        }}
        onMouseLeave={(e) => {
          // Return to normal state
          e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 20%, rgba(255, 255, 255, 0.7) 70%, rgba(240, 240, 240, 0.8) 100%), rgba(255, 255, 255, 0.8)`;
          e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.6)";
          e.currentTarget.style.color = "#333";
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = `
            0 4px 15px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 2px 8px rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.05)
          `;
        }}
        onMouseDown={(e) => {
          // Press state - Deeper yellow
          e.currentTarget.style.transform = "translateY(1px) scale(0.98)";
        }}
        onMouseUp={(e) => {
          // Release - back to hover state
          e.currentTarget.style.transform = "translateY(-1px) scale(1.05)";
        }}
      >
        <FiMinus size={16} />
      </div>

      {/* Square Number Input with Rounded Edges */}
      <input
        className="focus:outline-none text-center font-semibold"
        style={{
          width: "40px",
          height: "32px",
          borderRadius: "8px",
          border: "1px solid rgba(200, 200, 200, 0.4)",
          background: "rgba(255, 255, 255, 0.9)",
          fontSize: "16px",
          color: "#333"
        }}
        type={"number"}
        onWheel={(e: any) => {
          e.target.blur();
        }}
        onChange={({ target }) =>
          (limit === undefined || +target.value <= limit) &&
          setCount(+target.value)
        }
        value={+count}
      />

      {/* Plus Button with 3D Glass Effect */}
      <div
        className="cursor-pointer transition-all duration-200 ease-out"
        style={{
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          // Normal state - White glass
          background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 20%, rgba(255, 255, 255, 0.7) 70%, rgba(240, 240, 240, 0.8) 100%), rgba(255, 255, 255, 0.8)`,
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: `
            0 4px 15px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 2px 8px rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.05)
          `,
          color: "#333"
        }}
        onClick={() => {
          (limit === undefined || count < limit) && setCount(count + 1);
        }}
        onMouseEnter={(e) => {
          // Hover state - Yellow glass
          e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`;
          e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
          e.currentTarget.style.color = "#000";
          e.currentTarget.style.transform = "translateY(-1px) scale(1.05)";
          e.currentTarget.style.boxShadow = `
            0 6px 20px rgba(250, 204, 21, 0.4),
            inset 0 2px 0 rgba(255, 255, 255, 0.8),
            inset 0 3px 10px rgba(255, 255, 255, 0.4),
            inset 0 -1px 0 rgba(255, 215, 0, 0.4)
          `;
        }}
        onMouseLeave={(e) => {
          // Return to normal state
          e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 20%, rgba(255, 255, 255, 0.7) 70%, rgba(240, 240, 240, 0.8) 100%), rgba(255, 255, 255, 0.8)`;
          e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.6)";
          e.currentTarget.style.color = "#333";
          e.currentTarget.style.transform = "translateY(0) scale(1)";
          e.currentTarget.style.boxShadow = `
            0 4px 15px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            inset 0 2px 8px rgba(255, 255, 255, 0.3),
            inset 0 -1px 0 rgba(0, 0, 0, 0.05)
          `;
        }}
        onMouseDown={(e) => {
          // Press state - Deeper yellow
          e.currentTarget.style.transform = "translateY(1px) scale(0.98)";
        }}
        onMouseUp={(e) => {
          // Release - back to hover state
          e.currentTarget.style.transform = "translateY(-1px) scale(1.05)";
        }}
      >
        <FiPlus size={16} />
      </div>
    </div>
  );
};

export default Counter;