import React from 'react';
import { motion } from 'motion/react';
import { Inbox, ShoppingCart, X, Calendar, Weight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDashboard } from '@/contexts/DashboardContext';
import { OCRUpload } from '@/components/ui/OCRUpload';
import { OCRResult } from '@/lib/gemini';

export const EggTransactionModal: React.FC = () => {
  const {
    eggModalType,
    setEggModalType,
    eggDate,
    setEggDate,
    mitraName,
    setMitraName,
    eggIkat,
    setEggIkat,
    eggQty,
    eggPrice,
    setEggPrice,
    eggNotes,
    setEggNotes,
    eggType,
    setEggType,
    isSubmittingEggs,
    handleSubmitEgg,
    eggStock,
    showToast,
    showAlert
  } = useDashboard();

  const [showConfirm, setShowConfirm] = React.useState(false);

  if (!eggModalType) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={() => {
          setEggModalType(null);
          setShowConfirm(false);
        }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-slate-100 max-h-[90vh] rounded-xl flex flex-col overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
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
                {showConfirm ? 'Konfirmasi Data' : 'Transaksi Telur'}
              </p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">
                {showConfirm ? 'Detail Pesanan' : (eggModalType === 'terima' ? 'Beli / Setoran Telur' : 'Jual Telur ke Mitra')}
              </h3>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setEggModalType(null);
              setShowConfirm(false);
            }} 
            className="rounded-xl text-slate-400 hover:text-slate-900 hover:bg-white/50 transition-all w-10 h-10 border border-transparent hover:border-slate-100"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
          {showConfirm ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-xl p-6 border border-slate-100 space-y-4 shadow-sm">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                    <p className="text-sm font-black text-slate-900">{new Date(eggDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{eggModalType === 'terima' ? 'Pengirim' : 'Pembeli'}</p>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{mitraName || '-'}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-200/60">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Item Deskripsi</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subtotal</p>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{eggType}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-0.5">{eggIkat} Ikat • {eggQty} Kg @ Rp {eggPrice.toLocaleString('id-ID')}/Kg</p>
                    </div>
                    <p className="text-sm font-black text-slate-900">Rp {((eggQty || 0) * (eggPrice || 0)).toLocaleString('id-ID')}</p>
                  </div>
                </div>

                {eggNotes && (
                  <div className="pt-4 border-t border-slate-200/60">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Catatan</p>
                    <p className="text-[10px] font-bold text-slate-600 italic">"{eggNotes}"</p>
                  </div>
                )}
              </div>
              
              <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0 text-orange-600">
                  <Calendar size={14} />
                </div>
                <p className="text-[10px] font-bold text-orange-800 leading-relaxed">
                  Mohon periksa kembali data di atas. Klik <b>Konfirmasi & Simpan</b> jika data sudah benar. Data yang sudah disimpan akan masuk ke laporan keuangan dan stok gudang secara otomatis.
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {/* AI OCR Section */}
              <OCRUpload 
                type="egg" 
                onSuccess={(data: OCRResult) => {
                  if (data.tanggal) setEggDate(data.tanggal);
                  if (data.nama_mitra) setMitraName(data.nama_mitra);
                  if (data.harga_per_kg) setEggPrice(data.harga_per_kg);
                  // Optionally handle jumlah_kg if needed, though usually eggQty is calculated from eggIkat
                }}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Date Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Calendar size={12} className="text-slate-300" />
                  Tanggal Transaksi
                </label>
                <input 
                  type="date" 
                  value={eggDate}
                  onChange={(e) => setEggDate(e.target.value)}
                  className="w-full h-14 bg-white border border-slate-100 rounded-xl px-4 text-sm font-black text-slate-900 outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm" 
                />
              </div>

              {/* Mitra Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  {eggModalType === 'terima' ? 'Peternak / Pengirim' : 'Customer / Pembeli'}
                </label>
                <input 
                  type="text" 
                  value={mitraName}
                  onChange={(e) => setMitraName(e.target.value)}
                  placeholder={eggModalType === 'terima' ? 'Nama peternak...' : 'Nama pembeli...'}
                  className="w-full h-14 bg-white border border-slate-100 rounded-xl px-4 text-sm font-black text-slate-900 outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 transition-all placeholder:text-slate-300 shadow-sm" 
                />
              </div>

              {/* Egg Type Chips */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jenis Telur Ayam</label>
                <div className="flex gap-3">
                  {['Telur Ayam Horn', 'Telur Ayam Arab'].map((type) => {
                    const stockVal = type === 'Telur Ayam Horn' ? eggStock?.horn : eggStock?.arab;
                    return (
                      <div key={type} className="flex-1 relative group">
                        <button
                          type="button"
                          onClick={() => setEggType(type)}
                          className={cn(
                            "w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                            eggType === type 
                              ? (eggModalType === 'terima' ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-500/20")
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 shadow-sm"
                          )}
                        >
                          {type}
                        </button>
                        {/* Hover Dialog Detail Stok */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
                          <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg shadow-2xl flex items-center gap-2 border border-slate-700">
                            <Weight size={12} className="text-orange-400" />
                            Sisa Stok: {stockVal || 0} Kg
                          </div>
                          <div className="w-2 h-2 bg-slate-900 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-slate-700" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Qty Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jumlah Produksi (Ikat)</label>
                <div className="relative group">
                    <input 
                      type="number" 
                      value={eggIkat || ''}
                      onChange={(e) => setEggIkat(Number(e.target.value))}
                      placeholder="0"
                      className="w-full h-14 bg-white border border-slate-100 rounded-xl px-4 pr-16 text-sm font-black text-slate-900 outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm" 
                    />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ikat</span>
                </div>
              </div>

              {/* Weight Auto Section */}
              <div className="space-y-2 opacity-80">
                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1 italic">Total Berat (Kg) — Auto</label>
                <div className="relative">
                    <input 
                      type="number" 
                      value={eggQty || ''}
                      readOnly
                      className="w-full h-14 bg-slate-100/50 border border-slate-100/50 rounded-xl px-4 pr-12 text-sm font-black text-slate-400 cursor-not-allowed" 
                    />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">Kg</span>
                </div>
              </div>

              {/* Price Section */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Harga Satuan per Kg</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-900">Rp</span>
                  <input 
                    type="text" 
                    value={eggPrice ? eggPrice.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setEggPrice(val ? parseInt(val) : 0);
                    }}
                    placeholder="0"
                    className="w-full h-14 bg-white border border-slate-100 rounded-xl pl-12 pr-12 text-sm font-black text-slate-900 outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 transition-all shadow-sm" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">/ Kg</span>
                </div>
              </div>

              {/* Notes Section */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Catatan Tambahan (Opsional)</label>
                <textarea 
                  rows={2}
                  value={eggNotes}
                  onChange={(e) => setEggNotes(e.target.value)}
                  placeholder="Contoh: Titipan mitra, telur pecah, dll..."
                  className="w-full bg-white border border-slate-100 rounded-xl p-4 text-sm font-black text-slate-900 outline-none focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 transition-all placeholder:text-slate-300 resize-none shadow-sm" 
                />
              </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Section */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-col">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Nilai Transaksi</p>
            <h4 className={cn(
              "text-3xl font-black tracking-tighter tabular-nums",
              eggModalType === 'terima' ? "text-orange-500" : "text-orange-600"
            )}>
              Rp {((eggQty || 0) * (eggPrice || 0)).toLocaleString('id-ID')}
            </h4>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              onClick={() => {
                if (showConfirm) {
                  setShowConfirm(false);
                } else {
                  setEggModalType(null);
                }
              }} 
              className="flex-1 sm:flex-none h-14 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-white transition-all"
            >
              {showConfirm ? 'Kembali Edit' : 'Batal'}
            </Button>
            <Button 
              onClick={() => {
                if (showConfirm) {
                  handleSubmitEgg();
                } else {
                  // Basic validation
                  if (!mitraName || !eggQty || !eggPrice) {
                    showAlert('Data Tidak Lengkap', 'Mohon lengkapi data mitra, jumlah, dan harga telur sebelum menyimpan transaksi.');
                    return;
                  }
                  setShowConfirm(true);
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
              ) : (
                showConfirm ? 'Konfirmasi & Simpan' : 'Simpan Transaksi'
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
