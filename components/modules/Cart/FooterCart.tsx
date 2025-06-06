import axios from "axios"
import {useRouter} from "next/router"

const FooterCart = ({items, handleClose} : any) => {

  const router = useRouter();

  const checkout = async () => {
    const body = items.map((item: any) => ({
      product_id: item.id,
      quantity: item.quantity
    }))
    const cart = await axios.post(`/api/createCart`, {
      items: body
    })
    
    if (cart.status === 200) {
      router.push(cart.data.checkout_url)
    }
  }

  return (
    <div className="border p-4 flex flex-col gap-4">
      <button className="rounded-sm" onClick={handleClose}>Continue Shopping</button>
      <button className="rounded-sm btn-secondary" onClick={checkout}>Go to Checkout</button>
    </div>
  );
};

export default FooterCart;
