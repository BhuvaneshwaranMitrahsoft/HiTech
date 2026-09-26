import { Injectable, inject, signal } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';
import { Order } from '../models/order.model';
import { ServiceBookingRequest } from '../models/service.model';
import { LoggerService } from './logger.service';

export interface EmailLogEntry {
  id: string;
  type: 'ORDER_NOTIFICATION' | 'SERVICE_BOOKING';
  recipient: string;
  subject: string;
  payload: any;
  sentAt: string;
  status: 'SENT_VIA_EMAILJS' | 'SIMULATED_LOCAL';
}

const EMAIL_LOGS_KEY = 'hitech_email_logs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private logger = inject(LoggerService);
  private _logs = signal<EmailLogEntry[]>(this.loadLogs());
  readonly logs = this._logs.asReadonly();

  /**
   * Always reads configuration directly from environment.emailJs
   * (Admin UI does not manage API credentials; configured in code)
   */
  private getConfig() {
    return environment.emailJs;
  }

  private loadLogs(): EmailLogEntry[] {
    try {
      const saved = localStorage.getItem(EMAIL_LOGS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private addLog(entry: Omit<EmailLogEntry, 'id' | 'sentAt'>): void {
    const newLog: EmailLogEntry = {
      ...entry,
      id: 'log-' + Date.now(),
      sentAt: new Date().toLocaleString()
    };
    this._logs.update(list => {
      const updated = [newLog, ...list.slice(0, 49)];
      localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(updated));
      return updated;
    });
  }

  /**
   * Send Order Details to the Shop Owner's email
   */
  async sendOrderNotification(order: Order): Promise<{ success: boolean; simulated: boolean }> {
    const config = this.getConfig();
    const ownerEmail = config.notificationEmail || 'bhuvaneshwaranaj@gmail.com';

    const itemsSummary = order.items
      .map(i => `${i.name} (x${i.quantity}) - ₹${i.totalPrice.toLocaleString()}`)
      .join('\n');

    const templateParams = {
      to_email: ownerEmail,
      order_number: order.orderNumber,
      customer_name: order.customer.name,
      customer_phone: order.customer.phone,
      delivery_address: order.customer.address + (order.customer.pincode ? ` - Pincode: ${order.customer.pincode}` : ''),
      customer_email: order.customer.email || 'N/A',
      items_summary: itemsSummary,
      subtotal: `₹${order.subtotal.toLocaleString()}`,
      delivery_fee: `₹${order.deliveryCharge}`,
      discount: `₹${order.discount.toLocaleString()}`,
      total_amount: `₹${order.totalAmount.toLocaleString()}`,
      order_type: order.placedByRole === 'shopowner' ? `Shop Owner Bulk Order (${order.shopName || ''})` : 'Customer Retail Order',
      order_date: new Date().toLocaleString()
    };

    const isConfigured = !!config.publicKey && config.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY';

    if (isConfigured) {
      try {
        await emailjs.send(
          config.serviceId,
          config.orderTemplateId,
          templateParams,
          config.publicKey
        );
        this.addLog({
          type: 'ORDER_NOTIFICATION',
          recipient: ownerEmail,
          subject: `New Order Placed: #${order.orderNumber} - ${order.customer.name}`,
          payload: templateParams,
          status: 'SENT_VIA_EMAILJS'
        });
        this.logger.info('EmailService', `Order notification sent via EmailJS to ${ownerEmail} for order #${order.orderNumber}`);
        return { success: true, simulated: false };
      } catch (err: any) {
        this.logger.warn('EmailService', `EmailJS dispatch failed for order #${order.orderNumber}: ${err?.text || err?.message || err}. Falling back to simulation.`, err);
      }
    } else {
      this.logger.info('EmailService', 'EmailJS public key not set in environment. Simulating order email dispatch.');
    }

    this.addLog({
      type: 'ORDER_NOTIFICATION',
      recipient: ownerEmail,
      subject: `New Order: #${order.orderNumber} by ${order.customer.name}`,
      payload: templateParams,
      status: 'SIMULATED_LOCAL'
    });

    return { success: true, simulated: true };
  }

  /**
   * Send Service Booking to Shop Owner
   */
  async sendServiceBookingNotification(booking: ServiceBookingRequest): Promise<{ success: boolean; simulated: boolean }> {
    const config = this.getConfig();
    const ownerEmail = config.notificationEmail || 'bhuvaneshwaranaj@gmail.com';

    const templateParams = {
      to_email: ownerEmail,
      booking_id: booking.id,
      service_name: booking.serviceName,
      device_model: booking.deviceModel,
      issue_description: booking.issueDescription,
      customer_name: booking.customerName,
      customer_phone: booking.customerPhone,
      customer_address: booking.customerAddress,
      preferred_slot: `${booking.preferredDate} (${booking.preferredTimeSlot})`,
      estimated_price: `₹${booking.estimatedPrice.toLocaleString()}`,
      fulfillment_mode: booking.fulfillmentMode,
      distance_km: booking.distanceKm != null ? `${booking.distanceKm} km` : 'Unknown',
      pincode: booking.pincode || 'N/A',
      booking_date: new Date().toLocaleDateString('en-IN')
    };

    const isConfigured = !!config.publicKey && config.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY';

    if (isConfigured) {
      try {
        const templateId = (config as any).serviceBookingTemplateId || config.orderTemplateId;
        await emailjs.send(
          config.serviceId,
          templateId,
          templateParams,
          config.publicKey
        );
        this.addLog({
          type: 'SERVICE_BOOKING',
          recipient: ownerEmail,
          subject: `Service Appointment: ${booking.serviceName} - ${booking.customerName}`,
          payload: templateParams,
          status: 'SENT_VIA_EMAILJS'
        });
        this.logger.info('EmailService', `Service booking email sent via EmailJS to ${ownerEmail} for booking #${booking.id}`);
        return { success: true, simulated: false };
      } catch (err: any) {
        this.logger.warn('EmailService', `EmailJS dispatch failed for booking #${booking.id}: ${err?.text || err?.message || err}. Falling back to simulation.`, err);
      }
    } else {
      this.logger.info('EmailService', 'EmailJS public key not configured in environment. Simulating service booking email dispatch.');
    }

    this.addLog({
      type: 'SERVICE_BOOKING',
      recipient: ownerEmail,
      subject: `Service Appointment: ${booking.serviceName} (${booking.deviceModel})`,
      payload: templateParams,
      status: 'SIMULATED_LOCAL'
    });

    return { success: true, simulated: true };
  }
}
