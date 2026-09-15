import { TestBed } from '@angular/core/testing';
import { FavouritesService } from './favourites.service';
import { ProductItem } from '../models/product.model';

describe('FavouritesService', () => {
  let service: FavouritesService;

  const mockProduct: ProductItem = {
    id: 'fav-test-1',
    name: 'Fav Test Phone',
    brand: 'TestBrand',
    category: 'phone',
    subCategory: 'smartphone',
    price: 15000,
    rating: 4.2,
    reviewsCount: 50,
    image: 'phone.jpg',
    inStock: true,
    description: 'A test phone for favourites'
  };

  const mockProduct2: ProductItem = {
    ...mockProduct,
    id: 'fav-test-2',
    name: 'Fav Test Accessory'
  };

  beforeEach(() => {
    localStorage.removeItem('hitech_favourite_ids');
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavouritesService);
    service.clearFavourites();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no favourites', () => {
    expect(service.count()).toBe(0);
    expect(service.favouriteIds().length).toBe(0);
  });

  it('should add a product to favourites via toggleFavourite', () => {
    const result = service.toggleFavourite(mockProduct);
    expect(result).toBeTrue();
    expect(service.count()).toBe(1);
    expect(service.isFavourite('fav-test-1')).toBeTrue();
  });

  it('should remove a product from favourites via toggleFavourite', () => {
    service.toggleFavourite(mockProduct); // add
    const result = service.toggleFavourite(mockProduct); // remove
    expect(result).toBeFalse();
    expect(service.count()).toBe(0);
    expect(service.isFavourite('fav-test-1')).toBeFalse();
  });

  it('should track multiple favourites', () => {
    service.toggleFavourite(mockProduct);
    service.toggleFavourite(mockProduct2);
    expect(service.count()).toBe(2);
  });

  it('should correctly report isFavourite', () => {
    service.toggleFavourite(mockProduct);
    expect(service.isFavourite('fav-test-1')).toBeTrue();
    expect(service.isFavourite('fav-test-2')).toBeFalse();
  });

  it('should remove a favourite by ID', () => {
    service.toggleFavourite(mockProduct);
    service.toggleFavourite(mockProduct2);
    service.removeFavourite('fav-test-1');
    expect(service.count()).toBe(1);
    expect(service.isFavourite('fav-test-1')).toBeFalse();
    expect(service.isFavourite('fav-test-2')).toBeTrue();
  });

  it('should clear all favourites', () => {
    service.toggleFavourite(mockProduct);
    service.toggleFavourite(mockProduct2);
    service.clearFavourites();
    expect(service.count()).toBe(0);
  });
});
