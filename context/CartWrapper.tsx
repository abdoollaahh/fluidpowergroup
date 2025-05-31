import { createContext, useState, useEffect } from 'react';
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
  clearCart: () => void;
}>({
  toggleCart: () => {},
  items: [],
  open: false,
  addItem: () => {},
  deleteItem: () => {},
  updateItem: () => {},
  setCart: () => {},
  clearCart: () => {},
});

type ICartWrapperProps = {
  children: Children;
};

const CartWrapper = ({ children }: ICartWrapperProps) => {
  // Initialize cart state from localStorage if available
  const [cart, setCart] = useState<ICart>(() => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('shopping-cart');
        const cartTimestamp = localStorage.getItem('cart-timestamp');
        
        if (savedCart && cartTimestamp) {
          const now = Date.now();
          const saved = parseInt(cartTimestamp);
          const oneDayInMs = 1 * 60 * 60 * 1000; // 24 hours
          
          // Check if cart is less than 24 hours old
          if (now - saved < oneDayInMs) {
            const parsedCart = JSON.parse(savedCart);
            return {
              open: false,
              items: parsedCart.items || []
            };
          } else {
            // Cart expired, clear it
            localStorage.removeItem('shopping-cart');
            localStorage.removeItem('cart-timestamp');
          }
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
    return { open: false, items: [] };
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('shopping-cart', JSON.stringify(cart));
        localStorage.setItem('cart-timestamp', Date.now().toString());
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cart]);

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

  const clearCart = () => {
    setCart({ open: false, items: [] });
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
        clearCart,
        open: cart.open,
      }}>
      {children}
    </CartContext.Provider>
  );
};

export default CartWrapper;