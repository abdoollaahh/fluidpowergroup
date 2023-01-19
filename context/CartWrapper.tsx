import { createContext, useState } from "react";
import { ICart, IItemCart } from "types/cart";
import { Children } from "types/general";

export const CartContext = createContext<{
  items: IItemCart[];
  open: boolean;
  toggleCart: () => void;
  addItem: (item: IItemCart) => void;
  deleteItem: (item: IItemCart) => void;
  updateItem: (item: IItemCart) => void;
  setCart: (cart: ICart) => void;
}>({
  toggleCart: () => {},
  items: [],
  open: false,
  addItem: () => {},
  deleteItem: () => {},
  updateItem: () => {},
  setCart: () => {},
});

type ICartWrapperProps = {
  children: Children;
};

const CartWrapper = ({ children }: ICartWrapperProps) => {
  const [cart, setCart] = useState<ICart>({ open: false, items: [] });

  console.log(cart);

  const toggleCart = () => {
    setCart({ ...cart, open: !cart.open });
  };

  const addItem = (item: IItemCart) => {
    console.log(item, "ADD");

    setCart({ open: true, items: cart.items.concat(item) });
  };

  const deleteItem = (item: IItemCart) => {
    setCart({
      ...cart,
      items: cart.items.filter((itemCart) => itemCart.id !== item.id),
    });
  };

  const updateItem = (item: IItemCart) => {
    setCart({
      ...cart,
      items: cart.items.map((itemCart) =>
        itemCart.id !== item.id ? itemCart : item
      ),
    });
  };

  return (
    <CartContext.Provider
      value={{
        toggleCart,
        items: cart.items,
        addItem,
        deleteItem,
        updateItem,
        setCart,
        open: cart.open,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartWrapper;
