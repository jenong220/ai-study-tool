import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isGuest: boolean;
  setAuth: (user: User, token: string) => void;
  setGuest: () => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isGuest: localStorage.getItem('isGuest') === 'true',
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.removeItem('isGuest');
    set({ user, token, isGuest: false });
  },
  setGuest: () => {
    localStorage.setItem('isGuest', 'true');
    localStorage.removeItem('token');
    set({
      user: { id: 'guest', email: 'guest@example.com', name: 'Guest User' },
      token: null,
      isGuest: true,
    });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isGuest');
    set({ user: null, token: null, isGuest: false });
  },
  initialize: () => {
    const token = localStorage.getItem('token');
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (token) {
      set({ token, isGuest: false });
    } else if (isGuest) {
      set({
        user: { id: 'guest', email: 'guest@example.com', name: 'Guest User' },
        token: null,
        isGuest: true,
      });
    }
  },
}));

