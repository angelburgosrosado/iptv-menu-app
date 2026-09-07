/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authStore, UserState } from '../authStore';

export function useSupabaseAuth() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Check current session
    supabase.auth.getSession().then(({ data: { session }, error: sessionError }) => {
      if (session && !sessionError) {
        const user = session.user;
        const role = user.email === 'angelburgosrosado@gmail.com' ? 'admin' : 'pro';
        authStore.setState({
          isLoggedIn: true,
          email: user.email || null,
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: role as any,
          isPremium: true,
          token: session.access_token,
        });
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const user = session.user;
        const role = user.email === 'angelburgosrosado@gmail.com' ? 'admin' : 'pro';
        authStore.setState({
          isLoggedIn: true,
          email: user.email || null,
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: role as any,
          isPremium: true,
          token: session.access_token,
        });
      } else {
        authStore.logout();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        // Fallback for preview/local mode
        const demoUser = {
          email: 'developer@iptv.menu',
          displayName: 'Pro Streamer (Demo)',
          role: 'pro' as const,
          isPremium: true,
          isLoggedIn: true,
          token: btoa(JSON.stringify({ email: 'developer@iptv.menu', role: 'pro' })),
        };
        authStore.setState(demoUser);
        setLoading(false);
        return demoUser;
      }

      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (signInError) throw signInError;
      return data;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<UserState> => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        return await authStore.login(email, password);
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const user = data.user;
      const role = user.email === 'angelburgosrosado@gmail.com' ? 'admin' : 'pro';
      const userState: UserState = {
        isLoggedIn: true,
        email: user.email || null,
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        role: role as any,
        isPremium: true,
        token: data.session?.access_token || null,
      };

      authStore.setState(userState);
      return userState;
    } catch (err: any) {
      setError(err.message || 'Email authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<UserState> => {
    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        return await authStore.login(email, password);
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      const user = data.user;
      const userState: UserState = {
        isLoggedIn: true,
        email: user?.email || null,
        displayName: user?.email?.split('@')[0] || 'User',
        role: 'user',
        isPremium: false,
        token: data.session?.access_token || null,
      };

      authStore.setState(userState);
      return userState;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      authStore.logout();
    } catch (err) {
      authStore.logout();
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isSupabaseConfigured,
  };
}
