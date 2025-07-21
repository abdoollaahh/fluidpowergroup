// components/views/Products/GridProducts/ItemProducts.tsx
import Anchor from "@/modules/Anchor";
import { motion } from "framer-motion";
import SafeImage from "../../../../utils/SafeImage";

const ItemProducts = ({ item, showDescription = false }: { item: any, showDescription?: boolean }) => {
  const getDescriptions = (description: string) => {
    //get text before first break tag
    const text = description.split("<br>")[0];
    const stripped = text.replace(/(<([^>]+)>)/ig, "").replace(/&nbsp;/g, "");
    return stripped + "...";
  }

  // Determine the correct URL based on item type
  const getItemUrl = (item: any) => {
    console.log('=== ItemProducts URL Debug ===');
    console.log('Item data:', item);
    console.log('Has price:', item.price !== undefined);
    console.log('Has stock:', item.stock !== undefined);
    console.log('Has quantity:', item.quantity !== undefined);
    console.log('Has name:', !!item.name);
    console.log('Has title:', !!item.title);
    console.log('Has slug:', !!item.slug);
    
    let url = '';
    let reason = '';
    
    // If item has quantity/price/stock, it's a final product - use ID
    if (item.quantity !== undefined || item.price !== undefined || item.stock !== undefined) {
      url = `/products/${item.id}`;
      reason = 'Has price/stock/quantity - using ID URL';
    }
    // If item has name (not title) and no slug, it's likely a product - use ID
    else if (item.name && !item.title && !item.slug) {
      url = `/products/${item.id}`;
      reason = 'Has name, no title/slug - using ID URL';
    }
    // If item has title (not name) and slug, it's a category/series - use query parameter
    else if (item.title && item.slug) {
      url = `/products?subcategory=${item.slug}`;
      reason = 'Has title and slug - using query URL';
    }
    // Fallback to ID-based URL (safer default)
    else {
      url = `/products/${item.id}`;
      reason = 'Fallback - using ID URL';
    }
    
    console.log('Decision:', reason);
    console.log('Generated URL:', url);
    console.log('=== End Debug ===');
    
    return url;
  };

  if (!item) {
    return (
      <div className="flex flex-col w-full max-w-sm mx-auto group cursor-pointer border-slate-800 border-[1px] p-4 h-full shadow-md">
        <div className="w-full pt-[100%] relative">
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        </div>
        <div className="text-xl px-3 py-1.5 font-light flex justify-center">
          <h3 className="text-xl font-semibold">Loading...</h3>
        </div>
      </div>
    );
  }

  return (
    <Anchor href={getItemUrl(item)}>
      <div className="flex flex-col w-full max-w-sm mx-auto group cursor-pointer border-slate-800 border-[1px] p-4 h-full shadow-md">
        <motion.div className="w-full pt-[100%] relative transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <SafeImage
              src={item.image}
              alt={item.slug || item.name || "Product image"}
              width={300}
              height={300}
              className="scale-75 group-hover:scale-[0.8] transition-all object-contain"
            />
          </div>
        </motion.div>
        <div className="text-xl px-3 py-1.5 font-light flex justify-center gap-12">
          <h3 className="text-xl font-semibold"><b>{item.name || item.title}</b></h3>
        </div>
        {showDescription && <div className="text-center">
          <span className="text-xs font-semibold text-slate-700">
            {item.description && getDescriptions(item.description)}
          </span>
        </div>}
      </div>
    </Anchor>
  );
};

export default ItemProducts;