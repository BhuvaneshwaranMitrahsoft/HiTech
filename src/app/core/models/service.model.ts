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

export interface ServiceBookingRequest {
  id: string;
  serviceId: string;
  serviceName: string;
  deviceModel: string;
  issueDescription: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  preferredDate: string;
  preferredTimeSlot: string;
  estimatedPrice: number;
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  createdAt: string;
}
