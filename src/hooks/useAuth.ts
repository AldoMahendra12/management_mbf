import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 2 Jam dalam milidetik (2 * 60 * 60 * 1000)
const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000;
const LAST_ACTIVE_KEY = 'mbf_last_active';

export const useAuth = () => {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<'editor' | 'viewer' | 'admin' | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const handleLogout = async () => {
    localStorage.removeItem(LAST_ACTIVE_KEY);
    localStorage.removeItem('mbf_sandbox_user');
    if (supabase) await supabase.auth.signOut();
    window.location.href = '/';
  };

  useEffect(() => {
    // 1. Cek Inaktivitas (Jika tab ditutup > 2 jam)
    const checkInactivity = () => {
      const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
      if (lastActive) {
        const now = Date.now();
        if (now - parseInt(lastActive) > INACTIVITY_TIMEOUT) {
          handleLogout();
          return true;
        }
      }
      // Update waktu aktif sekarang
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      return false;
    };

    if (checkInactivity()) return;

    // 2. Interval untuk update status "Aktif" (Selama tab terbuka)
    const activeInterval = setInterval(() => {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
    }, 30000); // Update setiap 30 detik

    // 3. Check for sandbox user
    const sandboxUser = localStorage.getItem('mbf_sandbox_user');
    if (sandboxUser) {
      const data = JSON.parse(sandboxUser);
      setSession({ user: { id: 'sandbox-id', email: 'trial@mbf.local' } });
      setUserRole('editor');
      setUserDisplayName(data.name || 'User Trial');
      setIsAuthLoading(false);
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
      if (session) fetchUserRole(session.user.id);
      else {
        setTimeout(() => setIsAuthLoading(false), 1000);
      }
    });

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        fetchUserRole(session.user.id);
      } else {
        localStorage.removeItem(LAST_ACTIVE_KEY);
        setUserRole(null);
        setTimeout(() => setIsAuthLoading(false), 1000);
      }
    });

    return () => {
      clearInterval(activeInterval);
      subscription.unsubscribe();
    };
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
