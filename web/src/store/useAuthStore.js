import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      users: [],
      loading: false,
      error: null,

      signUpWithEmail: async ({ email, password, name }) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email: email.toLowerCase(),
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth`,
              data: { name: name?.trim() || '', role: 'student' },
            },
          });
          if (error) throw error;
          set({ loading: false });
          return { needsEmailConfirmation: !data.session, user: data.user };
        } catch (err) {
          const msg = err.message;
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      signInWithEmail: async ({ email, password }) => {
        set({ loading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase(),
            password,
          });
          if (error) throw error;
          const confirmed = data.user?.email_confirmed_at || data.user?.confirmed_at;
          if (!confirmed) {
            await supabase.auth.signOut();
            const msg = 'Please verify your email before signing in.';
            set({ error: msg, loading: false });
            throw new Error(msg);
          }
          const profile = await fetchProfile(
            data.user.id,
            data.user.email,
            data.user.user_metadata?.name,
            data.user.user_metadata?.role
          );
          set({ user: profile, loading: false });
          return profile;
        } catch (err) {
          const msg = err.message;
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      resendVerificationEmail: async (email) => {
        set({ loading: true, error: null });
        try {
          const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email.toLowerCase(),
            options: { emailRedirectTo: `${window.location.origin}/auth` },
          });
          if (error) throw error;
          set({ loading: false });
        } catch (err) {
          const msg = err.message;
          set({ error: msg, loading: false });
          throw new Error(msg);
        }
      },

      updateProfileName: async (name) => {
        const { user } = get();
        if (!user) throw new Error('Not authenticated');
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ name, updated_at: new Date().toISOString() })
            .eq('id', user._id);
          if (error) throw error;
          set({ user: { ...user, name } });
        } catch (err) {
          throw err;
        }
      },

      refreshUser: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user._id)
            .single();
          if (profile) set({ user: mapProfile(profile) });
        } catch { /* ignore */ }
      },

      fetchUsers: async () => {
        set({ loading: true });
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          set({ users: (data || []).map(mapProfile), loading: false });
        } catch {
          set({ loading: false });
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, error: null });
      },

      restoreSession: async () => {
        try {
          const { data: sessionData, error } = await supabase.auth.getSession();
          if (error) throw error;
          const sessionUser = sessionData.session?.user;
          if (!sessionUser) return;
          const confirmed = sessionUser.email_confirmed_at || sessionUser.confirmed_at;
          if (!confirmed) return;
          const profile = await fetchProfile(
            sessionUser.id,
            sessionUser.email,
            sessionUser.user_metadata?.name,
            sessionUser.user_metadata?.role
          );
          if (profile) set({ user: profile });
        } catch {
          set({ user: null });
        }
      },
    }),
    {
      name: 'canteenx-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

/* Map a Supabase profiles row to the shape the frontend expects */
function mapProfile(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name || '',
    email: row.email || '',
    phone: row.phone || '',
    role: row.role || 'student',
    studentId: row.student_id || '',
    avatarUrl: row.avatar_url || '',
    walletBalance: Number(row.wallet_balance) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function fetchProfile(id, fallbackEmail, fallbackName, fallbackRole) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (profile && !error) return mapProfile(profile);

  const { data: created, error: createError } = await supabase
    .from('profiles')
    .insert({
      id,
      email: fallbackEmail || '',
      name: fallbackName || '',
      role: fallbackRole || 'student',
    })
    .select('*')
    .single();
  if (createError) throw createError;
  return mapProfile(created);
}
