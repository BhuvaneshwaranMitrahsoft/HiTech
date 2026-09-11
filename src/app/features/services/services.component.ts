import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { ServiceCardComponent } from '../../shared/components/service-card/service-card.component';
import { ServiceBookingItem, ServiceBookingRequest } from '../../core/models/service.model';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule, ServiceCardComponent],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent implements OnInit {
  dataService = inject(DataService);
  orderService = inject(OrderService);
  toastService = inject(ToastService);
  private route = inject(ActivatedRoute);

  selectedCategory: string = 'all';
  activeBookingModal: boolean = false;
  selectedService: ServiceBookingItem | null = null;
  bookingSubmitted: boolean = false;
  confirmedBooking: ServiceBookingRequest | null = null;
  isSubmitting: boolean = false;

  bookingForm = {
    deviceModel: '',
    issueDescription: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    preferredTimeSlot: '10:00 AM - 01:00 PM'
  };

  readonly timeSlots = [
    '10:00 AM - 01:00 PM',
    '01:00 PM - 04:00 PM',
    '04:00 PM - 07:00 PM',
    '07:00 PM - 09:00 PM'
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const srvId = params['selectedService'];
      if (srvId) {
        const found = this.dataService.services().find(s => s.id === srvId);
        if (found) {
          this.openBookingModal(found);
        }
      }
    });
  }

  get filteredServices(): ServiceBookingItem[] {
    const list = this.dataService.services();
    if (this.selectedCategory === 'all') return list;
    return list.filter(s => s.category.toLowerCase().includes(this.selectedCategory.toLowerCase()));
  }

  openBookingModal(service: ServiceBookingItem): void {
    this.selectedService = service;
    this.bookingSubmitted = false;
    this.confirmedBooking = null;
    this.activeBookingModal = true;
  }

  closeBookingModal(): void {
    this.activeBookingModal = false;
    this.selectedService = null;
  }

  async submitBooking(): Promise<void> {
    if (!this.selectedService) return;

    if (!this.bookingForm.customerName.trim() || !this.bookingForm.customerPhone.trim() || !this.bookingForm.customerAddress.trim()) {
      this.toastService.show('Please fill in your Name, Phone Number, and Address.', 'warning');
      return;
    }

    if (!this.bookingForm.deviceModel.trim()) {
      this.toastService.show('Please specify your mobile phone model.', 'warning');
      return;
    }

    this.isSubmitting = true;
    try {
      const res = await this.orderService.bookRepairService({
        serviceId: this.selectedService.id,
        serviceName: this.selectedService.name,
        deviceModel: this.bookingForm.deviceModel,
        issueDescription: this.bookingForm.issueDescription,
        customerName: this.bookingForm.customerName,
        customerPhone: this.bookingForm.customerPhone,
        customerAddress: this.bookingForm.customerAddress,
        preferredDate: this.bookingForm.preferredDate,
        preferredTimeSlot: this.bookingForm.preferredTimeSlot,
        estimatedPrice: this.selectedService.startingPrice
      });

      if (res.success && res.booking) {
        this.confirmedBooking = res.booking;
        this.bookingSubmitted = true;
        this.toastService.show('Service appointment scheduled! Team will contact you.', 'success', 'Booking Confirmed');
      } else {
        this.toastService.show(res.message || 'Failed to submit booking', 'danger');
      }
    } catch (e) {
      this.toastService.show('Error submitting booking appointment', 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }
}
