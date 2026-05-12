import React from 'react';
import { motion } from 'motion/react';
import { Wallet, FileText, X, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/contexts/DashboardContext';

export const PaymentModal: React.FC = () => {
  const {
    invoiceModalMode,
    setInvoiceModalMode,
    selectedInvoice,
    paymentAmount,
    setPaymentAmount,
    paymentDate,
    setPaymentDate,
    paymentNotes,
    setPaymentNotes,
    formatMoney,
    showConfirm,
    handleSubmitPayment,
    isSubmittingPayment
  } = useDashboard();

  if (!invoiceModalMode || !selectedInvoice) return null;

  const handleSavePayment = () => {
    showConfirm(
      'Konfirmasi Pembayaran',
      `Simpan pembayaran sebesar ${formatMoney(paymentAmount)} ke invoice ini?`,
      handleSubmitPayment
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        onClick={() => setInvoiceModalMode(null)}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-slate-100 rounded-2xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex flex-col max-h-[90vh] border border-slate-200/60"
      >
        {/* Header */}
        <div className="px-8 py-8 bg-gradient-to-br from-orange-200 to-orange-300/60 text-slate-900 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
          
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/20 transform rotate-3 transition-transform hover:rotate-0">
              <Wallet size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.3em] mb-1">Manajemen Keuangan</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Input Cicilan Baru</h3>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setInvoiceModalMode(null)} className="text-slate-400 hover:text-slate-900 hover:bg-white rounded-xl relative z-10 border border-transparent hover:border-slate-100">
            <X size={20} />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-2xl border border-slate-100 space-y-1 shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Tagihan</p>
              <p className="text-xl font-black text-slate-900 tabular-nums">
                {formatMoney(selectedInvoice.total_harga || selectedInvoice.total_tagihan || 0)}
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-orange-100/50 space-y-1 shadow-sm">
              <p className="text-[9px] font-black text-orange-600/60 uppercase tracking-widest">Sisa Piutang</p>
              <p className="text-xl font-black text-orange-600 tabular-nums">
                {formatMoney(Math.max(0, (selectedInvoice.total_harga || selectedInvoice.total_tagihan || 0) - (selectedInvoice.jumlah_dibayar || selectedInvoice.dibayar_hari_ini || 0)))}
              </p>
            </div>
          </div>

          {/* Payment Inputs */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={12} className="text-slate-300" />
                Tanggal Pembayaran
              </label>
              <input 
                type="date" 
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full h-14 bg-white border border-slate-100 rounded-xl px-4 text-sm font-black text-slate-900 outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nominal Pembayaran</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-900">Rp</span>
                <input 
                  type="text" 
                  value={paymentAmount ? paymentAmount.toLocaleString('id-ID') : ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setPaymentAmount(val ? parseInt(val) : 0);
                  }}
                  placeholder="0"
                  className="w-full h-14 bg-white border border-slate-100 rounded-xl pl-12 pr-4 text-sm font-black text-slate-900 outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan / Referensi (Opsional)</label>
              <textarea 
                rows={2}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Contoh: Transfer BCA, Tunai, dll..."
                className="w-full bg-white border border-slate-100 rounded-xl p-4 text-sm font-black text-slate-900 outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 transition-all placeholder:text-slate-300 resize-none shadow-sm" 
              />
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="px-8 py-8 bg-slate-50 border-t border-slate-100 shrink-0">
          <div className="flex gap-4">
            <Button 
              variant="ghost" 
              onClick={() => setInvoiceModalMode(null)} 
              className="flex-1 h-14 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-white transition-all"
            >
              Batal
            </Button>
            <Button 
              disabled={isSubmittingPayment}
              onClick={handleSavePayment}
              className="flex-[2] h-14 rounded-xl bg-orange-500 text-white hover:bg-orange-600 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 transition-all border-none"
            >
              {isSubmittingPayment ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <>
                  <CheckCircle2 size={16} className="text-white" />
                  Simpan Pembayaran
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
