import { FC } from "react";

type IIconButtonProps = {
  Icon: FC;
  className?: string;
};

const IconButton = ({ Icon, className }: IIconButtonProps) => {
  return (
    <a className="text-2xl">
      <div className="p-2 hover:bg-white/10 rounded-full">
        <Icon />
      </div>
    </a>
  );
};

export default IconButton;
