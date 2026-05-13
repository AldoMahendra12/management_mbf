
import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error("Mohon pilih file gambar (JPG/PNG)");
      }

      const result = await extractDataFromReceipt(file, type);
      if (result) {
        onSuccess(result);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
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
            {isScanning ? 'Mohon tunggu sebentar...' : 
             status === 'success' ? 'Data berhasil diisi otomatis.' :
             status === 'error' ? error :
             'Klik untuk ambil foto nota'}
          </p>
        </div>

        <Button 
          variant="outline" 
          size="sm"
          disabled={isScanning}
          onClick={() => fileInputRef.current?.click()}
          className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest border-slate-200 hover:bg-white shadow-sm"
        >
          {isScanning ? 'Wait' : 'Pilih File'}
        </Button>
      </div>

      {isScanning && (
        <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px] rounded-xl z-10 pointer-events-none" />
      )}
    </div>
  );
};
