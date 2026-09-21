import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { OrderService } from '../../core/services/order.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { ProductItem } from '../../core/models/product.model';

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './owner-dashboard.component.html',
  styleUrls: ['./owner-dashboard.component.scss']
})
export class OwnerDashboardComponent {
  authService = inject(AuthService);
  dataService = inject(DataService);
  orderService = inject(OrderService);
  cartService = inject(CartService);
  toastService = inject(ToastService);

  get session() {
    return this.authService.currentSession();
  }

  get currentOwner() {
    const s = this.session;
    if (!s) return null;
    return this.dataService.shopOwners().find(o => o.email.toLowerCase() === s.email.toLowerCase()) || null;
  }

  get myOrders() {
    const s = this.session;
    if (!s || !s.shopOwnerId) return [];
    return this.orderService.orders().filter(o => o.shopOwnerId === s.shopOwnerId);
  }

  quickAddBulk(product: ProductItem, qty: number = 5): void {
    if (!product.inStock) {
      this.toastService.show('Item is out of stock', 'warning');
      return;
    }
    const discount = this.session?.bulkDiscountPercent || 10;
    this.cartService.setBulkMode(true, discount);
    this.cartService.addToCart(product, qty);
    this.toastService.show(`Added ${qty}x ${product.name} to bulk cart with ${discount}% Wholesale discount`, 'success', 'Wholesale Bulk Added');
  }
}
