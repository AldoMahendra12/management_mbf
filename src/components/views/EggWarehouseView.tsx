import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronDown, 
  NotebookPen, 
  Info,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  MessageSquare,
  DollarSign,
  Trash2,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { SectionContainer } from '../layout/SectionContainer';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

import { useDashboard } from '../../contexts/DashboardContext';

export function EggWarehouseView() {
  const {
    isLoading,
    eggTransactions,
    userRole,
    eggSearchQuery,
    setEggSearchQuery,
    eggTypeFilter,
    setEggTypeFilter,
    eggMonthFilter,
    setEggMonthFilter,
    eggMitraFilter,
    setEggMitraFilter,
    setSelectedEggDetail,
    setIsEggDetailOpen,
    setEggModalType,
    setMitraName,
    setEggIkat,
    setEggPrice,
    eggStock,
    formatMoney,
    setActiveTab,
    setBillingMode,
    setBillingSubMode,
    handleDeleteEggTransaction
  } = useDashboard();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const uniqueEggMonths = Array.from(new Set(eggTransactions.map(t => t.tanggal?.substring(0, 7)))).filter(Boolean).sort().reverse();
  const uniqueEggMitras = Array.from(new Set(eggTransactions.map(t => t.keterangan?.split('|')[0]?.replace('Mitra: ', '').trim()))).filter(Boolean).sort();


  const filteredTransactions = eggTransactions.filter(row => {
    const rawJenis = row.jenis_transaksi?.toLowerCase() || '';
    const normalizedJenis = (rawJenis === 'terima setoran' || rawJenis === 'beli telur') ? 'Beli Telur' : 
                            (rawJenis === 'jual ke luar' || rawJenis === 'jual telur') ? 'Jual Telur' : row.jenis_transaksi;
    
    const matchesSearch = (row.id || '').toLowerCase().includes(eggSearchQuery.toLowerCase()) || 
                         (row.keterangan || '').toLowerCase().includes(eggSearchQuery.toLowerCase());
    const matchesType = eggTypeFilter === 'Semua' || normalizedJenis === eggTypeFilter;
    const matchesMonth = eggMonthFilter === 'all' || (row.tanggal || '').startsWith(eggMonthFilter);
    const matchesMitra = eggMitraFilter === 'Semua' || (row.keterangan?.split('|')[0]?.replace('Mitra: ', '').trim() || 'Umum') === eggMitraFilter;
    return matchesSearch && matchesType && matchesMonth && matchesMitra;
  });

  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedData = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [eggSearchQuery, eggTypeFilter, eggMonthFilter, eggMitraFilter]);


  const totalMasukEgg = eggTransactions
    .filter(t => t.jenis_transaksi === 'Beli Telur')
    .reduce((acc, t) => acc + (t.jumlah_kg || 0), 0);

  const totalKeluarEgg = eggTransactions
    .filter(t => t.jenis_transaksi === 'Jual Telur')
    .reduce((acc, t) => acc + (t.jumlah_kg || 0), 0);

  return (
    <SectionContainer className="space-y-6">
      <div className="flex items-center justify-between bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gudang Telur</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manajemen stok dan distribusi hasil produksi telur</p>
        </div>
        <div className="flex gap-3">
            <Button 
                disabled={userRole === 'viewer'}
                className="group relative overflow-hidden bg-orange-500 hover:bg-orange-600 text-white h-11 px-6 font-black text-xs uppercase tracking-widest rounded-xl active:bg-white active:text-slate-900 shadow-lg shadow-orange-500/20 transition-all duration-300" 
                onClick={() => {
                    setMitraName('');
                    setEggIkat(0);
                    setEggPrice(25000);
                    setEggModalType('terima');
                }}
            >
                <div className="relative z-10 flex items-center gap-2">
                    <Plus size={18} />
                    <div className="flex h-4 overflow-hidden">
                        {"Beli Telur".split('').map((char, i) => (
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
            <Button 
                disabled={userRole === 'viewer'}
                className="group relative overflow-hidden bg-orange-500 hover:bg-orange-600 text-white h-11 px-6 font-black text-xs uppercase tracking-widest rounded-xl active:bg-white active:text-slate-900 shadow-lg shadow-orange-500/20 transition-all duration-300" 
                onClick={() => {
                    setMitraName('');
                    setEggIkat(0);
                    setEggPrice(27500);
                    setEggModalType('jual');
                }}
            >
                <div className="relative z-10 flex items-center gap-2">
                    <ShoppingCart size={18} />
                    <div className="flex h-4 overflow-hidden">
                        {"Jual Telur".split('').map((char, i) => (
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
      </div>

      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Total Beli Telur', val: `${totalMasukEgg.toLocaleString('id-ID')} kg`, sub: 'Total telur diterima dari kandang' },
          { label: 'Total Jual Telur', val: `${totalKeluarEgg.toLocaleString('id-ID')} kg`, sub: 'Total telur terjual ke mitra' },
          { label: 'Stok Gudang Telur', val: `${((eggStock?.horn || 0) + (eggStock?.arab || 0)).toLocaleString('id-ID')} kg`, sub: 'Sisa stok telur di gudang' },
        ].map((card, i) => (
          <div key={i} className="card-premium p-6 flex flex-col justify-between h-[140px]">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
             <div>
               <h3 className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">{card.val}</h3>
               <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-70">{card.sub}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="card-premium overflow-hidden border border-slate-200/60 shadow-sm flex flex-col">
        <div className="bg-white px-10 py-8 border-b border-slate-100 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                <NotebookPen size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight uppercase tracking-widest">Buku Catatan Telur</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Arus Masuk Keluar Telur CV BEF</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Cari ID Transaksi, Mitra, atau Keterangan..." 
                className="w-full h-11 bg-slate-50 border-slate-200 rounded-xl pl-12 pr-4 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-orange-500/5 transition-all outline-none"
                value={eggSearchQuery}
                onChange={(e) => setEggSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner shrink-0">
              {(['Semua', 'Beli Telur', 'Jual Telur'] as const).map((t) => (
                <button 
                  key={t}
                  onClick={() => setEggTypeFilter(t as any)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    eggTypeFilter === t ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 rounded-xl border-slate-200 bg-white gap-2 px-4 text-xs font-black text-slate-600 hover:bg-slate-50">
                  <Filter size={16} />
                  Filter Lanjutan
                  <ChevronDown size={14} className="text-slate-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4 rounded-2xl shadow-2xl border-slate-100" align="end">
                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Bulan Transaksi</label>
                    <select 
                      className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/5 transition-all"
                      value={eggMonthFilter}
                      onChange={(e) => setEggMonthFilter(e.target.value)}
                    >
                      <option value="all">Semua Waktu</option>
                      {uniqueEggMonths.map(m => (
                        <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mitra / Supplier</label>
                    <select 
                      className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/5 transition-all"
                      value={eggMitraFilter}
                      onChange={(e) => setEggMitraFilter(e.target.value)}
                    >
                      <option value="Semua">Semua Mitra</option>
                      {uniqueEggMitras.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="pl-10 h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu / Invoice</TableHead>
              <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis</TableHead>
              <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</TableHead>
              <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kuantitas (kg)</TableHead>
              <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal</TableHead>
              <TableHead className="pr-10 h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat data...</TableCell>
                </TableRow>
            ) : paginatedData.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState 
                        icon={History} 
                        title="Transaksi Kosong" 
                        description="Tidak ditemukan riwayat transaksi telur untuk kriteria ini." 
                      />
                    </TableCell>
                </TableRow>
            ) : paginatedData.map((row, i) => {
              const jt = row.jenis_transaksi?.toLowerCase() || '';
              const displayJenis = jt === 'terima setoran' || jt === 'beli telur' ? 'Beli Telur' : 
                                   jt === 'jual ke luar' || jt === 'jual telur' ? 'Jual Telur' : 
                                   row.jenis_transaksi;
              const isBeli = displayJenis === 'Beli Telur';

              return (
                <TableRow key={row.id || i} className="group hover:bg-slate-50 transition-colors border-slate-50">
                  <TableCell className="pl-10 py-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{row.id?.slice(0, 8).toUpperCase()}</span>
                    <span className="text-[9px] font-bold text-slate-400">{new Date(row.tanggal || row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </TableCell>
                  <TableCell>
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight",
                      !isBeli ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    )}>
                      {!isBeli ? <ArrowUpRight size={10}/> : <ArrowDownLeft size={10}/>}
                      {displayJenis}
                    </div>
                  </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                        {(row.keterangan?.split('|')[0]?.replace('Mitra: ', '') || 'Umum').trim()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  <span className="text-xs font-black text-slate-900 tabular-nums">{(row.jumlah_kg || 0).toLocaleString('id-ID')} kg</span>
                </TableCell>
                  <TableCell className="text-left">
                    <span className="text-xs font-black tabular-nums text-slate-900">
                      {formatMoney(row.total_harga || 0)}
                    </span>
                  </TableCell>
                  <TableCell className="pr-10 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-orange-600 hover:bg-orange-50 hover:shadow-sm transition-all"
                        onClick={() => {
                          setSelectedEggDetail(row);
                          setIsEggDetailOpen(true);
                        }}
                        title="Detail Transaksi"
                      >
                        <Info size={16} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-orange-600 hover:bg-orange-50 hover:shadow-sm transition-all"
                        onClick={() => {
                          setBillingMode('telur');
                          setBillingSubMode('piutang');
                          setActiveTab('Tagihan');
                        }}
                        title="Lihat Tagihan"
                      >
                        <DollarSign size={16} />
                      </Button>
                      {userRole !== 'viewer' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 hover:shadow-sm transition-all"
                          onClick={() => handleDeleteEggTransaction(row.id)}
                          title="Hapus Data"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-slate-50/30">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Halaman {currentPage} dari {Math.max(1, totalPages)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest"
            >
              Prev
            </Button>
            {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "h-8 w-8 p-0 rounded-lg text-[9px] font-black",
                  currentPage === i + 1 ? "bg-orange-500 hover:bg-orange-600 border-orange-500 text-white" : ""
                )}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </SectionContainer>
  );
}
