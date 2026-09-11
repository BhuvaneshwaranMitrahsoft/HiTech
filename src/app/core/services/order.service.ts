import { Injectable, signal, computed, inject } from '@angular/core';
import { CustomerDetails, Order, OrderItemRecord } from '../models/order.model';
import { ServiceBookingRequest } from '../models/service.model';
import { CartService } from './cart.service';
import { EmailService } from './email.service';
import { AuthService } from './auth.service';

const ORDERS_STORAGE_KEY = 'hitech_customer_orders';
const BOOKINGS_STORAGE_KEY = 'hitech_service_bookings';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private cartService = inject(CartService);
  private emailService = inject(EmailService);
  private authService = inject(AuthService);

  private _orders = signal<Order[]>(this.loadOrders());
  private _bookings = signal<ServiceBookingRequest[]>(this.loadBookings());
  private _lastPlacedOrder = signal<Order | null>(null);
  private _lastPlacedBooking = signal<ServiceBookingRequest | null>(null);

  readonly orders = this._orders.asReadonly();
  readonly bookings = this._bookings.asReadonly();
  readonly lastPlacedOrder = this._lastPlacedOrder.asReadonly();
  readonly lastPlacedBooking = this._lastPlacedBooking.asReadonly();

  readonly totalOrdersCount = computed(() => this._orders().length);
  readonly totalBookingsCount = computed(() => this._bookings().length);

  private loadOrders(): Order[] {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private loadBookings(): ServiceBookingRequest[] {
    try {
      const saved = localStorage.getItem(BOOKINGS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Submit and finalize checkout order
   */
  async placeOrder(customer: CustomerDetails): Promise<{ success: boolean; order?: Order; message?: string }> {
    const cartItems = this.cartService.items();
    if (cartItems.length === 0) {
      return { success: false, message: 'Your cart is empty.' };
    }

    if (!customer.name?.trim() || !customer.phone?.trim() || !customer.address?.trim()) {
      return { success: false, message: 'Name, Phone number, and Delivery Address are mandatory.' };
    }

    const orderItems: OrderItemRecord[] = cartItems.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      brand: item.product.brand,
      price: item.selectedPrice,
      quantity: item.quantity,
      totalPrice: item.selectedPrice * item.quantity,
      image: item.product.image
    }));

    const session = this.authService.currentSession();
    const isOwner = this.authService.isShopOwner();

    const orderId = 'HT-' + Date.now().toString().slice(-6);
    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customer,
      items: orderItems,
      subtotal: this.cartService.subtotal(),
      deliveryCharge: this.cartService.deliveryFee(),
      discount: this.cartService.discountAmount(),
      totalAmount: this.cartService.finalTotal(),
      placedByRole: isOwner ? 'shopowner' : 'user',
      shopOwnerId: session?.shopOwnerId,
      shopName: session?.shopName,
      status: 'Order Placed',
      createdAt: new Date().toLocaleString(),
      ownerNotifiedViaEmail: false
    };

    // Dispatch email notification to owner
    const emailResult = await this.emailService.sendOrderNotification(newOrder);
    newOrder.ownerNotifiedViaEmail = emailResult.success;

    // Save to orders list in signal and localStorage
    this._orders.update(list => {
      const updated = [newOrder, ...list];
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    this._lastPlacedOrder.set(newOrder);
    this.cartService.clearCart();

    return { success: true, order: newOrder };
  }

  /**
   * Submit mobile repair service booking
   */
  async bookRepairService(bookingData: {
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
  }): Promise<{ success: boolean; booking?: ServiceBookingRequest; message?: string }> {
    if (!bookingData.customerName?.trim() || !bookingData.customerPhone?.trim() || !bookingData.customerAddress?.trim()) {
      return { success: false, message: 'Name, Phone number, and Address are required for service booking.' };
    }

    const booking: ServiceBookingRequest = {
      id: 'SRV-' + Math.floor(100000 + Math.random() * 900000),
      ...bookingData,
      status: 'Pending',
      createdAt: new Date().toLocaleString()
    };

    // Send email notification to owner
    await this.emailService.sendServiceBookingNotification(booking);

    this._bookings.update(list => {
      const updated = [booking, ...list];
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    this._lastPlacedBooking.set(booking);
    return { success: true, booking };
  }

  updateOrderStatus(orderId: string, status: Order['status']): void {
    this._orders.update(list => {
      const updated = list.map(ord => ord.id === orderId ? { ...ord, status } : ord);
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  updateBookingStatus(bookingId: string, status: ServiceBookingRequest['status']): void {
    this._bookings.update(list => {
      const updated = list.map(b => b.id === bookingId ? { ...b, status } : b);
      localStorage.setItem(BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }
}
