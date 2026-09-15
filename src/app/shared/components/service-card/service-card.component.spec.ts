import { TestBed } from '@angular/core/testing';
import { ServiceCardComponent } from './service-card.component';
import { ServiceBookingItem } from '../../../core/models/service.model';

describe('ServiceCardComponent', () => {
  const mockService: ServiceBookingItem = {
    id: 's-card-1',
    name: 'Battery Replacement',
    category: 'battery',
    icon: 'battery',
    startingPrice: 1299,
    warrantyPeriod: '3 Months Warranty',
    estimatedTime: '45 mins',
    includedPoints: ['OEM Grade Cell', 'Free Battery Health Report'],
    description: 'High performance battery',
    available: true,
    isPopular: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceCardComponent]
    }).compileComponents();
  });

  it('should create and render service details', () => {
    const fixture = TestBed.createComponent(ServiceCardComponent);
    fixture.componentInstance.service = mockService;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.service-title')?.textContent).toContain('Battery Replacement');
    expect(compiled.querySelector('.price-val')?.textContent).toContain('1,299');
    expect(compiled.querySelector('.badge-amber')?.textContent).toContain('Popular');
  });

  it('should emit bookClicked event when button clicked', () => {
    const fixture = TestBed.createComponent(ServiceCardComponent);
    fixture.componentInstance.service = mockService;
    fixture.detectChanges();

    spyOn(fixture.componentInstance.bookClicked, 'emit');
    const btn = fixture.nativeElement.querySelector('.book-btn') as HTMLButtonElement;
    btn.click();

    expect(fixture.componentInstance.bookClicked.emit).toHaveBeenCalledWith(mockService);
  });

  it('should disable button when service is unavailable', () => {
    const fixture = TestBed.createComponent(ServiceCardComponent);
    fixture.componentInstance.service = { ...mockService, available: false };
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('.book-btn') as HTMLButtonElement;
    expect(btn.disabled).toBeTrue();
    expect(btn.textContent).toContain('Currently Full');
  });
});
