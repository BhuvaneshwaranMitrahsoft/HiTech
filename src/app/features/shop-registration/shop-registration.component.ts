import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { ToastService } from '../../core/services/toast.service';
import { CatalogPublishService } from '../../core/services/catalog-publish.service';
import { ShopOwner, ShopRegistrationForm } from '../../core/models/shop-owner.model';

@Component({
  selector: 'app-shop-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './shop-registration.component.html',
  styleUrls: ['./shop-registration.component.scss']
})
export class ShopRegistrationComponent {
  dataService = inject(DataService);
  toastService = inject(ToastService);
  publishService = inject(CatalogPublishService);
  private router = inject(Router);

  isSubmitting = false;
  isRegistered = false;
  registeredShop: ShopOwner | null = null;

  form: ShopRegistrationForm = {
    shopName: '',
    ownerName: '',
    email: '',
    phone: '',
    location: '',
    shopPhoto: '',
    gstNumber: '',
    additionalNotes: ''
  };

  photoPreview: string | null = null;

  readonly sampleShopPhotos = [
    'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80'
  ];

  selectSamplePhoto(url: string): void {
    this.form.shopPhoto = url;
    this.photoPreview = url;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview = e.target?.result as string;
        this.form.shopPhoto = this.photoPreview;
      };
      reader.readAsDataURL(file);
    }
  }

  async submitRegistration(): Promise<void> {
    if (!this.form.shopName.trim() || !this.form.ownerName.trim() || !this.form.location.trim() || !this.form.shopPhoto.trim()) {
      this.toastService.show('Shop Name, Owner Name, Location, and Shop Photo are mandatory.', 'warning');
      return;
    }

    if (!this.form.email.trim() || !this.form.email.includes('@')) {
      this.toastService.show('A valid business email address is required for application review and credential delivery.', 'warning');
      return;
    }

    if (!this.form.phone.trim() || this.form.phone.trim().length < 10) {
      this.toastService.show('Please provide a valid 10-digit mobile / WhatsApp number.', 'warning');
      return;
    }

    this.isSubmitting = true;
    try {
      const newOwner = this.dataService.registerNewShopOwner(this.form);
      this.registeredShop = newOwner;

      // If GitHub integration is configured, sync the updated shop-owners file immediately
      if (this.publishService.isConfigured()) {
        try {
          const ownersJson = JSON.stringify(this.dataService.shopOwners(), null, 2);
          await this.publishService.publishFiles([
            { path: 'public/data/shop-owners.json', content: ownersJson }
          ], `feat(shop): new wholesale partner registration - ${newOwner.shopName}`);
        } catch (syncErr) {
          console.warn('Background GitHub sync skipped or failed:', syncErr);
        }
      }

      this.isRegistered = true;
      this.toastService.show('Application submitted! Your wholesale partner request is pending admin verification.', 'success', 'Application Received');
    } catch (e) {
      this.toastService.show('Failed to register shop. Please try again.', 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }
}
