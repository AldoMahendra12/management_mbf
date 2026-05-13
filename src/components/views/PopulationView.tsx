import React from 'react';
import { Plus, TrendingUp, History, UserMinus, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionContainer } from '../layout/SectionContainer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDashboard } from '../../contexts/DashboardContext';

export function PopulationView() {
  const { 
    userRole, 
    setIsAfkirModalOpen, 
    afkirTransactions, 
    formatMoney 
  } = useDashboard();

  const totalEkor = afkirTransactions.reduce((acc, curr) => acc + (curr.qty_ekor || 0), 0);
  const totalRevenue = afkirTransactions.reduce((acc, curr) => acc + (curr.total_harga || 0), 0);

  return (
    <SectionContainer className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Afkir Ayam</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Pantau data penjualan ayam afkir dan kontribusinya ke keuangan
          </p>
        </div>
        <Button 
          disabled={userRole === 'viewer'}
          className="group relative overflow-hidden bg-orange-500 hover:bg-orange-600 text-white h-11 px-6 font-black text-xs uppercase tracking-widest rounded-xl active:bg-white active:text-slate-900 shadow-lg shadow-orange-500/20 transition-all duration-300" 
          onClick={() => setIsAfkirModalOpen(true)}
        >
          <div className="relative z-10 flex items-center gap-2">
            <Plus size={18} />
            <div className="flex h-4 overflow-hidden">
              {"Catat Penjualan Afkir".split('').map((char, i) => (
                <span key={i} className="relative inline-block overflow-hidden">
                  <span 
                    className="block transition-transform duration-500 group-hover:-translate-y-full"
                    style={{ transitionDelay: `${i * 30}ms` }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                  <span 
                    className="block absolute top-0 left-0 transition-transform duration-500 translate-y-full group-hover:translate-y-0"
                    style={{ transitionDelay: `${i * 30}ms` }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </Button>
      </div>

      {/* Afkir Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Ayam Afkir */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm relative overflow-hidden transition-all">
          <div className="relative z-10 flex items-start justify-between mb-4">
            <UserMinus size={24} className="text-blue-500" />
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest px-2 py-1">
              Populasi
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Ayam Afkir</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{totalEkor.toLocaleString('id-ID')} <span className="text-sm text-slate-400 font-black uppercase ml-1 tracking-widest">Ekor</span></h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1.5 opacity-70">Akumulasi seluruh penjualan afkir</p>
          </div>
        </div>

        {/* Total Hasil Penjualan */}
        <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm relative overflow-hidden transition-all">
          <div className="relative z-10 flex items-start justify-between mb-4">
            <TrendingUp size={24} className="text-emerald-500" />
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest px-2 py-1">
              Pendapatan
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Hasil Penjualan</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{formatMoney(totalRevenue)}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1.5 opacity-70 italic uppercase tracking-widest">Otomatis masuk ke arus kas keuangan</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border-slate-200/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <History size={18} className="text-slate-400" />
                Riwayat Penjualan Afkir
              </CardTitle>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70 italic">Semua hasil penjualan otomatis tercatat dalam arus kas keuangan</p>
            </div>
            <div className="flex items-center gap-2">
               <Badge variant="outline" className="text-[10px] font-black border-slate-200 text-slate-400">
                  {afkirTransactions.length} TRANSAKSI
               </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full min-w-0">
        <Table>
              <TableHeader>
                <TableRow className="border-b-2 border-slate-100 hover:bg-transparent">
                  <TableHead className="h-12 text-[10px] font-black uppercase text-slate-400 pl-6">Tanggal</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase text-slate-400">Mitra/Pembeli</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase text-slate-400 text-center">Jumlah (Qty)</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase text-slate-400 text-right">Harga Satuan</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase text-slate-400 text-right pr-6">Total Hasil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {afkirTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState 
                        icon={History} 
                        title="Belum ada data afkir" 
                        description="Silakan catat penjualan afkir untuk melihat riwayat di sini." 
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  afkirTransactions.map((t, i) => (
                    <TableRow key={t.id || i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="py-4 pl-6 text-[11px] font-bold text-slate-400">
                        {new Date(t.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="py-4 text-[12px] font-black uppercase text-slate-900 tracking-tight">
                        {t.mitra_name || 'Umum'}
                      </TableCell>
                      <TableCell className="py-4 text-center text-[12px] font-black text-slate-600">
                        {t.qty_ekor} <span className="text-[10px] text-slate-400 font-bold ml-0.5">EKOR</span>
                      </TableCell>
                      <TableCell className="py-4 text-right text-[11px] font-bold text-slate-400 tabular-nums">
                        {formatMoney(t.harga_per_satuan)}
                      </TableCell>
                      <TableCell className="py-4 text-right pr-6 text-[12px] font-black text-emerald-600 tabular-nums">
                        {formatMoney(t.total_harga)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </div>
          </CardContent>
        </Card>
      </div>
    </SectionContainer>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
