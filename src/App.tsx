import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useDashboard } from './contexts/DashboardContext';
import { BrandLoader } from './components/layout/BrandLoader';
import Login from './components/Login';
import { Sidebar } from './components/layout/Sidebar';
import { Menu } from 'lucide-react';
import { ModalOrchestrator } from './components/modals/ModalOrchestrator';

// Views
import { DashboardView } from './components/views/DashboardView';
import { FeedWarehouseView } from './components/views/FeedWarehouseView';
import { EggWarehouseView } from './components/views/EggWarehouseView';
import { PopulationView } from './components/views/PopulationView';
import { BillingView } from './components/views/BillingView';
import { FinanceView } from './components/views/FinanceView';
import { ExportView } from './components/views/ExportView';
import logoMBF from './assets/logo_MBF.png';

export default function App() {
  const { 
    user, 
    isLoading, 
    activeTab, 
    notification 
  } = useDashboard();
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    // Show splash screen for 1.5s
    const timer = setTimeout(() => setShowLoader(false), 1500);
    
    // Prevent scroll from changing number input values
    const handleWheel = (e: WheelEvent) => {
      if (document.activeElement?.getAttribute('type') === 'number') {
        (document.activeElement as HTMLElement).blur();
      }
    };

    window.addEventListener('wheel', handleWheel);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  if (showLoader) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <BrandLoader />
    </div>
  );
  if (!user) return <Login />;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'Beranda': return <DashboardView />;
      case 'Gudang Telur': return <EggWarehouseView />;
      case 'Gudang Pakan': return <FeedWarehouseView />;
      case 'Afkir': return <PopulationView />;
      case 'Tagihan': return <BillingView />;
      case 'Keuangan': return <FinanceView />;
      case 'Ekspor': return <ExportView />;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 flex font-inter selection:bg-orange-100 selection:text-orange-900 overflow-x-hidden">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <main 
        className={
          `flex-1 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] relative w-full max-w-[100vw]
          ${isSidebarCollapsed ? 'md:pl-16' : 'md:pl-64'} pl-0`
        }
      >
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-2">
            <img src={logoMBF} alt="MBF" className="h-6" />
            <span className="font-bold text-slate-900">MBF Admin</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="p-4 md:px-6 md:pt-6 pb-24 relative z-0 w-full overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global Modals and Overlays */}
      <ModalOrchestrator />
          
      {/* Notifications */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-4 left-4 right-4 md:bottom-8 md:left-auto md:right-8 z-[200] px-5 py-3.5 rounded-lg shadow-lg flex items-center gap-3 border ${
              notification.type === 'success' 
                ? 'bg-slate-900 border-slate-800 text-white' 
                : 'bg-rose-600 border-rose-500 text-white'
            }`}
          >
            <div className={`shrink-0 w-2 h-2 rounded-full animate-pulse ${notification.type === 'success' ? 'bg-orange-500' : 'bg-white'}`} />
            <p className="text-sm font-medium">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white/80 backdrop-blur-md flex items-center justify-center cursor-wait z-[150]"
          >
            <BrandLoader />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
