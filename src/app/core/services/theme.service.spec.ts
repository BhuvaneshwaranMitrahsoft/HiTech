import { TestBed } from '@angular/core/testing';
import { ThemeService, Theme } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.removeItem('hitech_theme_preference');
    document.documentElement.removeAttribute('data-theme');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have a current theme', () => {
    const theme = service.currentTheme();
    expect(['light', 'dark']).toContain(theme);
  });

  it('should toggle theme from light to dark', () => {
    service.setTheme('light');
    service.toggleTheme();
    expect(service.currentTheme()).toBe('dark');
  });

  it('should toggle theme from dark to light', () => {
    service.setTheme('dark');
    service.toggleTheme();
    expect(service.currentTheme()).toBe('light');
  });

  it('should set theme explicitly', () => {
    service.setTheme('dark');
    expect(service.currentTheme()).toBe('dark');
    service.setTheme('light');
    expect(service.currentTheme()).toBe('light');
  });

  it('should report isDark correctly', () => {
    service.setTheme('dark');
    expect(service.isDark()).toBeTrue();
    service.setTheme('light');
    expect(service.isDark()).toBeFalse();
  });

  it('should apply data-theme attribute to document', () => {
    service.setTheme('dark');
    // Effect runs in Angular zone — wait for it
    TestBed.flushEffects();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('should persist theme to localStorage', () => {
    service.setTheme('dark');
    TestBed.flushEffects();
    expect(localStorage.getItem('hitech_theme_preference')).toBe('dark');
  });
});
