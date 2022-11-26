import Image from "next/image";
import React from "react";
import Anchor from "../Anchor";

type ILogoProps = {
  type?: "header" | "footer";
};

const Logo = ({ type = "header" }: ILogoProps) => {
  return (
    <Anchor href="/">
      <div className="relative h-[70px] w-[200px] bg-transparent">
        <Image
          src={`https://fluidpowergroup.s3.ap-southeast-2.amazonaws.com/logo-${type}.png`}
          layout="fill"
          objectFit="contain"
          alt="Site logo"
        />
      </div>
    </Anchor>
  );
};

export default Logo;
