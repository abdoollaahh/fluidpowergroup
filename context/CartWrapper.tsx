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
  // Start with empty cart for SSR consistency
  const [cart, setCart] = useState<ICart>({ open: false, items: [] });
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage after component mounts (client-side only)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('shopping-cart');
      const cartTimestamp = localStorage.getItem('cart-timestamp');
      
      if (savedCart && cartTimestamp) {
        const now = Date.now();
        const saved = parseInt(cartTimestamp);
        const oneHourInMs = 1 * 60 * 60 * 1000; // 1 hour
        
        // Check if cart is less than 1 hour old
        if (now - saved < oneHourInMs) {
          const parsedCart = JSON.parse(savedCart);
          setCart({
            open: false, // Always start with cart closed
            items: parsedCart.items || []
          });
        } else {
          // Cart expired, clear it
          localStorage.removeItem('shopping-cart');
          localStorage.removeItem('cart-timestamp');
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
    
    setIsHydrated(true);
  }, []); // Run only once after mount

  // Save cart to localStorage whenever it changes (but only after hydration)
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('shopping-cart', JSON.stringify(cart));
        localStorage.setItem('cart-timestamp', Date.now().toString());
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cart, isHydrated]);

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