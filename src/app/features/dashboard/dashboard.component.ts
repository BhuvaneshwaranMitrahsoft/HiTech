import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { ServiceCardComponent } from '../../shared/components/service-card/service-card.component';
import { ServiceBookingItem } from '../../core/models/service.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent, ServiceCardComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  dataService = inject(DataService);
  private router = inject(Router);

  activeTab: 'all' | 'phone' | 'accessory' = 'all';

  get displayedProducts() {
    if (this.activeTab === 'phone') {
      return this.dataService.products().slice(0, 6);
    }
    if (this.activeTab === 'accessory') {
      return this.dataService.accessories().slice(0, 6);
    }
    return this.dataService.allProducts().slice(0, 8);
  }

  get popularServices() {
    return this.dataService.services().slice(0, 4);
  }

  setTab(tab: 'all' | 'phone' | 'accessory'): void {
    this.activeTab = tab;
  }

  onBookService(service: ServiceBookingItem): void {
    this.router.navigate(['/services'], { queryParams: { selectedService: service.id } });
  }
}
