import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 24 Jam dalam milidetik (24 * 60 * 60 * 1000)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;
const SESSION_KEY = 'mbf_login_timestamp';

export const useAuth = () => {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<'editor' | 'viewer' | 'admin' | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const handleLogout = async () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('mbf_sandbox_user');
    if (supabase) await supabase.auth.signOut();
    window.location.href = '/';
  };

  useEffect(() => {
    // 1. Cek Timeout Login (24 Jam)
    const checkTimeout = () => {
      const loginTime = localStorage.getItem(SESSION_KEY);
      if (loginTime) {
        const now = Date.now();
        if (now - parseInt(loginTime) > SESSION_TIMEOUT) {
          handleLogout();
          return true;
        }
      }
      return false;
    };

    if (checkTimeout()) return;

    // 2. Check for sandbox user
    const sandboxUser = localStorage.getItem('mbf_sandbox_user');
    if (sandboxUser) {
      const data = JSON.parse(sandboxUser);
      setSession({ user: { id: 'sandbox-id', email: 'trial@mbf.local' } });
      setUserRole('editor');
      setUserDisplayName(data.name || 'User Trial');
      setIsAuthLoading(false);
      
      // Jika sandbox baru login dan belum ada timestamp, set sekarang
      if (!localStorage.getItem(SESSION_KEY)) {
        localStorage.setItem(SESSION_KEY, Date.now().toString());
      }
      return;
    }

    if (!supabase) {
      setTimeout(() => setIsAuthLoading(false), 1000);
      return;
    }

    const fetchUserRole = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, display_name')
          .eq('user_id', userId)
          .single();
        
        if (error) throw error;
        setUserRole(data.role as any);
        setUserDisplayName(data.display_name || '');
      } catch (err) {
        console.error('Error fetching role:', err);
        setUserRole(null);
        setUserDisplayName('');
      } finally {
        setTimeout(() => setIsAuthLoading(false), 1000);
      }
    };

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Jika session ada tapi timestamp tidak ada, set (baru login)
        if (!localStorage.getItem(SESSION_KEY)) {
          localStorage.setItem(SESSION_KEY, Date.now().toString());
        }
        fetchUserRole(session.user.id);
      } else {
        setTimeout(() => setIsAuthLoading(false), 1000);
      }
    });

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      if (session) {
        // Set timestamp saat login baru atau session awal terdeteksi
        if (!localStorage.getItem(SESSION_KEY)) {
          localStorage.setItem(SESSION_KEY, Date.now().toString());
        }
        fetchUserRole(session.user.id);
      } else {
        // Hapus timestamp saat logout
        localStorage.removeItem(SESSION_KEY);
        setUserRole(null);
        setTimeout(() => setIsAuthLoading(false), 1000);
      }

      // Jika session expired dari sisi Supabase, pastikan timeout local juga bersih
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(SESSION_KEY);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { 
    session, 
    user: session?.user, 
    userRole, 
    userDisplayName, 
    isAuthLoading, 
    supabase 
  };
};
