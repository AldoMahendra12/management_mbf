import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Inbox, ShoppingCart, X, Calendar, Plus, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/contexts/DashboardContext';
import { OCRUpload } from '@/components/ui/OCRUpload';

export const EggTransactionModal: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const {
    eggModalType,
    setEggModalType,
    eggDate,
    setEggDate,
    mitraName,
    setMitraName,
    eggCart,
    addEggCartRow,
    removeEggCartRow,
    updateEggCartRow,
    eggCartTotal,
    isSubmittingEggs,
    handleSubmitEgg,
    eggStock,
    showAlert
  } = useDashboard();

  if (!eggModalType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={() => setEggModalType(null)}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-4xl bg-slate-100 max-h-[90vh] rounded-xl flex flex-col overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
      >
        {/* Decorative Background */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-48 bg-gradient-to-b opacity-5 pointer-events-none",
          eggModalType === 'terima' ? "from-orange-500 to-transparent" : "from-orange-600 to-transparent"
        )} />

        {/* Header */}
        <div className={cn(
          "px-8 py-8 text-slate-900 flex items-center justify-between relative overflow-hidden shrink-0",
          "bg-gradient-to-br from-orange-200 to-orange-300/60"
        )}>
          <div className="flex items-center gap-5">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center shadow-2xl transform rotate-3 transition-transform hover:rotate-0",
              eggModalType === 'terima' ? "bg-orange-500 shadow-orange-500/20 text-white" : "bg-orange-600 shadow-orange-500/20 text-white"
            )}>
              {eggModalType === 'terima' ? <Inbox size={28} strokeWidth={2.5} /> : <ShoppingCart size={28} strokeWidth={2.5} />}
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-1">
                Transaksi Telur
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                {eggModalType === 'terima' ? 'Beli / Setoran Telur' : 'Jual Telur ke Mitra'}
              </h3>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setEggModalType(null)} 
            className="rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white/50 transition-all w-10 h-10 border border-transparent hover:border-slate-100"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar space-y-8">
          {step === 1 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={12} className="text-slate-300" />
                Tanggal Transaksi
              </label>
              <input 
                type="date" 
                value={eggDate}
                onChange={(e) => setEggDate(e.target.value)}
                className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 text-sm font-black text-slate-900 outline-none focus:border-orange-200 transition-all shadow-sm" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {eggModalType === 'terima' ? 'Peternak / Pengirim' : 'Customer / Pembeli'}
              </label>
              <input 
                type="text" 
                value={mitraName}
                onChange={(e) => setMitraName(e.target.value)}
                placeholder={eggModalType === 'terima' ? 'Nama peternak...' : 'Nama pembeli...'}
                className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 text-sm font-black text-slate-900 outline-none focus:border-orange-200 transition-all placeholder:text-slate-300 shadow-sm" 
              />
            </div>
          </div>

          {/* Cart Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Telur</label>
              <Button 
                variant="ghost" 
                onClick={addEggCartRow}
                className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50 gap-1.5"
              >
                <Plus size={14} />
                Tambah Item
              </Button>
            </div>

            <div className="space-y-4">
              {eggCart.map((item, index) => {
                const isHorn = item.type === 'Telur Ayam Horn';
                const isArab = item.type === 'Telur Ayam Arab';
                const isPuyuh = item.type === 'Telur Puyuh';

                return (
                  <div key={index} className="p-5 bg-white border border-slate-100 rounded-xl space-y-4 relative group hover:border-orange-100 transition-all shadow-sm">
                    {eggCart.length > 1 && (
                      <button 
                        onClick={() => removeEggCartRow(index)}
                        className="absolute top-5 right-5 text-slate-300 hover:text-red-500 transition-colors z-10"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pr-8">
                      {/* Jenis Telur */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Telur</label>
                        <div className="flex gap-2">
                          {['Telur Ayam Horn', 'Telur Ayam Arab', 'Telur Puyuh'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => updateEggCartRow(index, 'type', type)}
                              className={cn(
                                "px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all flex-1 text-center",
                                item.type === type
                                  ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                                  : "bg-white text-slate-400 border-slate-100 hover:border-orange-200 hover:text-slate-900 shadow-sm"
                              )}
                            >
                              {type.replace('Telur ', '')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Grade (Only for Horn) */}
                      {isHorn ? (
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade</label>
                          <div className="flex gap-2">
                            {['Krem', 'Merah'].map((grade) => (
                              <button
                                key={grade}
                                type="button"
                                onClick={() => updateEggCartRow(index, 'grade', grade)}
                                className={cn(
                                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all flex-1 text-center",
                                  item.grade === grade
                                    ? "bg-orange-100 text-orange-700 border-orange-200"
                                    : "bg-slate-50 text-slate-400 border-slate-100 hover:border-orange-200"
                                )}
                              >
                                {grade}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : <div />}

                        {/* Input Jumlah/Ikat */}
                        {!isArab && !isPuyuh ? (
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                              <span>Jumlah Ikat</span>
                            </label>
                            <div className="relative">
                              <input 
                                type="number" 
                                value={item.ikat || ''}
                                onChange={(e) => updateEggCartRow(index, 'ikat', Number(e.target.value))}
                                placeholder="0"
                                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-xs font-black text-slate-900 outline-none focus:border-orange-200 transition-all pr-12" 
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">Ikat</span>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 px-1 mt-1">= {item.qty || 0} Kg</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                              Jumlah ({isArab ? 'Butir' : 'Kg'})
                            </label>
                            <div className="relative">
                              <input 
                                type="number" 
                                value={item.qty || ''}
                                onChange={(e) => updateEggCartRow(index, 'qty', Number(e.target.value))}
                                placeholder="0"
                                className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-xs font-black text-slate-900 outline-none focus:border-orange-200 transition-all pr-12" 
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">
                                {isArab ? 'BTR' : 'KG'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Harga Satuan */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                            <Tag size={10} /> Harga per {isArab ? 'Butir' : 'Kg'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-900">Rp</span>
                            <input 
                              type="text" 
                              value={item.price ? item.price.toLocaleString('id-ID') : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                updateEggCartRow(index, 'price', val ? parseInt(val) : 0);
                              }}
                              placeholder="0"
                              className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-9 pr-4 text-xs font-black text-slate-900 outline-none focus:border-orange-200 transition-all" 
                            />
                          </div>
                        </div>

                        {/* Catatan */}
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan Tambahan</label>
                          <input 
                            type="text" 
                            value={item.notes || ''}
                            onChange={(e) => updateEggCartRow(index, 'notes', e.target.value)}
                            placeholder="Opsional..."
                            className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-xs font-black text-slate-900 outline-none focus:border-orange-200 transition-all placeholder:text-slate-300" 
                          />
                        </div>
                      </div>

                      <div className="pt-4 mt-2 border-t border-slate-50 flex justify-between items-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Subtotal</p>
                        <p className="text-sm font-black text-slate-900">Rp {((item.qty || 0) * (item.price || 0)).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="p-8 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-6">
                <div className="text-center pb-6 border-b border-orange-200/50">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Konfirmasi Transaksi</h4>
                  <p className="text-xs font-bold text-slate-500 mt-1">Pastikan data yang Anda masukkan sudah benar.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mitra / Customer</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{mitraName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                    <p className="text-sm font-black text-slate-900 uppercase">
                      {new Date(eggDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Item</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {eggCart.map((item, idx) => {
                      const isArab = item.type.includes('Arab');
                      return (
                        <div key={idx} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            <span className="text-sm font-black text-slate-900 uppercase block">{item.type} {item.grade ? `- ${item.grade}` : ''}</span>
                            <span className="text-xs font-bold text-slate-500 block">
                              {item.qty} {isArab ? 'BTR' : 'KG'} × Rp {(item.price || 0).toLocaleString('id-ID')}
                            </span>
                            {item.notes && <span className="text-[10px] font-bold text-slate-400 block italic">"{item.notes}"</span>}
                          </div>
                          <span className="text-sm font-black text-slate-900 tabular-nums">Rp {((item.qty || 0) * (item.price || 0)).toLocaleString('id-ID')}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 shrink-0">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Nilai Transaksi</p>
            <h4 className={cn(
              "text-3xl font-black tracking-tighter tabular-nums",
              eggModalType === 'terima' ? "text-orange-500" : "text-orange-600"
            )}>
              Rp {eggCartTotal.toLocaleString('id-ID')}
            </h4>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              onClick={() => step === 2 ? setStep(1) : setEggModalType(null)} 
              className="flex-1 sm:flex-none h-14 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-white transition-all"
            >
              {step === 2 ? 'Kembali' : 'Batal'}
            </Button>
            <Button 
              onClick={() => {
                if (step === 1) {
                  if (!mitraName || eggCart.some(i => !i.qty || !i.price)) {
                    showAlert('Data Tidak Lengkap', 'Mohon lengkapi data mitra, jumlah, dan harga untuk setiap item telur sebelum menyimpan transaksi.');
                    return;
                  }
                  setStep(2);
                } else {
                  handleSubmitEgg();
                  setTimeout(() => setStep(1), 500); // reset after submit
                }
              }}
              disabled={isSubmittingEggs}
              className={cn(
                "flex-1 sm:flex-none h-14 px-10 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all relative overflow-hidden group",
                isSubmittingEggs ? "bg-slate-100 text-slate-400 cursor-not-allowed" :
                eggModalType === 'terima' 
                  ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20" 
                  : "bg-orange-600 text-white hover:bg-orange-700 shadow-orange-500/20"
              )}
            >
              {isSubmittingEggs ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : step === 1 ? (
                'Lanjut ke Konfirmasi'
              ) : (
                'Simpan Transaksi'
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
