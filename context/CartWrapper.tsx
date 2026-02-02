import { createContext, useState } from 'react';
import { ICart, IItemCart } from 'types/cart';
import { Children } from 'types/general';

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

  const toggleCart = () => {
    setCart((prevCart) => ({ ...prevCart, open: !prevCart.open }));
  };

  const addItem = (item: IItemCart) => {
    setCart((prevCart) => ({
      open: true,
      items: [...prevCart.items, item],
    }));
  };

  const deleteItem = (item: IItemCart) => {
    setCart((prevCart) => ({
      ...prevCart,
      items: prevCart.items.filter((itemCart) => itemCart.id !== item.id),
    }));
  };

  const updateItem = (item: IItemCart) => {
    setCart((prevCart) => ({
      ...prevCart,
      items: prevCart.items.map((itemCart) =>
        itemCart.id !== item.id ? itemCart : item
      ),
    }));
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
      }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartWrapper;
