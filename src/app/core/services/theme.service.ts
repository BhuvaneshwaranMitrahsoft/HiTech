import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'hitech_theme_preference';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private _theme = signal<Theme>(this.getInitialTheme());
  readonly currentTheme = this._theme.asReadonly();

  constructor() {
    // Apply theme on changes and persist to localStorage
    effect(() => {
      const theme = this._theme();
      document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch (e) {
        console.error('Failed to persist theme preference', e);
      }
    });
  }

  private getInitialTheme(): Theme {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {}

    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }

    return 'light'; // Default to light mode (GadgetBazar-inspired)
  }

  toggleTheme(): void {
    this._theme.update(current => current === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: Theme): void {
    this._theme.set(theme);
  }

  isDark(): boolean {
    return this._theme() === 'dark';
  }
}
