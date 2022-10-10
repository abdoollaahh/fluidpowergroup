import { FiMail, FiPhone } from "react-icons/fi";
import ItemContact from "./ItemContact";

const ItemsContact = () => {
  const contactOptions = [
    {
      label: "General Queries",
      href: "mailto:office@abc.com",
      icon: FiMail,
      title: "office@abc.com",
    },
    {
      label: "Product Queries",
      href: "mailto:info@abc.com",
      icon: FiMail,
      title: "info@abc.com",
    },
    {
      label: "Sales",
      href: "tel:12345675645",
      icon: FiPhone,
      title: "+12345675645",
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
