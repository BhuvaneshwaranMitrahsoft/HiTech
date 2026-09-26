import { CartItem } from './product.model';

export interface CustomerDetails {
  name: string;
  phone: string;
  address: string;
  pincode?: string;
  email?: string;
  notes?: string;
}

export interface OrderItemRecord {
  productId: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  totalPrice: number;
  image: string;
}

export interface OrderStatusHistoryItem {
  status: Order['status'];
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerDetails;
  items: OrderItemRecord[];
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;
  placedByRole: 'user' | 'shopowner';
  shopOwnerId?: string;
  shopName?: string;
  status: 'Order Placed' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled';
  createdAt: string;
  updatedAt?: string;
  statusHistory?: OrderStatusHistoryItem[];
  ownerNotifiedViaEmail: boolean;
}
