import { Injectable, signal } from '@angular/core';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';
import { Order } from '../models/order.model';
import { ServiceBookingRequest } from '../models/service.model';

export interface EmailLogEntry {
  id: string;
  type: 'OTP' | 'ORDER_NOTIFICATION' | 'SERVICE_BOOKING' | 'SHOP_REGISTRATION';
  recipient: string;
  subject: string;
  payload: any;
  sentAt: string;
  status: 'SENT_VIA_EMAILJS' | 'SIMULATED_LOCAL';
}

const EMAIL_CONFIG_KEY = 'hitech_emailjs_custom_config';
const EMAIL_LOGS_KEY = 'hitech_email_logs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private _logs = signal<EmailLogEntry[]>(this.loadLogs());
  readonly logs = this._logs.asReadonly();

  private getConfig() {
    try {
      const saved = localStorage.getItem(EMAIL_CONFIG_KEY);
      if (saved) {
        return { ...environment.emailJs, ...JSON.parse(saved) };
      }
    } catch {}
    return environment.emailJs;
  }

  saveCustomConfig(config: Partial<typeof environment.emailJs>): void {
    localStorage.setItem(EMAIL_CONFIG_KEY, JSON.stringify(config));
  }

  getCustomConfig(): typeof environment.emailJs {
    return this.getConfig();
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
   * Send 6-digit OTP code to the given recipient email
   */
  async sendOtpEmail(email: string, otpCode: string, recipientName: string = 'User'): Promise<{ success: boolean; simulated: boolean; message: string }> {
    const config = this.getConfig();
    const isConfigured = config.publicKey && config.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY' &&
                         config.serviceId && config.serviceId !== 'YOUR_EMAILJS_SERVICE_ID';

    const templateParams = {
      to_email: email,
      recipient_name: recipientName,
      otp_code: otpCode,
      expiry_minutes: '1 minute',
      app_name: environment.appName
    };

    if (isConfigured) {
      try {
        await emailjs.send(
          config.serviceId,
          config.otpTemplateId,
          templateParams,
          config.publicKey
        );
        this.addLog({
          type: 'OTP',
          recipient: email,
          subject: `HiTech Admin Login OTP: ${otpCode}`,
          payload: templateParams,
          status: 'SENT_VIA_EMAILJS'
        });
        return { success: true, simulated: false, message: `OTP sent successfully to ${email}` };
      } catch (err: any) {
        console.warn('EmailJS error, falling back to simulated mode:', err);
      }
    }

    // Fallback simulation (allows testing right away!)
    this.addLog({
      type: 'OTP',
      recipient: email,
      subject: `[Dev Mode] HiTech Login OTP: ${otpCode}`,
      payload: templateParams,
      status: 'SIMULATED_LOCAL'
    });

    console.info(`[HiTech OTP Service] 🔑 Verification OTP for ${email}: ${otpCode} (Valid for 1 min)`);
    return {
      success: true,
      simulated: true,
      message: `OTP generated for ${email}: ${otpCode} (Testing Mode - EmailJS config is pending)`
    };
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

    const isConfigured = config.publicKey && config.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY';

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
        return { success: true, simulated: false };
      } catch (err) {
        console.warn('EmailJS error on order notification, falling back to simulated:', err);
      }
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
      estimated_price: `₹${booking.estimatedPrice.toLocaleString()}`
    };

    const isConfigured = config.publicKey && config.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY';

    if (isConfigured) {
      try {
        await emailjs.send(
          config.serviceId,
          config.orderTemplateId,
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
        return { success: true, simulated: false };
      } catch (e) {
        console.warn('EmailJS service booking error:', e);
      }
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
