import type { Property } from "@/services/firestore/properties";

export const getPropertyDetailPath = (property: Pick<Property, "id" | "status">) => {
  if (!property.id) return "/sales";

  const isRental = ["for-rent", "for rent"].includes(property.status.toLowerCase());
  const isSale = ["for-sale", "for sale"].includes(property.status.toLowerCase());
  const route = isRental ? "rentals" : isSale ? "sales" : "properties";

  return `/${route}/${encodeURIComponent(property.id)}`;
};
