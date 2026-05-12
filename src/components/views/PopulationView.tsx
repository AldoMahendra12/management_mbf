import React from 'react';
import { Plus, TrendingUp, History, UserMinus, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionContainer } from '../layout/SectionContainer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      <div className="flex items-center justify-between bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Afkir Ayam</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-2 flex items-center">
            <TrendingUp size={12} className="text-orange-500" />
            Pantau data penjualan ayam afkir dan kontribusinya ke keuangan
          </p>
        </div>
        <Button 
          disabled={userRole === 'viewer'}
          className="bg-orange-600 hover:bg-orange-700 text-white h-11 px-6 gap-2 shadow-lg shadow-orange-500/20 font-black text-xs uppercase tracking-widest rounded-lg transition-all active:scale-95" 
          onClick={() => setIsAfkirModalOpen(true)}
        >
          <Plus size={18} />
          Catat Penjualan Afkir
        </Button>
      </div>

      {/* Afkir Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Ayam Afkir */}
        <div className="bg-white border border-orange-100 rounded-xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-orange-300 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/80 to-transparent pointer-events-none group-hover:from-orange-50 transition-colors" />
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserMinus size={18} className="text-orange-600" />
            </div>
            <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest bg-orange-50 px-2 py-1 rounded-full border border-orange-100">
              Populasi
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-orange-600 transition-colors">Total Ayam Afkir</p>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{totalEkor.toLocaleString('id-ID')} <span className="text-sm text-slate-400 font-black uppercase ml-1 tracking-widest">Ekor</span></h3>
            <p className="text-[9px] font-bold text-slate-400 mt-1.5 opacity-70">Akumulasi seluruh penjualan afkir</p>
          </div>
        </div>

        {/* Total Hasil Penjualan */}
        <div className="bg-white border border-emerald-100 rounded-xl p-6 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-emerald-300 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 to-transparent pointer-events-none group-hover:from-emerald-50 transition-colors" />
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp size={18} className="text-emerald-600" />
            </div>
            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
              Pendapatan
            </span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-emerald-600 transition-colors">Total Hasil Penjualan</p>
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
                    <TableCell colSpan={5} className="h-32 text-center text-slate-400 italic text-xs">
                      Belum ada data penjualan ayam afkir yang dicatat.
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
          </CardContent>
        </Card>
      </div>
    </SectionContainer>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
