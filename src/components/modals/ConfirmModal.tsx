import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/contexts/DashboardContext';

export const ConfirmModal: React.FC = () => {
  const { confirmModal, setConfirmModal } = useDashboard();

  if (!confirmModal.isOpen) return null;

  const handleConfirm = () => {
    confirmModal.onConfirm();
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const handleClose = () => {
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[400px] bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col items-center text-center p-8"
      >
        <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 mb-6 shadow-sm border border-orange-100/50">
          <AlertTriangle size={32} />
        </div>

        <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase tracking-widest mb-2">
          {confirmModal.title}
        </h3>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-8 px-4 opacity-70">
          {confirmModal.message}
        </p>

        <div className="flex gap-3 w-full">
          {confirmModal.type === 'alert' ? (
            <Button
              onClick={handleClose}
              className="flex-1 h-14 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/10 border-none"
            >
              Mengerti, Tutup
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 border-slate-200 hover:bg-slate-50"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-[1.5] h-12 rounded-xl font-black text-[10px] uppercase tracking-widest bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20"
              >
                Ya, Lanjutkan
              </Button>
            </>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-slate-300 hover:text-slate-900 rounded-full"
        >
          <X size={18} />
        </Button>
      </motion.div>
    </div>
  );
};
