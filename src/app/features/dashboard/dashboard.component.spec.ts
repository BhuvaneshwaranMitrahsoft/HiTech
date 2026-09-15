import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should have default activeTab as "all"', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component.activeTab).toBe('all');
  });

  it('should switch tab to "phone"', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.setTab('phone');
    expect(component.activeTab).toBe('phone');
  });

  it('should switch tab to "accessory"', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.setTab('accessory');
    expect(component.activeTab).toBe('accessory');
  });

  it('should have dataService injected', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component.dataService).toBeTruthy();
  });

  it('should render hero section', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero-section')).toBeTruthy();
  });

  it('should render hero title', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.hero-title')).toBeTruthy();
  });

  it('should render category cards', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.category-cards-grid')).toBeTruthy();
  });

  it('should render tab pills', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const tabBtns = compiled.querySelectorAll('.tab-btn');
    expect(tabBtns.length).toBe(3); // All, Phones, Accessories
  });

  it('should return popularServices from dataService', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    expect(component.popularServices).toBeDefined();
  });

  it('should return filtered displayedProducts based on activeTab', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    component.setTab('phone');
    expect(component.displayedProducts).toBeDefined();

    component.setTab('accessory');
    expect(component.displayedProducts).toBeDefined();

    component.setTab('all');
    expect(component.displayedProducts).toBeDefined();
  });

  it('should navigate to services with query param when onBookService is called', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    const router = (component as any).router;
    spyOn(router, 'navigate');

    component.onBookService({ id: 's-123' } as any);
    expect(router.navigate).toHaveBeenCalledWith(['/services'], {
      queryParams: { selectedService: 's-123' }
    });
  });
});
