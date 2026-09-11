export interface ProductSpecs {
  ram?: string;
  storage?: string;
  display?: string;
  battery?: string;
  camera?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  brand: string;
  category: 'phone' | 'accessory';
  subCategory: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  specs?: ProductSpecs;
  compatibleWith?: string;
  inStock: boolean;
  isFeatured?: boolean;
  description: string;
  bulkDiscountPercent?: number;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
  selectedPrice: number;
}
