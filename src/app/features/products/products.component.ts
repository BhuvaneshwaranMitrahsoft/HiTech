import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ProductItem } from '../../core/models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProductCardComponent],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductsComponent implements OnInit {
  dataService = inject(DataService);
  private route = inject(ActivatedRoute);

  selectedCategory: string = 'all';
  selectedSubCategory: string = 'all';
  searchQuery: string = '';
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating' = 'featured';
  inStockOnly: boolean = false;

  readonly subCategories = [
    'Cases & Covers',
    'Chargers & Cables',
    'Audio & Earphones',
    'Screen Protectors',
    'Power Banks'
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = params['category'];
      }
      if (params['search']) {
        this.searchQuery = params['search'];
      }
    });
  }

  get filteredProducts(): ProductItem[] {
    let list = this.dataService.allProducts();

    // Category filter
    if (this.selectedCategory === 'phone') {
      list = list.filter(p => p.category === 'phone');
    } else if (this.selectedCategory === 'accessory') {
      list = list.filter(p => p.category === 'accessory');
    }

    // Subcategory filter
    if (this.selectedSubCategory !== 'all') {
      list = list.filter(p => p.subCategory === this.selectedSubCategory);
    }

    // In Stock filter
    if (this.inStockOnly) {
      list = list.filter(p => p.inStock);
    }

    // Search query filter
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.subCategory.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Sorting
    return list.sort((a, b) => {
      if (this.sortBy === 'price-asc') return a.price - b.price;
      if (this.sortBy === 'price-desc') return b.price - a.price;
      if (this.sortBy === 'rating') return b.rating - a.rating;
      return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    });
  }

  resetFilters(): void {
    this.selectedCategory = 'all';
    this.selectedSubCategory = 'all';
    this.searchQuery = '';
    this.inStockOnly = false;
    this.sortBy = 'featured';
  }
}
