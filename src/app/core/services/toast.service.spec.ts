import { TestBed } from '@angular/core/testing';
import { ToastService, ToastMessage } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have no active toast initially', () => {
    expect(service.activeToast()).toBeNull();
  });

  it('should show a toast message with correct properties', () => {
    service.show('Test message', 'success', 'Test Title');
    const toast = service.activeToast();
    expect(toast).toBeTruthy();
    expect(toast!.message).toBe('Test message');
    expect(toast!.type).toBe('success');
    expect(toast!.title).toBe('Test Title');
    expect(toast!.id).toBeGreaterThan(0);
  });

  it('should show toast with default type "info"', () => {
    service.show('Info message');
    const toast = service.activeToast();
    expect(toast).toBeTruthy();
    expect(toast!.type).toBe('info');
  });

  it('should show danger toast', () => {
    service.show('Error occurred', 'danger');
    expect(service.activeToast()!.type).toBe('danger');
  });

  it('should show warning toast', () => {
    service.show('Be careful', 'warning');
    expect(service.activeToast()!.type).toBe('warning');
  });

  it('should clear toast manually', () => {
    service.show('Test message', 'success');
    expect(service.activeToast()).toBeTruthy();
    service.clear();
    expect(service.activeToast()).toBeNull();
  });

  it('should replace existing toast when a new one is shown', () => {
    service.show('First message', 'info');
    const firstId = service.activeToast()!.id;

    service.show('Second message', 'success');
    const secondToast = service.activeToast();
    expect(secondToast!.message).toBe('Second message');
    expect(secondToast!.type).toBe('success');
    expect(secondToast!.id).not.toBe(firstId);
  });

  it('should auto-clear toast after specified duration', (done: DoneFn) => {
    service.show('Auto clear', 'info', undefined, 100);
    expect(service.activeToast()).toBeTruthy();

    setTimeout(() => {
      expect(service.activeToast()).toBeNull();
      done();
    }, 200);
  });
});
