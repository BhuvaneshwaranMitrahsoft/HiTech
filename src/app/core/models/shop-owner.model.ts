export interface ShopOwner {
  id: string;
  email: string;
  passwordHash?: string;
  defaultPasswordPlain?: string;
  role: 'shopowner' | 'admin';
  shopName: string;
  ownerName: string;
  phone: string;
  location: string;
  shopPhoto: string;
  gstNumber?: string;
  status: 'active' | 'pending' | 'suspended';
  registeredDate: string;
  bulkDiscountTier?: string;
}

export interface ShopRegistrationForm {
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  location: string;
  shopPhoto: string;
  gstNumber?: string;
  additionalNotes?: string;
}
