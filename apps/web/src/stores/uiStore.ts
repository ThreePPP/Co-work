import { create } from 'zustand';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type AccentColor = 'indigo' | 'purple' | 'emerald' | 'rose' | 'blue';
export type Language = 'th' | 'en';

interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  theme: ThemeMode;
  accentColor: AccentColor;
  language: Language;
  soundEnabled: boolean;
  toasts: ToastItem[];
  
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleTheme: () => void;
  initTheme: () => void;
  addToast: (toast: Omit<ToastItem, 'id'>) => string;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  theme: 'dark',
  accentColor: 'indigo',
  language: 'th',
  soundEnabled: true,
  toasts: [],

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

  initTheme: () => {
    if (typeof window === 'undefined') return;
    const savedTheme = (localStorage.getItem('cowork_theme') as ThemeMode) || 'dark';
    const savedAccent = (localStorage.getItem('cowork_accent') as AccentColor) || 'indigo';
    const savedSound = localStorage.getItem('cowork_sound') !== 'false';
    const savedLang = (localStorage.getItem('cowork_lang') as Language) || 'th';

    get().setTheme(savedTheme);
    get().setAccentColor(savedAccent);
    get().setLanguage(savedLang);
    set({ soundEnabled: savedSound });
  },

  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cowork_lang', language);
    }
    set({ language });
  },

  toggleLanguage: () => {
    const current = get().language;
    const next: Language = current === 'th' ? 'en' : 'th';
    get().setLanguage(next);
  },

  setSoundEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cowork_sound', String(enabled));
    }
    set({ soundEnabled: enabled });
  },

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cowork_theme', theme);

      let effectiveTheme = theme;
      if (theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light';
      }

      const root = document.documentElement;
      root.classList.remove('dark', 'light');
      root.classList.add(effectiveTheme);
    }
    set({ theme });
  },

  setAccentColor: (accentColor) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cowork_accent', accentColor);
      const root = document.documentElement;
      root.setAttribute('data-accent', accentColor);
    }
    set({ accentColor });
  },

  toggleTheme: () => {
    const current = get().theme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...toast, id };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    const duration = toast.duration || 4000;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
