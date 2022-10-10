import { createContext, useState } from "react";
import { Children } from "types/general";

export const HoverContext = createContext<{
  hover: string | null;
  setHover: (val: string | null) => void;
}>({ hover: null, setHover: () => {} });

type IHoverWrapperProps = {
  children: Children;

  hook: { hover: string | null; setHover: (val: string | null) => void };
};

const HoverWrapper = ({
  children,
  hook: { hover, setHover },
}: IHoverWrapperProps) => {
  return (
    <HoverContext.Provider value={{ hover, setHover }}>
      {children}
    </HoverContext.Provider>
  );
};

export default HoverWrapper;
