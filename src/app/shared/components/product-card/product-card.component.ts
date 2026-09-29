import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductItem } from '../../../core/models/product.model';
import { CartService } from '../../../core/services/cart.service';
import { FavouritesService } from '../../../core/services/favourites.service';
import { ToastService } from '../../../core/services/toast.service';

import { DataService } from '../../../core/services/data.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input({ required: true }) product!: ProductItem;

  cartService = inject(CartService);
  favService = inject(FavouritesService);
  toastService = inject(ToastService);
  dataService = inject(DataService);

  get competitorComparison(): {
    amazonPrice?: number | null;
    flipkartPrice?: number | null;
    amazonDiff: number;
    flipkartDiff: number;
    maxSavings: number;
  } | null {
    const comp = this.dataService.getCompetitorPrice(this.product.id);
    if (!comp) return null;

    const amazonDiff = comp.amazonPrice && comp.amazonPrice > this.product.price ? comp.amazonPrice - this.product.price : 0;
    const flipkartDiff = comp.flipkartPrice && comp.flipkartPrice > this.product.price ? comp.flipkartPrice - this.product.price : 0;
    const maxSavings = Math.max(amazonDiff, flipkartDiff);

    return {
      amazonPrice: comp.amazonPrice,
      flipkartPrice: comp.flipkartPrice,
      amazonDiff,
      flipkartDiff,
      maxSavings
    };
  }

  addToCart(e: Event): void {
    e.stopPropagation();
    if (!this.product.inStock) {
      this.toastService.show('Item is currently out of stock.', 'warning');
      return;
    }
    this.cartService.addToCart(this.product);
    this.toastService.show(`Added ${this.product.name} to your cart`, 'success', 'Cart Updated');
  }

  toggleFav(e: Event): void {
    e.stopPropagation();
    const added = this.favService.toggleFavourite(this.product);
    if (added) {
      this.toastService.show(`Saved ${this.product.name} to favourites`, 'info');
    } else {
      this.toastService.show(`Removed from favourites`, 'info');
    }
  }
}
