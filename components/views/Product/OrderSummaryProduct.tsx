import { CartContext } from "context/CartWrapper";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useMemo } from "react";
import { IItemCart } from "types/cart";
import { useRouter } from "next/router";

type IOrderSummaryProductProps = {
  items: IItemCart[];
  series?: ISeries;
  handleClear: () => void;
};

type ISeries = {
  name: string;
  description: string;
  images: string[];
};

const OrderSummaryProduct = ({
  items,
  series,
  handleClear,
}: IOrderSummaryProductProps) => {
  const itemsAdded = useMemo(
    () => items.filter((item) => item.quantity),
    [items]
  );
  const router = useRouter();
  const { addItem } = useContext(CartContext);

  const totalPrice = useMemo(
    () => items.reduce((prev, curr) => prev + curr.price * curr.quantity, 0),
    [items]
  );

  const salesTax = 0.1 * totalPrice;

  const handleAddToCart = () => {
    window.scroll({ behavior: "smooth", top: 0, left: 0 });

    itemsAdded.forEach((item) => {
      const itemWithImage = {
        ...item,
        image: series?.images?.[0] || '/cartImage.jpeg' // Use first series image or fallback
      };
      addItem(itemWithImage);
    });

    handleClear();
  };

  const checkout = async () => {
    // Add items to cart silently (without scrolling or opening cart)
    itemsAdded.forEach((item) => {
      const itemWithImage = {
        ...item,
        image: series?.images?.[0] || '/cartImage.jpeg'
      };
      addItem(itemWithImage);
    });
  
    // Clear the form
    handleClear();
  
    // Navigate directly to unified checkout page (reads from localStorage)
    console.log('Routing to unified checkout - Total items:', itemsAdded.length);
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {itemsAdded.length > 0 && (
        <motion.div
          className="wrapper px-8 md:px-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.6 } }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
        >
          <div className="w-full flex flex-col sm:items-end">
            <div className="flex flex-col gap-6 max-w-md w-full">
              <h2 className="text-3xl sm:text-4xl font-semibold">
                Order Summary
              </h2>

              <div className="flex flex-col gap-4">
                <div className="sm:text-xl font-normal flex flex-col gap-4">
                  {itemsAdded.map((item) => (
                    <div className="flex justify-between gap-8" key={item.name}>
                      <div>
                        {item.quantity} x {item.name}
                      </div>
                      <div>${(item.quantity * item.price).toFixed(2)}</div>
                    </div>
                  ))}

                  <div className="flex justify-between gap-8 italic">
                    <div>GST (10%) </div>
                    <div>${salesTax.toFixed(2)}</div>
                  </div>
                </div>

                <div className="w-full border"></div>
                <div className="flex justify-between gap-8 sm:text-xl">
                  <div>Total</div>
                  <div>${(salesTax + totalPrice).toFixed(2)}</div>
                </div>
              </div>

              <div className="flex w-full gap-4 mt-2 justify-center">
                {/* Checkout Button - Black 3D Glass */}
                <button 
                  className="relative overflow-hidden transition-all duration-300 ease-out"
                  onClick={checkout}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "14px 28px",
                    borderRadius: "40px",
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "#fff",
                    textDecoration: "none",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    whiteSpace: "nowrap" as const,
                    minWidth: "140px",
                    width: "auto",
                    // Black 3D glass background
                    background: `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`,
                    backdropFilter: "blur(15px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    boxShadow: `
                      0 4px 15px rgba(0, 0, 0, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.3),
                      inset 0 2px 8px rgba(255, 255, 255, 0.1),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                    `
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    // Change to white background on hover
                    e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 20%, rgba(255, 255, 255, 0.9) 70%, rgba(245, 245, 245, 0.95) 100%), rgba(255, 255, 255, 0.9)`;
                    e.currentTarget.style.border = "1px solid rgba(200, 200, 200, 0.8)";
                    e.currentTarget.style.color = "#000";
                    e.currentTarget.style.boxShadow = `
                      0 10px 30px rgba(0, 0, 0, 0.2),
                      inset 0 2px 0 rgba(255, 255, 255, 1),
                      inset 0 3px 10px rgba(255, 255, 255, 0.8),
                      inset 0 -1px 0 rgba(200, 200, 200, 0.4)
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                    e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(0, 0, 0, 0.9) 20%, rgba(0, 0, 0, 0.8) 70%, rgba(20, 20, 20, 0.85) 100%), rgba(0, 0, 0, 0.8)`;
                    e.currentTarget.style.border = "1px solid rgba(255, 255, 255, 0.2)";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.boxShadow = `
                      0 4px 15px rgba(0, 0, 0, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.3),
                      inset 0 2px 8px rgba(255, 255, 255, 0.1),
                      inset 0 -1px 0 rgba(0, 0, 0, 0.2)
                    `;
                  }}
                >
                  {/* Glass shine effect */}
                  <div
                    style={{
                      position: "absolute",
                      top: "1px",
                      left: "8px",
                      right: "8px",
                      height: "50%",
                      background: "linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                      borderRadius: "40px 40px 20px 20px",
                      pointerEvents: "none",
                      transition: "all 0.4s ease"
                    }}
                  />
                  Checkout
                </button>

                {/* Add to Cart Button - Yellow 3D Glass */}
                <button 
                  className="relative overflow-hidden transition-all duration-300 ease-out"
                  onClick={handleAddToCart}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "14px 28px",
                    borderRadius: "40px",
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "#000",
                    textDecoration: "none",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    position: "relative",
                    whiteSpace: "nowrap" as const,
                    minWidth: "140px",
                    width: "auto",
                    // Yellow 3D glass background
                    background: `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`,
                    backdropFilter: "blur(15px)",
                    border: "1px solid rgba(255, 215, 0, 0.9)",
                    boxShadow: `
                      0 6px 20px rgba(250, 204, 21, 0.4),
                      inset 0 2px 0 rgba(255, 255, 255, 0.8),
                      inset 0 3px 8px rgba(255, 255, 255, 0.4),
                      inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                    `
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(255, 215, 0, 1) 20%, rgba(250, 204, 21, 0.9) 60%, rgba(255, 235, 59, 0.9) 100%), rgba(255, 215, 0, 0.8)`;
                    e.currentTarget.style.border = "1px solid rgba(255, 235, 59, 1)";
                    e.currentTarget.style.boxShadow = `
                      0 10px 30px rgba(250, 204, 21, 0.6),
                      inset 0 2px 0 rgba(255, 255, 255, 0.9),
                      inset 0 4px 12px rgba(255, 255, 255, 0.5),
                      inset 0 -1px 0 rgba(255, 215, 0, 0.6)
                    `;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0px) scale(1)";
                    e.currentTarget.style.background = `radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), rgba(250, 204, 21, 0.6)`;
                    e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                    e.currentTarget.style.boxShadow = `
                      0 6px 20px rgba(250, 204, 21, 0.4),
                      inset 0 2px 0 rgba(255, 255, 255, 0.8),
                      inset 0 3px 8px rgba(255, 255, 255, 0.4),
                      inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                    `;
                  }}
                >
                  {/* Glass shine effect */}
                  <div
                    style={{
                      position: "absolute",
                      top: "1px",
                      left: "8px",
                      right: "8px",
                      height: "50%",
                      background: "linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.3) 50%, rgba(255, 215, 0, 0.2) 100%)",
                      borderRadius: "40px 40px 20px 20px",
                      pointerEvents: "none",
                      transition: "all 0.3s ease"
                    }}
                  />
                  Add to cart
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrderSummaryProduct;