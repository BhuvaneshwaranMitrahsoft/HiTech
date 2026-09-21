export interface ServiceBookingItem {
  id: string;
  name: string;
  category: string;
  startingPrice: number;
  estimatedTime: string;
  warrantyPeriod: string;
  description: string;
  icon: string;
  isPopular: boolean;
  available: boolean;
  includedPoints: string[];
}

export type ServiceFulfillmentMode = 'home_pickup' | 'parcel' | 'store_handover';

export interface ServiceBookingRequest {
  id: string;
  serviceId: string;
  serviceName: string;
  deviceModel: string;
  issueDescription: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  pincode?: string;
  distanceKm?: number;
  pickupEligible?: boolean;
  fulfillmentMode: ServiceFulfillmentMode;
  preferredDate: string;
  preferredTimeSlot: string;
  estimatedPrice: number;
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
}
