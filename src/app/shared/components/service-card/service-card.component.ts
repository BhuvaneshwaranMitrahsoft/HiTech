import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceBookingItem } from '../../../core/models/service.model';

@Component({
  selector: 'app-service-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './service-card.component.html',
  styleUrls: ['./service-card.component.scss']
})
export class ServiceCardComponent {
  @Input({ required: true }) service!: ServiceBookingItem;
  @Output() bookClicked = new EventEmitter<ServiceBookingItem>();

  onBook(): void {
    this.bookClicked.emit(this.service);
  }
}
