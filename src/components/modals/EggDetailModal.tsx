import React from 'react';
import { motion } from 'motion/react';
import { Inbox, ShoppingCart, X, Info, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/contexts/DashboardContext';
import { generateInvoiceCode } from '@/lib/invoice-utils';

export const EggDetailModal: React.FC = () => {
  const {
    isEggDetailOpen,
    setIsEggDetailOpen,
    selectedEggDetail,
    userRole,
    paymentHistory,
    setInvoiceModalMode,
    setSelectedInvoice,
    formatMoney,
    setActiveTab,
    setBillingMode
  } = useDashboard();

  if (!isEggDetailOpen || !selectedEggDetail) return null;

  const handleGoToBilling = () => {
    setBillingMode('telur');
    setActiveTab('Tagihan');
    setIsEggDetailOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={() => setIsEggDetailOpen(false)}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-slate-100 rounded-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex flex-col max-h-[90vh] border border-slate-200/60"
      >
        {/* Header */}
        <div className={cn(
          "px-8 py-8 text-slate-900 flex items-center justify-between relative overflow-hidden shrink-0",
          "bg-gradient-to-br from-orange-200 to-orange-300/60"
        )}>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 transform rotate-3 transition-transform hover:rotate-0">
              <Inbox size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-1">Rincian Inventori</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none mt-1">
                {generateInvoiceCode(selectedEggDetail.id, selectedEggDetail.tanggal, "BEF")}
              </h3>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsEggDetailOpen(false)} className="text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl relative z-10 border border-transparent hover:border-slate-100">
            <X size={20} />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar space-y-8">
          {/* Main Info Grid */}
          <div className="p-6 bg-white rounded-2xl border border-slate-100 space-y-4 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Informasi Transaksi</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal</span>
                <span className="text-xs font-black text-slate-900">
                  {new Date(selectedEggDetail.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pihak Terkait</span>
                <span className="text-xs font-black text-slate-900 truncate uppercase">
                  {selectedEggDetail.nama_mitra || selectedEggDetail.keterangan?.replace('Mitra: ', '')?.split('|')[0]?.trim() || '-'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jenis Telur</span>
                <span className="text-xs font-black text-slate-900 uppercase">
                  {(() => {
                    const ket = selectedEggDetail.keterangan || "";
                    const typeMatch = ket.match(/Jenis: ([^|]+)/);
                    return typeMatch ? typeMatch[1].trim() : "Telur Ayam Ras";
                  })()}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Total Berat</span>
                <span className="text-xs font-black text-slate-900 uppercase">
                  {(selectedEggDetail.jumlah_kg || 0).toLocaleString('id-ID')} KG
                </span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="space-y-4">
            <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 space-y-6 relative overflow-hidden shadow-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
              
              {(() => {
                const totalPaid = paymentHistory.reduce((sum, p) => sum + (p.nominal || 0), 0);
                const sisa = Math.max(0, (selectedEggDetail.total_harga || 0) - totalPaid);
                const progress = Math.round((totalPaid / (selectedEggDetail.total_harga || 1)) * 100);

                return (
                  <>
                    <div className="flex justify-between items-end relative z-10">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Grand Total</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">
                          {formatMoney(selectedEggDetail.total_harga || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Sisa Pembayaran</p>
                        <p className={cn(
                          "text-3xl font-black tracking-tighter tabular-nums",
                          sisa <= 0 ? "text-emerald-500" : "text-orange-500"
                        )}>
                          {formatMoney(sisa)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5 relative z-10">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em]">
                        <span className="text-slate-400">Progress Pelunasan</span>
                        <span className="text-slate-900">{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, progress)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full bg-orange-500"
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Payment History List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Wallet size={12} className="text-slate-300" />
                Riwayat Pembayaran
              </span>
              <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[8px] font-black text-slate-500 uppercase">
                {paymentHistory.length} Kali
              </span>
            </div>

            <div className="relative pl-10 space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {paymentHistory.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 -ml-10 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Belum ada riwayat</p>
                </div>
              ) : (
                paymentHistory.map((log, idx) => (
                  <div key={log.id} className="relative group">
                    <div className={cn(
                      "absolute -left-8 top-1 w-6 h-6 rounded-full border-4 border-white z-10 transition-all",
                      idx === 0 ? "bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]" : "bg-slate-200"
                    )} />
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-900">{formatMoney(log.nominal)}</span>
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-100 text-slate-400 bg-white">Pembayaran #{paymentHistory.length - idx}</Badge>
                      </div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {new Date(log.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="px-8 py-8 bg-slate-50 border-t border-slate-100 shrink-0">
          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setIsEggDetailOpen(false)} 
              className="flex-1 h-14 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-white transition-all"
            >
              Tutup
            </Button>
            {userRole !== 'viewer' && (
              <Button 
                onClick={handleGoToBilling}
                className="flex-[2] h-14 rounded-xl bg-orange-500 text-white hover:bg-orange-600 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-3 border-none"
              >
                <Wallet size={16} />
                Kelola Tagihan
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
