import Image from "next/image";
import React from "react";
import Anchor from "../Anchor";

type ILogoProps = {
  type?: "header" | "footer";
};

const Logo = ({ type = "header" }: ILogoProps) => {
  return (
    <Anchor href="/">
      <div className="relative h-[90px] w-[220px] overflow-hidden">
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/logo.png`}
          alt="Site logo"
          width={220}
          height={90}
          className="object-contain w-full h-full"
          priority
          quality={100}
          unoptimized
        />
      </div>
    </Anchor>
  );
};

export default Logo;