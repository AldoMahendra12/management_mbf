import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [session, setSession] = useState<any>(null);
  const [userRole, setUserRole] = useState<'editor' | 'viewer' | 'admin' | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
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

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      else {
        setTimeout(() => setIsAuthLoading(false), 1000);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserRole(session.user.id);
      else {
        setUserRole(null);
        setTimeout(() => setIsAuthLoading(false), 1000);
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
