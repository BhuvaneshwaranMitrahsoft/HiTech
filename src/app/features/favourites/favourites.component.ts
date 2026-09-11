import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FavouritesService } from '../../core/services/favourites.service';
import { DataService } from '../../core/services/data.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { ProductItem } from '../../core/models/product.model';

@Component({
  selector: 'app-favourites',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './favourites.component.html',
  styleUrls: ['./favourites.component.scss']
})
export class FavouritesComponent {
  favService = inject(FavouritesService);
  dataService = inject(DataService);
  cartService = inject(CartService);
  toastService = inject(ToastService);

  get favouriteProducts(): ProductItem[] {
    const ids = this.favService.favouriteIds();
    return this.dataService.allProducts().filter(p => ids.includes(p.id));
  }

  moveToCart(product: ProductItem): void {
    if (!product.inStock) {
      this.toastService.show('Item is out of stock.', 'warning');
      return;
    }
    this.cartService.addToCart(product);
    this.toastService.show(`Moved ${product.name} to Cart`, 'success', 'Added to Cart');
  }

  removeFav(product: ProductItem): void {
    this.favService.removeFavourite(product.id);
    this.toastService.show(`Removed from favourites`, 'info');
  }

  clearAll(): void {
    this.favService.clearFavourites();
    this.toastService.show('Wishlist cleared', 'info');
  }
}
