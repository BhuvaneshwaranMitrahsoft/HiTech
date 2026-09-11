import { Injectable, signal, computed, effect } from '@angular/core';
import { ProductItem } from '../models/product.model';

const FAVOURITES_KEY = 'hitech_favourite_ids';

@Injectable({
  providedIn: 'root'
})
export class FavouritesService {
  private _favouriteIds = signal<string[]>(this.loadFromStorage());

  readonly favouriteIds = this._favouriteIds.asReadonly();
  readonly count = computed(() => this._favouriteIds().length);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(FAVOURITES_KEY, JSON.stringify(this._favouriteIds()));
      } catch (e) {
        console.error('Failed to save favourites to localStorage', e);
      }
    });
  }

  private loadFromStorage(): string[] {
    try {
      const saved = localStorage.getItem(FAVOURITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  isFavourite(productId: string): boolean {
    return this._favouriteIds().includes(productId);
  }

  toggleFavourite(product: ProductItem): boolean {
    const isFav = this.isFavourite(product.id);
    if (isFav) {
      this._favouriteIds.update(ids => ids.filter(id => id !== product.id));
      return false;
    } else {
      this._favouriteIds.update(ids => [...ids, product.id]);
      return true;
    }
  }

  removeFavourite(productId: string): void {
    this._favouriteIds.update(ids => ids.filter(id => id !== productId));
  }

  clearFavourites(): void {
    this._favouriteIds.set([]);
  }
}
