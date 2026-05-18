import React from 'react';
import { motion } from 'motion/react';
import { Package, X, Calendar, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/contexts/DashboardContext';
import { OCRUpload } from '@/components/ui/OCRUpload';

export const FeedTransactionModal: React.FC = () => {
  const {
    feedModalType,
    setFeedModalType,
    mitraName,
    setMitraName,
    feedCart,
    feedItems,
    isLoading,
    handleBahanChange,
    removeFeedCartRow,
    updateFeedCartRow,
    addFeedCartRow,
    feedCartTotal,
    feedNotes,
    setFeedNotes,
    handleSubmitFeed,
    isSubmittingFeed,
    feedDate,
    setFeedDate,
    showToast,
    showAlert,
    handleOCRFeedResult
  } = useDashboard();

  const [step, setStep] = React.useState<1 | 2>(1);

  if (!feedModalType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={() => {
          setFeedModalType(null);
        }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-3xl bg-slate-100 max-h-[90vh] rounded-xl flex flex-col overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-200"
      >
        {/* Decorative Background */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-48 bg-gradient-to-b opacity-5 pointer-events-none",
          feedModalType === 'beli' ? "from-orange-500 to-transparent" : "from-orange-600 to-transparent"
        )} />

        {/* Header */}
        <div className={cn(
          "relative z-10 px-8 py-8 flex items-center justify-between overflow-hidden shrink-0 border-b border-slate-100",
          "bg-gradient-to-br from-orange-200 to-orange-300/60"
        )}>
          <div className="flex items-center gap-5">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 transition-transform hover:rotate-0",
              feedModalType === 'beli' ? "bg-orange-500 shadow-orange-500/20 text-white" : "bg-orange-600 shadow-orange-500/20 text-white"
            )}>
              <Package size={28} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-1">
                Logistik Pakan
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                {feedModalType === 'beli' ? 'Beli Stok Pakan' : 'Jual Pakan ke Customer'}
              </h3>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setFeedModalType(null);
            }} 
            className="rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white/50 transition-all w-10 h-10 border border-transparent hover:border-slate-100"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar space-y-8">
          {step === 1 ? (
            <>
              {/* AI OCR Section */}
              <OCRUpload 
                type="feed" 
                onSuccess={handleOCRFeedResult}
              />

              {/* Top Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Calendar size={12} className="text-slate-300" />
                    Tanggal Transaksi
                  </label>
                  <input 
                    type="date" 
                    value={feedDate}
                    onChange={(e) => setFeedDate(e.target.value)}
                    className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 text-sm font-black text-slate-900 outline-none focus:border-orange-200 transition-all shadow-sm" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {feedModalType === 'beli' ? 'Supplier / Pabrik' : 'Customer / Pembeli'}
                  </label>
                  <input 
                    type="text" 
                    value={mitraName}
                    onChange={(e) => setMitraName(e.target.value)}
                    placeholder={feedModalType === 'beli' ? 'Nama supplier...' : 'Nama pembeli...'}
                    className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 text-sm font-black text-slate-900 outline-none focus:border-orange-200 transition-all placeholder:text-slate-300 shadow-sm" 
                  />
                </div>
              </div>

              {/* Cart Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Bahan Pakan</label>
                  <Button 
                    variant="ghost" 
                    onClick={addFeedCartRow}
                    className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-orange-600 hover:bg-orange-50 gap-1.5"
                  >
                    <Plus size={14} />
                    Tambah Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {feedCart.map((item, index) => (
                    <div key={index} className="p-4 bg-white border border-slate-100 rounded-xl space-y-4 relative group hover:border-orange-100 transition-all shadow-sm">
                      <button 
                        onClick={() => removeFeedCartRow(index)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="space-y-2 pr-8">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Produk</label>
                        <div className="flex flex-wrap gap-2">
                          {isLoading ? (
                            <div className="h-10 w-full bg-slate-100 animate-pulse rounded-xl" />
                          ) : (
                            feedItems.map((feed) => (
                              <button
                                key={feed.id}
                                type="button"
                                onClick={() => handleBahanChange(index, feed.id)}
                                className={cn(
                                  "px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all duration-300",
                                  String(item.id_bahan) === String(feed.id)
                                    ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                                    : "bg-white text-slate-400 border-slate-100 hover:border-orange-200 hover:text-slate-900 shadow-sm"
                                )}
                              >
                                {feed.nama_bahan}
                              </button>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={item.qty || ''}
                              onChange={(e) => updateFeedCartRow(index, 'qty', Number(e.target.value))}
                              placeholder="0"
                              className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-xs font-black text-slate-900 outline-none focus:border-orange-200 transition-all" 
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 uppercase">
                              {feedItems.find(f => String(f.id) === String(item.id_bahan))?.satuan || 'Unit'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                            Harga / {feedItems.find(f => String(f.id) === String(item.id_bahan))?.satuan || 'Satuan'}
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-900">Rp</span>
                            <input 
                              type="text" 
                              value={item.harga_per_satuan ? item.harga_per_satuan.toLocaleString('id-ID') : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                updateFeedCartRow(index, 'harga_per_satuan', val ? parseInt(val) : 0);
                              }}
                              className="w-full h-11 bg-white border border-slate-200 rounded-xl pl-10 pr-4 text-xs font-black text-slate-900 outline-none focus:border-orange-200 transition-all" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan (Opsional)</label>
                  <input 
                  type="text" 
                  value={feedNotes}
                  onChange={(e) => setFeedNotes(e.target.value)}
                  placeholder="Contoh: Pembayaran tempo 1 minggu, atau nomor plat mobil..."
                  className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 text-xs font-bold text-slate-900 outline-none focus:border-orange-200 transition-all placeholder:text-slate-300 shadow-sm" 
                />
              </div>
            </>
          ) : (
            <div className="space-y-6">
              <div className="p-8 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-6">
                <div className="text-center pb-6 border-b border-orange-200/50">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Konfirmasi Transaksi Pakan</h4>
                  <p className="text-xs font-bold text-slate-500 mt-1">Pastikan data transaksi pakan sudah benar.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mitra / Customer</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{mitraName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                    <p className="text-sm font-black text-slate-900 uppercase">
                      {new Date(feedDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Item</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {feedCart.map((item, idx) => {
                      const feedDef = feedItems.find(f => String(f.id) === String(item.id_bahan));
                      const feedName = feedDef?.nama_bahan || 'Pakan';
                      const satuan = feedDef?.satuan || 'Unit';
                      return (
                        <div key={idx} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div className="space-y-1">
                            <span className="text-sm font-black text-slate-900 uppercase block">{feedName}</span>
                            <span className="text-xs font-bold text-slate-500 block">
                              {item.qty} {satuan} × Rp {(item.harga_per_satuan || 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <span className="text-sm font-black text-slate-900 tabular-nums">Rp {((item.qty || 0) * (item.harga_per_satuan || 0)).toLocaleString('id-ID')}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {feedNotes && (
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Catatan</p>
                    <p className="text-sm font-bold text-slate-700 italic">"{feedNotes}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Pembayaran</p>
            <h4 className={cn(
              "text-3xl font-black tracking-tighter tabular-nums",
              feedModalType === 'beli' ? "text-orange-500" : "text-orange-600"
            )}>
              Rp {(feedCartTotal || 0).toLocaleString('id-ID')}
            </h4>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              onClick={() => step === 2 ? setStep(1) : setFeedModalType(null)} 
              className="flex-1 sm:flex-none h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-white transition-all"
            >
              {step === 2 ? 'Kembali' : 'Batal'}
            </Button>
            <Button 
              onClick={() => {
                if (step === 1) {
                  if (!mitraName || feedCart.length === 0 || feedCartTotal === 0) {
                    showAlert('Data Tidak Lengkap', 'Mohon lengkapi data mitra dan item pakan sebelum menyimpan transaksi.');
                    return;
                  }
                  setStep(2);
                } else {
                  handleSubmitFeed();
                  setTimeout(() => setStep(1), 500); // reset step
                }
              }}
              disabled={isSubmittingFeed}
              className={cn(
                "flex-1 sm:flex-none h-12 px-10 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all relative overflow-hidden group",
                isSubmittingFeed ? "bg-slate-100 text-slate-400 cursor-not-allowed" : 
                feedModalType === 'beli' ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20" : 
                "bg-orange-600 text-white hover:bg-orange-700 shadow-orange-500/20"
              )}
            >
              {isSubmittingFeed ? (
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
