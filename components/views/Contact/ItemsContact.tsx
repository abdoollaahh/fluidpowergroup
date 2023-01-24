import { FiMail, FiPhone } from "react-icons/fi";
import ItemContact from "./ItemContact";

const ItemsContact = () => {
  const contactOptions = [
    {
      label: "General Queries",
      href: "mailto:admin@fluidpowergroup.com.au",
      icon: FiMail,
      title: "admin@fluidpowergroup.com.au",
    },
    {
      label: "Product Queries",
      href: "mailto:info@fluidpowergroup.com.au",
      icon: FiMail,
      title: "info@fluidpowergroup.com.au",
    },
    {
      label: "Sales",
      href: "tel:61409517333",
      icon: FiPhone,
      title: "+61 409 517 333",
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-4 sm:gap-8">
      {contactOptions.map((item, i) => (
        <ItemContact key={i} {...item} />
      ))}
    </div>
  );
};

export default ItemsContact;
