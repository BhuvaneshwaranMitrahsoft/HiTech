import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { EmailService } from '../../core/services/email.service';
import { ProductItem } from '../../core/models/product.model';
import { ServiceBookingItem } from '../../core/models/service.model';
import { ShopOwner } from '../../core/models/shop-owner.model';
import { Order } from '../../core/models/order.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  dataService = inject(DataService);
  orderService = inject(OrderService);
  authService = inject(AuthService);
  toastService = inject(ToastService);
  emailService = inject(EmailService);

  activeTab: 'products' | 'pricing' | 'owners' | 'orders' | 'settings' = 'products';
  pricingCategoryTab: 'phones' | 'accessories' | 'services' = 'phones';
  searchQuery: string = '';

  // Editing state for Product / Service pricing modal
  editingProduct: ProductItem | null = null;
  editingPriceValue: number = 0;

  editingService: ServiceBookingItem | null = null;
  editingServicePriceValue: number = 0;

  // Editing state for Shop Owner credentials
  editingOwner: ShopOwner | null = null;
  editOwnerEmail: string = '';
  editOwnerPasswordPlain: string = '';
  editOwnerTier: string = '';

  // EmailJS Settings form
  emailSettings = {
    publicKey: '',
    serviceId: '',
    otpTemplateId: '',
    orderTemplateId: '',
    notificationEmail: ''
  };

  ngOnInit(): void {
    const cfg = this.emailService.getCustomConfig();
    this.emailSettings = { ...cfg };
  }

  setTab(tab: 'products' | 'pricing' | 'owners' | 'orders' | 'settings'): void {
    this.activeTab = tab;
  }

  // --- Product Management ---

  get filteredProductsList(): ProductItem[] {
    const list = this.dataService.allProducts();
    if (!this.searchQuery.trim()) return list;
    const q = this.searchQuery.toLowerCase();
    return list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  toggleAvailability(product: ProductItem): void {
    this.dataService.toggleProductAvailability(product.id);
    const updated = !product.inStock;
    this.toastService.show(
      `${product.name} is now ${updated ? 'In Stock' : 'Out of Stock'}`,
      updated ? 'success' : 'warning',
      'Stock Updated'
    );
  }

  openEditPrice(product: ProductItem): void {
    this.editingProduct = product;
    this.editingPriceValue = product.price;
  }

  saveProductPrice(): void {
    if (this.editingProduct && this.editingPriceValue > 0) {
      this.dataService.updateProductPrice(this.editingProduct.id, this.editingPriceValue);
      this.toastService.show(`Price updated to ₹${this.editingPriceValue.toLocaleString()}`, 'success');
      this.editingProduct = null;
    }
  }

  // --- Services Management ---

  toggleServiceAvailability(service: ServiceBookingItem): void {
    this.dataService.toggleServiceAvailability(service.id);
    this.toastService.show(`${service.name} status updated`, 'info');
  }

  openEditServicePrice(service: ServiceBookingItem): void {
    this.editingService = service;
    this.editingServicePriceValue = service.startingPrice;
  }

  saveServicePrice(): void {
    if (this.editingService && this.editingServicePriceValue > 0) {
      this.dataService.updateServicePrice(this.editingService.id, this.editingServicePriceValue);
      this.toastService.show(`Service rate updated to ₹${this.editingServicePriceValue.toLocaleString()}`, 'success');
      this.editingService = null;
    }
  }

  // --- Shop Owners Management ---

  toggleOwnerStatus(owner: ShopOwner): void {
    this.dataService.toggleShopOwnerStatus(owner.id);
    const newStatus = owner.status === 'active' ? 'Suspended' : 'Active';
    this.toastService.show(`${owner.shopName} is now ${newStatus}`, 'info');
  }

  openEditOwner(owner: ShopOwner): void {
    this.editingOwner = owner;
    this.editOwnerEmail = owner.email;
    this.editOwnerPasswordPlain = owner.defaultPasswordPlain || 'Owner@HiTech123';
    this.editOwnerTier = owner.bulkDiscountTier || 'Gold (15% OFF)';
  }

  saveOwnerCredentials(): void {
    if (this.editingOwner) {
      this.dataService.updateShopOwnerCredentials(
        this.editingOwner.id,
        this.editOwnerEmail,
        this.editOwnerPasswordPlain,
        this.editOwnerTier
      );
      this.toastService.show(`Credentials updated for ${this.editingOwner.shopName}`, 'success');
      this.editingOwner = null;
    }
  }

  copyCredentials(owner: ShopOwner): void {
    const text = `HiTech Shop Partner Access:\nOutlet: ${owner.shopName}\nLogin: ${owner.email}\nPassword: ${owner.defaultPasswordPlain || 'Owner@HiTech123'}\nPortal: https://hitech.com/auth/login`;
    navigator.clipboard.writeText(text).then(() => {
      this.toastService.show('Credentials copied to clipboard! You can share them with the owner.', 'success');
    });
  }

  // --- Orders Management ---

  updateOrderStatus(order: Order, event: Event): void {
    const select = event.target as HTMLSelectElement;
    const newStatus = select.value as Order['status'];
    this.orderService.updateOrderStatus(order.id, newStatus);
    this.toastService.show(`Order #${order.orderNumber} status changed to ${newStatus}`, 'info');
  }

  // --- Export & Reset ---

  exportData(type: 'products' | 'accessories' | 'services' | 'shop-owners'): void {
    this.dataService.exportDataJson(type);
    this.toastService.show(`Exported ${type}.json. Commit this file to GitHub for permanent site-wide updates.`, 'success');
  }

  resetAllData(): void {
    if (confirm('Are you sure you want to reset all modifications back to original JSON files?')) {
      this.dataService.resetAllData();
      this.toastService.show('All catalogs reset to bundled JSON defaults', 'info');
    }
  }

  saveEmailSettings(): void {
    this.emailService.saveCustomConfig(this.emailSettings);
    this.toastService.show('EmailJS configuration updated!', 'success');
  }
}
