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
  async login(emailInput: string, passwordInput: string): Promise<UserState> {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput.trim();

    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    // Direct Administrator Credentials Check
    if (email === 'angelburgosrosado@gmail.com') {
      if (password !== 'Admin123') {
        throw new Error('Invalid credentials for administrator account. Check your password.');
      }

      const uid = 'admin_angelburgos';
      const tokenPayload = {
        uid,
        sub: uid,
        email: 'angelburgosrosado@gmail.com',
        name: 'Angel Burgos',
        role: 'admin',
        subscriptionTier: 'builder',
        accountStatus: 'active'
      };
      const token = btoa(JSON.stringify(tokenPayload));

      const adminState: UserState = {
        isLoggedIn: true,
        email: 'angelburgosrosado@gmail.com',
        displayName: 'Angel Burgos (CEO)',
        role: 'admin',
        isPremium: true,
        token
      };

      authStore.setState(adminState);

      // Async backend sync if server is reachable
      try {
        fetch('/api/public/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        }).catch(() => null);
      } catch (e) {
        // Backend sync optional
      }

      return adminState;
    }

    // Standard user login / registration
    const uid = `usr_${btoa(email).replace(/=/g, '').slice(0, 10)}`;
    const tokenPayload = {
      uid,
      sub: uid,
      email,
      name: email.split('@')[0],
      role: 'user',
      subscriptionTier: 'pro',
      accountStatus: 'active'
    };
    const token = btoa(JSON.stringify(tokenPayload));

    const standardState: UserState = {
      isLoggedIn: true,
      email,
      displayName: email.split('@')[0],
      role: 'user',
      isPremium: true,
      token
    };

    authStore.setState(standardState);
    return standardState;
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
