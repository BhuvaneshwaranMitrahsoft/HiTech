import { TestBed } from '@angular/core/testing';
import { EmailService } from './email.service';
import { Order } from '../models/order.model';
import { ServiceBookingRequest } from '../models/service.model';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [EmailService]
    });
    service = TestBed.inject(EmailService);
    service.saveCustomConfig({
      publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',
      serviceId: 'YOUR_EMAILJS_SERVICE_ID'
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get and save custom config', () => {
    const customConfig = { serviceId: 'my_service', publicKey: 'my_key' };
    service.saveCustomConfig(customConfig);
    const config = service.getCustomConfig();
    expect(config.serviceId).toBe('my_service');
    expect(config.publicKey).toBe('my_key');
  });

  it('should send simulated OTP email when unconfigured', async () => {
    const result = await service.sendOtpEmail('test@example.com', '123456', 'Tester');
    expect(result.success).toBeTrue();
    expect(result.simulated).toBeTrue();
    expect(service.logs().length).toBeGreaterThan(0);
    expect(service.logs()[0].type).toBe('OTP');
  });

  it('should send simulated order notification', async () => {
    const mockOrder: Order = {
      id: 'ord-1',
      orderNumber: 'ORD-1234',
      items: [
        {
          productId: 'p1',
          name: 'Item 1',
          brand: 'BrandA',
          price: 1000,
          quantity: 2,
          totalPrice: 2000,
          image: ''
        }
      ],
      customer: {
        name: 'John Doe',
        phone: '9876543210',
        email: 'john@example.com',
        address: '123 Street',
        pincode: '600001'
      },
      subtotal: 2000,
      deliveryCharge: 50,
      discount: 100,
      totalAmount: 1950,
      placedByRole: 'user',
      createdAt: '2026-01-01T00:00:00Z',
      status: 'Confirmed',
      ownerNotifiedViaEmail: false
    };

    const result = await service.sendOrderNotification(mockOrder);
    expect(result.success).toBeTrue();
    expect(result.simulated).toBeTrue();
    expect(service.logs()[0].type).toBe('ORDER_NOTIFICATION');
  });

  it('should send simulated order notification for shop owner', async () => {
    const mockOrder: Order = {
      id: 'ord-shop-1',
      orderNumber: 'ORD-SHOP-1',
      items: [],
      customer: { name: 'Owner', phone: '1234567890', address: 'Shop Address' },
      subtotal: 10000,
      deliveryCharge: 0,
      discount: 1000,
      totalAmount: 9000,
      placedByRole: 'shopowner',
      shopName: 'Owner Electronics',
      createdAt: '2026-01-01',
      status: 'Confirmed',
      ownerNotifiedViaEmail: false
    };

    const result = await service.sendOrderNotification(mockOrder);
    expect(result.success).toBeTrue();
    expect(result.simulated).toBeTrue();
  });

  it('should send simulated service booking notification', async () => {
    const mockBooking: ServiceBookingRequest = {
      id: 'srv-book-1',
      serviceId: 'srv-1',
      serviceName: 'Display Replacement',
      deviceModel: 'Pixel 8 Pro',
      issueDescription: 'Cracked screen',
      customerName: 'Alice',
      customerPhone: '9988776655',
      customerAddress: '45 Avenue',
      pincode: '600002',
      distanceKm: 12,
      pickupEligible: true,
      fulfillmentMode: 'home_pickup',
      preferredDate: '2026-04-01',
      preferredTimeSlot: '10:00 AM',
      estimatedPrice: 3500,
      status: 'Pending',
      createdAt: '2026-01-01'
    };

    const result = await service.sendServiceBookingNotification(mockBooking);
    expect(result.success).toBeTrue();
    expect(result.simulated).toBeTrue();
    expect(service.logs()[0].type).toBe('SERVICE_BOOKING');
  });

  it('should load pre-existing logs from localStorage', () => {
    const preExisting = [{
      id: 'log-old',
      type: 'OTP' as const,
      recipient: 'old@test.com',
      subject: 'Old OTP',
      payload: {},
      sentAt: '2026-01-01',
      status: 'SIMULATED_LOCAL' as const
    }];
    localStorage.setItem('hitech_email_logs', JSON.stringify(preExisting));

    const newService = new EmailService();
    expect(newService.logs().length).toBe(1);
    expect(newService.logs()[0].id).toBe('log-old');
  });
});
