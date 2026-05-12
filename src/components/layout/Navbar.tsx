import React from 'react';
import { Bell, Search, Menu, Settings, LogOut, User as UserIcon, ChevronRight } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { activeTab, user, userRole, supabase } = useDashboard();

  return (
    <header className="h-16 bg-slate-50 flex items-center justify-between px-8 sticky top-0 z-40 border-b border-slate-100/50">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
          <Menu size={20} />
        </button>
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 font-medium">MBF</span>
          <ChevronRight size={14} className="text-slate-300" />
          <span className="text-slate-900 font-semibold">{activeTab}</span>
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden lg:flex relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-500 transition-colors" size={15} />
          <input 
            type="text" 
            placeholder="Cari transaksi..." 
            className="w-56 h-10 bg-white border border-slate-200/60 rounded-lg pl-10 pr-4 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all outline-none"
          />
        </div>

        {/* Notification Bell */}
        <Button variant="ghost" size="icon" className="relative w-10 h-10 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-white">
          <Bell size={18} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-slate-50" />
        </Button>

        <Separator orientation="vertical" className="h-6 bg-slate-200/50" />

        {/* User Avatar + Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-3 pl-1 pr-1 py-1 rounded-lg hover:bg-white transition-all group">
              <Avatar className="w-9 h-9 border-2 border-white shadow-sm ring-1 ring-slate-200/50 group-hover:ring-orange-200 transition-all">
                <AvatarImage src="" />
                <AvatarFallback className="bg-orange-600 text-white text-xs font-bold">
                  {user?.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 leading-none mb-0.5">{user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-[11px] font-medium text-slate-400 leading-none">{userRole || 'Staff'}</p>
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 rounded-xl shadow-2xl border-slate-800 bg-slate-900" align="end">
            <div className="p-1">
              <p className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest px-2 pt-1">Akun & Profil</p>
              <div className="space-y-0.5">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all text-left">
                  <UserIcon size={16} /> Edit Profil
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-all text-left">
                  <Settings size={16} /> Pengaturan
                </button>
              </div>
              <Separator className="my-2 bg-slate-800" />
              <button 
                onClick={() => supabase.auth.signOut()}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-rose-400 hover:bg-rose-500/20 transition-all text-left"
              >
                <LogOut size={16} /> Keluar
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
