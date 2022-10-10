import Anchor from "@/modules/Anchor";
import React from "react";
import { Children } from "types/general";

type ILinkFooterProps = {
  href?: string;
  children: Children;
};

const LinkFooter = ({ href = "/", children }: ILinkFooterProps) => {
  return (
    <Anchor href={href} className="text-lg ">
      {children}
    </Anchor>
  );
};

export default LinkFooter;
