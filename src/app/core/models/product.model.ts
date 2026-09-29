export interface ProductSpecs {
  ram?: string;
  storage?: string;
  display?: string;
  battery?: string;
  camera?: string;
}

export interface CompetitorLinks {
  amazonUrl?: string;
  amazonAsin?: string;
  flipkartUrl?: string;
}

export interface CompetitorPriceRecord {
  amazonPrice?: number | null;
  amazonUrl?: string;
  flipkartPrice?: number | null;
  flipkartUrl?: string;
  lastUpdated?: string;
  status?: 'success' | 'partial' | 'failed';
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
  competitorLinks?: CompetitorLinks;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
  selectedPrice: number;
}

