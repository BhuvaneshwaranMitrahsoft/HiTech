import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { ProductItem } from '../models/product.model';

describe('CartService', () => {
  let service: CartService;

  const mockProduct: ProductItem = {
    id: 'test-product-1',
    name: 'Test Phone',
    brand: 'TestBrand',
    category: 'phone',
    subCategory: 'smartphone',
    price: 25000,
    originalPrice: 30000,
    rating: 4.5,
    reviewsCount: 120,
    image: 'test.jpg',
    inStock: true,
    isFeatured: true,
    description: 'A test phone'
  };

  const mockAccessory: ProductItem = {
    id: 'test-accessory-1',
    name: 'Test Charger',
    brand: 'TestBrand',
    category: 'accessory',
    subCategory: 'charger',
    price: 999,
    rating: 4.0,
    reviewsCount: 45,
    image: 'charger.jpg',
    inStock: true,
    description: 'A test charger'
  };

  beforeEach(() => {
    localStorage.removeItem('hitech_cart_items');
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
    service.clearCart();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty cart', () => {
    expect(service.items().length).toBe(0);
    expect(service.totalCount()).toBe(0);
    expect(service.subtotal()).toBe(0);
  });

  it('should add a product to the cart', () => {
    service.addToCart(mockProduct);
    expect(service.items().length).toBe(1);
    expect(service.items()[0].product.id).toBe('test-product-1');
    expect(service.items()[0].quantity).toBe(1);
    expect(service.items()[0].selectedPrice).toBe(25000);
  });

  it('should increment quantity when adding duplicate product', () => {
    service.addToCart(mockProduct);
    service.addToCart(mockProduct);
    expect(service.items().length).toBe(1);
    expect(service.items()[0].quantity).toBe(2);
  });

  it('should add multiple different products', () => {
    service.addToCart(mockProduct);
    service.addToCart(mockAccessory);
    expect(service.items().length).toBe(2);
  });

  it('should calculate totalCount correctly', () => {
    service.addToCart(mockProduct, 2);
    service.addToCart(mockAccessory, 3);
    expect(service.totalCount()).toBe(5);
  });

  it('should calculate subtotal correctly', () => {
    service.addToCart(mockProduct, 2);
    service.addToCart(mockAccessory, 1);
    expect(service.subtotal()).toBe(25000 * 2 + 999);
  });

  it('should update quantity for a product', () => {
    service.addToCart(mockProduct);
    service.updateQuantity('test-product-1', 5);
    expect(service.items()[0].quantity).toBe(5);
  });

  it('should remove product when quantity is set to 0', () => {
    service.addToCart(mockProduct);
    service.updateQuantity('test-product-1', 0);
    expect(service.items().length).toBe(0);
  });

  it('should remove a product by id', () => {
    service.addToCart(mockProduct);
    service.addToCart(mockAccessory);
    service.removeFromCart('test-product-1');
    expect(service.items().length).toBe(1);
    expect(service.items()[0].product.id).toBe('test-accessory-1');
  });

  it('should clear entire cart', () => {
    service.addToCart(mockProduct);
    service.addToCart(mockAccessory);
    service.clearCart();
    expect(service.items().length).toBe(0);
    expect(service.totalCount()).toBe(0);
  });

  it('should calculate delivery fee — free over ₹1000', () => {
    service.addToCart(mockProduct);
    expect(service.deliveryFee()).toBe(0); // 25000 > 1000
  });

  it('should calculate delivery fee — ₹99 under ₹1000', () => {
    const cheapProduct = { ...mockAccessory, price: 500, id: 'cheap-1' };
    service.addToCart(cheapProduct);
    expect(service.deliveryFee()).toBe(99);
  });

  it('should calculate delivery fee — ₹0 for empty cart', () => {
    expect(service.deliveryFee()).toBe(0);
  });

  it('should calculate finalTotal correctly without bulk mode', () => {
    service.addToCart(mockProduct); // 25000
    const expected = 25000 + 0; // subtotal + free delivery
    expect(service.finalTotal()).toBe(expected);
  });

  it('should apply bulk discount when bulk mode is enabled', () => {
    service.addToCart(mockProduct);
    service.setBulkMode(true, 10);
    const discount = Math.round(25000 * 0.1);
    expect(service.discountAmount()).toBe(discount);
    expect(service.finalTotal()).toBe(25000 - discount + 0);
  });

  it('should have no discount when bulk mode is disabled', () => {
    service.addToCart(mockProduct);
    service.setBulkMode(false);
    expect(service.discountAmount()).toBe(0);
  });
});
