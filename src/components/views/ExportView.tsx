import React, { useState, useRef, useMemo } from 'react';
import { 
  TrendingUp, 
  FileText, 
  Calendar, 
  Printer, 
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionContainer } from '../layout/SectionContainer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { generateInvoiceCode } from '@/lib/invoice-utils';
import logoMBF from '../../assets/logo_MBF.png';
import logoBEF from '../../assets/logo_BEF.png';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useDashboard } from '../../contexts/DashboardContext';

// --- Helper: parse egg items from keterangan JSON ---
function parseEggItems(keterangan: string): { type: string; grade: string; qty: number; price: number; ikat: number; notes: string }[] {
  if (!keterangan || !keterangan.includes('| JSON:')) return [];
  try {
    const jsonPart = keterangan.split('| JSON:')[1];
    return JSON.parse(jsonPart);
  } catch { return []; }
}

// --- Helper: get mitra name from egg transaction ---
function getEggMitra(t: any): string {
  return (t.nama_mitra || t.keterangan?.replace('Mitra: ', '')?.split('|')[0]?.trim() || 'Umum').trim();
}

// --- Helper: get mitra name from feed transaction ---
function getFeedMitra(t: any): string {
  return (t.nama_mitra || t.keterangan?.replace('Mitra: ', '')?.split('|')[0]?.trim() || 'Umum').trim();
}


// Helper: pagination nav component
const PrevNextNav = ({ page, totalPages, onPrev, onNext }: { page: number; totalPages: number; onPrev: () => void; onNext: () => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-3 mt-3 print:hidden">
      <Button variant="outline" size="sm" onClick={onPrev} disabled={page === 1} className="px-3 h-7 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">◀ Prev</Button>
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hal {page} / {totalPages}</span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={page === totalPages} className="px-3 h-7 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">Next ▶</Button>
    </div>
  );
};

