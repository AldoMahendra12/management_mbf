import React, { useState, useRef } from 'react';
import { 
  TrendingUp, 
  Package, 
  FileText, 
  Calendar, 
  ChevronDown, 
  Printer, 
  Download 
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionContainer } from '../layout/SectionContainer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import logoMBF from '../../assets/logo_MBF.png';
import logoBEF from '../../assets/logo_BEF.png';

import { useDashboard } from '../../contexts/DashboardContext';

export function ExportView() {
  const { eggTransactions, feedTransactions, afkirTransactions, formatMoney, showToast } = useDashboard();
  
  const RECENT_EXPORTS = [
    { name: 'Laporan Penjualan April 2026', period: 'Apr 2026', user: 'Bu Latifun', date: '28 Apr 2026', format: 'PDF' },
    { name: 'Laporan Piutang April 2026', period: 'Apr 2026', user: 'Bu Latifun', date: '28 Apr 2026', format: 'Excel' },
    { name: 'Laporan Stok Pakan Mar 2026', period: 'Mar 2026', user: 'Bu Latifun', date: '1 Apr 2026', format: 'PDF' },
    { name: 'Laporan Penjualan Mar 2026', period: 'Mar 2026', user: 'Bu Latifun', date: '1 Apr 2026', format: 'Excel' },
    { name: 'Laporan Piutang Feb 2026', period: 'Feb 2026', user: 'Bu Latifun', date: '3 Mar 2026', format: 'PDF' },
    { name: 'Laporan Stok Pakan Feb 2026', period: 'Feb 2026', user: 'Bu Latifun', date: '3 Mar 2026', format: 'Excel' },
  ];
  const [reportType, setReportType] = useState('Laporan Penjualan Telur');
  const [selectedEntity, setSelectedEntity] = useState<'MBF' | 'BEF'>('MBF');
  const printRefLaporan = useRef<HTMLDivElement>(null);
  const handlePrintLaporan = useReactToPrint({ contentRef: printRefLaporan });

  const handleExportCSV = (type: string) => {
    let dataToExport: any[] = [];
    let filename = '';

    if (type === 'telur') {
      dataToExport = eggTransactions.map(t => ({
        Tanggal: new Date(t.tanggal).toLocaleDateString('id-ID'),
        Invoice: t.id,
        Customer: t.keterangan?.replace('Mitra: ', '') || 'Umum',
        'Total KG': t.total_kg || t.jumlah_kg,
        'Harga/KG': t.harga_per_kg,
        'Total Harga': t.total_harga,
        'Jumlah Dibayar': t.jumlah_dibayar,
        'Sisa Piutang': t.total_harga - (t.jumlah_dibayar || 0)
      }));
      filename = `Laporan_Telur_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'pakan') {
      dataToExport = feedTransactions.map(t => ({
        Tanggal: new Date(t.tanggal).toLocaleDateString('id-ID'),
        Invoice: t.id,
        Jenis: t.jenis_transaksi,
        Mitra: t.nama_mitra || t.keterangan?.replace('Mitra: ', '') || 'Umum',
        'Total Tagihan': t.total_tagihan,
        'Sudah Dibayar': t.dibayar_hari_ini || 0,
        'Sisa Piutang/Utang': t.total_tagihan - (t.dibayar_hari_ini || 0)
      }));
      filename = `Laporan_Pakan_${new Date().toISOString().split('T')[0]}.csv`;
    }

    if (dataToExport.length === 0) {
      showToast('Tidak ada data untuk diekspor', 'error');
      return;
    }

    const headers = Object.keys(dataToExport[0]).join(',');
    const csvRows = dataToExport.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csvContent = [headers, ...csvRows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    showToast(`Berhasil mengunduh ${filename}`);
  };

  return (
    <SectionContainer className="space-y-6">
      <div className="flex items-center justify-between bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ekspor Data</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Unduh laporan operasional dan finansial untuk arsip</p>
        </div>
        
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
          <button
            onClick={() => setSelectedEntity('MBF')}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              selectedEntity === 'MBF' ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
            )}
          >
            PT MBF
          </button>
          <button
            onClick={() => setSelectedEntity('BEF')}
            className={cn(
              "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
              selectedEntity === 'BEF' ? "bg-white text-slate-900 shadow-md" : "text-slate-400 hover:text-slate-600"
            )}
          >
            CV BEF
          </button>
        </div>

        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Terakhir diekspor: 28 Apr 2026</p>
      </div>

      {/* Financial Report Entity Selection */}
      <div className="grid grid-cols-2 gap-6">
        {[
          { 
            title: 'Laporan Keuangan PT MBF', 
            entity: 'MBF' as const,
            icon: TrendingUp, 
            desc: 'Rekapitulasi finansial lengkap untuk PT Mitra Barokah Farm mencakup arus kas, margin, dan laba rugi.',
          },
          { 
            title: 'Laporan Keuangan CV BEF', 
            entity: 'BEF' as const,
            icon: FileText, 
            desc: 'Rekapitulasi finansial lengkap untuk CV Barokah Eka Farm mencakup arus kas, margin, dan laba rugi.',
          },
        ].map((card, i) => (
          <Card key={i} className="border-slate-200/60 shadow-sm group hover:border-orange-200/50 transition-all flex flex-col relative overflow-hidden">
              <div className={cn(
                "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-[0.03] transition-transform group-hover:scale-150",
                card.entity === 'MBF' ? "bg-slate-900" : "bg-orange-600"
              )} />
              
              <CardHeader className="p-8 pb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all mb-6 shadow-sm",
                  card.entity === 'MBF' ? "bg-slate-900 text-white" : "bg-orange-500 text-white"
                )}>
                    <card.icon size={24} />
                </div>
                <CardTitle className="text-lg font-black text-slate-900 uppercase tracking-tight">{card.title}</CardTitle>
                <p className="text-xs font-medium text-slate-400 mt-2 leading-relaxed">{card.desc}</p>
              </CardHeader>
              
              <CardContent className="p-8 pt-4 space-y-6 mt-auto">
                <div className="flex items-center gap-4">
                    <div className="flex-1 flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">
                        {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <Badge className={cn(
                      "text-[9px] font-black uppercase px-2 py-1 rounded-lg border-none shadow-none",
                      card.entity === 'MBF' ? "bg-slate-100 text-slate-900" : "bg-orange-50 text-orange-600"
                    )}>
                      FULL REKAP
                    </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <Button 
                      onClick={() => {
                        setSelectedEntity(card.entity);
                        setReportType(card.title);
                        setTimeout(() => handlePrintLaporan(), 100);
                      }}
                      className={cn(
                        "h-11 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-95",
                        card.entity === 'MBF' ? "bg-slate-900 text-white shadow-slate-900/10" : "bg-orange-600 text-white shadow-orange-600/10"
                      )}
                    >
                      <Printer size={14} className="mr-2" />
                      PDF REPORT
                    </Button>
                    <Button 
                      onClick={() => handleExportCSV('telur')}
                      variant="outline"
                      className="h-11 text-[10px] font-black uppercase tracking-widest rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      <Download size={14} className="mr-2" />
                      CSV DATA
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
          </div>
        </CardHeader>
        <CardContent className="p-12 bg-slate-100/50 flex flex-col items-center">
            {/* A4 Paper Preview */}
            <div ref={printRefLaporan} className="bg-white w-full max-w-[800px] min-h-[1100px] shadow-2xl shadow-slate-200 p-16 flex flex-col gap-10 text-slate-800 ring-1 ring-slate-200">
              {/* Official Letterhead */}
              <div className="flex items-center justify-between border-b-[3px] border-slate-900 pb-8">
                  <div className="flex items-center gap-6">
                    <img 
                      src={selectedEntity === 'MBF' ? logoMBF : logoBEF} 
                      alt="Logo" 
                      className="h-20 w-auto object-contain" 
                    />
                    <div className="h-16 w-[2px] bg-slate-200" />
                    <div className="flex flex-col">
                      <h1 className="text-3xl font-black tracking-tighter text-slate-900">
                        {selectedEntity === 'MBF' ? 'PT MITRA BAROKAH FARM' : 'CV BAROKAH EKA FARM'}
                      </h1>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Livestock & Feed Management System</p>
                      <div className="mt-2 space-y-0.5">
                        <p className="text-[9px] font-bold text-slate-500 uppercase">
                          {selectedEntity === 'MBF' 
                            ? 'Jl. Raya Tulungagung - Trenggalek No. 45' 
                            : 'Dusun Krajan, Desa Bendorejo, Pogalan'}
                        </p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase">
                          Email: admin@{selectedEntity === 'MBF' ? 'barokahfarm.id' : 'ekafarm.id'} | Telp: (0355) 321xxx
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="bg-slate-900 text-white px-4 py-2 rounded-lg mb-2 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em]">{reportType}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Periode Laporan</p>
                      <p className="text-[12px] font-black text-slate-900 uppercase tracking-tight mt-0.5">
                        {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end mt-1">
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.2em]">Dicetak Pada</p>
                      <p className="text-[10px] font-bold text-slate-400 tabular-nums">
                        {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
              </div>

              {/* Report Summary */}
              <div className="grid grid-cols-3 gap-6">
                {[
                    { label: 'Total Pemasukan', val: formatMoney(
                      eggTransactions.reduce((s, t) => s + (t.total_harga || 0), 0) + 
                      feedTransactions.filter(t => t.jenis_transaksi?.toLowerCase().includes('jual')).reduce((s, t) => s + (t.total_tagihan || 0), 0) +
                      afkirTransactions.reduce((s, t) => s + (t.total_harga || 0), 0)
                      , false) 
                    },
                    { label: 'Total Pengeluaran', val: formatMoney(
                      feedTransactions.filter(t => t.jenis_transaksi?.toLowerCase().includes('beli') || t.jenis_transaksi?.toLowerCase().includes('masuk')).reduce((s, t) => s + (t.total_tagihan || 0), 0) + 
                      eggTransactions.filter(t => t.jenis_transaksi?.toLowerCase().includes('beli')).reduce((s, t) => s + (t.total_harga || 0), 0)
                      , false) 
                    },
                    { label: 'Selisih Bersih', val: formatMoney(
                      (eggTransactions.reduce((s, t) => s + (t.total_harga || 0), 0) + feedTransactions.filter(t => t.jenis_transaksi?.toLowerCase().includes('jual')).reduce((s, t) => s + (t.total_tagihan || 0), 0) + afkirTransactions.reduce((s, t) => s + (t.total_harga || 0), 0)) - 
                      (feedTransactions.filter(t => t.jenis_transaksi?.toLowerCase().includes('beli') || t.jenis_transaksi?.toLowerCase().includes('masuk')).reduce((s, t) => s + (t.total_tagihan || 0), 0) + eggTransactions.filter(t => t.jenis_transaksi?.toLowerCase().includes('beli')).reduce((s, t) => s + (t.total_harga || 0), 0))
                      , false) 
                    },
                ].map((s, i) => (
                    <div key={i} className="bg-slate-50 p-6 rounded-xl flex flex-col gap-1.5 border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                      <p className="text-sm font-black text-slate-900 tabular-nums">{s.val}</p>
                    </div>
                ))}
              </div>

              <div className="flex-1">
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 border-b pb-2">Rincian Transaksi Konsolidasi</h3>
                  <Table>
                    <TableHeader>
                        <TableRow className="border-b-2 border-slate-100 hover:bg-transparent">
                          <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400 p-0">Tanggal</TableHead>
                          <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400 p-0">Keterangan</TableHead>
                          <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400 p-0 text-right">Debit</TableHead>
                          <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400 p-0 text-right pr-4">Kredit</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...eggTransactions, ...feedTransactions, ...afkirTransactions].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 30).map((t, i) => {
                          const isAfkir = !t.jenis_transaksi && t.mitra_name; // Simple check for afkir object structure
                          const isIncome = isAfkir || t.jenis_transaksi?.toLowerCase().includes('jual') || t.jenis_transaksi?.toLowerCase().includes('keluar') || (t.total_harga && !t.jenis_transaksi?.toLowerCase().includes('beli'));
                          const amount = t.total_harga || t.total_tagihan || 0;
                          const customer = (t.mitra_name || t.nama_mitra || t.keterangan?.replace('Mitra: ', '') || 'Umum').split('|')[0].trim();
                          const description = isAfkir ? 'Penjualan Ayam Afkir' : (t.jenis_transaksi || 'Penjualan Telur');
                          
                          return (
                            <TableRow key={i} className="border-b border-slate-50 hover:bg-transparent">
                                <TableCell className="py-3 text-[10px] font-bold text-slate-400">{new Date(t.tanggal).toLocaleDateString('id-ID', {day: '2-digit', month: '2-digit'})}</TableCell>
                                <TableCell className="py-3 text-left text-[11px] font-black uppercase text-slate-900">
                                  {description} - {customer}
                                </TableCell>
                                <TableCell className="py-3 text-right text-[11px] font-black text-blue-600 tabular-nums">{!isIncome ? formatMoney(amount, false) : '-'}</TableCell>
                                <TableCell className="py-3 text-right pr-4 text-[11px] font-black text-emerald-600 tabular-nums">{isIncome ? formatMoney(amount, false) : '-'}</TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
              </div>

              {/* Signature Section */}
              <div className="grid grid-cols-2 gap-20 mt-10">
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-16">Dibuat Oleh,</p>
                  <div className="w-40 h-[1px] bg-slate-900 mb-1" />
                  <p className="text-[10px] font-black uppercase tracking-tighter text-slate-900">Admin Keuangan</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-16">Mengetahui,</p>
                  <div className="w-40 h-[1px] bg-slate-900 mb-1" />
                  <p className="text-[10px] font-black uppercase tracking-tighter text-slate-900">
                    {selectedEntity === 'MBF' ? 'Pimpinan PT MBF' : 'Pimpinan CV BEF'}
                  </p>
                </div>
              </div>

              <div className="border-t-2 border-slate-100 pt-8 flex justify-between items-center opacity-50">
                  <p className="text-[9px] font-bold italic text-slate-400">Dokumen ini merupakan laporan resmi yang dihasilkan secara otomatis oleh Sistem Admin MBF.</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Halaman 1 / 1</p>
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <Button 
                  onClick={() => handlePrintLaporan()}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-widest rounded-lg h-12 px-8 shadow-xl shadow-orange-500/20 gap-3"
                >
                  <Printer size={18} />
                  Cetak Sekarang
              </Button>
              <Button 
                  onClick={() => handlePrintLaporan()}
                  variant="outline" 
                  className="border-slate-300 text-slate-600 font-black text-xs uppercase tracking-widest rounded-lg h-12 px-8 bg-white gap-3 group"
                >
                  <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                  Download PDF
              </Button>
            </div>
        </CardContent>
      </Card>

      {/* Recent Exports Table */}
      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-5">
          <CardTitle className="text-base font-black text-slate-800 uppercase tracking-tight">Riwayat Ekspor</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow className="border-slate-100">
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-4 pl-8">Nama Laporan</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">Periode</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">Diekspor Oleh</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">Tanggal</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-4">Format</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest py-4 pr-8 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {RECENT_EXPORTS.map((exp, i) => (
                <TableRow key={i} className="group hover:bg-slate-50 transition-colors border-slate-50">
                  <TableCell className="py-4 pl-8 text-xs font-black text-slate-800 tracking-tight uppercase">{exp.name}</TableCell>
                  <TableCell className="py-4 text-xs font-bold text-slate-500">{exp.period}</TableCell>
                  <TableCell className="py-4 text-xs font-black text-slate-900 uppercase">{exp.user}</TableCell>
                  <TableCell className="py-4 text-xs font-bold text-slate-400">{exp.date}</TableCell>
                  <TableCell className="py-4">
                      <Badge className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border-none shadow-none",
                        exp.format === 'PDF' ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                      )}>
                        {exp.format}
                      </Badge>
                  </TableCell>
                  <TableCell className="py-4 pr-8 text-center">
                      <Button variant="ghost" size="sm" className="h-8 gap-2 text-[10px] font-black text-slate-400 hover:text-orange-600 uppercase tracking-widest group">
                        <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
                        Download
                      </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SectionContainer>
  );
}
