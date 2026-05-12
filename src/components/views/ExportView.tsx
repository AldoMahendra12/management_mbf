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

import { useDashboard } from '../../contexts/DashboardContext';

export function ExportView() {
  const { eggTransactions, feedTransactions, formatMoney, showToast } = useDashboard();
  
  const RECENT_EXPORTS = [
    { name: 'Laporan Penjualan April 2026', period: 'Apr 2026', user: 'Bu Latifun', date: '28 Apr 2026', format: 'PDF' },
    { name: 'Laporan Piutang April 2026', period: 'Apr 2026', user: 'Bu Latifun', date: '28 Apr 2026', format: 'Excel' },
    { name: 'Laporan Stok Pakan Mar 2026', period: 'Mar 2026', user: 'Bu Latifun', date: '1 Apr 2026', format: 'PDF' },
    { name: 'Laporan Penjualan Mar 2026', period: 'Mar 2026', user: 'Bu Latifun', date: '1 Apr 2026', format: 'Excel' },
    { name: 'Laporan Piutang Feb 2026', period: 'Feb 2026', user: 'Bu Latifun', date: '3 Mar 2026', format: 'PDF' },
    { name: 'Laporan Stok Pakan Feb 2026', period: 'Feb 2026', user: 'Bu Latifun', date: '3 Mar 2026', format: 'Excel' },
  ];
  const [reportType, setReportType] = useState('Laporan Penjualan Telur');
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
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2">Terakhir diekspor: 28 Apr 2026</p>
      </div>

      {/* Quick Export Strip */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { 
            title: 'Laporan Penjualan', 
            icon: TrendingUp, 
            desc: 'Rekap semua transaksi penjualan telur beserta status pembayaran per periode',
            hasFilter: false
          },
          { 
            title: 'Laporan Stok Pakan', 
            icon: Package, 
            desc: 'Riwayat masuk keluar pakan, saldo terkini, dan total biaya per bahan',
            hasFilter: true,
            filterType: 'Bahan Pakan'
          },
          { 
            title: 'Laporan Piutang', 
            icon: FileText, 
            desc: 'Semua invoice, status pembayaran, dan riwayat cicilan per customer',
            hasFilter: true,
            filterType: 'Status'
          },
        ].map((card, i) => (
          <Card key={i} className="border-slate-200/60 shadow-sm group hover:border-orange-200/50 transition-all flex flex-col">
              <CardHeader className="p-6 pb-2">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-all mb-4">
                    <card.icon size={20} />
                </div>
                <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-tight">{card.title}</CardTitle>
                <p className="text-[11px] font-medium text-slate-400 mt-2 leading-relaxed">{card.desc}</p>
              </CardHeader>
              <CardContent className="p-6 pt-4 space-y-4 mt-auto">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">1 Apr - 29 Apr</span>
                    </div>
                    {card.hasFilter && (
                      <div className="relative">
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 pl-3 pr-8 text-[10px] font-black uppercase tracking-widest outline-none appearance-none focus:bg-white focus:border-orange-200 transition-all cursor-pointer text-slate-500">
                          <option>Semua {card.filterType}</option>
                          {card.filterType === 'Bahan Pakan' ? (
                            <>
                              <option>Katul</option>
                              <option>Jagung</option>
                            </>
                          ) : (
                            <>
                              <option>Belum Lunas</option>
                              <option>Jatuh Tempo</option>
                            </>
                          )}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => {
                        setReportType(card.title === 'Laporan Penjualan' ? 'Laporan Penjualan Telur' : 
                                      card.title === 'Laporan Stok Pakan' ? 'Laporan Stok Pakan' : 'Laporan Piutang');
                        setTimeout(() => handlePrintLaporan(), 100);
                      }}
                      className="h-9 text-[9px] font-black uppercase tracking-widest rounded-lg bg-orange-600 text-white shadow-lg shadow-orange-500/10"
                    >
                      PDF
                    </Button>
                    <Button 
                      onClick={() => handleExportCSV(card.title === 'Laporan Penjualan' ? 'telur' : 'pakan')}
                      variant="outline"
                      className="h-9 text-[9px] font-black uppercase tracking-widest rounded-lg border-slate-200 text-slate-600"
                    >
                      CSV
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
          <div className="relative w-64">
              <select 
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-3 pr-8 text-[10px] font-black uppercase tracking-widest outline-none appearance-none focus:border-orange-200 transition-all cursor-pointer"
              >
                  <option>Laporan Penjualan Telur</option>
                  <option>Laporan Stok Pakan</option>
                  <option>Laporan Piutang</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>
        </CardHeader>
        <CardContent className="p-12 bg-slate-100/50 flex flex-col items-center">
            {/* A4 Paper Preview */}
            <div ref={printRefLaporan} className="bg-white w-full max-w-[800px] min-h-[1100px] shadow-2xl shadow-slate-200 p-16 flex flex-col gap-10 text-slate-800 ring-1 ring-slate-200">
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter">MITRA BAROKAH FARM</h1>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{reportType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-black uppercase tracking-widest">Periode: <span className="text-slate-900">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span></p>
                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Dicetak: {new Date().toLocaleDateString('id-ID')}</p>
                  </div>
              </div>

              {reportType === 'Laporan Penjualan Telur' ? (
                <>
                  <div className="grid grid-cols-4 gap-6">
                    {[
                        { label: 'Total Penjualan', val: formatMoney(eggTransactions.reduce((s, t) => s + (t.total_harga || 0), 0), false) },
                        { label: 'Total Terbayar', val: formatMoney(eggTransactions.reduce((s, t) => s + (t.jumlah_dibayar || 0), 0), false) },
                        { label: 'Total Piutang', val: formatMoney(eggTransactions.reduce((s, t) => s + ((t.total_harga || 0) - (t.jumlah_dibayar || 0)), 0), false) },
                        { label: 'Total Transaksi', val: eggTransactions.length },
                    ].map((s, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-lg flex flex-col gap-1 border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                          <p className="text-xs font-black text-slate-900">{s.val}</p>
                        </div>
                    ))}
                  </div>

                  <div className="flex-1">
                      <Table className="border-t border-slate-100">
                        <TableHeader>
                            <TableRow className="border-b-2 border-slate-100 hover:bg-transparent">
                              <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400 p-0">Invoice</TableHead>
                              <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400 p-0">Customer</TableHead>
                              <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400 p-0">Total</TableHead>
                              <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400 p-0 pr-4">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {eggTransactions.slice(0, 15).map((t, i) => {
                              const sisa = (t.total_harga || 0) - (t.jumlah_dibayar || 0);
                              return (
                                <TableRow key={i} className="border-b border-slate-50 hover:bg-transparent">
                                    <TableCell className="py-4 text-[11px] font-bold text-slate-600">{t.id.slice(0, 8).toUpperCase()}</TableCell>
                                    <TableCell className="py-4 text-left text-[11px] font-black uppercase">{t.keterangan?.replace('Mitra: ', '')}</TableCell>
                                    <TableCell className="py-4 text-left text-[11px] font-black text-slate-900">{formatMoney(t.total_harga, true)}</TableCell>
                                    <TableCell className="py-4 text-left pr-4 text-[10px] font-black text-slate-400">
                                      {sisa <= 0 ? 'LUNAS' : sisa === t.total_harga ? 'BELUM LUNAS' : 'SEBAGIAN'}
                                    </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                  </div>
                </>
              ) : reportType === 'Laporan Stok Pakan' ? (
                <>
                    <div className="grid grid-cols-3 gap-6">
                    {[
                        { label: 'Total Pembelian', val: formatMoney(feedTransactions.reduce((s, t) => s + (t.total_tagihan || 0), 0), false) },
                        { label: 'Sisa Utang', val: formatMoney(feedTransactions.reduce((s, t) => s + ((t.total_tagihan || 0) - (t.dibayar_hari_ini || 0)), 0), false) },
                        { label: 'Total Transaksi', val: feedTransactions.length },
                    ].map((s, i) => (
                        <div key={i} className="bg-slate-50 p-4 rounded-lg flex flex-col gap-1 border border-slate-100">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                          <p className="text-xs font-black text-slate-900">{s.val}</p>
                        </div>
                    ))}
                  </div>

                  <div className="flex-1">
                      <Table className="border-t border-slate-100">
                        <TableHeader>
                            <TableRow className="border-b-2 border-slate-100 hover:bg-transparent">
                              <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400 p-0">Invoice</TableHead>
                              <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400 p-0">Supplier</TableHead>
                              <TableHead className="h-10 text-[10px] font-black uppercase text-slate-400 p-0">Total Tagihan</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {feedTransactions.slice(0, 15).map((t, i) => (
                                <TableRow key={i} className="border-b border-slate-50 hover:bg-transparent">
                                    <TableCell className="py-4 text-[11px] font-bold text-slate-600">{t.id.slice(0, 8).toUpperCase()}</TableCell>
                                    <TableCell className="py-4 text-left text-[11px] font-black uppercase">{t.keterangan?.replace('Mitra: ', '')}</TableCell>
                                    <TableCell className="py-4 text-left text-[11px] font-black text-slate-900">{formatMoney(t.total_tagihan, true)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 italic">
                    Detail Laporan Piutang akan digenerate otomatis berdasarkan ledger...
                </div>
              )}

              <div className="border-t border-slate-100 pt-8 flex justify-between items-center opacity-50">
                  <p className="text-[10px] font-medium italic">Dokumen ini digenerate otomatis oleh Sistem Admin — Konfidensial</p>
                  <p className="text-[10px] font-black uppercase tracking-widest">Halaman 1 / 1</p>
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
