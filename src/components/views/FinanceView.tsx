import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarDays,
  X,
  PieChart,
  Users,
  Search,
  ArrowRightLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionContainer } from '../layout/SectionContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { useDashboard } from '../../contexts/DashboardContext';

type DateRangeMode = 'minggu' | 'bulan' | 'custom';

function getDateBounds(mode: DateRangeMode, customStart: string, customEnd: string): { start: Date; end: Date } {
  const now = new Date();
  if (mode === 'minggu') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end: now };
  }
  if (mode === 'bulan') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: now };
  }
  // custom
  return {
    start: customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1),
    end: customEnd ? new Date(customEnd + 'T23:59:59') : now,
  };
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-100 shadow-xl rounded-xl p-3 text-xs">
        <p className="font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="font-bold text-slate-600">{p.name}:</span>
            <span className="font-black text-slate-900">
              Rp {(p.value as number).toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function FinanceView() {
  const { eggTransactions, feedTransactions, afkirTransactions, formatMoney } = useDashboard();

  const [rangeMode, setRangeMode] = useState<DateRangeMode>('bulan');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [detailModal, setDetailModal] = useState<'masuk' | 'keluar' | 'net' | null>(null);
  const [mitraSearch, setMitraSearch] = useState('');

  const { start, end } = useMemo(
    () => getDateBounds(rangeMode, customStart, customEnd),
    [rangeMode, customStart, customEnd]
  );

  // Filter transactions within date range
  const filteredEgg = useMemo(() =>
    eggTransactions.filter(t => {
      const d = new Date(t.tanggal || t.created_at);
      return d >= start && d <= end;
    }), [eggTransactions, start, end]);

  const filteredFeed = useMemo(() =>
    feedTransactions.filter(t => {
      const d = new Date(t.tanggal || t.created_at);
      return d >= start && d <= end;
    }), [feedTransactions, start, end]);

  const filteredAfkir = useMemo(() =>
    afkirTransactions.filter(t => {
      const d = new Date(t.tanggal || t.created_at);
      return d >= start && d <= end;
    }), [afkirTransactions, start, end]);

  // Section A: Summary cards breakdown
  const { eggIn, feedIn, eggOut, feedOut, afkirIn } = useMemo(() => {
    const eIn = filteredEgg
      .filter(t => {
        const j = t.jenis_transaksi?.toLowerCase() || '';
        return j === 'jual telur' || j === 'jual ke luar';
      })
      .reduce((s, t) => s + (t.total_harga || 0), 0);
    const fIn = filteredFeed
      .filter(t => {
        const j = t.jenis_transaksi?.toLowerCase() || '';
        return j === 'jual pakan' || j === 'keluar';
      })
      .reduce((s, t) => s + (t.total_tagihan || 0), 0);
      
    const eOut = filteredEgg
      .filter(t => {
        const j = t.jenis_transaksi?.toLowerCase() || '';
        return j === 'beli telur' || j === 'terima setoran';
      })
      .reduce((s, t) => s + (t.total_harga || 0), 0);
    const fOut = filteredFeed
      .filter(t => {
        const j = t.jenis_transaksi?.toLowerCase() || '';
        return j === 'beli pakan' || j === 'masuk gudang';
      })
      .reduce((s, t) => s + (t.total_tagihan || 0), 0);

    const aIn = filteredAfkir
      .reduce((s, t) => s + (t.total_harga || 0), 0);

    return { eggIn: eIn, feedIn: fIn, eggOut: eOut, feedOut: fOut, afkirIn: aIn };
  }, [filteredEgg, filteredFeed, filteredAfkir]);

  const totalMasuk = eggIn + feedIn + afkirIn;
  const totalKeluar = eggOut + feedOut;
  const net = totalMasuk - totalKeluar;

  // Section B: Line chart data — aggregate by date
  const chartData = useMemo(() => {
    const dateMap: Record<string, { tanggal: string; masuk: number; keluar: number }> = {};

    const addDays = (start: Date, end: Date) => {
      const days: string[] = [];
      const cur = new Date(start);
      while (cur <= end) {
        days.push(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
      return days;
    };
    addDays(start, end).forEach(d => {
      dateMap[d] = { tanggal: d, masuk: 0, keluar: 0 };
    });

    filteredEgg.forEach(t => {
      const dateKey = (t.tanggal || t.created_at || '').substring(0, 10);
      if (!dateMap[dateKey]) return;
      const j = t.jenis_transaksi?.toLowerCase() || '';
      if (j === 'jual telur' || j === 'jual ke luar') {
        dateMap[dateKey].masuk += t.total_harga || 0;
      } else {
        dateMap[dateKey].keluar += t.total_harga || 0;
      }
    });

    filteredFeed.forEach(t => {
      const dateKey = (t.tanggal || t.created_at || '').substring(0, 10);
      if (!dateMap[dateKey]) return;
      const j = t.jenis_transaksi?.toLowerCase() || '';
      if (j === 'jual pakan' || j === 'keluar') {
        dateMap[dateKey].masuk += t.total_tagihan || 0;
      } else {
        dateMap[dateKey].keluar += t.total_tagihan || 0;
      }
    });

    filteredAfkir.forEach(t => {
      const dateKey = (t.tanggal || t.created_at || '').substring(0, 10);
      if (!dateMap[dateKey]) return;
      dateMap[dateKey].masuk += t.total_harga || 0;
    });

    return Object.values(dateMap).map(row => ({
      ...row,
      label: formatDateLabel(row.tanggal),
    }));
  }, [filteredEgg, filteredFeed, start, end]);

  // Section C: Mitra Recap Table
  const mitraRecap = useMemo(() => {
    const recapMap: Record<string, { name: string; income: number; expense: number; count: number }> = {};

    const process = (trx: any, amount: number, isIncome: boolean) => {
      const name = (trx.nama_mitra || trx.keterangan?.replace('Mitra: ', '') || 'Pelanggan Umum').split('|')[0].trim();
      if (!recapMap[name]) {
        recapMap[name] = { name, income: 0, expense: 0, count: 0 };
      }
      if (isIncome) recapMap[name].income += amount;
      else recapMap[name].expense += amount;
      recapMap[name].count += 1;
    };

    filteredEgg.forEach(t => {
      const jt = t.jenis_transaksi?.toLowerCase() || '';
      const isInc = jt === 'jual telur' || jt === 'jual ke luar';
      process(t, t.total_harga || 0, isInc);
    });

    filteredFeed.forEach(t => {
      const jt = t.jenis_transaksi?.toLowerCase() || '';
      const isInc = jt === 'jual pakan' || jt === 'keluar';
      process(t, t.total_tagihan || 0, isInc);
    });

    filteredAfkir.forEach(t => {
      process(t, t.total_harga || 0, true);
    });

    let results = Object.values(recapMap).sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
    
    if (mitraSearch) {
      const q = mitraSearch.toLowerCase();
      results = results.filter(r => r.name.toLowerCase().includes(q));
    }

    return results;
  }, [filteredEgg, filteredFeed, mitraSearch]);


  const rangeModes: { key: DateRangeMode; label: string }[] = [
    { key: 'minggu', label: 'Minggu Ini' },
    { key: 'bulan', label: 'Bulan Ini' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <SectionContainer className="space-y-6">
      {/* Header with Date Range Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Laporan Keuangan</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Tren arus kas dan rekap operasional
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
            {rangeModes.map(m => (
              <button
                key={m.key}
                onClick={() => setRangeMode(m.key)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
                  rangeMode === m.key ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                {m.key === 'custom' && <CalendarDays size={11} />}
                {m.label}
              </button>
            ))}
          </div>

          {rangeMode === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-bold outline-none focus:border-green-300"
              />
              <span className="text-xs font-black text-slate-400">—</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-bold outline-none focus:border-green-300"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section A — Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Uang Masuk */}
        <div 
          onClick={() => setDetailModal('masuk')}
          className="bg-white border border-green-100 rounded-xl p-6 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent pointer-events-none group-hover:from-green-50 transition-colors" />
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowDownLeft size={18} className="text-green-600" />
            </div>
            <span className="text-[9px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-full border border-green-100">
              Masuk
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-green-600 transition-colors">Total Uang Masuk</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{formatMoney(totalMasuk)}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1.5 opacity-70 flex items-center gap-1 group-hover:text-green-700 transition-colors">
              Klik untuk lihat detail <ArrowUpRight size={10} />
            </p>
          </div>
        </div>

        {/* Uang Keluar */}
        <div 
          onClick={() => setDetailModal('keluar')}
          className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent pointer-events-none group-hover:from-blue-50 transition-colors" />
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ArrowUpRight size={18} className="text-blue-600" />
            </div>
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-full border border-blue-100">
              Keluar
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-blue-600 transition-colors">Total Uang Keluar</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{formatMoney(totalKeluar)}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1.5 opacity-70 flex items-center gap-1 group-hover:text-blue-700 transition-colors">
              Klik untuk lihat detail <ArrowUpRight size={10} />
            </p>
          </div>
        </div>

        {/* Net */}
        <div 
          onClick={() => setDetailModal('net')}
          className={cn(
            "bg-white rounded-xl p-6 shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-all",
            net >= 0 ? "border border-green-200 hover:border-green-400" : "border border-red-200 hover:border-red-400"
          )}
        >
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br to-transparent pointer-events-none transition-colors",
            net >= 0 ? "from-green-50/60 group-hover:from-green-50" : "from-red-50/40 group-hover:from-red-50"
          )} />
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform",
              net >= 0 ? "bg-green-100" : "bg-red-100"
            )}>
              {net >= 0 ? <TrendingUp size={18} className="text-green-600" /> : <TrendingDown size={18} className="text-red-500" />}
            </div>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border",
              net >= 0 ? "text-green-600 bg-green-50 border-green-100" : "text-red-500 bg-red-50 border-red-100"
            )}>
              {net >= 0 ? 'Surplus' : 'Defisit'}
            </span>
          </div>
          <div className="relative z-10">
            <p className={cn("text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 transition-colors", net >= 0 ? "group-hover:text-green-600" : "group-hover:text-red-500")}>Selisih Bersih</p>
            <h3 className={cn(
              "text-2xl font-black tracking-tighter",
              net >= 0 ? "text-green-600" : "text-red-500"
            )}>
              {net >= 0 ? '+' : ''}{formatMoney(net)}
            </h3>
            <p className={cn("text-[9px] font-bold text-slate-400 mt-1.5 opacity-70 flex items-center gap-1 transition-colors", net >= 0 ? "group-hover:text-green-700" : "group-hover:text-red-700")}>
              Klik untuk lihat margin <ArrowUpRight size={10} />
            </p>
          </div>
        </div>
      </div>

      {/* Section B — Line Chart */}
      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-50 py-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
              <Minus size={16} className="text-slate-300" />
              Tren Arus Kas
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-green-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Masuk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-blue-500 rounded-full" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keluar</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {chartData.every(d => d.masuk === 0 && d.keluar === 0) ? (
            <div className="h-52 flex items-center justify-center">
              <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Tidak ada transaksi dalam periode ini</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="masuk"
                  name="Uang Masuk"
                  stroke="#22c55e"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#22c55e', strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="keluar"
                  name="Uang Keluar"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Section C — Mitra Recap Table */}
      <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 md:px-10 py-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight uppercase">Rekapitulasi per Pelanggan</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total perputaran uang berdasarkan mitra</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg flex items-center gap-2 focus-within:border-orange-300 transition-colors">
              <Search size={12} className="text-slate-400" />
              <input 
                type="text" 
                value={mitraSearch}
                onChange={(e) => setMitraSearch(e.target.value)}
                placeholder="Cari pelanggan..." 
                className="text-[10px] font-bold outline-none bg-transparent w-32 placeholder:text-slate-300"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="pl-10 h-12 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Pelanggan</TableHead>
                <TableHead className="h-12 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">Aktivitas</TableHead>
                <TableHead className="h-12 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Uang Masuk</TableHead>
                <TableHead className="h-12 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Uang Keluar</TableHead>
                <TableHead className="pr-10 h-12 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Saldo Bersih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mitraRecap.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyState 
                      icon={Users} 
                      title="Data Mitra Kosong" 
                      description="Tidak ada rekapitulasi mitra untuk periode yang dipilih." 
                    />
                  </TableCell>
                </TableRow>
              ) : (
                mitraRecap.map((row, i) => {
                  const netMitra = row.income - row.expense;
                  return (
                    <TableRow key={i} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                      <TableCell className="pl-10 py-4">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{row.name}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase">
                          {row.count} Trx
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs font-black text-emerald-600 tabular-nums">
                          {formatMoney(row.income)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xs font-black text-blue-600 tabular-nums">
                          {formatMoney(row.expense)}
                        </span>
                      </TableCell>
                      <TableCell className="pr-10 text-right">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black tabular-nums shadow-sm border",
                          netMitra >= 0 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-red-50 text-red-600 border-red-100"
                        )}>
                          {netMitra >= 0 ? '+' : ''}{formatMoney(netMitra)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="px-6 md:px-10 py-4 bg-slate-50/30 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Menampilkan {mitraRecap.length} pelanggan dalam periode ini
          </p>
          <div className="flex items-center gap-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDetailModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className={cn(
              "p-5 border-b",
              detailModal === 'masuk' ? "bg-green-50/50 border-green-100" :
              detailModal === 'keluar' ? "bg-blue-50/50 border-blue-100" :
              net >= 0 ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm",
                    detailModal === 'masuk' ? "text-green-600" :
                    detailModal === 'keluar' ? "text-blue-600" :
                    net >= 0 ? "text-green-600" : "text-red-500"
                  )}>
                    {detailModal === 'masuk' ? <ArrowDownLeft size={20} /> :
                     detailModal === 'keluar' ? <ArrowUpRight size={20} /> :
                     <PieChart size={20} />}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg leading-tight uppercase tracking-tight">
                      {detailModal === 'masuk' ? 'Uang Masuk' : detailModal === 'keluar' ? 'Uang Keluar' : 'Selisih Bersih'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Rincian Komponen</p>
                  </div>
                </div>
                <button onClick={() => setDetailModal(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {detailModal === 'masuk' && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Penjualan Telur</span>
                      <span className="font-black text-green-600">{formatMoney(eggIn)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Penjualan Pakan</span>
                      <span className="font-black text-green-600">{formatMoney(feedIn)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Penjualan Afkir</span>
                      <span className="font-black text-green-600">{formatMoney(afkirIn)}</span>
                    </div>
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Masuk</span>
                      <span className="text-lg font-black text-slate-900">{formatMoney(totalMasuk)}</span>
                    </div>
                  </>
                )}
                {detailModal === 'keluar' && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pembelian Pakan</span>
                      <span className="font-black text-blue-600">{formatMoney(feedOut)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pembelian Telur</span>
                      <span className="font-black text-blue-600">{formatMoney(eggOut)}</span>
                    </div>
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Keluar</span>
                      <span className="text-lg font-black text-slate-900">{formatMoney(totalKeluar)}</span>
                    </div>
                  </>
                )}
                {detailModal === 'net' && (
                  <>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                      <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Total Masuk</span>
                      <span className="font-black text-green-700">{formatMoney(totalMasuk)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Total Keluar</span>
                      <span className="font-black text-blue-700">{formatMoney(totalKeluar)}</span>
                    </div>
                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Selisih Bersih</span>
                      <span className={cn("text-lg font-black", net >= 0 ? "text-green-600" : "text-red-500")}>
                        {net >= 0 ? '+' : ''}{formatMoney(net)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <button 
                onClick={() => setDetailModal(null)}
                className="w-full h-10 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </SectionContainer>
  );
}
