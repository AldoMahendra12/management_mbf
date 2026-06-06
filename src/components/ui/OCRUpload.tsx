
import React, { useState, useRef } from 'react';
import { Camera, Loader2, CheckCircle2, AlertCircle, X, ZoomIn } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { extractDataFromReceipt, OCRResult } from '@/lib/gemini';

interface OCRUploadProps {
  onSuccess: (data: OCRResult) => void;
  type: 'egg' | 'feed';
  className?: string;
}

export const OCRUpload: React.FC<OCRUploadProps> = ({ onSuccess, type, className }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setIsScanning(true);
    setError(null);
    setStatus('idle');

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error("Mohon pilih file gambar (JPG/PNG)");
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      const result = await extractDataFromReceipt(file, type);
      if (result) {
        onSuccess(result);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 4000);
      } else {
        throw new Error("Gagal mengekstrak data dari gambar");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat memindai nota");
      setStatus('error');
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setStatus('idle');
    setError(null);
  };

  return (
    <div className={cn("relative", className)}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
      />

      {/* Main Scan Bar */}
      <div className={cn(
        "flex items-center gap-3 p-3 rounded-xl border-2 border-dashed transition-all",
        isScanning ? "border-orange-500 bg-orange-50/50" :
        status === 'success' ? "border-emerald-500 bg-emerald-50/50" :
        status === 'error' ? "border-rose-500 bg-rose-50/50" :
        "border-slate-200 bg-white hover:border-orange-300 hover:bg-slate-50"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
          isScanning ? "bg-orange-500 text-white" :
          status === 'success' ? "bg-emerald-500 text-white" :
          status === 'error' ? "bg-rose-500 text-white" :
          "bg-slate-100 text-slate-500"
        )}>
          {isScanning ? <Loader2 size={20} className="animate-spin" /> :
           status === 'success' ? <CheckCircle2 size={20} /> :
           status === 'error' ? <AlertCircle size={20} /> :
           <Camera size={20} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-[10px] font-black uppercase tracking-widest",
            isScanning ? "text-orange-600" :
            status === 'success' ? "text-emerald-600" :
            status === 'error' ? "text-rose-600" :
            "text-slate-400"
          )}>
            {isScanning ? 'Memindai Nota...' :
             status === 'success' ? 'Berhasil Dipindai!' :
             status === 'error' ? 'Gagal Memindai' :
             'AI Scan Nota'}
          </p>
          <p className="text-[10px] font-bold text-slate-500 truncate">
            {isScanning ? 'AI sedang membaca gambar...' :
             status === 'success' ? 'Data berhasil diisi otomatis. Cek hasil di bawah.' :
             status === 'error' ? error :
             'Foto nota → AI isi form otomatis'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Preview thumbnail */}
          {previewUrl && !isScanning && (
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-orange-400 transition-all group"
              title="Lihat gambar nota"
            >
              <img src={previewUrl} alt="Nota" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <ZoomIn size={14} className="text-white opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            </button>
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={isScanning}
            onClick={() => fileInputRef.current?.click()}
            className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-slate-200 hover:bg-white shadow-sm"
          >
            {isScanning ? 'Wait' : previewUrl ? 'Scan Ulang' : 'Pilih File'}
          </Button>

          {previewUrl && !isScanning && (
            <button
              type="button"
              onClick={clearPreview}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {isScanning && (
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] rounded-xl z-10 pointer-events-none" />
      )}

      {/* Full Preview Modal */}
      {isPreviewOpen && previewUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-2xl max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={previewUrl} alt="Preview Nota" className="w-full h-full object-contain" />
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-3 right-3 w-9 h-9 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-all"
            >
              <X size={18} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="text-white text-xs font-bold">Gambar Nota Yang Dipindai</p>
              <p className="text-white/70 text-[10px]">Klik di luar untuk menutup</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
