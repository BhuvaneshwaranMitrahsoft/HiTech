import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { ToastService } from '../../core/services/toast.service';
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

  submitRegistration(): void {
    if (!this.form.shopName.trim() || !this.form.ownerName.trim() || !this.form.location.trim() || !this.form.shopPhoto.trim()) {
      this.toastService.show('Shop Name, Owner Name, Location, and Shop Photo are mandatory.', 'warning');
      return;
    }

    if (!this.form.email.trim()) {
      this.form.email = `shop_${Date.now().toString().slice(-4)}@hitech.com`;
    }

    this.isSubmitting = true;
    try {
      const newOwner = this.dataService.registerNewShopOwner(this.form);
      this.registeredShop = newOwner;
      this.isRegistered = true;
      this.toastService.show('Shop registered successfully! Credentials generated.', 'success', 'Registration Approved');
    } catch (e) {
      this.toastService.show('Failed to register shop', 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }
}
