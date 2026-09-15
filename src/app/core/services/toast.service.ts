import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning' | 'danger';
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private _toast = signal<ToastMessage | null>(null);
  readonly activeToast = this._toast.asReadonly();
  private nextId = 1;
  private timer: any = null;

  show(message: string, type: 'success' | 'info' | 'warning' | 'danger' = 'info', title?: string, duration: number = 4000): void {
    if (this.timer) clearTimeout(this.timer);

    this._toast.set({
      id: this.nextId++,
      message,
      type,
      title
    });

    this.timer = setTimeout(() => {
      this.clear();
    }, duration);
  }

  clear(): void {
    this._toast.set(null);
  }
}
