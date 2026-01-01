// ========================================
// PHASE 1: URL MIGRATION
// ========================================
// Updated "buy" href to new Suite360 URL
const siteLinks = [
  { id: "home", title: "Home", href: "/" },
  { id: "products", title: "BuyProducts", href: "/catalogue" },
  { id: "buy", title: "Suite360", href: "/suite360" }, // ← CHANGED from /buy
  { id: "services", title: "Services", href: "/services" },
  { id: "design", title: "Design", href: "/design" },
  { id: "about", title: "About", href: "/about" },
  { id: "contact", title: "Contact Us", href: "/contact" },
];

export default siteLinks;