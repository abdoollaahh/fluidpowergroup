import Image from "next/image";
import React from "react";
import Anchor from "../Anchor";

type ILogoProps = {
  type?: "header" | "footer";
};

const Logo = ({ type = "header" }: ILogoProps) => {
  return (
    <Anchor href="/">
      <div className="relative h-[90px] w-[220px]">
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_URL || ''}/logo.png`}
          alt="Site logo"
          layout="fill"
          objectFit="contain"
          priority
          quality={100}
          loader={({ src }) => src} // Add this line
        />
      </div>
    </Anchor>
  );
};

export default Logo;