export function ExportView() {
  const { eggTransactions, feedTransactions, afkirTransactions, feedItems, formatMoney, showToast } = useDashboard();
  
  const [selectedEntity, setSelectedEntity] = useState<'MBF' | 'BEF'>('MBF');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const getMonthStr = (dateStr: string) => dateStr ? new Date(dateStr).toISOString().substring(0, 7) : '';
  
  // --- FILTERED DATA ---
  const filteredFeed = useMemo(() => feedTransactions.filter(t => getMonthStr(t.tanggal) === selectedMonth), [feedTransactions, selectedMonth]);
  const filteredEgg = useMemo(() => eggTransactions.filter(t => getMonthStr(t.tanggal) === selectedMonth && t.jenis_transaksi !== 'Stok Awal'), [eggTransactions, selectedMonth]);
  const filteredAfkir = useMemo(() => afkirTransactions.filter(t => getMonthStr(t.tanggal) === selectedMonth), [afkirTransactions, selectedMonth]);

  const printFeed = selectedEntity === 'MBF' ? filteredFeed : [];
  const printEgg = selectedEntity === 'BEF' ? filteredEgg : [];
  const printAfkir = selectedEntity === 'BEF' ? filteredAfkir : [];

  // --- FEED (MBF) CALCULATIONS ---
  const feedSales = useMemo(() => printFeed.filter(t => {
    const j = (t.jenis_transaksi || '').toLowerCase();
    return j.includes('jual') || j.includes('keluar');
  }), [printFeed]);

  const feedPurchases = useMemo(() => printFeed.filter(t => {
    const j = (t.jenis_transaksi || '').toLowerCase();
    return j.includes('beli') || j.includes('masuk');
  }), [printFeed]);

  const feedSalesTotal = useMemo(() => feedSales.reduce((s, t) => s + (t.total_tagihan || 0), 0), [feedSales]);
  const feedPurchasesTotal = useMemo(() => feedPurchases.reduce((s, t) => s + (t.total_tagihan || 0), 0), [feedPurchases]);
  const feedSalesPaid = useMemo(() => feedSales.reduce((s, t) => s + (t.dibayar_hari_ini || 0), 0), [feedSales]);
  const feedPurchasesPaid = useMemo(() => feedPurchases.reduce((s, t) => s + (t.dibayar_hari_ini || 0), 0), [feedPurchases]);

  // Customer summary for MBF
  const feedCustomerSummary = useMemo(() => {
    const map: Record<string, { total: number; paid: number; count: number }> = {};
    feedSales.forEach(t => {
      const name = getFeedMitra(t);
      if (!map[name]) map[name] = { total: 0, paid: 0, count: 0 };
      map[name].total += (t.total_tagihan || 0);
      map[name].paid += (t.dibayar_hari_ini || 0);
      map[name].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [feedSales]);

  // --- EGG (BEF) CALCULATIONS ---
  const eggSales = useMemo(() => printEgg.filter(t => {
    const j = (t.jenis_transaksi || '').toLowerCase();
    return j.includes('jual') || j.includes('keluar');
  }), [printEgg]);

  const eggPurchases = useMemo(() => printEgg.filter(t => {
    const j = (t.jenis_transaksi || '').toLowerCase();
    return j.includes('beli') || j.includes('terima') || j.includes('setoran');
  }), [printEgg]);

  const eggSalesTotal = useMemo(() => eggSales.reduce((s, t) => s + (t.total_harga || 0), 0), [eggSales]);
  const eggPurchasesTotal = useMemo(() => eggPurchases.reduce((s, t) => s + (t.total_harga || 0), 0), [eggPurchases]);
  const eggSalesPaid = useMemo(() => eggSales.reduce((s, t) => s + (t.jumlah_dibayar || 0), 0), [eggSales]);
  const eggPurchasesPaid = useMemo(() => eggPurchases.reduce((s, t) => s + (t.jumlah_dibayar || 0), 0), [eggPurchases]);
  const afkirTotal = useMemo(() => printAfkir.reduce((s, t) => s + (t.total_harga || 0), 0), [printAfkir]);

  // Customer summary for BEF
  const eggCustomerSummary = useMemo(() => {
    const map: Record<string, { total: number; paid: number; count: number }> = {};
    eggSales.forEach(t => {
      const name = getEggMitra(t);
      if (!map[name]) map[name] = { total: 0, paid: 0, count: 0 };
      map[name].total += (t.total_harga || 0);
      map[name].paid += (t.jumlah_dibayar || 0);
      map[name].count += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [eggSales]);

  // --- PREVIEW PAGINATION STATE ---
  const PAGE_SIZE = 15;
  const [feedSalesPage, setFeedSalesPage] = useState(1);
  const [feedPurchasesPage, setFeedPurchasesPage] = useState(1);
  const [eggSalesPage, setEggSalesPage] = useState(1);
  const [eggPurchasesPage, setEggPurchasesPage] = useState(1);

  // Reset all pages when entity or month changes
  React.useEffect(() => {
    setFeedSalesPage(1);
    setFeedPurchasesPage(1);
    setEggSalesPage(1);
    setEggPurchasesPage(1);
  }, [selectedEntity, selectedMonth]);

  const feedSalesTotalPages = Math.max(1, Math.ceil(feedSales.length / PAGE_SIZE));
  const feedPurchasesTotalPages = Math.max(1, Math.ceil(feedPurchases.length / PAGE_SIZE));
  const eggSalesTotalPages = Math.max(1, Math.ceil(eggSales.length / PAGE_SIZE));
  const eggPurchasesTotalPages = Math.max(1, Math.ceil(eggPurchases.length / PAGE_SIZE));

  // --- PRINT ---
  const printRefLaporan = useRef<HTMLDivElement>(null);
  const handlePrintLaporan = useReactToPrint({ contentRef: printRefLaporan });

  // --- PDF EXPORT ---
  const handleExportPDF = () => {
    const periodLabel = new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    if (selectedEntity === 'MBF') {
      // Flatten feed transactions with item details
      const rows: string[][] = [];
      rows.push(['No', 'No. Invoice', 'Tanggal', 'Jenis', 'Pelanggan/Mitra', 'Nama Bahan', 'Qty', 'Satuan', 'Harga Satuan', 'Subtotal', 'Total Tagihan', 'Sudah Dibayar', 'Sisa', 'Status']);
      
      let no = 0;
      const sorted = [...filteredFeed].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
      sorted.forEach(t => {
        no++;
        const inv = generateInvoiceCode(t.id, t.tanggal, 'MBF');
        const tgl = new Date(t.tanggal).toLocaleDateString('id-ID');
        const mitra = getFeedMitra(t);
        const jenis = t.jenis_transaksi || '';
        const totalTagihan = t.total_tagihan || 0;
        const paid = t.dibayar_hari_ini || 0;
        const sisa = totalTagihan - paid;
        const status = sisa <= 0 ? 'LUNAS' : paid > 0 ? 'SEBAGIAN' : 'BELUM BAYAR';

        if (t.details && t.details.length > 0) {
          t.details.forEach((d: any, idx: number) => {
            const bahan = feedItems?.find((f: any) => String(f.id) === String(d.bahan_id));
            const namaBahan = bahan?.nama_bahan || `ID:${d.bahan_id}`;
            const satuan = bahan?.satuan || 'sak';
            rows.push([
              idx === 0 ? String(no) : '',
              idx === 0 ? inv : '',
              idx === 0 ? tgl : '',
              idx === 0 ? jenis : '',
              idx === 0 ? mitra : '',
              namaBahan,
              String(d.qty || 0),
              satuan,
              String(d.harga_satuan || 0),
              String(d.subtotal || (d.qty * d.harga_satuan) || 0),
              idx === 0 ? String(totalTagihan) : '',
              idx === 0 ? String(paid) : '',
              idx === 0 ? String(sisa) : '',
              idx === 0 ? status : ''
            ]);
          });
        } else {
          rows.push([String(no), inv, tgl, jenis, mitra, '-', '-', '-', '-', '-', String(totalTagihan), String(paid), String(sisa), status]);
        }
      });

      downloadPDF(rows, `Laporan_PT_MBF_${selectedMonth}.pdf`, 'MBF');
    } else {
      // Flatten egg transactions with item details from JSON
      const rows: string[][] = [];
      rows.push(['No', 'No. Invoice', 'Tanggal', 'Jenis', 'Pelanggan/Mitra', 'Jenis Telur', 'Grade', 'Qty (Kg/Btr)', 'Ikat', 'Harga Satuan', 'Subtotal', 'Total Harga', 'Sudah Dibayar', 'Sisa', 'Status']);

      let no = 0;
      const sorted = [...filteredEgg].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
      sorted.forEach(t => {
        no++;
        const inv = generateInvoiceCode(t.id, t.tanggal, 'BEF');
        const tgl = new Date(t.tanggal).toLocaleDateString('id-ID');
        const mitra = getEggMitra(t);
        const jenis = t.jenis_transaksi || '';
        const totalHarga = t.total_harga || 0;
        const paid = t.jumlah_dibayar || 0;
        const sisa = totalHarga - paid;
        const status = sisa <= 0 ? 'LUNAS' : paid > 0 ? 'SEBAGIAN' : 'BELUM BAYAR';
        const items = parseEggItems(t.keterangan || '');

        if (items.length > 0) {
          items.forEach((item, idx) => {
            const qty = item.qty || 0;
            const isArab = item.type === 'Telur Ayam Arab';
            const divisor = isArab ? 300 : 15;
            const ikatVal = qty > 0 && qty % divisor === 0 ? String(qty / divisor) : '-';
            rows.push([
              idx === 0 ? String(no) : '',
              idx === 0 ? inv : '',
              idx === 0 ? tgl : '',
              idx === 0 ? jenis : '',
              idx === 0 ? mitra : '',
              item.type || '',
              item.grade || '-',
              String(qty),
              ikatVal,
              String(item.price || 0),
              String(qty * (item.price || 0)),
              idx === 0 ? String(totalHarga) : '',
              idx === 0 ? String(paid) : '',
              idx === 0 ? String(sisa) : '',
              idx === 0 ? status : ''
            ]);
          });
        } else {
          rows.push([String(no), inv, tgl, jenis, mitra, '-', '-', String(t.jumlah_kg || 0), '-', String(t.harga_per_kg || 0), '-', String(totalHarga), String(paid), String(sisa), status]);
        }
      });

      // Afkir section
      if (filteredAfkir.length > 0) {
        rows.push([]);
        rows.push(['--- PENJUALAN AYAM AFKIR ---']);
        rows.push(['No', 'Tanggal', 'Mitra', 'Qty (Ekor)', 'Harga/Ekor', 'Total Harga', 'Sudah Dibayar', 'Sisa']);
        filteredAfkir.forEach((t, i) => {
          const paid = t.jumlah_dibayar || 0;
          rows.push([
            String(i + 1),
            new Date(t.tanggal).toLocaleDateString('id-ID'),
            t.mitra_name || '-',
            String(t.qty_ekor || 0),
            String(t.harga_per_satuan || 0),
            String(t.total_harga || 0),
            String(paid),
            String((t.total_harga || 0) - paid)
          ]);
        });
      }

      downloadPDF(rows, `Laporan_CV_BEF_${selectedMonth}.pdf`, 'BEF');
    }
    showToast(`Berhasil mengunduh laporan PDF`);
  };

  function downloadPDF(rows: string[][], filename: string, entity: 'MBF' | 'BEF') {
    const doc = new jsPDF('landscape');
    const title = entity === 'MBF' ? 'Laporan Keuangan PT MBF' : 'Laporan Keuangan CV BEF';
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Periode: ${periodLabel}`, 14, 22);

    const head = rows[0];
    const body = rows.slice(1).filter(r => r.length > 0).map(r => {
      const padded = [...r];
      while (padded.length < head.length) padded.push('');
      return padded;
    });

    autoTable(doc, {
      startY: 25,
      head: [head],
      body: body,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1 },
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(filename);
  }

  // --- PERIOD LABEL ---
  const periodLabel = new Date(selectedMonth + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  // --- Lookup feed item name ---
  const getBahanName = (bahanId: string) => {
    const item = feedItems?.find((f: any) => String(f.id) === String(bahanId));
    return item?.nama_bahan || `ID:${bahanId}`;
  };
  const getBahanSatuan = (bahanId: string) => {
    const item = feedItems?.find((f: any) => String(f.id) === String(bahanId));
    return item?.satuan || 'sak';
  };

  return (
    <SectionContainer className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Laporan Keuangan</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Laporan keuangan rinci untuk arsip dan akuntan</p>
        </div>
      </div>

      {/* Entity Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {([
          { 
            title: 'Laporan Keuangan PT MBF', 
            entity: 'MBF' as const,
            icon: TrendingUp, 
            desc: 'Rekapitulasi penjualan & pembelian pakan ternak lengkap dengan rincian item per transaksi.',
          },
          { 
            title: 'Laporan Keuangan CV BEF', 
            entity: 'BEF' as const,
            icon: FileText, 
            desc: 'Rekapitulasi penjualan & pembelian telur lengkap dengan rincian item dan konversi ikat.',
          },
        ]).map((card, i) => (
          <Card key={i} className={cn(
            "border-slate-200/60 shadow-sm group hover:border-orange-200/50 transition-all flex flex-col relative overflow-hidden",
            selectedEntity === card.entity && "ring-2 ring-orange-500/30 border-orange-200"
          )}>
              <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-[0.03] transition-transform group-hover:scale-150 bg-orange-600" />
              
              <CardHeader className="p-8 pb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all mb-6 shadow-sm",
                  selectedEntity === card.entity ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
                )}>
                    <card.icon size={24} />
                </div>
                <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">{card.title}</CardTitle>
                <p className="text-xs font-medium text-slate-400 mt-2 leading-relaxed">{card.desc}</p>
              </CardHeader>
              
              <CardContent className="p-8 pt-4 space-y-6 mt-auto">
                {/* Month Picker */}
                <div className="flex items-center gap-4">
                    <div 
                      className="flex-1 flex items-center gap-2 p-2.5 bg-slate-100 hover:bg-slate-200 transition-colors rounded-xl border border-slate-200 relative cursor-pointer group"
                      onClick={() => {
                        const input = document.getElementById(`month-picker-${i}`);
                        if (input && 'showPicker' in input) {
                          try { (input as any).showPicker(); } catch (e) {}
                        }
                      }}
                    >
                      <Calendar size={14} className="text-slate-500 group-hover:text-slate-700 transition-colors" />
                      <input 
                        id={`month-picker-${i}`}
                        type="month" 
                        value={selectedMonth}
                        onClick={(e) => {
                          e.stopPropagation();
                          if ('showPicker' in e.currentTarget) {
                            try { (e.currentTarget as any).showPicker(); } catch (e) {}
                          }
                        }}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-transparent border-none text-[11px] font-black text-slate-700 uppercase tracking-widest focus:ring-0 outline-none p-0 w-full cursor-pointer h-full"
                      />
                    </div>
                    <Badge className="text-[9px] font-black uppercase px-2 py-1 rounded-lg border-none shadow-none bg-orange-50 text-orange-600">
                      RINCI
                    </Badge>
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                    <Button 
                      onClick={() => {
                        setSelectedEntity(card.entity);
                        setTimeout(() => handlePrintLaporan(), 150);
                      }}
                      className="h-11 text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 bg-orange-600 text-white shadow-orange-600/10"
                    >
                      <Printer size={14} className="mr-1.5" />
                      CETAK PDF
                    </Button>
                    <Button 
                      onClick={() => {
                        setSelectedEntity(card.entity);
                        handleExportPDF();
                      }}
                      className="h-11 text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95 bg-emerald-600 text-white shadow-emerald-600/10"
                    >
                      <Download size={14} className="mr-1.5" />
                      DOWNLOAD PDF
                    </Button>
                    <Button 
                      onClick={() => {
                        setSelectedEntity(card.entity);
                        setTimeout(() => document.getElementById('print-preview')?.scrollIntoView({ behavior: 'smooth' }), 100);
                      }}
                      variant="outline"
                      className="h-11 text-[9px] font-black uppercase tracking-widest rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <FileText size={14} className="mr-1.5" />
                      PREVIEW
                    </Button>
                </div>
              </CardContent>
          </Card>
        ))}
      </div>

      {/* Print Preview Panel */}
      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-5 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-black text-slate-800 uppercase tracking-tight">Preview Laporan</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-black border-slate-200 text-slate-400 px-3 py-1">
              {selectedEntity === 'MBF' ? 'ENTITY: PT MBF' : 'ENTITY: CV BEF'}
            </Badge>
            <Badge variant="outline" className="text-[10px] font-black border-slate-200 text-slate-400 px-3 py-1">
              {periodLabel.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-12 bg-slate-100/50 flex flex-col items-center w-full">
            <div className="w-full flex justify-center overflow-hidden py-4 min-h-[300px] md:min-h-0">
              <div className="origin-top transition-transform duration-500 scale-[0.4] sm:scale-[0.6] md:scale-100 mb-[-650px] sm:mb-[-400px] md:mb-0" style={{ width: '800px' }}>
                <div id="print-preview" ref={printRefLaporan} className="bg-white w-[800px] h-auto min-h-[500px] shadow-2xl shadow-slate-200 p-12 flex flex-col gap-8 text-slate-800 ring-1 ring-slate-200 relative print-content">
                  {/* Perforation Effect */}
                  <div className="absolute left-2 top-0 bottom-0 w-4 flex flex-col justify-around py-4 gap-4 opacity-10">
                    {[...Array(30)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-slate-900" />)}
                  </div>
                  <div className="absolute right-2 top-0 bottom-0 w-4 flex flex-col justify-around py-4 gap-4 opacity-10">
                    {[...Array(30)].map((_, i) => <div key={i} className="w-2 h-2 rounded-full bg-slate-900" />)}
                  </div>

                  {/* ===== LETTERHEAD ===== */}
                  <div className="flex items-center justify-between border-b-[3px] border-slate-900 pb-6">
                    <div className="flex gap-5 items-center">
                      <img 
                        src={selectedEntity === 'MBF' ? logoMBF : logoBEF} 
                        alt="Logo" 
                        className="w-16 h-16 object-contain" 
                      />
                      <div>
                        <h1 className="text-2xl font-black tracking-tighter text-slate-900 uppercase">
                          {selectedEntity === 'MBF' ? 'PT. MITRA BAROKAH FARM' : 'CV BERKAH EGG FARM'}
                        </h1>
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-tight mt-1">
                          {selectedEntity === 'MBF' 
                            ? 'Divisi Distribusi Pakan Ternak' 
                            : 'Pengepul & Supplier Telur Ayam'}
                          <br/>Tulungagung, Jawa Timur
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg mb-1.5 shadow-sm">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em]">Laporan Keuangan Rinci</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Periode</p>
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{periodLabel}</p>
                      </div>
                      <div className="flex flex-col items-end mt-0.5">
                        <p className="text-[7px] font-bold text-slate-300 uppercase tracking-[0.2em]">Dicetak</p>
                        <p className="text-[9px] font-bold text-slate-400 tabular-nums">
                          {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ===== EXECUTIVE SUMMARY ===== */}
                  {selectedEntity === 'MBF' ? (
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Penjualan Pakan', val: feedSalesTotal, color: 'text-emerald-700' },
                        { label: 'Pembelian Stok', val: feedPurchasesTotal, color: 'text-blue-700' },
                        { label: 'Piutang Penjualan', val: feedSalesTotal - feedSalesPaid, color: 'text-orange-600' },
                        { label: 'Laba Kotor', val: feedSalesTotal - feedPurchasesTotal, color: feedSalesTotal - feedPurchasesTotal >= 0 ? 'text-emerald-700' : 'text-rose-600' },
                      ].map((s, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-lg flex flex-col gap-1 border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                          <p className={cn("text-xs font-black tabular-nums", s.color)}>{formatMoney(s.val, false)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Penjualan Telur', val: eggSalesTotal + afkirTotal, color: 'text-emerald-700' },
                        { label: 'Pembelian Telur', val: eggPurchasesTotal, color: 'text-blue-700' },
                        { label: 'Piutang Penjualan', val: (eggSalesTotal - eggSalesPaid), color: 'text-orange-600' },
                        { label: 'Laba Kotor', val: (eggSalesTotal + afkirTotal) - eggPurchasesTotal, color: (eggSalesTotal + afkirTotal) - eggPurchasesTotal >= 0 ? 'text-emerald-700' : 'text-rose-600' },
                      ].map((s, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-lg flex flex-col gap-1 border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                          <p className={cn("text-xs font-black tabular-nums", s.color)}>{formatMoney(s.val, false)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ===== CUSTOMER SUMMARY ===== */}
                  {selectedEntity === 'MBF' && feedCustomerSummary.length > 0 && (
                    <div>
                      <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.15em] mb-3 border-b pb-1.5">Rekap Penjualan Per Pelanggan</h3>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 w-8">No</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Pelanggan</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-center">Trx</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Total Tagihan</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Sudah Bayar</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right pr-2">Sisa Piutang</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {feedCustomerSummary.map(([name, data], i) => (
                            <TableRow key={i} className="border-b border-slate-50 hover:bg-transparent">
                              <TableCell className="py-1.5 text-[9px] font-bold text-slate-400 p-0">{i + 1}</TableCell>
                              <TableCell className="py-1.5 text-[9px] font-black text-slate-900 uppercase p-0">{name}</TableCell>
                              <TableCell className="py-1.5 text-[9px] font-bold text-slate-500 text-center p-0">{data.count}x</TableCell>
                              <TableCell className="py-1.5 text-[9px] font-black text-slate-900 text-right tabular-nums p-0">{formatMoney(data.total, false)}</TableCell>
                              <TableCell className="py-1.5 text-[9px] font-bold text-emerald-600 text-right tabular-nums p-0">{formatMoney(data.paid, false)}</TableCell>
                              <TableCell className="py-1.5 text-[9px] font-black text-right tabular-nums p-0 pr-2">
                                <span className={data.total - data.paid > 0 ? 'text-orange-600' : 'text-emerald-600'}>
                                  {formatMoney(data.total - data.paid, false)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {selectedEntity === 'BEF' && eggCustomerSummary.length > 0 && (
                    <div>
                      <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.15em] mb-3 border-b pb-1.5">Rekap Penjualan Per Pelanggan</h3>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 w-8">No</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Pelanggan</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-center">Trx</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Total Tagihan</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Sudah Bayar</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right pr-2">Sisa Piutang</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {eggCustomerSummary.map(([name, data], i) => (
                            <TableRow key={i} className="border-b border-slate-50 hover:bg-transparent">
                              <TableCell className="py-1.5 text-[9px] font-bold text-slate-400 p-0">{i + 1}</TableCell>
                              <TableCell className="py-1.5 text-[9px] font-black text-slate-900 uppercase p-0">{name}</TableCell>
                              <TableCell className="py-1.5 text-[9px] font-bold text-slate-500 text-center p-0">{data.count}x</TableCell>
                              <TableCell className="py-1.5 text-[9px] font-black text-slate-900 text-right tabular-nums p-0">{formatMoney(data.total, false)}</TableCell>
                              <TableCell className="py-1.5 text-[9px] font-bold text-emerald-600 text-right tabular-nums p-0">{formatMoney(data.paid, false)}</TableCell>
                              <TableCell className="py-1.5 text-[9px] font-black text-right tabular-nums p-0 pr-2">
                                <span className={data.total - data.paid > 0 ? 'text-orange-600' : 'text-emerald-600'}>
                                  {formatMoney(data.total - data.paid, false)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* ===== DETAILED SALES TRANSACTIONS ===== */}
                  {selectedEntity === 'MBF' && (
                    <div>
                      <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.15em] mb-3 border-b pb-1.5">
                        Rincian Penjualan Pakan ({feedSales.length} Transaksi)
                      </h3>
                      {feedSales.length > 0 ? (
                        <>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 w-8">No</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Invoice</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Tgl</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Pelanggan</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Nama Bahan</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Qty</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Harga</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Subtotal</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right pr-2">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...feedSales].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map((t, tIdx) => {
                              const isVisible = tIdx >= (feedSalesPage - 1) * PAGE_SIZE && tIdx < feedSalesPage * PAGE_SIZE;
                              const rowVisibilityClass = !isVisible ? "hidden print:table-row" : "";
                              const details = t.details || [];
                              const sisa = (t.total_tagihan || 0) - (t.dibayar_hari_ini || 0);
                              const inv = generateInvoiceCode(t.id, t.tanggal, 'MBF');

                              if (details.length === 0) {
                                return (
                                  <TableRow key={tIdx} className={cn("border-b border-slate-100 hover:bg-transparent", rowVisibilityClass)}>
                                    <TableCell className="py-1.5 text-[8px] font-bold text-slate-400 p-0">{tIdx + 1}</TableCell>
                                    <TableCell className="py-1.5 text-[8px] font-black text-slate-700 p-0">{inv}</TableCell>
                                    <TableCell className="py-1.5 text-[8px] font-bold text-slate-500 p-0">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}</TableCell>
                                    <TableCell className="py-1.5 text-[8px] font-black text-slate-900 uppercase p-0">{getFeedMitra(t)}</TableCell>
                                    <TableCell className="py-1.5 text-[8px] text-slate-400 italic p-0">-</TableCell>
                                    <TableCell className="py-1.5 text-[8px] text-slate-400 text-right p-0">-</TableCell>
                                    <TableCell className="py-1.5 text-[8px] text-slate-400 text-right p-0">-</TableCell>
                                    <TableCell className="py-1.5 text-[8px] font-black text-slate-900 text-right tabular-nums p-0">{formatMoney(t.total_tagihan || 0, false)}</TableCell>
                                    <TableCell className="py-1.5 text-[8px] font-black text-right p-0 pr-2">
                                      <span className={sisa <= 0 ? 'text-emerald-600' : 'text-orange-600'}>{sisa <= 0 ? 'LUNAS' : 'BELUM'}</span>
                                    </TableCell>
                                  </TableRow>
                                );
                              }

                              return details.map((d: any, dIdx: number) => (
                                <TableRow key={`${tIdx}-${dIdx}`} className={cn(
                                  "hover:bg-transparent",
                                  dIdx === details.length - 1 ? "border-b border-slate-100" : "border-b border-slate-50/50",
                                  rowVisibilityClass
                                )}>
                                  <TableCell className="py-1 text-[8px] font-bold text-slate-400 p-0">{dIdx === 0 ? tIdx + 1 : ''}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-black text-slate-700 p-0">{dIdx === 0 ? inv : ''}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-bold text-slate-500 p-0">{dIdx === 0 ? new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : ''}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-black text-slate-900 uppercase p-0">{dIdx === 0 ? getFeedMitra(t) : ''}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-bold text-slate-700 p-0">{getBahanName(d.bahan_id)} <span className="text-slate-400">({getBahanSatuan(d.bahan_id)})</span></TableCell>
                                  <TableCell className="py-1 text-[8px] font-bold text-slate-700 text-right tabular-nums p-0">{(d.qty || 0).toLocaleString('id-ID')}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-bold text-slate-500 text-right tabular-nums p-0">{formatMoney(d.harga_satuan || 0, false)}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-black text-slate-900 text-right tabular-nums p-0">{formatMoney(d.subtotal || (d.qty * d.harga_satuan) || 0, false)}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-black text-right p-0 pr-2">
                                    {dIdx === 0 && <span className={sisa <= 0 ? 'text-emerald-600' : 'text-orange-600'}>{sisa <= 0 ? 'LUNAS' : 'BELUM'}</span>}
                                  </TableCell>
                                </TableRow>
                              ));
                            })}
                            {/* Sales Total Row */}
                            <TableRow className="border-t-2 border-slate-900 hover:bg-transparent">
                              <TableCell colSpan={7} className="py-2 text-[9px] font-black text-slate-900 uppercase tracking-widest p-0">Total Penjualan</TableCell>
                              <TableCell className="py-2 text-[10px] font-black text-emerald-700 text-right tabular-nums p-0">{formatMoney(feedSalesTotal, false)}</TableCell>
                              <TableCell className="p-0" />
                            </TableRow>
                          </TableBody>
                        </Table>
                        <PrevNextNav page={feedSalesPage} totalPages={feedSalesTotalPages} onPrev={() => setFeedSalesPage(p => Math.max(1, p-1))} onNext={() => setFeedSalesPage(p => Math.min(feedSalesTotalPages, p+1))} />
                        </>
                      ) : (
                        <p className="text-[9px] font-bold text-slate-400 italic py-4">Tidak ada transaksi penjualan pakan di periode ini.</p>
                      )}
                    </div>
                  )}

                  {/* ===== MBF PURCHASES DETAIL ===== */}
                  {selectedEntity === 'MBF' && feedPurchases.length > 0 && (
                    <div>
                      <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.15em] mb-3 border-b pb-1.5">
                        Rincian Pembelian Stok ({feedPurchases.length} Transaksi)
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 w-8">No</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Invoice</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Tgl</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Supplier</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Nama Bahan</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Qty</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Harga</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Subtotal</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right pr-2">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...feedPurchases].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map((t, tIdx) => {
                              const isVisible = tIdx >= (feedPurchasesPage - 1) * PAGE_SIZE && tIdx < feedPurchasesPage * PAGE_SIZE;
                              const rowVisibilityClass = !isVisible ? "hidden print:table-row" : "";
                            const details = t.details || [];
                            const sisa = (t.total_tagihan || 0) - (t.dibayar_hari_ini || 0);
                            const inv = generateInvoiceCode(t.id, t.tanggal, 'MBF');

                            if (details.length === 0) {
                              return (
                                <TableRow key={tIdx} className={cn("border-b border-slate-100 hover:bg-transparent", rowVisibilityClass)}>
                                  <TableCell className="py-1.5 text-[8px] font-bold text-slate-400 p-0">{tIdx + 1}</TableCell>
                                  <TableCell className="py-1.5 text-[8px] font-black text-slate-700 p-0">{inv}</TableCell>
                                  <TableCell className="py-1.5 text-[8px] font-bold text-slate-500 p-0">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}</TableCell>
                                  <TableCell className="py-1.5 text-[8px] font-black text-slate-900 uppercase p-0">{getFeedMitra(t)}</TableCell>
                                  <TableCell className="py-1.5 text-[8px] text-slate-400 italic p-0">-</TableCell>
                                  <TableCell className="py-1.5 text-[8px] text-slate-400 text-right p-0">-</TableCell>
                                  <TableCell className="py-1.5 text-[8px] text-slate-400 text-right p-0">-</TableCell>
                                  <TableCell className="py-1.5 text-[8px] font-black text-slate-900 text-right tabular-nums p-0">{formatMoney(t.total_tagihan || 0, false)}</TableCell>
                                  <TableCell className="py-1.5 text-[8px] font-black text-right p-0 pr-2">
                                    <span className={sisa <= 0 ? 'text-emerald-600' : 'text-blue-600'}>{sisa <= 0 ? 'LUNAS' : 'BELUM'}</span>
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            return details.map((d: any, dIdx: number) => (
                              <TableRow key={`${tIdx}-${dIdx}`} className={cn(
                                "hover:bg-transparent",
                                dIdx === details.length - 1 ? "border-b border-slate-100" : "border-b border-slate-50/50"
                              )}>
                                <TableCell className="py-1 text-[8px] font-bold text-slate-400 p-0">{dIdx === 0 ? tIdx + 1 : ''}</TableCell>
                                <TableCell className="py-1 text-[8px] font-black text-slate-700 p-0">{dIdx === 0 ? inv : ''}</TableCell>
                                <TableCell className="py-1 text-[8px] font-bold text-slate-500 p-0">{dIdx === 0 ? new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : ''}</TableCell>
                                <TableCell className="py-1 text-[8px] font-black text-slate-900 uppercase p-0">{dIdx === 0 ? getFeedMitra(t) : ''}</TableCell>
                                <TableCell className="py-1 text-[8px] font-bold text-slate-700 p-0">{getBahanName(d.bahan_id)} <span className="text-slate-400">({getBahanSatuan(d.bahan_id)})</span></TableCell>
                                <TableCell className="py-1 text-[8px] font-bold text-slate-700 text-right tabular-nums p-0">{(d.qty || 0).toLocaleString('id-ID')}</TableCell>
                                <TableCell className="py-1 text-[8px] font-bold text-slate-500 text-right tabular-nums p-0">{formatMoney(d.harga_satuan || 0, false)}</TableCell>
                                <TableCell className="py-1 text-[8px] font-black text-slate-900 text-right tabular-nums p-0">{formatMoney(d.subtotal || (d.qty * d.harga_satuan) || 0, false)}</TableCell>
                                <TableCell className="py-1 text-[8px] font-black text-right p-0 pr-2">
                                  {dIdx === 0 && <span className={sisa <= 0 ? 'text-emerald-600' : 'text-blue-600'}>{sisa <= 0 ? 'LUNAS' : 'BELUM'}</span>}
                                </TableCell>
                              </TableRow>
                            ));
                          })}
                          <TableRow className="border-t-2 border-slate-900 hover:bg-transparent">
                            <TableCell colSpan={7} className="py-2 text-[9px] font-black text-slate-900 uppercase tracking-widest p-0">Total Pembelian</TableCell>
                            <TableCell className="py-2 text-[10px] font-black text-blue-700 text-right tabular-nums p-0">{formatMoney(feedPurchasesTotal, false)}</TableCell>
                            <TableCell className="p-0" />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* ===== BEF SALES DETAIL ===== */}
                  {selectedEntity === 'BEF' && (
                    <div>
                      <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.15em] mb-3 border-b pb-1.5">
                        Rincian Penjualan Telur ({eggSales.length} Transaksi)
                      </h3>
                      {eggSales.length > 0 ? (
                        <>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 w-6">No</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Invoice</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Tgl</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Pelanggan</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Jenis & Grade</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Qty</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Ikat</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Harga</TableHead>
                              <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right pr-2">Subtotal</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...eggSales].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map((t, tIdx) => {
                                const isVisible = tIdx >= (eggSalesPage - 1) * PAGE_SIZE && tIdx < eggSalesPage * PAGE_SIZE;
                                const rowVisibilityClass = !isVisible ? "hidden print:table-row" : "";
                              const items = parseEggItems(t.keterangan || '');
                              const mitra = getEggMitra(t);
                              const inv = generateInvoiceCode(t.id, t.tanggal, 'BEF');

                              if (items.length === 0) {
                                return (
                                  <TableRow key={tIdx} className={cn("border-b border-slate-100 hover:bg-transparent", rowVisibilityClass)}>
                                    <TableCell className="py-1.5 text-[8px] font-bold text-slate-400 p-0">{tIdx + 1}</TableCell>
                                    <TableCell className="py-1.5 text-[8px] font-black text-slate-700 p-0">{inv}</TableCell>
                                    <TableCell className="py-1.5 text-[8px] font-bold text-slate-500 p-0">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}</TableCell>
                                    <TableCell className="py-1.5 text-[8px] font-black text-slate-900 uppercase p-0">{mitra}</TableCell>
                                    <TableCell className="py-1.5 text-[8px] text-slate-400 italic p-0">Telur Ayam</TableCell>
                                    <TableCell className="py-1.5 text-[8px] font-bold text-slate-700 text-right tabular-nums p-0">{(t.jumlah_kg || 0).toLocaleString('id-ID')} kg</TableCell>
                                    <TableCell className="py-1.5 text-[8px] font-bold text-slate-400 text-right tabular-nums p-0">{(t.jumlah_kg || 0) % 15 === 0 && t.jumlah_kg > 0 ? (t.jumlah_kg / 15) : '-'}</TableCell>
                                    <TableCell className="py-1.5 text-[8px] font-bold text-slate-500 text-right tabular-nums p-0">{formatMoney(t.harga_per_kg || 0, false)}</TableCell>
                                    <TableCell className="py-1.5 text-[8px] font-black text-slate-900 text-right tabular-nums p-0 pr-2">{formatMoney(t.total_harga || 0, false)}</TableCell>
                                  </TableRow>
                                );
                              }

                              return items.map((item, iIdx) => {
                                const qty = item.qty || 0;
                                const isArab = item.type === 'Telur Ayam Arab';
                                const divisor = isArab ? 300 : 15;
                                const unitLabel = isArab ? 'btr' : 'kg';
                                const ikatStr = qty > 0 && qty % divisor === 0 ? String(qty / divisor) : '-';
                                return (
                                  <TableRow key={`${tIdx}-${iIdx}`} className={cn(
                                    "hover:bg-transparent",
                                    iIdx === items.length - 1 ? "border-b border-slate-100" : "border-b border-slate-50/50"
                                  )}>
                                    <TableCell className="py-1 text-[8px] font-bold text-slate-400 p-0">{iIdx === 0 ? tIdx + 1 : ''}</TableCell>
                                    <TableCell className="py-1 text-[8px] font-black text-slate-700 p-0">{iIdx === 0 ? inv : ''}</TableCell>
                                    <TableCell className="py-1 text-[8px] font-bold text-slate-500 p-0">{iIdx === 0 ? new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : ''}</TableCell>
                                    <TableCell className="py-1 text-[8px] font-black text-slate-900 uppercase p-0">{iIdx === 0 ? mitra : ''}</TableCell>
                                    <TableCell className="py-1 text-[8px] font-bold text-slate-700 p-0">{item.type}{item.grade ? ` - ${item.grade}` : ''}</TableCell>
                                    <TableCell className="py-1 text-[8px] font-bold text-slate-700 text-right tabular-nums p-0">{qty.toLocaleString('id-ID')} {unitLabel}</TableCell>
                                    <TableCell className="py-1 text-[8px] font-bold text-slate-400 text-right tabular-nums p-0">{ikatStr}</TableCell>
                                    <TableCell className="py-1 text-[8px] font-bold text-slate-500 text-right tabular-nums p-0">{formatMoney(item.price || 0, false)}</TableCell>
                                    <TableCell className="py-1 text-[8px] font-black text-slate-900 text-right tabular-nums p-0 pr-2">{formatMoney(qty * (item.price || 0), false)}</TableCell>
                                  </TableRow>
                                );
                              });
                            })}
                            <TableRow className="border-t-2 border-slate-900 hover:bg-transparent">
                              <TableCell colSpan={8} className="py-2 text-[9px] font-black text-slate-900 uppercase tracking-widest p-0">Total Penjualan Telur</TableCell>
                              <TableCell className="py-2 text-[10px] font-black text-emerald-700 text-right tabular-nums p-0 pr-2">{formatMoney(eggSalesTotal, false)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                        <PrevNextNav page={eggSalesPage} totalPages={eggSalesTotalPages} onPrev={() => setEggSalesPage(p => Math.max(1, p-1))} onNext={() => setEggSalesPage(p => Math.min(eggSalesTotalPages, p+1))} />
                        </>
                      ) : (
                        <p className="text-[9px] font-bold text-slate-400 italic py-4">Tidak ada transaksi penjualan telur di periode ini.</p>
                      )}
                    </div>
                  )}

                  {/* ===== BEF PURCHASES DETAIL ===== */}
                  {selectedEntity === 'BEF' && eggPurchases.length > 0 && (
                    <div>
                      <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.15em] mb-3 border-b pb-1.5">
                        Rincian Pembelian Telur dari Supplier ({eggPurchases.length} Transaksi)
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 w-6">No</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Invoice</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Tgl</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Supplier</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Jenis & Grade</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Qty</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Ikat</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Harga</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right pr-2">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...eggPurchases].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map((t, tIdx) => {
                              const isVisible = tIdx >= (eggPurchasesPage - 1) * PAGE_SIZE && tIdx < eggPurchasesPage * PAGE_SIZE;
                              const rowVisibilityClass = !isVisible ? "hidden print:table-row" : "";
                            const items = parseEggItems(t.keterangan || '');
                            const mitra = getEggMitra(t);
                            const inv = generateInvoiceCode(t.id, t.tanggal, 'BEF');

                            if (items.length === 0) {
                              return (
                                <TableRow key={tIdx} className={cn("border-b border-slate-100 hover:bg-transparent", rowVisibilityClass)}>
                                  <TableCell className="py-1.5 text-[8px] font-bold text-slate-400 p-0">{tIdx + 1}</TableCell>
                                  <TableCell className="py-1.5 text-[8px] font-black text-slate-700 p-0">{inv}</TableCell>
                                  <TableCell className="py-1.5 text-[8px] font-bold text-slate-500 p-0">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}</TableCell>
                                  <TableCell className="py-1.5 text-[8px] font-black text-slate-900 uppercase p-0">{mitra}</TableCell>
                                  <TableCell className="py-1.5 text-[8px] text-slate-400 italic p-0">Telur Ayam</TableCell>
                                  <TableCell className="py-1.5 text-[8px] font-bold text-slate-700 text-right tabular-nums p-0">{(t.jumlah_kg || 0).toLocaleString('id-ID')} kg</TableCell>
                                  <TableCell className="py-1.5 text-[8px] font-bold text-slate-400 text-right tabular-nums p-0">{(t.jumlah_kg || 0) % 15 === 0 && t.jumlah_kg > 0 ? (t.jumlah_kg / 15) : '-'}</TableCell>
                                  <TableCell className="py-1.5 text-[8px] font-bold text-slate-500 text-right tabular-nums p-0">{formatMoney(t.harga_per_kg || 0, false)}</TableCell>
                                  <TableCell className="py-1.5 text-[8px] font-black text-slate-900 text-right tabular-nums p-0 pr-2">{formatMoney(t.total_harga || 0, false)}</TableCell>
                                </TableRow>
                              );
                            }

                            return items.map((item, iIdx) => {
                              const qty = item.qty || 0;
                              const isArab = item.type === 'Telur Ayam Arab';
                              const divisor = isArab ? 300 : 15;
                              const unitLabel = isArab ? 'btr' : 'kg';
                              const ikatStr = qty > 0 && qty % divisor === 0 ? String(qty / divisor) : '-';
                              return (
                                <TableRow key={`${tIdx}-${iIdx}`} className={cn(
                                  "hover:bg-transparent",
                                  iIdx === items.length - 1 ? "border-b border-slate-100" : "border-b border-slate-50/50"
                                )}>
                                  <TableCell className="py-1 text-[8px] font-bold text-slate-400 p-0">{iIdx === 0 ? tIdx + 1 : ''}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-black text-slate-700 p-0">{iIdx === 0 ? inv : ''}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-bold text-slate-500 p-0">{iIdx === 0 ? new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }) : ''}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-black text-slate-900 uppercase p-0">{iIdx === 0 ? mitra : ''}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-bold text-slate-700 p-0">{item.type}{item.grade ? ` - ${item.grade}` : ''}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-bold text-slate-700 text-right tabular-nums p-0">{qty.toLocaleString('id-ID')} {unitLabel}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-bold text-slate-400 text-right tabular-nums p-0">{ikatStr}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-bold text-slate-500 text-right tabular-nums p-0">{formatMoney(item.price || 0, false)}</TableCell>
                                  <TableCell className="py-1 text-[8px] font-black text-slate-900 text-right tabular-nums p-0 pr-2">{formatMoney(qty * (item.price || 0), false)}</TableCell>
                                </TableRow>
                              );
                            });
                          })}
                          <TableRow className="border-t-2 border-slate-900 hover:bg-transparent">
                            <TableCell colSpan={8} className="py-2 text-[9px] font-black text-slate-900 uppercase tracking-widest p-0">Total Pembelian Telur</TableCell>
                            <TableCell className="py-2 text-[10px] font-black text-blue-700 text-right tabular-nums p-0 pr-2">{formatMoney(eggPurchasesTotal, false)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* ===== BEF AFKIR ===== */}
                  {selectedEntity === 'BEF' && printAfkir.length > 0 && (
                    <div>
                      <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-[0.15em] mb-3 border-b pb-1.5">
                        Penjualan Ayam Afkir ({printAfkir.length} Transaksi)
                      </h3>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 w-8">No</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Tanggal</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0">Mitra</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Qty (Ekor)</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right">Harga/Ekor</TableHead>
                            <TableHead className="h-7 text-[8px] font-black uppercase text-slate-400 p-0 text-right pr-2">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {printAfkir.map((t, i) => (
                            <TableRow key={i} className="border-b border-slate-50 hover:bg-transparent">
                              <TableCell className="py-1.5 text-[8px] font-bold text-slate-400 p-0">{i + 1}</TableCell>
                              <TableCell className="py-1.5 text-[8px] font-bold text-slate-500 p-0">{new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}</TableCell>
                              <TableCell className="py-1.5 text-[8px] font-black text-slate-900 uppercase p-0">{t.mitra_name || '-'}</TableCell>
                              <TableCell className="py-1.5 text-[8px] font-bold text-slate-700 text-right tabular-nums p-0">{(t.qty_ekor || 0).toLocaleString('id-ID')}</TableCell>
                              <TableCell className="py-1.5 text-[8px] font-bold text-slate-500 text-right tabular-nums p-0">{formatMoney(t.harga_per_satuan || 0, false)}</TableCell>
                              <TableCell className="py-1.5 text-[8px] font-black text-slate-900 text-right tabular-nums p-0 pr-2">{formatMoney(t.total_harga || 0, false)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="border-t-2 border-slate-900 hover:bg-transparent">
                            <TableCell colSpan={5} className="py-2 text-[9px] font-black text-slate-900 uppercase tracking-widest p-0">Total Afkir</TableCell>
                            <TableCell className="py-2 text-[10px] font-black text-emerald-700 text-right tabular-nums p-0 pr-2">{formatMoney(afkirTotal, false)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* ===== EMPTY STATE ===== */}
                  {((selectedEntity === 'MBF' && printFeed.length === 0) || (selectedEntity === 'BEF' && printEgg.length === 0 && printAfkir.length === 0)) && (
                    <EmptyState 
                      icon={FileText} 
                      title="Laporan Kosong" 
                      description={`Tidak ada transaksi ${selectedEntity === 'MBF' ? 'pakan' : 'telur'} untuk periode ${periodLabel}.`}
                    />
                  )}

                  {/* ===== SIGNATURE ===== */}
                  <div className="grid grid-cols-2 gap-20 mt-6">
                    <div className="flex flex-col items-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-14">Dibuat Oleh,</p>
                      <div className="w-36 h-[1px] bg-slate-900 mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-tighter text-slate-900">Admin Keuangan</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-14">Mengetahui,</p>
                      <div className="w-36 h-[1px] bg-slate-900 mb-1" />
                      <p className="text-[9px] font-black uppercase tracking-tighter text-slate-900">
                        {selectedEntity === 'MBF' ? 'Pimpinan PT MBF' : 'Pimpinan CV BEF'}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="border-t-2 border-slate-100 pt-6 flex justify-between items-center opacity-50">
                    <p className="text-[8px] font-bold italic text-slate-400">Dokumen ini merupakan laporan resmi yang dihasilkan secara otomatis oleh Sistem Admin MBF.</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-900">Halaman 1 / 1</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Print/Download Buttons */}
            <div className="flex gap-4 mt-12">
              <Button 
                  onClick={() => handlePrintLaporan()}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-widest rounded-lg h-12 px-8 shadow-xl shadow-orange-500/20 gap-3"
                >
                  <Printer size={18} />
                  Cetak Sekarang
              </Button>
              <Button 
                  onClick={() => handleExportPDF()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest rounded-lg h-12 px-8 shadow-xl shadow-emerald-500/20 gap-3"
                >
                  <Download size={18} />
                  Download PDF
              </Button>
            </div>
        </CardContent>
      </Card>
    </SectionContainer>
  );
}
