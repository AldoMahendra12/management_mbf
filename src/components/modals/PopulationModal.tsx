import React from 'react';
import { motion } from 'motion/react';
import { Bird, X, Calendar, User, Scale, Banknote, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboard } from '@/contexts/DashboardContext';

export const PopulationModal: React.FC = () => {
  const {
    isAfkirModalOpen,
    setIsAfkirModalOpen,
    userRole,
    afkirDate, setAfkirDate,
    afkirQty, setAfkirQty,
    afkirWeight, setAfkirWeight,
    afkirPrice, setAfkirPrice,
    afkirNotes, setAfkirNotes,
    afkirMitra, setAfkirMitra,
    afkirKandang, setAfkirKandang,
    isSubmittingAfkir,
    handleSubmitAfkir,
  } = useDashboard();

  const [step, setStep] = React.useState<1 | 2>(1);

  if (!isAfkirModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={() => setIsAfkirModalOpen(false)}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-xl bg-white max-h-[95vh] rounded-2xl flex flex-col overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)]"
      >
        {/* Header */}
        <div className="relative px-8 py-7 bg-gradient-to-br from-orange-500 to-orange-600 text-white shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <Bird size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight leading-tight">Penjualan Afkir Ayam</h3>
                <p className="text-[10px] font-bold text-orange-100 uppercase tracking-widest mt-1">Hasil penjualan akan masuk ke arus kas keuangan</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsAfkirModalOpen(false)} 
              className="rounded-full text-white/70 hover:text-white hover:bg-white/10"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6 custom-scrollbar">
          {step === 1 ? (
            <>
          <div className="grid grid-cols-2 gap-6">
            {/* Mitra / Pembeli */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> Mitra / Nama Pembeli
              </label>
              <input 
                type="text" 
                value={afkirMitra}
                onChange={(e) => setAfkirMitra(e.target.value)}
                placeholder="Contoh: Pak Haji Ahmad" 
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all placeholder:text-slate-300" 
              />
            </div>
            {/* Kandang Asal */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Bird size={12} /> Kandang Asal
              </label>
              <input 
                type="text" 
                value={afkirKandang || ''}
                onChange={(e) => setAfkirKandang(e.target.value)}
                placeholder="Contoh: Kandang Pak Budi" 
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all placeholder:text-slate-300" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Tanggal */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} /> Tanggal Penjualan
              </label>
              <input 
                type="date" 
                value={afkirDate}
                onChange={(e) => setAfkirDate(e.target.value)}
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all" 
              />
            </div>

            {/* Qty (Ekor) */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Bird size={12} /> Jumlah (Ekor)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  value={afkirQty || ''}
                  onChange={(e) => setAfkirQty(Number(e.target.value))}
                  placeholder="0" 
                  className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 pr-16 text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">EKOR</span>
              </div>
            </div>
          </div>

          {/* Harga Per Unit */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Banknote size={12} /> Harga (Per Ekor)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-900">Rp</span>
              <input 
                type="text" 
                value={afkirPrice ? afkirPrice.toLocaleString('id-ID') : ''}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setAfkirPrice(val ? parseInt(val) : 0);
                }}
                placeholder="0" 
                className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all" 
              />
            </div>
          </div>

          {/* Kalkulasi Otomatis */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1">
             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estimasi Total Pendapatan</p>
             <h4 className="text-xl font-black text-slate-900">
               Rp {(afkirQty * afkirPrice).toLocaleString('id-ID')}
             </h4>
          </div>

          {/* Keterangan */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <FileText size={12} /> Catatan Tambahan
            </label>
            <textarea 
              rows={2} 
              value={afkirNotes}
              onChange={(e) => setAfkirNotes(e.target.value)}
              placeholder="Contoh: Pembayaran tunai, ayam kandang A2..." 
              className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-orange-500 transition-all placeholder:text-slate-300 resize-none"
            />
          </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="p-8 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-6">
                <div className="text-center pb-6 border-b border-orange-200/50">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Konfirmasi Penjualan Afkir</h4>
                  <p className="text-xs font-bold text-slate-500 mt-1">Pastikan data transaksi penjualan ayam afkir sudah benar.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mitra / Pembeli</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{afkirMitra || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kandang Asal</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{afkirKandang || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                    <p className="text-sm font-black text-slate-900 uppercase">
                      {new Date(afkirDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Penjualan</p>
                  </div>
                  <div className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div className="space-y-1">
                      <span className="text-sm font-black text-slate-900 uppercase block">Ayam Afkir</span>
                      <span className="text-xs font-bold text-slate-500 block">
                        {afkirQty} EKOR × Rp {(afkirPrice || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <span className="text-sm font-black text-slate-900 tabular-nums">Rp {((afkirQty || 0) * (afkirPrice || 0)).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {afkirNotes && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Catatan</p>
                    <p className="text-sm font-bold text-slate-700 italic">"{afkirNotes}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <Button 
            variant="ghost" 
            onClick={() => step === 2 ? setStep(1) : setIsAfkirModalOpen(false)} 
            className="h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900"
          >
            {step === 2 ? 'Kembali' : 'Batal'}
          </Button>
          <Button 
            disabled={userRole === 'viewer' || isSubmittingAfkir}
            onClick={() => {
              if (step === 1) {
                // Ensure required fields are provided if any logic demands it, 
                // but default values exist in state. Just move to step 2.
                setStep(2);
              } else {
                handleSubmitAfkir();
                setTimeout(() => setStep(1), 500); // reset step
              }
            }}
            className="h-12 px-10 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 transition-all flex items-center gap-3 active:scale-95"
          >
            {isSubmittingAfkir ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : step === 1 ? (
              'Lanjut ke Konfirmasi'
            ) : (
              'Simpan & Masuk Keuangan'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
