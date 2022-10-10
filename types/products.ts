export interface Category {
  title: string;
  id: string;
  slug: string;
  image?: string;
  subCategories: SubCategory[];
}

export interface SubCategory {
  title: string;
  id: string;
  image?: string;
  slug: string;
  category: string;
}

export interface Product extends SubCategory {
  price: number;
}
