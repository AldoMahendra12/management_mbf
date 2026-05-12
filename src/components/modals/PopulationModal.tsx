import React from 'react';
import { motion } from 'motion/react';
import { Bird, X, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/contexts/DashboardContext';

export const PopulationModal: React.FC = () => {
  const {
    isPopulationModalOpen,
    setIsPopulationModalOpen,
    eventEntryType,
    setEventEntryType,
    userRole,
    isSubmittingPopulation,
    handleSubmitPopulation,
  } = useDashboard();

  if (!isPopulationModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={() => setIsPopulationModalOpen(false)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-white max-h-[90vh] rounded-xl flex flex-col overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-orange-600/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="relative z-10 px-8 py-8 flex items-center justify-between overflow-hidden shrink-0 bg-gradient-to-br from-orange-200 to-orange-300/60">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-orange-500 shadow-2xl shadow-orange-500/20 flex items-center justify-center text-white transform rotate-3 transition-transform hover:rotate-0">
              <Bird size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-1">Manajemen Populasi</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Catat Kejadian Baru</h3>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsPopulationModalOpen(false)} 
            className="rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white/50 transition-all w-10 h-10 border border-transparent hover:border-slate-100"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
          <div className="space-y-8">
            {/* Event Type Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Jenis Kejadian</label>
              <div className="grid grid-cols-2 bg-slate-100/50 p-1.5 rounded-[1.25rem] gap-1.5">
                {[
                  { id: 'Ayam Masuk', label: 'Ayam Masuk', color: 'bg-orange-500 shadow-orange-500/20' },
                  { id: 'Afkir', label: 'Ayam Afkir', color: 'bg-red-600 shadow-red-500/20' }
                ].map((btn) => (
                  <button 
                    key={btn.id}
                    onClick={() => setEventEntryType(btn.id as any)}
                    className={cn(
                      "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                      eventEntryType === btn.id 
                        ? `${btn.color} text-white shadow-lg` 
                        : "text-slate-400 hover:text-slate-600 hover:bg-white"
                    )}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Calendar size={12} className="text-slate-300" />
                  Tanggal Kejadian
                </label>
                <input 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]} 
                  className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-orange-200 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah (Ekor)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full h-14 bg-slate-50 border border-slate-100 rounded-xl px-4 pr-16 text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-orange-200 transition-all placeholder:text-slate-300" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Ekor</span>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Alasan</label>
              <textarea 
                rows={3} 
                placeholder="Tuliskan alasan atau kondisi yang ditemukan..." 
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-orange-200 transition-all placeholder:text-slate-300 resize-none"
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100/50 flex items-start gap-4">
              <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                <AlertCircle size={16} />
              </div>
              <p className="text-[10px] font-bold text-orange-700/80 leading-relaxed uppercase tracking-widest mt-1">
                Data populasi akan diperbarui secara otomatis di seluruh sistem setelah catatan ini disimpan.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-4">
          <Button 
            variant="ghost" 
            onClick={() => setIsPopulationModalOpen(false)} 
            className="h-14 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-white transition-all"
          >
            Batal
          </Button>
          <Button 
            disabled={userRole === 'viewer' || isSubmittingPopulation}
            onClick={handleSubmitPopulation}
            className="h-14 px-10 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 transition-all flex items-center gap-3"
          >
            {isSubmittingPopulation ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              'Simpan Catatan'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
