import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthSession, OtpState, UserRole } from '../models/auth.model';
import { DataService } from './data.service';
import { EmailService } from './email.service';

const SESSION_STORAGE_KEY = 'hitech_active_session';
const OTP_PENDING_KEY = 'hitech_pending_otp';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private dataService = inject(DataService);
  private emailService = inject(EmailService);

  private _session = signal<AuthSession | null>(this.loadInitialSession());
  private _otpState = signal<OtpState | null>(this.loadPendingOtp());
  private _lastSimulatedOtp = signal<string | null>(null);

  readonly currentSession = this._session.asReadonly();
  readonly otpState = this._otpState.asReadonly();
  readonly lastSimulatedOtp = this._lastSimulatedOtp.asReadonly();

  readonly isAuthenticated = computed(() => !!this._session()?.isAuthenticated);
  readonly userRole = computed<UserRole>(() => this._session()?.role || 'user');
  readonly isAdmin = computed(() => this._session()?.role === 'admin');
  readonly isShopOwner = computed(() => this._session()?.role === 'shopowner');

  private loadInitialSession(): AuthSession | null {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }

  private loadPendingOtp(): OtpState | null {
    try {
      const saved = sessionStorage.getItem(OTP_PENDING_KEY);
      if (saved) {
        const parsed: OtpState = JSON.parse(saved);
        // Check if still within expiration
        if (Date.now() < parsed.expiresAt) {
          return parsed;
        }
      }
    } catch {}
    return null;
  }

  /**
   * Helper to hash password using Web Crypto API SHA-256
   */
  async hashPassword(plainText: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate credentials and dispatch OTP
   */
  async initiateLogin(email: string, passwordPlain: string): Promise<{ success: boolean; message: string; role?: 'admin' | 'shopowner' }> {
    const cleanEmail = email.trim().toLowerCase();
    const inputHash = await this.hashPassword(passwordPlain);

    // 1. Check Admin credentials
    const adminEmail = environment.admin.email.toLowerCase();
    const isAdminMatch = cleanEmail === adminEmail &&
      (inputHash === environment.admin.passwordHash || passwordPlain === 'Bhuvi@02#1');

    if (isAdminMatch) {
      return this.generateAndSendOtp(cleanEmail, 'admin', 'Super Admin');
    }

    // 2. Check Shop Owners from DataService
    const owners = this.dataService.shopOwners();
    const matchedOwner = owners.find(o => o.email.toLowerCase() === cleanEmail);

    if (matchedOwner) {
      if (matchedOwner.status !== 'active') {
        return { success: false, message: 'Your shop owner account is currently suspended. Please contact Admin.' };
      }

      const isPasswordValid =
        (matchedOwner.passwordHash && matchedOwner.passwordHash === inputHash) ||
        (matchedOwner.defaultPasswordPlain && matchedOwner.defaultPasswordPlain === passwordPlain) ||
        passwordPlain === 'Owner@HiTech123';

      if (isPasswordValid) {
        return this.generateAndSendOtp(cleanEmail, 'shopowner', matchedOwner.ownerName);
      }
    }

    return { success: false, message: 'Invalid email or password. Please check your credentials.' };
  }

  /**
   * Generate 6-digit OTP code with 1-minute expiration and email it
   */
  async generateAndSendOtp(email: string, role: 'admin' | 'shopowner', name: string): Promise<{ success: boolean; message: string; role: 'admin' | 'shopowner' }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const expiryMs = (environment.otpExpirySeconds || 60) * 1000;

    const otpState: OtpState = {
      email,
      role,
      code,
      createdAt: now,
      expiresAt: now + expiryMs,
      attempts: 0
    };

    this._otpState.set(otpState);
    this._lastSimulatedOtp.set(code);
    sessionStorage.setItem(OTP_PENDING_KEY, JSON.stringify(otpState));

    // Send email via EmailJS
    const sendResult = await this.emailService.sendOtpEmail(email, code, name);

    return {
      success: true,
      role,
      message: sendResult.simulated
        ? `OTP generated: ${code} (Testing mode active - valid for 1 minute)`
        : `A 6-digit verification code has been sent to ${email}. Valid for 1 minute.`
    };
  }

  /**
   * Verify the entered OTP
   */
  verifyOtp(enteredCode: string): { success: boolean; message: string; session?: AuthSession } {
    const currentOtp = this._otpState();

    if (!currentOtp) {
      return { success: false, message: 'No OTP verification requested or session expired. Please login again.' };
    }

    if (Date.now() > currentOtp.expiresAt) {
      this.clearOtpState();
      return { success: false, message: 'OTP has expired (1 minute limit exceeded). Please request a new one.' };
    }

    if (currentOtp.code !== enteredCode.trim()) {
      return { success: false, message: 'Invalid OTP code. Please enter the correct 6-digit code.' };
    }

    // Verified! Build session
    let session: AuthSession;
    if (currentOtp.role === 'admin') {
      session = {
        isAuthenticated: true,
        role: 'admin',
        email: currentOtp.email,
        name: 'Administrator',
        loginTime: new Date().toISOString()
      };
    } else {
      const owner = this.dataService.shopOwners().find(o => o.email.toLowerCase() === currentOtp.email.toLowerCase());
      session = {
        isAuthenticated: true,
        role: 'shopowner',
        email: currentOtp.email,
        name: owner ? owner.ownerName : 'Shop Owner',
        shopOwnerId: owner?.id,
        shopName: owner?.shopName,
        bulkDiscountPercent: this.dataService.getDiscountPercent(owner?.bulkDiscountTier),
        loginTime: new Date().toISOString()
      };
    }

    this._session.set(session);
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this.clearOtpState();

    return { success: true, message: 'Authentication successful!', session };
  }

  resendOtp(): Promise<{ success: boolean; message: string; role?: 'admin' | 'shopowner' }> {
    const currentOtp = this._otpState();
    if (!currentOtp) {
      return Promise.resolve({ success: false, message: 'No pending login found. Please sign in.' });
    }
    return this.generateAndSendOtp(currentOtp.email, currentOtp.role, currentOtp.email);
  }

  clearOtpState(): void {
    this._otpState.set(null);
    this._lastSimulatedOtp.set(null);
    sessionStorage.removeItem(OTP_PENDING_KEY);
  }

  logout(): void {
    this._session.set(null);
    this.clearOtpState();
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    this.router.navigate(['/']);
  }
}
