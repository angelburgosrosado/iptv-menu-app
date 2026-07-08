import * as React from 'react';

export interface UserState {
  isLoggedIn: boolean;
  email: string | null;
  isPremium: boolean;
}

let authState: UserState = {
  isLoggedIn: false,
  email: null,
  isPremium: false,
};

const listeners = new Set<() => void>();

export const authStore = {
  getState() {
    return authState;
  },
  setState(newState: Partial<UserState>) {
    authState = { ...authState, ...newState };
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
