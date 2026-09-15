import { Injectable, signal } from '@angular/core';

export type Theme = 'smart-hms-light' | 'smart-hms-dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'smart-hms-theme';
  currentTheme = signal<Theme>('smart-hms-light');

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    let savedTheme = localStorage.getItem(this.THEME_KEY) as Theme | null;
    
    // Safely check system preference
    let systemPrefersDark = false;
    try {
        systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch(e) {}
    
    if (savedTheme === 'smart-hms-light' || savedTheme === 'smart-hms-dark') {
      this.setTheme(savedTheme);
    } else if (systemPrefersDark) {
      this.setTheme('smart-hms-dark');
    } else {
      this.setTheme('smart-hms-light');
    }
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    try {
        localStorage.setItem(this.THEME_KEY, theme);
    } catch(e) {}
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleTheme(): void {
    this.setTheme(this.currentTheme() === 'smart-hms-light' ? 'smart-hms-dark' : 'smart-hms-light');
  }
}
