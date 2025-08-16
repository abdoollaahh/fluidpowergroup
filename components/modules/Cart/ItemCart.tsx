import { CartContext } from "context/CartWrapper";
import Image from "next/image";
import { useContext } from "react";
import { FiX, FiPlus, FiMinus } from "react-icons/fi";
import { IItemCart } from "types/cart";

type IItemCartProps = { item: IItemCart };

const ItemCart = ({ item }: IItemCartProps) => {
  const { updateItem, deleteItem } = useContext(CartContext);

  // Calculate the total price for the item based on its quantity
  const totalPrice = item.price * item.quantity;

  const incrementQuantity = () => {
    if (item.quantity < item.stock) {
      updateItem({ ...item, quantity: item.quantity + 1 });
    }
  };

  const decrementQuantity = () => {
    if (item.quantity > 0) {
      updateItem({ ...item, quantity: item.quantity - 1 });
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 0 && value <= item.stock) {
      updateItem({ ...item, quantity: value });
    }
  };

  return (
    <div 
      className="m-3 p-4 flex gap-4 justify-between select-none transition-all duration-200 hover:shadow-md"
      style={{
        border: "1px solid rgba(0, 0, 0, 0.15)",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.5)",
        backdropFilter: "blur(5px)"
      }}
    >
      <div className="flex gap-4 flex-grow">
        <div 
          className="w-20 aspect-square p-2 min-w-fit"
          style={{
            background: "white",
            border: "1px solid rgba(0, 0, 0, 0.1)",
            borderRadius: "8px"
          }}
        >
          <div className="relative w-full h-full">
            <Image
              layout="fill"
              src={item.image || '/cartImage.jpeg'} 
              alt={item.name || "product"}
              objectFit="contain"
            />
          </div>
        </div>
        <div className="flex flex-col text-xl font-light gap-2">
          <h3 className="font-medium">{item.name}</h3>
          <h4 className="text-base text-gray-600">{item.name}</h4>
          
          {/* Enhanced Quantity Counter */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={decrementQuantity}
              disabled={item.quantity <= 0}
              className="flex items-center justify-center transition-all duration-200"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid rgba(0, 0, 0, 0.2)",
                background: item.quantity <= 0 
                  ? "rgba(200, 200, 200, 0.3)" 
                  : "rgba(255, 255, 255, 0.8)",
                color: item.quantity <= 0 ? "#999" : "#333",
                cursor: item.quantity <= 0 ? "not-allowed" : "pointer",
                backdropFilter: "blur(10px)",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
              }}
              onMouseEnter={(e) => {
                if (item.quantity > 0) {
                  e.currentTarget.style.background = "rgba(250, 204, 21, 0.8)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (item.quantity > 0) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              <div style={{ width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiMinus style={{ width: "100%", height: "100%", minWidth: "18px", minHeight: "18px" }} />
              </div>
            </button>

            <input
              type="number"
              value={item.quantity}
              onChange={handleQuantityChange}
              min="0"
              max={item.stock}
              className="text-center font-semibold transition-all duration-200 focus:outline-none"
              style={{
                width: "60px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid rgba(0, 0, 0, 0.2)",
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(10px)",
                boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
                fontSize: "14px"
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(250, 204, 21, 0.8)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(250, 204, 21, 0.2), inset 0 1px 3px rgba(0, 0, 0, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.2)";
                e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0, 0, 0, 0.1)";
              }}
            />

            <button
              onClick={incrementQuantity}
              disabled={item.quantity >= item.stock}
              className="flex items-center justify-center transition-all duration-200"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid rgba(0, 0, 0, 0.2)",
                background: item.quantity >= item.stock 
                  ? "rgba(200, 200, 200, 0.3)" 
                  : "rgba(255, 255, 255, 0.8)",
                color: item.quantity >= item.stock ? "#999" : "#333",
                cursor: item.quantity >= item.stock ? "not-allowed" : "pointer",
                backdropFilter: "blur(10px)",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
              }}
              onMouseEnter={(e) => {
                if (item.quantity < item.stock) {
                  e.currentTarget.style.background = "rgba(250, 204, 21, 0.8)";
                  e.currentTarget.style.transform = "scale(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (item.quantity < item.stock) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.8)";
                  e.currentTarget.style.transform = "scale(1)";
                }
              }}
            >
              <div style={{ width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiPlus style={{ width: "100%", height: "100%", minWidth: "18px", minHeight: "18px" }} />
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-between items-end text-xl font-light gap-1">
        <button
          className="flex items-center justify-center transition-all duration-200"
          onClick={() => deleteItem(item)}
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            background: "rgba(254, 226, 226, 0.8)",
            color: "#dc2626",
            cursor: "pointer"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
            e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(254, 226, 226, 0.8)";
            e.currentTarget.style.borderColor = "rgba(220, 38, 38, 0.3)";
          }}
        >
          <div style={{ width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FiX style={{ width: "100%", height: "100%", minWidth: "20px", minHeight: "20px" }} />
          </div>
        </button>
        <h4 className="text-lg font-medium">${totalPrice.toFixed(2)}</h4>
      </div>
    </div>
  );
};

export default ItemCart;