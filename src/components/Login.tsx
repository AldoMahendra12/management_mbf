import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '@/components/ui/button';
import logoMBF from '../assets/logo_MBF.png';
import logoBEF from '../assets/logo_BEF.png';
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    
    setLoading(true);
    setError(null);

    try {
      const input = username.trim().toLowerCase();
      
      // Sandbox User Check
      if (input === 'trial_mbf' && password === 'trial123') {
        localStorage.setItem('mbf_sandbox_user', JSON.stringify({
          name: 'User Trial',
          role: 'editor',
          isSandbox: true
        }));
        window.location.reload();
        return;
      }

      // Handle both username prefix and full email
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
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[850px] bg-white rounded-[2rem] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15),0_8px_20px_-6px_rgba(0,0,0,0.1)] flex flex-col md:flex-row overflow-hidden min-h-[480px]"
      >
        {/* Left Banner */}
        <div className="hidden md:flex flex-col justify-between w-[45%] p-10 relative overflow-hidden m-2 rounded-[1.5rem]">
          {/* Background Gradient similar to image */}
          <div className="absolute inset-0 bg-[#fbf9f8] z-0" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-400/80 via-orange-200/40 to-transparent blur-3xl z-0" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#fbf9f8] to-transparent z-0 opacity-60" />
          
          <div className="relative z-10 h-7 overflow-hidden">
            <motion.div
              animate={{ y: [0, 0, -28, -28, -56] }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5, 
                ease: "easeInOut",
                times: [0, 0.4, 0.5, 0.9, 1]
              }}
              className="flex flex-col text-xl font-black text-slate-900 tracking-tight"
            >
              <div className="h-7 flex items-center">Mitra Barokah Farm</div>
              <div className="h-7 flex items-center">Berkah Egg Farm</div>
              <div className="h-7 flex items-center">Mitra Barokah Farm</div>
            </motion.div>
          </div>

          <div className="relative z-10 mt-auto">
            <p className="text-[11px] font-bold tracking-wide text-slate-800/60 mb-2 uppercase">Sistem Administrasi Internal</p>
            <h1 className="text-3xl font-black text-slate-900 leading-[1.15] tracking-tight">
              Akses data operasional dan pantau performa bisnis.
            </h1>
          </div>
        </div>

        {/* Right Form */}
        <div className="w-full md:w-[55%] p-8 sm:px-12 flex flex-col justify-center relative">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-8">
              <div className="mb-5 relative flex items-center justify-start w-fit" style={{ perspective: 1000 }}>
                <motion.div
                  animate={{ rotateY: [0, 180, 180, 360, 360] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", times: [0, 0.4, 0.5, 0.9, 1] }}
                  className="relative origin-center"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <img src={logoBEF} alt="Placeholder" className="w-auto h-9 opacity-0 pointer-events-none block" />
                  <div className="absolute inset-0 flex items-center justify-start" style={{ backfaceVisibility: 'hidden' }}>
                    <img src={logoMBF} alt="MBF Logo" className="w-auto h-7" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-start" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                    <img src={logoBEF} alt="BEF Logo" className="w-auto h-9" />
                  </div>
                </motion.div>
              </div>

              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2 leading-none">Masuk ke akun</h2>
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                Gunakan kredensial yang telah diberikan oleh administrator sistem untuk mengakses dashboard operasional.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-[13px] font-medium outline-none focus:border-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-900 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-3 pr-10 text-[13px] font-medium outline-none focus:border-slate-900 transition-all placeholder:text-slate-400"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-rose-500 text-xs font-bold pt-1"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0a0a0b] hover:bg-[#18181b] text-white h-[2.75rem] rounded-xl font-bold text-[13px] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.5)] transition-all mt-4"
              >
                {loading ? 'Authenticating...' : 'Masuk sekarang'}
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
