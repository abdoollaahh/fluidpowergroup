import Anchor from "@/modules/Anchor";
import siteLinks from "constants/site-links";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { v4 as uuid } from "uuid";

type INavSnackbarProps = { handleClose: () => void };

const NavSnackbar = ({ handleClose }: INavSnackbarProps) => {
  const [pressedItem, setPressedItem] = useState<string | null>(null);
  
  const pages = useMemo(
    () => siteLinks.map((page) => ({ ...page, id: uuid() })),
    []
  );

  const handleItemPress = (pageId: string) => {
    setPressedItem(pageId);
    setTimeout(() => {
      setPressedItem(null);
    }, 200); // Brief highlight
  };

  return (
    <div className="flex flex-col gap-4 text-3xl font-light tracking-wider text-black">
      {pages.map((page, i) => (
        <motion.div
          key={page.id}
          initial={{ opacity: 0, y: -100 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: i * 0.2 },
          }}
          exit={{
            opacity: 0,
            y: -100,
            transition: {
              duration: 0.2,
            },
          }}
          onClick={handleClose}
          onTouchStart={() => handleItemPress(page.id)}
          onMouseDown={() => handleItemPress(page.id)}
          className="cursor-pointer px-2 py-1 rounded-xl transition-all duration-200"
          style={{
            backgroundColor: pressedItem === page.id ? "rgba(0, 0, 0, 0.1)" : "transparent"
          }}
        >
          <Anchor href={page.href} className="flex items-center gap-4">
            {page.title}
          </Anchor>
        </motion.div>
      ))}
    </div>
  );
};

export default NavSnackbar;