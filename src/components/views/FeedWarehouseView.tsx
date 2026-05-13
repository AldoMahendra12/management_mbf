import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ShoppingCart, 
  Package, 
  Search, 
  Filter, 
  ChevronDown, 
  NotebookPen, 
  Info,
  ArrowDownLeft,
  ArrowUpRight,
  MessageSquare,
  DollarSign,
  Trash2,
  History
} from 'lucide-react';
import { motion } from 'motion/react';
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

export function FeedWarehouseView() {
  const {
    isLoading,
    feedItems,
    feedTransactions,
    userRole,
    setMitraName,
    setFeedCart,
    setFeedModalType,
    feedTypeFilter,
    setFeedTypeFilter,
    feedSearchQuery,
    setFeedSearchQuery,
    feedMonthFilter,
    setFeedMonthFilter,
    feedMitraFilter,
    setFeedMitraFilter,
    setSelectedFeedDetail,
    setIsFeedDetailOpen,
    formatMoney,
    setActiveTab,
    setBillingMode,
    setBillingSubMode,
    handleDeleteFeedTransaction
  } = useDashboard();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  
  const processedFeeds = feedTransactions.map(trx => {
    const detailsCount = trx.details?.length || 0;
    const firstDetail = trx.details?.[0];
    const bahanItem = feedItems.find(f => String(f.id) === String(firstDetail?.bahan_id));
    
    return {
      ...trx,
      nama_bahan_utama: bahanItem?.nama_bahan || 'Multi-item',
      satuan_utama: bahanItem?.satuan || 'Unit',
      tambahan_count: detailsCount > 1 ? detailsCount - 1 : 0
    };
  });

  const uniqueFeedMonths = Array.from(new Set(processedFeeds.map(f => f.tanggal?.substring(0, 7)))).filter(Boolean).sort().reverse();
  const uniqueFeedMitras = Array.from(new Set(processedFeeds.map(f => (f.nama_mitra || f.keterangan?.split('|')[0]?.replace('Mitra: ', '').trim())))).filter(Boolean).sort();

  const filteredFeeds = processedFeeds.filter(row => {
    const rawJenis = row.jenis_transaksi?.toLowerCase() || '';
    const normalizedJenis = (rawJenis === 'masuk gudang' || rawJenis === 'beli pakan') ? 'Beli Pakan' : 
                            (rawJenis === 'keluar' || rawJenis === 'jual pakan') ? 'Jual Pakan' : row.jenis_transaksi;

    const matchesSearch = row.id?.toLowerCase().includes(feedSearchQuery.toLowerCase()) || 
                         row.keterangan?.toLowerCase().includes(feedSearchQuery.toLowerCase()) ||
                         row.nama_bahan_utama?.toLowerCase().includes(feedSearchQuery.toLowerCase());
    const matchesType = feedTypeFilter === 'Semua' || (row.jenis_transaksi === feedTypeFilter) || ((row.jenis_transaksi === 'Masuk Gudang' || row.jenis_transaksi === 'Beli Pakan') && feedTypeFilter === 'Beli Pakan') || ((row.jenis_transaksi === 'Keluar' || row.jenis_transaksi === 'Jual Pakan') && feedTypeFilter === 'Jual Pakan');
    const matchesMonth = feedMonthFilter === 'all' || (row.tanggal || '').startsWith(feedMonthFilter);
    const matchesMitra = feedMitraFilter === 'Semua' || (row.nama_mitra || row.keterangan?.split('|')[0]?.replace('Mitra: ', '').trim() || 'Umum') === feedMitraFilter;
    
    return matchesSearch && matchesType && matchesMonth && matchesMitra;
  });

  const totalPages = Math.ceil(filteredFeeds.length / pageSize);
  const paginatedData = filteredFeeds.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [feedSearchQuery, feedTypeFilter, feedMonthFilter, feedMitraFilter]);

  const totalMasukFeed = feedTransactions
    .filter(t => t.jenis_transaksi === 'Beli Pakan' || t.jenis_transaksi === 'Masuk Gudang')
    .reduce((acc, t) => acc + (t.total_tagihan || 0), 0);

  const totalKeluarFeed = feedTransactions
    .filter(t => t.jenis_transaksi === 'Jual Pakan' || t.jenis_transaksi === 'Keluar')
    .reduce((acc, t) => acc + (t.total_tagihan || 0), 0);

  return (
    <SectionContainer className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gudang Pakan</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manajemen stok pakan, obat-obatan, dan suplemen</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            disabled={userRole === 'viewer'}
            className="group relative overflow-hidden bg-orange-500 hover:bg-orange-600 text-white h-11 px-6 font-black text-xs uppercase tracking-widest rounded-xl active:bg-white active:text-slate-900 shadow-lg shadow-orange-500/20 transition-all duration-300" 
            onClick={() => {
              setMitraName('');
              setFeedCart([{ id_bahan: '', qty: 0, harga_per_satuan: 0 }]);
              setFeedModalType('beli');
            }}
          >
            <div className="relative z-10 flex items-center gap-2">
              <Plus size={18} />
              <div className="flex h-4 overflow-hidden">
                {"Beli Pakan".split('').map((char, i) => (
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
            className="group relative overflow-hidden bg-orange-500 hover:bg-orange-600 text-white h-11 px-6 font-black text-xs uppercase tracking-widest rounded-lg active:bg-white active:text-slate-900 shadow-lg shadow-orange-500/20 transition-all duration-300" 
            onClick={() => {
              setMitraName('');
              setFeedCart([{ id_bahan: '', qty: 0, harga_per_satuan: 0 }]);
              setFeedModalType('jual');
            }}
          >
            <div className="relative z-10 flex items-center gap-2">
              <ShoppingCart size={18} />
              <div className="flex h-4 overflow-hidden">
                {"Jual Pakan".split('').map((char, i) => (
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-xl">
             <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Loading data...</p>
             </div>
          </div>
        )}
        
        {feedItems.map((card, i) => {
          const isMenipis = card.stok_sekarang <= (card.batas_minimum || 50);
          const isKritis = card.stok_sekarang <= (card.batas_minimum || 50) / 2;
          const statusText = isKritis ? 'Kritis' : isMenipis ? 'Menipis' : 'Aman';
          const statusColor = isKritis ? 'bg-red-500' : isMenipis ? 'bg-amber-500' : 'bg-green-500';
          const percent = Math.min(100, (card.stok_sekarang / ((card.batas_minimum || 50) * 5)) * 100);

          return (
            <div key={i} className={cn(
              "card-premium p-3 md:p-4 flex flex-col justify-between group transition-all cursor-default hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 min-w-0",
              isKritis ? "border-red-200/60 bg-red-50/10 shadow-lg shadow-red-500/20" : 
              isMenipis ? "border-amber-200/60 bg-amber-50/10 shadow-lg shadow-amber-500/20" : ""
            )}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.nama_bahan}</p>
                <Package size={14} className={cn("text-slate-300", isMenipis && !isKritis ? "text-amber-500" : isKritis ? "text-red-500" : "text-green-500")} />
              </div>
              <div className="mt-2 md:mt-4 mb-2">
                <h4 className="text-xl md:text-2xl font-black text-slate-900 leading-none">{card.stok_sekarang} <span className="text-[10px] font-bold text-slate-400 ml-1">{card.satuan}</span></h4>
              </div>
              <div className="space-y-3">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 1, delay: 0.1 * i }}
                    className={cn("h-full", statusColor)} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400">Min: {card.batas_minimum || 0} {card.satuan}</span>
                  <Badge className={cn(
                    "text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border-none shadow-none",
                    statusText === 'Aman' ? "bg-green-100 text-green-600" :
                    statusText === 'Menipis' ? "bg-amber-100 text-amber-600" :
                    "bg-red-100 text-red-600"
                  )}>
                    {statusText}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card-premium overflow-hidden border border-slate-200/60 shadow-sm flex flex-col min-w-0">
        <div className="bg-white px-6 md:px-10 py-8 border-b border-slate-100 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                <NotebookPen size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight uppercase tracking-widest">Buku Catatan Pakan</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Riwayat Arus Barang & Transaksi Pakan</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Cari Mitra, ID Transaksi, atau Nama Bahan..." 
                className="w-full h-11 bg-slate-50 border-slate-200 rounded-xl pl-12 pr-4 text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900/5 transition-all outline-none"
                value={feedSearchQuery}
                onChange={(e) => setFeedSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner shrink-0">
              {(['Semua', 'Beli Pakan', 'Jual Pakan'] as const).map((t) => (
                <button 
                  key={t}
                  onClick={() => setFeedTypeFilter(t as any)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    feedTypeFilter === t ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-slate-400 hover:text-slate-600"
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
                      className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                      value={feedMonthFilter}
                      onChange={(e) => setFeedMonthFilter(e.target.value)}
                    >
                      <option value="all">Semua Waktu</option>
                      {uniqueFeedMonths.map(m => (
                        <option key={m} value={m}>{new Date(m + '-01').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Mitra / Supplier</label>
                    <select 
                      className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
                      value={feedMitraFilter}
                      onChange={(e) => setFeedMitraFilter(e.target.value)}
                    >
                      <option value="Semua">Semua Mitra</option>
                      {uniqueFeedMitras.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="overflow-x-auto w-full min-w-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="pl-10 h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu / Nota</TableHead>
              <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis</TableHead>
              <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</TableHead>
              <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Item</TableHead>
              <TableHead className="h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tagihan</TableHead>
              <TableHead className="pr-10 h-12 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Memuat data...</TableCell>
              </TableRow>
            ) : filteredFeeds.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState 
                        icon={History} 
                        title="Catatan Kosong" 
                        description="Tidak ditemukan riwayat transaksi pakan untuk kriteria ini." 
                      />
                    </TableCell>
                </TableRow>
            ) : paginatedData.map((row, i) => {
              const jt = row.jenis_transaksi?.toLowerCase() || '';
              const displayJenis = jt === 'masuk gudang' || jt === 'beli pakan' ? 'Beli Pakan' : 
                                   jt === 'keluar' || jt === 'jual pakan' ? 'Jual Pakan' : 
                                   row.jenis_transaksi;
              const isBeli = displayJenis === 'Beli Pakan';

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
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{(row.nama_mitra || row.keterangan?.split('|')[0]?.replace('Mitra: ', '') || 'Umum').trim()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <span className="text-xs font-black text-slate-900 tabular-nums">
                      {(row.details || []).reduce((acc: number, d: any) => acc + (d.qty || 0), 0)} {(row.details?.[0] as any)?.satuan || row.satuan_utama}
                    </span>
                  </TableCell>
                  <TableCell className="text-left">
                    <span className="text-xs font-black tabular-nums text-slate-900">
                      {formatMoney(row.total_tagihan || 0)}
                    </span>
                  </TableCell>
                  <TableCell className="pr-10 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-lg text-slate-300 hover:text-orange-600 hover:bg-orange-50 hover:shadow-sm transition-all"
                        onClick={() => {
                          setSelectedFeedDetail(row);
                          setIsFeedDetailOpen(true);
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
                          setBillingMode('pakan');
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
                          onClick={() => handleDeleteFeedTransaction(row.id)}
                          title="Hapus Data"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
            }
          </TableBody>
        </Table>
        </div>

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
