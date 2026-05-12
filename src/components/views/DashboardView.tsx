import React, { useState } from 'react';
import { 
  DollarSign, 
  History, 
  Weight, 
  AlertCircle, 
  Users, 
  ArrowRight,
  MoreHorizontal,
  Egg,
  Truck,
  Package,
  CircleDollarSign,
  Clock,
  ArrowUpRight,
  Bell,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { SectionContainer } from '../layout/SectionContainer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDashboard } from '../../contexts/DashboardContext';

export function DashboardView() {
  const [activityPage, setActivityPage] = useState(1);
  const { 
    dashboardStats, 
    eggReceivables, 
    feedRecv, 
    feedItems,
    recentCombinedActivities, 
    setActiveTab,
    formatMoney,
    user
  } = useDashboard();
  
  // Compute top debtors (piutang)
  const topPiutang = [
    ...(eggReceivables || []).map(t => ({ ...t, source: 'Telur' })), 
    ...((feedRecv || []).filter(t => (t.total_tagihan - (t.dibayar_hari_ini || 0)) > 0).map(t => ({ ...t, source: 'Pakan' })))
  ]
    .filter(t => (t.total_harga || t.total_tagihan || 0) - (t.jumlah_dibayar ?? t.dibayar_hari_ini ?? 0) > 0)
    .sort((a, b) => ((b.total_harga || b.total_tagihan || 0) - (b.jumlah_dibayar ?? b.dibayar_hari_ini ?? 0)) - ((a.total_harga || a.total_tagihan || 0) - (a.jumlah_dibayar ?? a.dibayar_hari_ini ?? 0)))
    .slice(0, 4)
    .map(row => ({
      customer: (row.nama_mitra || row.keterangan?.replace('Mitra: ', '') || 'Unknown').split('|')[0].trim(),
      remains: (row.total_harga || row.total_tagihan || 0) - (row.jumlah_dibayar ?? row.dibayar_hari_ini ?? 0),
      source: row.source
    }));

  // Compute top utang
  const topUtang = [
    ...(feedRecv || []).map(t => ({ ...t, source: 'Pakan' })),
    ...(eggReceivables || []).map(t => ({ ...t, source: 'Telur' }))
  ]
    .filter(t => (t.total_harga || t.total_tagihan || 0) - (t.jumlah_dibayar ?? t.dibayar_hari_ini ?? 0) > 0)
    .sort((a, b) => ((b.total_harga || b.total_tagihan || 0) - (b.jumlah_dibayar ?? b.dibayar_hari_ini ?? 0)) - ((a.total_harga || a.total_tagihan || 0) - (a.jumlah_dibayar ?? a.dibayar_hari_ini ?? 0)))
    .slice(0, 4)
    .map(row => ({
      customer: (row.nama_mitra || row.keterangan?.replace('Mitra: ', '') || 'Unknown').split('|')[0].trim(),
      remains: (row.total_harga || row.total_tagihan || 0) - (row.jumlah_dibayar ?? row.dibayar_hari_ini ?? 0),
      source: row.source
    }));

  // Activity icon helper
  const getActivityIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('telur') || t.includes('setoran')) return Egg;
    if (t.includes('jual') || t.includes('kirim')) return Truck;
    if (t.includes('pakan') || t.includes('masuk')) return Package;
    return CircleDollarSign;
  };

  // Activity status helper
  const getActivityStatus = (act: any) => {
    const total = act.total_harga || act.total_tagihan || 0;
    const paid = act.jumlah_dibayar ?? act.dibayar_hari_ini ?? 0;
    if (total <= 0) return { label: 'SELESAI', color: 'bg-emerald-500' };
    if (paid >= total) return { label: 'LUNAS', color: 'bg-emerald-500' };
    if (paid > 0) return { label: 'SEBAGIAN', color: 'bg-amber-500' };
    return { label: 'BELUM BAYAR', color: 'bg-rose-500' };
  };

  // Activity name helper
  const getActivityName = (act: any) => {
    const type = act.jenis_transaksi?.toLowerCase() || '';
    if (type.includes('afkir')) return 'Afkir';
    if (type.includes('jual pakan') || type.includes('pakan_keluar')) return 'Jual Pakan';
    if (type.includes('beli pakan') || type.includes('pakan_masuk') || type.includes('tambah stok')) return 'Beli Pakan';
    if (type.includes('jual telur') || act.source === 'Telur') return 'Jual Telur';
    if (type.includes('beli telur')) return 'Beli Telur';
    return act.jenis_transaksi || 'Aktivitas';
  };

  // Activity detail helper
  const getActivityDetail = (act: any) => {
    if (act.source === 'Afkir' || act.jenis_transaksi?.toLowerCase().includes('afkir')) {
      return `${act.qty_ekor || 0} Ekor Ayam`;
    }
    if (act.source === 'Telur') {
      return `${act.jumlah_kg || act.total_kg || 0} kg Telur`;
    }
    if (act.details && act.details.length > 0) {
      const totalQty = act.details.reduce((sum: number, d: any) => sum + (d.qty || 0), 0);
      if (act.details.length === 1) {
        const bahanItem = feedItems?.find((f: any) => String(f.id) === String(act.details[0].bahan_id));
        return `${totalQty} ${bahanItem?.satuan || 'sak'} ${bahanItem?.nama_bahan || 'Pakan'}`;
      }
      return `${totalQty} item (Berbagai Pakan)`;
    }
    return 'Item Pakan';
  };

  // User formatting
  const rawEmail = user?.email?.split('@')[0] || 'User';
  const lowercaseName = rawEmail.toLowerCase();
  let formattedName = rawEmail.charAt(0).toUpperCase() + rawEmail.slice(1);
  
  if (lowercaseName === 'hasan' || lowercaseName === 'imam') {
    formattedName = `Pak ${formattedName}`;
  } else if (lowercaseName === 'latifun') {
    formattedName = `Bu ${formattedName}`;
  }

  return (
    <SectionContainer className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Selamat datang, {formattedName}
            <motion.span 
              animate={{ rotate: [0, 15, -10, 15, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="inline-block origin-bottom-right"
            >
              👋
            </motion.span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Berikut adalah ringkasan data operasional terbaru Anda</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Display */}
          <div className="hidden md:flex flex-col items-end mr-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Hari Ini</p>
            <p className="text-sm font-black text-slate-900 tracking-tight mt-1.5">
              {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Notification Bell */}
          <button className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm relative group">
            <Bell size={20} />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white group-hover:animate-ping" />
          </button>
        </div>
      </div>

      {/* ===== TASK 2: Top Overview Cards (4 Columns) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Piutang */}
        <div className="bg-white border border-slate-200/50 rounded-xl flex flex-col justify-between group cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 shadow-sm transition-all duration-500 overflow-hidden" onClick={() => setActiveTab('Tagihan')}>
          <div className="p-6 pb-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Piutang</p>
            <h3 className={cn("font-black text-slate-900 mt-3 tracking-tighter tabular-nums", (dashboardStats?.piutang || 0) >= 1000000 ? "text-xl" : "text-2xl")}>{formatMoney(dashboardStats?.piutang || 0)}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-70">Sisa tagihan aktif</p>
          </div>
          <div className="relative overflow-hidden flex items-center justify-between px-6 py-4 border-t-2 border-slate-200 bg-slate-50/50 group-hover:border-t-orange-500 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-400 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out z-0" />
            <span className="relative z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors duration-500">Lihat tagihan</span>
            <ArrowRight size={14} className="relative z-10 text-slate-400 group-hover:translate-x-1 group-hover:text-white transition-all duration-500" />
          </div>
        </div>

        {/* Card 2: Total Utang */}
        <div className="bg-white border border-slate-200/50 rounded-xl flex flex-col justify-between group cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 shadow-sm transition-all duration-500 overflow-hidden" onClick={() => setActiveTab('Tagihan')}>
          <div className="p-6 pb-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Utang</p>
            <h3 className={cn("font-black text-slate-900 mt-3 tracking-tighter tabular-nums", (dashboardStats?.hutang || 0) >= 1000000 ? "text-xl" : "text-2xl")}>{formatMoney(dashboardStats?.hutang || 0)}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-70">Kewajiban ke mitra</p>
          </div>
          <div className="relative overflow-hidden flex items-center justify-between px-6 py-4 border-t-2 border-slate-200 bg-slate-50/50 group-hover:border-t-orange-500 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-400 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out z-0" />
            <span className="relative z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors duration-500">Lihat tagihan</span>
            <ArrowRight size={14} className="relative z-10 text-slate-400 group-hover:translate-x-1 group-hover:text-white transition-all duration-500" />
          </div>
        </div>

        {/* Card 3: Stok Telur */}
        <div className="bg-white border border-slate-200/50 rounded-xl flex flex-col justify-between group cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 shadow-sm transition-all duration-500 overflow-hidden" onClick={() => setActiveTab('Gudang Telur')}>
          <div className="p-6 pb-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stok Telur</p>
            <h3 className="font-black text-slate-900 mt-3 tracking-tighter tabular-nums text-2xl">
              {dashboardStats.stokTelur.toLocaleString('id-ID')} <span className="text-sm text-slate-400 font-black tracking-widest uppercase ml-0.5">kg</span>
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-70">Tersedia di gudang</p>
          </div>
          <div className="relative overflow-hidden flex items-center justify-between px-6 py-4 border-t-2 border-slate-200 bg-slate-50/50 group-hover:border-t-orange-500 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-400 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out z-0" />
            <span className="relative z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors duration-500">Lihat gudang</span>
            <ArrowRight size={14} className="relative z-10 text-slate-400 group-hover:translate-x-1 group-hover:text-white transition-all duration-500" />
          </div>
        </div>

        {/* Card 4: Stok Pakan Kritis */}
        <div className={cn(
          "bg-white border border-slate-200/50 rounded-xl flex flex-col justify-between group cursor-pointer transition-all duration-500 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1",
          dashboardStats.criticalFeed > 0 ? "shadow-lg shadow-red-500/10 border-red-100" : "shadow-sm"
        )} onClick={() => setActiveTab('Gudang Pakan')}>
          <div className="p-6 pb-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pakan Kritis</p>
            <h3 className="font-black text-slate-900 mt-3 tracking-tighter tabular-nums text-2xl">
              {dashboardStats.criticalFeed} <span className="text-sm text-slate-400 font-black tracking-widest uppercase ml-0.5">item</span>
            </h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-70">Perlu restock segera</p>
          </div>
          <div className="relative overflow-hidden flex items-center justify-between px-6 py-4 border-t-2 border-slate-200 bg-slate-50/50 group-hover:border-t-orange-500 transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-orange-400 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out z-0" />
            <span className="relative z-10 text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors duration-500">Lihat gudang</span>
            <ArrowRight size={14} className="relative z-10 text-slate-400 group-hover:translate-x-1 group-hover:text-white transition-all duration-500" />
          </div>
        </div>
      </div>

      {/* ===== TASK 3: Middle Section - Wallet-style Piutang & Utang ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Review Piutang Terbesar */}
        <div className="bg-white border border-slate-200/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100/60">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Review Piutang</h3>
            <button 
              onClick={() => setActiveTab('Tagihan')}
              className="px-3 py-1.5 rounded-md text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all duration-300 hover:bg-orange-500 hover:text-white flex items-center gap-1 border border-slate-100 hover:border-orange-500"
            >
              <span className="transition-colors duration-300">Lihat semua</span>
              <ArrowUpRight size={12} className="transition-colors duration-300" />
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {topPiutang.length > 0 ? topPiutang.map((item, i) => (
              <div key={i} className="bg-slate-100 border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-slate-200 text-slate-700 text-xs font-black">
                      {item.customer.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.source}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest truncate mb-1">{item.customer}</p>
                  <p className={cn("font-black text-slate-900 tabular-nums tracking-tight", item.remains >= 1000000 ? "text-sm" : "text-base")}>{formatMoney(item.remains)}</p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-80">Belum lunas</p>
              </div>
            )) : (
              <div className="col-span-2 py-10 text-center">
                <DollarSign size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tidak ada piutang aktif</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Review Utang Terbesar */}
        <div className="bg-white border border-slate-200/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100/60">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Review Utang</h3>
            <button 
              onClick={() => setActiveTab('Tagihan')}
              className="px-3 py-1.5 rounded-md text-[10px] font-black text-slate-400 uppercase tracking-widest transition-all duration-300 hover:bg-orange-500 hover:text-white flex items-center gap-1 border border-slate-100 hover:border-orange-500"
            >
              <span className="transition-colors duration-300">Lihat semua</span>
              <ArrowUpRight size={12} className="transition-colors duration-300" />
            </button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {topUtang.length > 0 ? topUtang.map((item, i) => (
              <div key={i} className="bg-slate-100 border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-slate-200 text-slate-700 text-xs font-black">
                      {item.customer.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.source}</span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest truncate mb-1">{item.customer}</p>
                  <p className={cn("font-black text-slate-900 tabular-nums tracking-tight", item.remains >= 1000000 ? "text-sm" : "text-base")}>{formatMoney(item.remains)}</p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-80">Kewajiban bayar</p>
              </div>
            )) : (
              <div className="col-span-2 py-10 text-center">
                <History size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tidak ada utang aktif</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== TASK 4: Bottom - Recent Activities Table ===== */}
      <div className="bg-white border border-slate-200/50 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100/60">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Aktivitas Terbaru</h3>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/50 border-b border-slate-100/40">
          <div className="col-span-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktivitas</span>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail Item</span>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pelanggan</span>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</span>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah</span>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-50">
          {recentCombinedActivities.length > 0 ? (
            recentCombinedActivities.slice((activityPage - 1) * 5, activityPage * 5).map((act, i) => {
              const IconComponent = getActivityIcon(act.jenis_transaksi);
              const status = getActivityStatus(act);
              const dateObj = new Date(act.tanggal || act.created_at);
              const amount = act.total_harga || act.total_tagihan || 0;

              return (
                <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors group items-center">
                  {/* Activity + Icon */}
                  <div className="col-span-2 flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                      getActivityName(act)?.includes('Jual') ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                    )}>
                      <IconComponent size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className={cn(
                        "text-xs font-black uppercase tracking-tight truncate",
                        getActivityName(act)?.includes('Jual') ? "text-emerald-600" : "text-blue-600"
                      )}>
                        {getActivityName(act)}
                      </p>
                    </div>
                  </div>

                  {/* Detail Item */}
                  <div className="col-span-2">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                      {getActivityDetail(act)}
                    </p>
                  </div>

                  {/* Pelanggan */}
                  <div className="col-span-2">
                    <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate">
                      {(act.nama_mitra || act.keterangan?.replace('Mitra: ', '') || 'Umum').split('|')[0].trim()}
                    </p>
                  </div>

                  {/* Date */}
                  <div className="col-span-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">
                      {dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2">
                    <span className="text-sm font-black text-slate-900 tabular-nums tracking-tighter">
                      {amount > 0 ? formatMoney(amount) : '-'}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <Badge className={cn(
                      "text-[8px] font-black uppercase border-none px-2 py-0.5",
                      status.label === 'LUNAS' ? "bg-emerald-100 text-emerald-600" :
                      status.label === 'SEBAGIAN' ? "bg-amber-100 text-amber-600" :
                      "bg-rose-100 text-rose-600"
                    )}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <Clock size={32} className="text-slate-200 mb-3" />
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Belum ada aktivitas tercatat</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {recentCombinedActivities.length > 5 && (
          <div className="flex justify-center items-center py-4 border-t border-slate-50 gap-2">
            {[1, 2, 3].map(p => {
              const totalPages = Math.ceil((recentCombinedActivities?.length || 0) / 5);
              const isDisabled = p > totalPages;
              
              return (
                <button
                  key={p}
                  onClick={() => !isDisabled && setActivityPage(p)}
                  disabled={isDisabled}
                  className={cn(
                    "w-6 h-6 rounded flex items-center justify-center text-[10px] font-black transition-colors",
                    activityPage === p ? "bg-slate-900 text-white" 
                    : isDisabled ? "bg-slate-50 text-slate-300 cursor-not-allowed" 
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
