import * as React from 'react';

export interface UserState {
  isLoggedIn: boolean;
  email: string | null;
  displayName: string | null;
  role: 'user' | 'pro' | 'builder' | 'admin';
  isPremium: boolean;
  token: string | null;
}

const STORAGE_KEY = 'iptv_auth_state';

const loadPersistedState = (): UserState => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (e) {
    console.warn('Could not read auth state from localStorage', e);
  }
  return {
    isLoggedIn: false,
    email: null,
    displayName: null,
    role: 'user',
    isPremium: false,
    token: null,
  };
};

let authState: UserState = loadPersistedState();

const listeners = new Set<() => void>();

export const authStore = {
  getState() {
    return authState;
  },
  setState(newState: Partial<UserState>) {
    authState = { ...authState, ...newState };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
      }
    } catch (e) {
      console.warn('Could not persist auth state', e);
    }
    listeners.forEach((listener) => listener());
  },
  async register(emailInput: string, passwordInput: string): Promise<UserState> {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const response = await fetch('/api/public/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    const newState: UserState = {
      isLoggedIn: true,
      email: data.user.email,
      displayName: data.user.displayName,
      role: data.user.role,
      isPremium: data.user.isPremium,
      token: data.token
    };

    authStore.setState(newState);
    return newState;
  },

  async login(emailInput: string, passwordInput: string): Promise<UserState> {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    const response = await fetch('/api/public/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    const newState: UserState = {
      isLoggedIn: true,
      email: data.user.email,
      displayName: data.user.displayName,
      role: data.user.role,
      isPremium: data.user.isPremium,
      token: data.token
    };

    authStore.setState(newState);
    return newState;
  },
  logout() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Could not clear auth state', e);
    }
    const emptyState: UserState = {
      isLoggedIn: false,
      email: null,
      displayName: null,
      role: 'user',
      isPremium: false,
      token: null,
    };
    authState = emptyState;
    listeners.forEach((listener) => listener());
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useAuth() {
  const [state, setState] = React.useState(authStore.getState());
  
  React.useEffect(() => {
    // Initial sync
    setState(authStore.getState());
    
    // Subscribe to updates
    return authStore.subscribe(() => {
      setState(authStore.getState());
    });
  }, []);
  
  return state;
}
