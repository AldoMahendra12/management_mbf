import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, User as UserIcon, Key } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import logoMBF from '../assets/logo_MBF.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    setError(null);

    try {
      // Handle both username prefix and full email
      const input = username.trim().toLowerCase();
      const email = input.includes('@') ? input : `${input}@mbf.local`;
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message === 'Invalid login credentials' 
        ? 'Username atau password salah.' 
        : 'Gagal masuk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img src={logoMBF} alt="MBF Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">MBF MANAGEMENT</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Administrasi Internal</p>
        </div>

        <Card className="border-slate-200/60 shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="bg-slate-900 text-white p-6 pb-8">
            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
              <Lock size={18} className="text-orange-400" />
              MASUK KE SISTEM
            </CardTitle>
            <CardDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
              Gunakan kredensial yang telah diberikan
            </CardDescription>
          </CardHeader>
          
          <CardContent className="p-6 -mt-4 bg-white rounded-t-2xl relative z-10">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm font-bold outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm font-bold outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-all"
                  />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white h-11 font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20 transition-all mt-4"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AUTHENTICATING...
                  </div>
                ) : (
                  'MASUK SEKARANG'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center mt-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          &copy; 2026 PT. MBF &middot; ALL RIGHTS RESERVED
        </p>
      </motion.div>
    </div>
  );
}
