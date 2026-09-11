import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-auth-otp',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './auth-otp.component.html',
  styleUrls: ['./auth-otp.component.scss']
})
export class AuthOtpComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  otpDigits: string[] = ['', '', '', '', '', ''];
  secondsRemaining: number = 60;
  private intervalId: any = null;
  returnUrl: string = '';
  isVerifying: boolean = false;
  isResending: boolean = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '';
    });

    const currentOtp = this.authService.otpState();
    if (!currentOtp) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.calculateRemainingSeconds();
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private calculateRemainingSeconds(): void {
    const currentOtp = this.authService.otpState();
    if (currentOtp) {
      const remainingMs = currentOtp.expiresAt - Date.now();
      this.secondsRemaining = Math.max(0, Math.floor(remainingMs / 1000));
    }
  }

  private startTimer(): void {
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(() => {
      if (this.secondsRemaining > 0) {
        this.secondsRemaining--;
      } else {
        clearInterval(this.intervalId);
      }
    }, 1000);
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;

    if (val && val.length > 0) {
      this.otpDigits[index] = val.slice(-1);
      // Auto focus next input box
      if (index < 5) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`) as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }
    }

    // Auto submit if all 6 digits entered
    if (this.otpDigits.every(d => d !== '')) {
      this.verifyOtp();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  }

  fillCode(code: string): void {
    const chars = code.split('').slice(0, 6);
    for (let i = 0; i < 6; i++) {
      this.otpDigits[i] = chars[i] || '';
    }
    this.verifyOtp();
  }

  async verifyOtp(): Promise<void> {
    const fullCode = this.otpDigits.join('');
    if (fullCode.length < 6) {
      this.toastService.show('Please enter all 6 digits of the OTP.', 'warning');
      return;
    }

    this.isVerifying = true;
    try {
      const result = this.authService.verifyOtp(fullCode);
      if (result.success && result.session) {
        this.toastService.show(`Welcome, ${result.session.name}!`, 'success', 'Verified');

        if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else if (result.session.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/owner']);
        }
      } else {
        this.toastService.show(result.message, 'danger', 'Verification Failed');
      }
    } finally {
      this.isVerifying = false;
    }
  }

  async resendOtp(): Promise<void> {
    this.isResending = true;
    try {
      const res = await this.authService.resendOtp();
      if (res.success) {
        this.toastService.show(res.message, 'info', 'New OTP Sent');
        this.calculateRemainingSeconds();
        this.startTimer();
        this.otpDigits = ['', '', '', '', '', ''];
      } else {
        this.toastService.show(res.message, 'danger');
      }
    } finally {
      this.isResending = false;
    }
  }
}
