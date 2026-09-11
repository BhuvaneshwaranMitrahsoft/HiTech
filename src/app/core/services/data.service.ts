import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProductItem } from '../models/product.model';
import { ServiceBookingItem } from '../models/service.model';
import { ShopOwner, ShopRegistrationForm } from '../models/shop-owner.model';

const STORAGE_KEYS = {
  PRODUCTS: 'hitech_custom_products',
  ACCESSORIES: 'hitech_custom_accessories',
  SERVICES: 'hitech_custom_services',
  SHOP_OWNERS: 'hitech_custom_shopowners'
};

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);

  // Reactive state signals
  private _products = signal<ProductItem[]>([]);
  private _accessories = signal<ProductItem[]>([]);
  private _services = signal<ServiceBookingItem[]>([]);
  private _shopOwners = signal<ShopOwner[]>([]);
  private _isLoaded = signal<boolean>(false);

  // Readonly public signals
  readonly products = this._products.asReadonly();
  readonly accessories = this._accessories.asReadonly();
  readonly services = this._services.asReadonly();
  readonly shopOwners = this._shopOwners.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();

  // Computed signals
  readonly allProducts = computed(() => [...this._products(), ...this._accessories()]);
  readonly featuredProducts = computed(() => this.allProducts().filter(p => p.isFeatured));
  readonly activeShopOwners = computed(() => this._shopOwners().filter(o => o.status === 'active'));

  constructor() {
    this.initData();
  }

  /**
   * Initializes data by loading bundled JSON and merging any localStorage modifications
   */
  async initData(): Promise<void> {
    try {
      // 1. Load Products
      const localProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (localProducts) {
        this._products.set(JSON.parse(localProducts));
      } else {
        this.http.get<ProductItem[]>('data/products.json').subscribe({
          next: (data) => this._products.set(data),
          error: (err) => console.error('Failed to load products.json', err)
        });
      }

      // 2. Load Accessories
      const localAccessories = localStorage.getItem(STORAGE_KEYS.ACCESSORIES);
      if (localAccessories) {
        this._accessories.set(JSON.parse(localAccessories));
      } else {
        this.http.get<ProductItem[]>('data/accessories.json').subscribe({
          next: (data) => this._accessories.set(data),
          error: (err) => console.error('Failed to load accessories.json', err)
        });
      }

      // 3. Load Services
      const localServices = localStorage.getItem(STORAGE_KEYS.SERVICES);
      if (localServices) {
        this._services.set(JSON.parse(localServices));
      } else {
        this.http.get<ServiceBookingItem[]>('data/services.json').subscribe({
          next: (data) => this._services.set(data),
          error: (err) => console.error('Failed to load services.json', err)
        });
      }

      // 4. Load Shop Owners
      const localOwners = localStorage.getItem(STORAGE_KEYS.SHOP_OWNERS);
      if (localOwners) {
        this._shopOwners.set(JSON.parse(localOwners));
      } else {
        this.http.get<ShopOwner[]>('data/shop-owners.json').subscribe({
          next: (data) => this._shopOwners.set(data),
          error: (err) => console.error('Failed to load shop-owners.json', err)
        });
      }

      this._isLoaded.set(true);
    } catch (e) {
      console.error('Error in initData', e);
      this._isLoaded.set(true);
    }
  }

  // --- Products & Accessories Modifiers ---

  toggleProductAvailability(id: string): void {
    const isPhone = this._products().some(p => p.id === id);
    if (isPhone) {
      this._products.update(list => {
        const updated = list.map(item => item.id === id ? { ...item, inStock: !item.inStock } : item);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
        return updated;
      });
    } else {
      this._accessories.update(list => {
        const updated = list.map(item => item.id === id ? { ...item, inStock: !item.inStock } : item);
        localStorage.setItem(STORAGE_KEYS.ACCESSORIES, JSON.stringify(updated));
        return updated;
      });
    }
  }

  updateProductPrice(id: string, newPrice: number): void {
    const isPhone = this._products().some(p => p.id === id);
    if (isPhone) {
      this._products.update(list => {
        const updated = list.map(item => item.id === id ? { ...item, price: newPrice } : item);
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
        return updated;
      });
    } else {
      this._accessories.update(list => {
        const updated = list.map(item => item.id === id ? { ...item, price: newPrice } : item);
        localStorage.setItem(STORAGE_KEYS.ACCESSORIES, JSON.stringify(updated));
        return updated;
      });
    }
  }

  // --- Services Modifiers ---

  toggleServiceAvailability(id: string): void {
    this._services.update(list => {
      const updated = list.map(srv => srv.id === id ? { ...srv, available: !srv.available } : srv);
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updated));
      return updated;
    });
  }

  updateServicePrice(id: string, newPrice: number): void {
    this._services.update(list => {
      const updated = list.map(srv => srv.id === id ? { ...srv, startingPrice: newPrice } : srv);
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(updated));
      return updated;
    });
  }

  // --- Shop Owners Modifiers ---

  toggleShopOwnerStatus(id: string): void {
    this._shopOwners.update(list => {
      const updated = list.map(owner => {
        if (owner.id === id) {
          const newStatus: 'active' | 'suspended' = owner.status === 'active' ? 'suspended' : 'active';
          return { ...owner, status: newStatus };
        }
        return owner;
      });
      localStorage.setItem(STORAGE_KEYS.SHOP_OWNERS, JSON.stringify(updated));
      return updated;
    });
  }

  updateShopOwnerCredentials(id: string, email: string, passwordPlain?: string, tier?: string): void {
    this._shopOwners.update(list => {
      const updated = list.map(owner => {
        if (owner.id === id) {
          return {
            ...owner,
            email: email || owner.email,
            defaultPasswordPlain: passwordPlain || owner.defaultPasswordPlain,
            bulkDiscountTier: tier || owner.bulkDiscountTier
          };
        }
        return owner;
      });
      localStorage.setItem(STORAGE_KEYS.SHOP_OWNERS, JSON.stringify(updated));
      return updated;
    });
  }

  registerNewShopOwner(form: ShopRegistrationForm): ShopOwner {
    const newOwner: ShopOwner = {
      id: 'owner-' + Date.now(),
      email: form.email,
      defaultPasswordPlain: 'Owner@HiTech123',
      role: 'shopowner',
      shopName: form.shopName,
      ownerName: form.ownerName,
      phone: form.phone,
      location: form.location,
      shopPhoto: form.shopPhoto || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80',
      gstNumber: form.gstNumber || '',
      status: 'active', // Auto-approved or set to active for static demo
      registeredDate: new Date().toISOString().split('T')[0],
      bulkDiscountTier: 'Standard (10% OFF)'
    };

    this._shopOwners.update(list => {
      const updated = [newOwner, ...list];
      localStorage.setItem(STORAGE_KEYS.SHOP_OWNERS, JSON.stringify(updated));
      return updated;
    });

    return newOwner;
  }

  // --- Helpers for Static Data Reset and Export ---

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.ACCESSORIES);
    localStorage.removeItem(STORAGE_KEYS.SERVICES);
    localStorage.removeItem(STORAGE_KEYS.SHOP_OWNERS);
    this.initData();
  }

  exportDataJson(type: 'products' | 'accessories' | 'services' | 'shop-owners'): void {
    let data: any = [];
    if (type === 'products') data = this._products();
    if (type === 'accessories') data = this._accessories();
    if (type === 'services') data = this._services();
    if (type === 'shop-owners') data = this._shopOwners();

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
