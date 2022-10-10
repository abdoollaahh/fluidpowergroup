import { FiX } from "react-icons/fi";

interface IHeaderCart {
  handleClose: () => void;
}

const HeaderCart = ({ handleClose }: IHeaderCart) => {
  return (
    <div className="p-4 border flex justify-center relative">
      <div className="absolute top-0 left-0 h-full  flex items-center">
        <div
          className="text-3xl lg:text-2xl p-2 rounded-full mx-4 hover:bg-slate-100/50 cursor-pointer"
          onClick={handleClose}
        >
          <FiX />
        </div>
      </div>
      <h2 className="text-3xl font-light">Your Cart</h2>
    </div>
  );
};

export default HeaderCart;
