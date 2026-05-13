import React, { useState, useMemo } from 'react';
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
import { motion, AnimatePresence } from 'motion/react';
import { SectionContainer } from '../layout/SectionContainer';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';
import { useDashboard } from '../../contexts/DashboardContext';

export function DashboardView() {
  const [activityPage, setActivityPage] = useState(1);
  const [showNotifs, setShowNotifs] = useState(false);
  const { 
    dashboardStats, 
    eggReceivables, 
    eggPayables,
    feedRecv, 
    feedPayables,
    feedItems,
    recentCombinedActivities, 
    setActiveTab,
    formatMoney,
    user
  } = useDashboard();
  
  // Compute top debtors (piutang)
  const topPiutang = useMemo(() => {
    return [
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
  }, [eggReceivables, feedRecv]);

  // Compute top utang
  const topUtang = useMemo(() => {
    return [
      ...(eggPayables || []).map(t => ({ ...t, source: 'Telur' })),
      ...(feedPayables || []).map(t => ({ ...t, source: 'Pakan' }))
    ]
      .filter(t => (t.total_harga || t.total_tagihan || 0) - (t.jumlah_dibayar ?? t.dibayar_hari_ini ?? 0) > 0)
      .sort((a, b) => ((b.total_harga || b.total_tagihan || 0) - (b.jumlah_dibayar ?? b.dibayar_hari_ini ?? 0)) - ((a.total_harga || a.total_tagihan || 0) - (a.jumlah_dibayar ?? a.dibayar_hari_ini ?? 0)))
      .slice(0, 4)
      .map(row => ({
        customer: (row.nama_mitra || row.keterangan?.replace('Mitra: ', '') || 'Unknown').split('|')[0].trim(),
        remains: (row.total_harga || row.total_tagihan || 0) - (row.jumlah_dibayar ?? row.dibayar_hari_ini ?? 0),
        source: row.source
      }));
  }, [eggPayables, feedPayables]);

  // Activity icon helper
  const getActivityIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('afkir')) return Bird;
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
    const type = (act.jenis_transaksi || '').toLowerCase();
    if (type.includes('afkir') || act.source === 'Afkir') return 'Afkir Ayam';
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

  // Generate dynamic alerts
  const alerts = useMemo(() => {
    const list: any[] = [];
    
    // Critical feed alerts
    feedItems?.forEach((item: any) => {
      if (item.stok_sekarang <= (item.batas_minimum || 50)) {
        list.push({
          id: `feed-${item.id}`,
          type: 'critical',
          title: 'Stok Pakan Kritis',
          message: `${item.nama_bahan} sisa ${item.stok_sekarang} ${item.satuan}. Segera pesan!`,
          time: 'Sekarang'
        });
      }
    });

    // Unpaid receivables alerts
    const unpaidCount = topPiutang.length;
    if (unpaidCount > 0) {
      list.push({
        id: 'piutang-alert',
        type: 'warning',
        title: 'Tagihan Pending',
        message: `Ada ${unpaidCount} mitra dengan piutang yang belum lunas.`,
        time: 'Hari ini'
      });
    }

    return list;
  }, [feedItems, topPiutang]);

  return (
    <SectionContainer className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            Assalamu'alaikum, {formattedName}
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
          <div className="relative">
            <button 
              onClick={() => setShowNotifs(!showNotifs)}
              className={cn(
                "w-11 h-11 rounded-xl bg-white border flex items-center justify-center transition-all shadow-sm relative group",
                showNotifs ? "border-orange-500 text-orange-600 ring-4 ring-orange-500/5" : "border-slate-200 text-slate-400 hover:text-orange-600 hover:border-orange-200"
              )}
            >
              <Bell size={20} />
              {alerts.length > 0 && (
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white group-hover:animate-ping" />
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifs && (
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
            )}
            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  key="notif-dropdown"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
                >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">Notifikasi</h4>
                      <Badge className="bg-orange-500 text-white border-none text-[9px] font-black">{alerts.length} BARU</Badge>
                    </div>
                    
                    <div className="max-h-[350px] overflow-y-auto py-2 custom-scrollbar">
                      {alerts.length > 0 ? alerts.map((notif) => (
                        <div key={notif.id} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 group">
                          <div className="flex gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-xl shrink-0 flex items-center justify-center",
                              notif.type === 'critical' ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"
                            )}>
                              {notif.type === 'critical' ? <AlertCircle size={14} /> : <DollarSign size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{notif.title}</p>
                                <span className="text-[8px] font-bold text-slate-400 uppercase">{notif.time}</span>
                              </div>
                              <p className="text-[11px] font-medium text-slate-500 leading-tight line-clamp-2">
                                {notif.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )) : (
                        <div className="py-12 text-center">
                          <Bell size={24} className="text-slate-200 mx-auto mb-2" />
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tidak ada notifikasi baru</p>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                      <button 
                        onClick={() => setShowNotifs(false)}
                        className="w-full py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                      >
                        Tandai semua dibaca
                      </button>
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>
          </div>
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
          <div className="relative overflow-hidden flex items-center justify-between px-6 py-4 border-t-2 border-orange-500 bg-orange-500 transition-all duration-500">
            <div className="relative z-10 text-[10px] font-black text-white uppercase tracking-widest flex h-4 overflow-hidden">
              {"Lihat tagihan".split('').map((char, i) => (
                <span key={i} className="relative inline-block overflow-hidden">
                  <span className="block transition-transform duration-500 group-hover:-translate-y-full" style={{ transitionDelay: `${i * 30}ms` }}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                  <span className="block absolute top-0 left-0 transition-transform duration-500 translate-y-full group-hover:translate-y-0" style={{ transitionDelay: `${i * 30}ms` }}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                </span>
              ))}
            </div>
            <ArrowRight size={14} className="relative z-10 text-white group-hover:translate-x-1 transition-all duration-500" />
          </div>
        </div>

        {/* Card 2: Total Utang */}
        <div className="bg-white border border-slate-200/50 rounded-xl flex flex-col justify-between group cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 shadow-sm transition-all duration-500 overflow-hidden" onClick={() => setActiveTab('Tagihan')}>
          <div className="p-6 pb-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Utang</p>
            <h3 className={cn("font-black text-slate-900 mt-3 tracking-tighter tabular-nums", (dashboardStats?.hutang || 0) >= 1000000 ? "text-xl" : "text-2xl")}>{formatMoney(dashboardStats?.hutang || 0)}</h3>
            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-70">Kewajiban ke mitra</p>
          </div>
          <div className="relative overflow-hidden flex items-center justify-between px-6 py-4 border-t-2 border-orange-500 bg-orange-500 transition-all duration-500">
            <div className="relative z-10 text-[10px] font-black text-white uppercase tracking-widest flex h-4 overflow-hidden">
              {"Lihat tagihan".split('').map((char, i) => (
                <span key={i} className="relative inline-block overflow-hidden">
                  <span className="block transition-transform duration-500 group-hover:-translate-y-full" style={{ transitionDelay: `${i * 30}ms` }}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                  <span className="block absolute top-0 left-0 transition-transform duration-500 translate-y-full group-hover:translate-y-0" style={{ transitionDelay: `${i * 30}ms` }}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                </span>
              ))}
            </div>
            <ArrowRight size={14} className="relative z-10 text-white group-hover:translate-x-1 transition-all duration-500" />
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
          <div className="relative overflow-hidden flex items-center justify-between px-6 py-4 border-t-2 border-orange-500 bg-orange-500 transition-all duration-500">
            <div className="relative z-10 text-[10px] font-black text-white uppercase tracking-widest flex h-4 overflow-hidden">
              {"Lihat gudang".split('').map((char, i) => (
                <span key={i} className="relative inline-block overflow-hidden">
                  <span className="block transition-transform duration-500 group-hover:-translate-y-full" style={{ transitionDelay: `${i * 30}ms` }}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                  <span className="block absolute top-0 left-0 transition-transform duration-500 translate-y-full group-hover:translate-y-0" style={{ transitionDelay: `${i * 30}ms` }}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                </span>
              ))}
            </div>
            <ArrowRight size={14} className="relative z-10 text-white group-hover:translate-x-1 transition-all duration-500" />
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
          <div className="relative overflow-hidden flex items-center justify-between px-6 py-4 border-t-2 border-orange-500 bg-orange-500 transition-all duration-500">
            <div className="relative z-10 text-[10px] font-black text-white uppercase tracking-widest flex h-4 overflow-hidden">
              {"Lihat gudang".split('').map((char, i) => (
                <span key={i} className="relative inline-block overflow-hidden">
                  <span className="block transition-transform duration-500 group-hover:-translate-y-full" style={{ transitionDelay: `${i * 30}ms` }}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                  <span className="block absolute top-0 left-0 transition-transform duration-500 translate-y-full group-hover:translate-y-0" style={{ transitionDelay: `${i * 30}ms` }}>
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                </span>
              ))}
            </div>
            <ArrowRight size={14} className="relative z-10 text-white group-hover:translate-x-1 transition-all duration-500" />
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
              <motion.div 
                key={i} 
                whileHover="hover"
                className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-orange-300 transition-colors relative overflow-hidden group"
              >
                {/* Hover Gradient Effect */}
                <motion.div
                  variants={{
                    hover: { x: '-10%', y: '-10%', opacity: 1, scale: 2.5 },
                  }}
                  initial={{ x: '-40%', y: '-40%', opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="absolute top-0 left-0 w-48 h-48 bg-orange-500/30 blur-2xl rounded-full pointer-events-none"
                />

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-700 text-[10px] font-black shadow-sm group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-colors duration-300">
                      {item.customer.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-orange-600 transition-colors">{item.source}</span>
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest truncate mb-1 group-hover:text-slate-900 transition-colors">{item.customer}</p>
                  <p className={cn("font-black text-slate-900 tabular-nums tracking-tight transition-all group-hover:scale-105 origin-left", item.remains >= 1000000 ? "text-sm" : "text-base")}>{formatMoney(item.remains)}</p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-80 relative z-10">Belum lunas</p>
              </motion.div>
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
              <motion.div 
                key={i} 
                whileHover="hover"
                className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 shadow-sm flex flex-col justify-between hover:border-orange-300 transition-colors relative overflow-hidden group"
              >
                {/* Hover Gradient Effect */}
                <motion.div
                  variants={{
                    hover: { x: '-10%', y: '-10%', opacity: 1, scale: 2.5 },
                  }}
                  initial={{ x: '-40%', y: '-40%', opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                  className="absolute top-0 left-0 w-48 h-48 bg-orange-500/30 blur-2xl rounded-full pointer-events-none"
                />

                <div className="flex items-center justify-between mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center bg-white border border-slate-200 text-slate-700 text-[10px] font-black shadow-sm group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-colors duration-300">
                      {item.customer.substring(0, 1).toUpperCase()}
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-orange-600 transition-colors">{item.source}</span>
                  </div>
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest truncate mb-1 group-hover:text-slate-900 transition-colors">{item.customer}</p>
                  <p className={cn("font-black text-slate-900 tabular-nums tracking-tight transition-all group-hover:scale-105 origin-left", item.remains >= 1000000 ? "text-sm" : "text-base")}>{formatMoney(item.remains)}</p>
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest opacity-80 relative z-10">Kewajiban bayar</p>
              </motion.div>
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

        <div className="overflow-x-auto min-w-full">
          <div className="min-w-[800px]">

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
                      {(act.mitra_name || act.nama_mitra || act.keterangan?.replace('Mitra: ', '') || 'Umum').split('|')[0].trim()}
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
            <EmptyState 
              icon={Clock} 
              title="Belum ada aktivitas" 
              description="Semua transaksi terbaru Anda akan muncul di sini." 
            />
          )}
        </div>
        </div>
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
