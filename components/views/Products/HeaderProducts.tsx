import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { Category, SubCategory } from "types/products";

// Helper function to strip HTML tags
const stripHtml = (str: string): string => {
  if (!str) return '';
  
  // Remove HTML tags
  let cleaned = str.replace(/<[^>]*>/g, '');
  
  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  
  // Clean up extra whitespace
  return cleaned.trim().replace(/\s+/g, ' ');
};

const HeaderProducts = ({
  categories,
  slug,
}: {
  categories: Category[];
  slug: string | string[] | undefined;
}) => {
  const { subcategory } = useRouter().query;

  const subCategories = useMemo(
    () =>
      categories.reduce(
        (prev: SubCategory[], curr) => prev.concat(curr.subCategories),
        []
      ),
      [categories] // Add categories to dependency array
  );

  // Get the description and strip HTML tags
  const description = subCategories.find((c) => subcategory === c.slug)?.description;
  const cleanDescription = description ? stripHtml(description) : '';

  return (
    <div className="flex flex-col items-center gap-3">
      <h1 className="text-4xl font-semibold">Products</h1>
      <h2 className="text-xl font-light text-center">
        {cleanDescription}
      </h2>
    </div>
  );
};

export default HeaderProducts;