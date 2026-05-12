import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { 
  LayoutGrid, 
  ShoppingCart, 
  Package, 
  Bird, 
  DollarSign, 
  FileBarChart, 
  FileText, 
  LogOut,
  PanelLeft,
  Settings
} from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { cn } from '@/lib/utils';
import logoBEF from '../../assets/logo_BEF.png';
import logoMBF from '../../assets/logo_MBF.png';

export function Sidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (v: boolean) => void }) {
  const { activeTab, setActiveTab, supabase, user, userRole } = useDashboard();
  const sidebarLogoContainerRef = useRef<HTMLDivElement>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  useEffect(() => {
    if (!sidebarLogoContainerRef.current) return;
    
    const flipElement = sidebarLogoContainerRef.current.querySelector('.logo-flip');
    if (!flipElement) return;

    const hoverTl = gsap.to(flipElement, {
      rotateY: 180,
      duration: 0.6,
      ease: "back.out(1.7)",
      paused: true
    });

    const handleEnter = () => {
      hoverTl.play();
      setIsLogoHovered(true);
    };
    const handleLeave = () => {
      hoverTl.reverse();
      setIsLogoHovered(false);
    };

    const container = sidebarLogoContainerRef.current;
    container.addEventListener('mouseenter', handleEnter);
    container.addEventListener('mouseleave', handleLeave);

    return () => {
      container.removeEventListener('mouseenter', handleEnter);
      container.removeEventListener('mouseleave', handleLeave);
      hoverTl.kill();
    };
  }, []);

  // Close profile menu on any click
  useEffect(() => {
    if (!isProfileMenuOpen) return;
    
    const handleGlobalClick = () => {
      setIsProfileMenuOpen(false);
    };

    const timer = setTimeout(() => {
      window.addEventListener('click', handleGlobalClick);
    }, 10);

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      clearTimeout(timer);
    };
  }, [isProfileMenuOpen]);

  const menuItems = [
    { id: 'Beranda', icon: LayoutGrid, label: 'Beranda' },
    { id: 'Gudang Telur', icon: ShoppingCart, label: 'Gudang Telur' },
    { id: 'Gudang Pakan', icon: Package, label: 'Gudang Pakan' },
    { id: 'Afkir', icon: Bird, label: 'Afkir Ayam' },
    { id: 'Tagihan', icon: DollarSign, label: 'Tagihan & Piutang' },
    { id: 'Keuangan', icon: FileBarChart, label: 'Laporan Keuangan' },
    { id: 'Ekspor', icon: FileText, label: 'Ekspor Data' },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-white border-r border-slate-200/50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 flex flex-col overflow-visible",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo & Brand */}
      <div className="flex items-center h-16 relative group transition-all duration-500 overflow-hidden w-full">
        <div ref={sidebarLogoContainerRef} className={cn(
          "flex items-center perspective-1000 transition-all duration-500 absolute top-1/2 -translate-y-1/2",
          isCollapsed ? "left-[18px] group-hover:opacity-0 group-hover:scale-75" : "left-6"
        )}>
          <div className="relative w-7 h-7 preserve-3d logo-flip shrink-0">
            <img src={logoMBF} alt="MBF" className="absolute inset-0 w-full h-full object-contain backface-hidden" />
            <img src={logoBEF} alt="BEF" className="absolute inset-0 w-full h-full object-contain backface-hidden rotate-y-180" />
          </div>
          <div className={cn(
            "flex flex-col whitespace-nowrap pl-3 overflow-hidden transition-all duration-500",
            isCollapsed ? "w-0" : "w-[150px]"
          )}>
            <div className="relative h-[14px] w-full overflow-hidden">
              <span className={cn(
                "absolute inset-0 text-sm font-bold text-slate-900 tracking-tight leading-none transition-transform duration-500",
                isLogoHovered ? "-translate-y-full" : "translate-y-0"
              )}>MBF Management</span>
              <span className={cn(
                "absolute inset-0 text-sm font-bold text-slate-900 tracking-tight leading-none transition-transform duration-500",
                isLogoHovered ? "translate-y-0" : "translate-y-full"
              )}>BEF Management</span>
            </div>
            <span className="text-[11px] font-medium text-orange-600 mt-0.5 transition-all duration-500">Pusat Administrasi</span>
          </div>
        </div>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all hidden md:flex items-center justify-center shrink-0 absolute z-10 w-10 h-10 bg-white top-1/2 -translate-y-1/2",
            isCollapsed ? "opacity-0 group-hover:opacity-100 right-[12px]" : "right-[14px]"
          )}
        >
          <div className="absolute inset-y-0 -left-6 w-6 bg-gradient-to-r from-transparent to-white pointer-events-none" />
          <PanelLeft size={22} className="relative z-10" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-visible">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={isCollapsed ? item.label : undefined}
            className={cn(
              "w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
              activeTab === item.id 
                ? (isCollapsed ? "text-orange-500" : "bg-orange-500 text-white shadow-lg shadow-orange-500/20")
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50",
              isCollapsed && "justify-center px-0"
            )}
          >
            <item.icon size={18} className={cn(
              "shrink-0 transition-colors duration-200",
              activeTab === item.id ? (isCollapsed ? "text-orange-500" : "text-white") : "text-slate-400 group-hover:text-slate-600"
            )} />
            
            {/* Label for expanded state */}
            {!isCollapsed && (
              <div className="transition-all duration-500 text-left w-[160px] opacity-100 overflow-hidden">
                <span className="text-[13px] font-medium whitespace-nowrap block pl-3">
                  {item.label}
                </span>
              </div>
            )}

            {/* Label for collapsed state (Instant tooltip) */}
            {isCollapsed && (
              <div className="absolute left-12 bg-white border border-slate-200 text-slate-900 px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none z-50 font-bold text-[11px] whitespace-nowrap">
                {item.label}
              </div>
            )}

          </button>
        ))}
      </nav>

      {/* Bottom Section - User & Logout */}
      <div className={cn("mt-auto border-t border-slate-100/60 relative", isCollapsed ? "p-3" : "p-4")}>
        {/* Profile Menu Popup */}
        <div className={cn(
          "absolute bottom-full mb-3 bg-slate-900 border border-slate-800 shadow-2xl rounded-xl overflow-hidden flex flex-col p-1.5 transition-all duration-300 origin-bottom",
          isCollapsed ? "left-4 w-48" : "left-4 right-4",
          isProfileMenuOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        )}>
          <button 
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-slate-200 hover:bg-white/10 transition-all text-left w-full"
          >
            <Settings size={20} className="text-slate-400" />
            Pengaturan
          </button>
          <div className="h-px bg-slate-800 my-1 mx-2" />
          <button 
            onClick={async () => {
              try {
                localStorage.removeItem('mbf_sandbox_user');
                if (supabase?.auth) {
                  await supabase.auth.signOut();
                }
              } catch (err) {
                console.error('Logout error:', err);
              } finally {
                window.location.href = window.location.origin;
              }
            }}
            className="group relative overflow-hidden flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-semibold text-slate-200 hover:text-white transition-all duration-300 text-left w-full"
          >
            <div className="absolute inset-0 bg-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />
            <LogOut size={20} className="relative z-10 text-slate-400 group-hover:text-white transition-colors duration-300" />
            <span className="relative z-10 transition-colors duration-300">Keluar</span>
          </button>
        </div>

        <button 
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className={cn(
            "w-full flex items-center rounded-lg hover:bg-slate-50 transition-colors text-left overflow-hidden",
            isCollapsed ? "justify-center p-2" : "p-2"
          )}
        >
          <div className="w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.email?.substring(0, 2).toUpperCase() || 'U'}
          </div>
          <div className={cn(
            "overflow-hidden transition-all duration-500",
            isCollapsed ? "w-0" : "w-[160px]"
          )}>
            <div className="flex flex-col whitespace-nowrap pl-3">
              <span className="text-[13px] font-semibold text-slate-900 truncate capitalize">{user?.email?.split('@')[0] || 'User'}</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{userRole || 'Staff'}</span>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}
