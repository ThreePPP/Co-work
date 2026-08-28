import { create } from 'zustand';
import { User } from '../types';
import { api } from '../lib/api';
import { disconnectSocket } from '../lib/socket';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  initAuth: () => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; department?: string; position?: string }) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initAuth: async () => {
    try {
      const token = localStorage.getItem('cowork_token');
      const cachedUser = localStorage.getItem('cowork_user');

      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      if (cachedUser) {
        set({ user: JSON.parse(cachedUser), token, isAuthenticated: true });
      }

      // Verify token with backend
      const res: any = await api.get('/auth/me');
      if (res?.data) {
        localStorage.setItem('cowork_user', JSON.stringify(res.data));
        set({ user: res.data, token, isAuthenticated: true, isLoading: false, error: null });
      }
    } catch (err: any) {
      localStorage.removeItem('cowork_token');
      localStorage.removeItem('cowork_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: err.message });
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await api.post('/auth/login', credentials);
      const { user, token } = res.data;
      localStorage.setItem('cowork_token', token);
      localStorage.setItem('cowork_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await api.post('/auth/register', data);
      const { user, token } = res.data;
      localStorage.setItem('cowork_token', token);
      localStorage.setItem('cowork_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  googleLogin: async (credential: string) => {
    set({ isLoading: true, error: null });
    try {
      const res: any = await api.post('/auth/google', { credential });
      const { user, token } = res.data;
      localStorage.setItem('cowork_token', token);
      localStorage.setItem('cowork_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
      throw err;
    }
  },

  updateProfile: async (data) => {
    try {
      const res: any = await api.patch('/auth/me', data);
      const updated = res.data;
      localStorage.setItem('cowork_user', JSON.stringify(updated));
      set({ user: updated });
    } catch (err: any) {
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore
    } finally {
      localStorage.removeItem('cowork_token');
      localStorage.removeItem('cowork_user');
      disconnectSocket();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
