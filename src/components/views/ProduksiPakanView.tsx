import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FlaskConical, Plus, Trash2, ChevronDown, ChevronUp, Package, BarChart3, Layers, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';
import { useDashboard } from '../../contexts/DashboardContext';
import { SectionContainer } from '../layout/SectionContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ResepDetail {
  id?: string;
  bahan_id: string;
  qty_per_batch: number;
  satuan?: string;
}

interface Resep {
  id: string;
  nama_resep: string;
  deskripsi?: string;
  hasil_setel: number;
  details?: ResepDetail[];
}

interface ProduksiDetail {
  bahan_id: string;
  qty_used: number;
  harga_satuan: number;
  subtotal: number;
}

interface Produksi {
  id: string;
  tanggal: string;
  resep_id?: string;
  nama_produk: string;
  jumlah_setel: number;
  total_biaya: number;
  hpp_per_setel: number;
  keterangan?: string;
  created_at: string;
  details?: ProduksiDetail[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatMoney(n: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProduksiPakanView() {
  const { supabase, feedItems, fetchFeedMaster, showToast, showConfirm, userRole } = useDashboard();

  // ── Data state ──
  const [resepList, setResepList] = useState<Resep[]>([]);
  const [produksiList, setProduksiList] = useState<Produksi[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── UI state ──
  const [activeSection, setActiveSection] = useState<'produksi' | 'resep'>('produksi');
  const [expandedProduksiId, setExpandedProduksiId] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7));

  // ── Form: Produksi baru ──
  const [produksiDate, setProduksiDate] = useState(today());
  const [selectedResepId, setSelectedResepId] = useState('');
  const [jumlahSetel, setJumlahSetel] = useState(10);
  const [produksiBahan, setProduksiBahan] = useState<{ bahan_id: string; qty_used: number; harga_satuan: number }[]>([
    { bahan_id: '', qty_used: 0, harga_satuan: 0 }
  ]);
  const [produksiKet, setProduksiKet] = useState('');
  const [isSubmittingProduksi, setIsSubmittingProduksi] = useState(false);

  // ── Form: Resep baru / edit ──
  const [showResepForm, setShowResepForm] = useState(false);
  const [editingResep, setEditingResep] = useState<Resep | null>(null);
  const [resepNama, setResepNama] = useState('Pakan Racikan Grower');
  const [resepDeskripsi, setResepDeskripsi] = useState('');
  const [resepHasilSetel, setResepHasilSetel] = useState(10);
  const [resepBahan, setResepBahan] = useState<{ bahan_id: string; qty_per_batch: number }[]>([
    { bahan_id: '', qty_per_batch: 0 }
  ]);
  const [isSubmittingResep, setIsSubmittingResep] = useState(false);

  // ── Fetch ──
  const fetchResep = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('resep_pakan')
      .select('*, details:resep_pakan_detail(*)')
      .order('created_at', { ascending: true });
    if (!error && data) setResepList(data);
  }, [supabase]);

  const fetchProduksi = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('produksi_pakan')
      .select('*, details:produksi_pakan_detail(*)')
      .order('tanggal', { ascending: false });
    if (!error && data) setProduksiList(data);
  }, [supabase]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchResep(), fetchProduksi()]).finally(() => setIsLoading(false));
  }, [fetchResep, fetchProduksi]);

  // ── When resep is selected → auto-fill bahan ──
  useEffect(() => {
    if (!selectedResepId) return;
    const resep = resepList.find(r => r.id === selectedResepId);
    if (!resep?.details) return;
    const bahan = resep.details.map(d => {
      const item = feedItems.find(f => String(f.id) === String(d.bahan_id));
      return {
        bahan_id: String(d.bahan_id),
        qty_used: d.qty_per_batch,
        harga_satuan: item?.harga_jual_default || 0
      };
    });
    if (bahan.length > 0) setProduksiBahan(bahan);
    setJumlahSetel(resep.hasil_setel);
  }, [selectedResepId, resepList, feedItems]);

  // ── HPP Calculation ──
  const totalBiaya = useMemo(() => {
    return produksiBahan.reduce((acc, b) => acc + (b.qty_used * b.harga_satuan), 0);
  }, [produksiBahan]);

  const hppPerSetel = useMemo(() => {
    return jumlahSetel > 0 ? Math.round(totalBiaya / jumlahSetel) : 0;
  }, [totalBiaya, jumlahSetel]);

  // ── Stock validation ──
  const stockWarnings = useMemo(() => {
    const warnings: { nama: string; dibutuhkan: number; tersedia: number }[] = [];
    produksiBahan.forEach(b => {
      if (!b.bahan_id) return;
      const item = feedItems.find(f => String(f.id) === String(b.bahan_id));
      if (item && item.stok_sekarang < b.qty_used) {
        warnings.push({ nama: item.nama_bahan, dibutuhkan: b.qty_used, tersedia: item.stok_sekarang });
      }
    });
    return warnings;
  }, [produksiBahan, feedItems]);

  // ── Summary stats ──
  const filteredProduksi = useMemo(() => {
    if (monthFilter === 'all') return produksiList;
    return produksiList.filter(p => p.tanggal?.startsWith(monthFilter));
  }, [produksiList, monthFilter]);

  const totalProduksiBulanIni = filteredProduksi.length;
  const totalBiayaBulanIni = filteredProduksi.reduce((s, p) => s + (p.total_biaya || 0), 0);
  const avgHpp = filteredProduksi.length > 0
    ? Math.round(filteredProduksi.reduce((s, p) => s + (p.hpp_per_setel || 0), 0) / filteredProduksi.length)
    : 0;

  const racikanItem = feedItems.find(f => f.nama_bahan?.toLowerCase().includes('racikan grower') || f.nama_bahan?.toLowerCase().includes('pakan racikan'));
  const stokRacikan = racikanItem?.stok_sekarang ?? 0;

  // ── Submit Produksi ──
  const handleSubmitProduksi = useCallback(async () => {
    const validBahan = produksiBahan.filter(b => b.bahan_id && b.qty_used > 0);
    if (validBahan.length === 0) {
      showToast('Mohon isi minimal 1 bahan', 'error'); return;
    }
    if (jumlahSetel <= 0) {
      showToast('Jumlah setel harus lebih dari 0', 'error'); return;
    }
    if (stockWarnings.length > 0) {
      showToast('Stok bahan tidak mencukupi. Periksa peringatan di bawah.', 'error'); return;
    }
    if (!supabase) return;

    setIsSubmittingProduksi(true);
    try {
      const totalBiayaFinal = validBahan.reduce((a, b) => a + b.qty_used * b.harga_satuan, 0);
      const hppFinal = jumlahSetel > 0 ? Math.round(totalBiayaFinal / jumlahSetel) : 0;

      // 1. Insert produksi header
      const { data: headerData, error: headerErr } = await supabase
        .from('produksi_pakan')
        .insert([{
          tanggal: produksiDate,
          resep_id: selectedResepId || null,
          nama_produk: 'Pakan Racikan Grower',
          jumlah_setel: jumlahSetel,
          total_biaya: totalBiayaFinal,
          hpp_per_setel: hppFinal,
          keterangan: produksiKet || null
        }])
        .select();

      if (headerErr) throw headerErr;
      const header = headerData![0];

      // 2. Insert detail bahan
      const detailRows = validBahan.map(b => ({
        produksi_id: header.id,
        bahan_id: b.bahan_id,
        qty_used: b.qty_used,
        harga_satuan: b.harga_satuan,
        subtotal: b.qty_used * b.harga_satuan
      }));

      const { error: detailErr } = await supabase
        .from('produksi_pakan_detail')
        .insert(detailRows);
      if (detailErr) throw detailErr;

      // 3. Kurangi stok bahan mentah
      for (const b of validBahan) {
        const item = feedItems.find(f => String(f.id) === String(b.bahan_id));
        if (item) {
          await supabase
            .from('master_pakan')
            .update({ stok_sekarang: Math.max(0, item.stok_sekarang - b.qty_used) })
            .eq('id', b.bahan_id);
        }
      }

      // 4. Tambah stok pakan racikan (jika ada di master_pakan)
      if (racikanItem) {
        await supabase
          .from('master_pakan')
          .update({ stok_sekarang: (racikanItem.stok_sekarang || 0) + jumlahSetel })
          .eq('id', racikanItem.id);
      }

      await fetchFeedMaster();
      await fetchProduksi();
      showToast(`Berhasil memproduksi ${jumlahSetel} setel Pakan Racikan Grower!`);

      // Reset form
      setSelectedResepId('');
      setProduksiBahan([{ bahan_id: '', qty_used: 0, harga_satuan: 0 }]);
      setJumlahSetel(10);
      setProduksiKet('');
      setProduksiDate(today());
    } catch (err: any) {
      showToast(err.message || 'Gagal mencatat produksi', 'error');
    } finally {
      setIsSubmittingProduksi(false);
    }
  }, [produksiBahan, jumlahSetel, produksiDate, selectedResepId, produksiKet, supabase, feedItems, racikanItem, fetchFeedMaster, fetchProduksi, showToast, stockWarnings]);

  // ── Delete Produksi ──
  const handleDeleteProduksi = useCallback((produksi: Produksi) => {
    if (userRole === 'viewer') { showToast('Tidak memiliki akses hapus', 'error'); return; }
    showConfirm(
      'Hapus Produksi?',
      `Produksi ${produksi.jumlah_setel} setel pada ${new Date(produksi.tanggal).toLocaleDateString('id-ID')} akan dihapus dan stok bahan akan dikembalikan.`,
      async () => {
        if (!supabase) return;
        try {
          // Reverse: kembalikan stok bahan
          for (const d of (produksi.details || [])) {
            const item = feedItems.find(f => String(f.id) === String(d.bahan_id));
            if (item) {
              await supabase
                .from('master_pakan')
                .update({ stok_sekarang: (item.stok_sekarang || 0) + d.qty_used })
                .eq('id', d.bahan_id);
            }
          }
          // Reverse: kurangi stok racikan
          if (racikanItem) {
            await supabase
              .from('master_pakan')
              .update({ stok_sekarang: Math.max(0, (racikanItem.stok_sekarang || 0) - produksi.jumlah_setel) })
              .eq('id', racikanItem.id);
          }

          await supabase.from('produksi_pakan_detail').delete().eq('produksi_id', produksi.id);
          await supabase.from('produksi_pakan').delete().eq('id', produksi.id);
          await fetchFeedMaster();
          await fetchProduksi();
          showToast('Produksi berhasil dihapus dan stok dikembalikan');
        } catch (err: any) {
          showToast(err.message || 'Gagal menghapus produksi', 'error');
        }
      }
    );
  }, [supabase, feedItems, racikanItem, fetchFeedMaster, fetchProduksi, showToast, showConfirm, userRole]);

  // ── Submit Resep ──
  const handleSubmitResep = useCallback(async () => {
    if (!resepNama.trim()) { showToast('Nama resep harus diisi', 'error'); return; }
    const validBahan = resepBahan.filter(b => b.bahan_id && b.qty_per_batch > 0);
    if (validBahan.length === 0) { showToast('Minimal 1 bahan harus diisi', 'error'); return; }
    if (!supabase) return;

    setIsSubmittingResep(true);
    try {
      if (editingResep) {
        await supabase.from('resep_pakan').update({ nama_resep: resepNama, deskripsi: resepDeskripsi, hasil_setel: resepHasilSetel }).eq('id', editingResep.id);
        await supabase.from('resep_pakan_detail').delete().eq('resep_id', editingResep.id);
        await supabase.from('resep_pakan_detail').insert(validBahan.map(b => ({ resep_id: editingResep.id, bahan_id: b.bahan_id, qty_per_batch: b.qty_per_batch })));
      } else {
        const { data, error } = await supabase.from('resep_pakan').insert([{ nama_resep: resepNama, deskripsi: resepDeskripsi, hasil_setel: resepHasilSetel }]).select();
        if (error) throw error;
        const resepId = data![0].id;
        await supabase.from('resep_pakan_detail').insert(validBahan.map(b => ({ resep_id: resepId, bahan_id: b.bahan_id, qty_per_batch: b.qty_per_batch })));
      }
      await fetchResep();
      showToast(editingResep ? 'Resep berhasil diperbarui' : 'Resep berhasil disimpan');
      setShowResepForm(false);
      setEditingResep(null);
      setResepNama('Pakan Racikan Grower');
      setResepDeskripsi('');
      setResepHasilSetel(10);
      setResepBahan([{ bahan_id: '', qty_per_batch: 0 }]);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan resep', 'error');
    } finally {
      setIsSubmittingResep(false);
    }
  }, [resepNama, resepDeskripsi, resepHasilSetel, resepBahan, editingResep, supabase, fetchResep, showToast]);

  const handleEditResep = (resep: Resep) => {
    setEditingResep(resep);
    setResepNama(resep.nama_resep);
    setResepDeskripsi(resep.deskripsi || '');
    setResepHasilSetel(resep.hasil_setel);
    setResepBahan(resep.details?.map(d => ({ bahan_id: String(d.bahan_id), qty_per_batch: d.qty_per_batch })) || [{ bahan_id: '', qty_per_batch: 0 }]);
    setShowResepForm(true);
    setActiveSection('resep');
  };

  const handleDeleteResep = (id: string, nama: string) => {
    if (userRole === 'viewer') { showToast('Tidak memiliki akses hapus', 'error'); return; }
    showConfirm('Hapus Resep?', `Resep "${nama}" akan dihapus. Riwayat produksi yang menggunakan resep ini tidak akan terhapus.`, async () => {
      await supabase?.from('resep_pakan').delete().eq('id', id);
      await fetchResep();
      showToast('Resep berhasil dihapus');
    });
  };

  // ── Months for filter ──
  const availableMonths = useMemo(() => {
    const months = new Set(produksiList.map(p => p.tanggal?.slice(0, 7)).filter(Boolean));
    return ['all', ...Array.from(months).sort().reverse()];
  }, [produksiList]);

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <SectionContainer>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
          <FlaskConical className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Produksi Pakan Racikan</h1>
          <p className="text-xs text-slate-400 font-medium">Kelola pembuatan Pakan Racikan Grower untuk ayam muda</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-orange-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={14} className="text-orange-500" />
              <span className="text-[10px] font-black text-orange-700 uppercase tracking-wider">Batch Bulan Ini</span>
            </div>
            <p className="text-2xl font-black text-orange-800">{totalProduksiBulanIni}</p>
            <p className="text-[9px] text-orange-500 font-semibold">batch produksi</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-rose-50 to-red-50 border-rose-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package size={14} className="text-rose-500" />
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider">Total Biaya</span>
            </div>
            <p className="text-lg font-black text-rose-800 leading-tight">{formatMoney(totalBiayaBulanIni)}</p>
            <p className="text-[9px] text-rose-500 font-semibold">biaya produksi</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Layers size={14} className="text-violet-500" />
              <span className="text-[10px] font-black text-violet-700 uppercase tracking-wider">HPP Rata-rata</span>
            </div>
            <p className="text-lg font-black text-violet-800 leading-tight">{formatMoney(avgHpp)}</p>
            <p className="text-[9px] text-violet-500 font-semibold">per setel</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Stok Racikan</span>
            </div>
            <p className="text-2xl font-black text-emerald-800">{stokRacikan}</p>
            <p className="text-[9px] text-emerald-500 font-semibold">setel tersedia</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Switch */}
      <div className="flex gap-2 mb-5">
        {(['produksi', 'resep'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSection(tab)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all',
              activeSection === tab
                ? 'bg-slate-900 text-white shadow'
                : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
            )}
          >
            {tab === 'produksi' ? '🏭 Produksi' : '📋 Kelola Resep'}
          </button>
        ))}
      </div>

      {/* ─────── SECTION: PRODUKSI ─────── */}
      {activeSection === 'produksi' && (
        <div className="space-y-5">
          {/* Form Produksi Baru */}
          <Card className="border border-orange-100 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5">
              <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                <FlaskConical size={15} className="text-orange-500" />
                Catat Produksi Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              {/* Row 1: Tanggal + Resep + Setel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tanggal Produksi</label>
                  <input
                    type="date"
                    value={produksiDate}
                    onChange={e => setProduksiDate(e.target.value)}
                    className="w-full h-9 px-3 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gunakan Resep</label>
                  <select
                    value={selectedResepId}
                    onChange={e => setSelectedResepId(e.target.value)}
                    className="w-full h-9 px-3 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white"
                  >
                    <option value="">-- Input Manual --</option>
                    {resepList.map(r => (
                      <option key={r.id} value={r.id}>{r.nama_resep} ({r.hasil_setel} setel/batch)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Jumlah Setel Diproduksi</label>
                  <input
                    type="number"
                    min={1}
                    value={jumlahSetel}
                    onChange={e => setJumlahSetel(Number(e.target.value))}
                    className="w-full h-9 px-3 text-sm font-black border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
              </div>

              {/* Tabel Bahan */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Daftar Bahan yang Dipakai</label>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="h-8 text-[9px] font-black uppercase text-slate-400 pl-3">Bahan</TableHead>
                        <TableHead className="h-8 text-[9px] font-black uppercase text-slate-400 text-right">Qty Pakai</TableHead>
                        <TableHead className="h-8 text-[9px] font-black uppercase text-slate-400 text-right">Harga/Satuan</TableHead>
                        <TableHead className="h-8 text-[9px] font-black uppercase text-slate-400 text-right">Subtotal</TableHead>
                        <TableHead className="h-8 w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produksiBahan.map((b, i) => {
                        const item = feedItems.find(f => String(f.id) === String(b.bahan_id));
                        const isKurang = item && item.stok_sekarang < b.qty_used;
                        return (
                          <TableRow key={i} className={cn('hover:bg-transparent', isKurang && 'bg-rose-50')}>
                            <TableCell className="py-2 pl-3">
                              <select
                                value={b.bahan_id}
                                onChange={e => {
                                  const found = feedItems.find(f => String(f.id) === e.target.value);
                                  setProduksiBahan(prev => prev.map((row, idx) =>
                                    idx === i ? { ...row, bahan_id: e.target.value, harga_satuan: found?.harga_jual_default || 0 } : row
                                  ));
                                }}
                                className="w-full text-xs font-semibold border border-slate-200 rounded-md px-2 py-1 bg-white"
                              >
                                <option value="">-- Pilih Bahan --</option>
                                {feedItems.map(f => (
                                  <option key={f.id} value={f.id}>{f.nama_bahan} (stok: {f.stok_sekarang} {f.satuan})</option>
                                ))}
                              </select>
                            </TableCell>
                            <TableCell className="py-2">
                              <input
                                type="number"
                                min={0}
                                value={b.qty_used}
                                onChange={e => setProduksiBahan(prev => prev.map((row, idx) =>
                                  idx === i ? { ...row, qty_used: Number(e.target.value) } : row
                                ))}
                                className={cn('w-24 text-xs font-black text-right border rounded-md px-2 py-1', isKurang ? 'border-rose-400 bg-rose-50' : 'border-slate-200')}
                              />
                              {item && <div className="text-[9px] text-slate-400 mt-0.5 text-right">{item.satuan}</div>}
                              {isKurang && <div className="text-[9px] text-rose-500 font-bold mt-0.5 text-right">⚠ stok: {item!.stok_sekarang}</div>}
                            </TableCell>
                            <TableCell className="py-2">
                              <input
                                type="number"
                                min={0}
                                value={b.harga_satuan}
                                onChange={e => setProduksiBahan(prev => prev.map((row, idx) =>
                                  idx === i ? { ...row, harga_satuan: Number(e.target.value) } : row
                                ))}
                                className="w-32 text-xs font-semibold text-right border border-slate-200 rounded-md px-2 py-1"
                              />
                            </TableCell>
                            <TableCell className="py-2 text-right">
                              <span className="text-xs font-black text-slate-800 tabular-nums">{formatMoney(b.qty_used * b.harga_satuan)}</span>
                            </TableCell>
                            <TableCell className="py-2 pr-2">
                              <button
                                onClick={() => setProduksiBahan(prev => prev.filter((_, idx) => idx !== i))}
                                className="text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <button
                  onClick={() => setProduksiBahan(prev => [...prev, { bahan_id: '', qty_used: 0, harga_satuan: 0 }])}
                  className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-orange-500 hover:text-orange-700 uppercase tracking-widest"
                >
                  <Plus size={12} /> Tambah Bahan
                </button>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Keterangan (opsional)</label>
                <input
                  type="text"
                  value={produksiKet}
                  onChange={e => setProduksiKet(e.target.value)}
                  placeholder="Contoh: Batch untuk kandang A & B"
                  className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>

              {/* HPP Summary */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 flex flex-wrap gap-6 items-center border border-orange-100">
                <div>
                  <div className="text-[9px] font-black text-orange-700 uppercase tracking-widest">Total Biaya Produksi</div>
                  <div className="text-xl font-black text-orange-800 tabular-nums">{formatMoney(totalBiaya)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-black text-orange-700 uppercase tracking-widest">HPP per Setel</div>
                  <div className="text-xl font-black text-violet-700 tabular-nums">{formatMoney(hppPerSetel)}</div>
                </div>
                <div>
                  <div className="text-[9px] font-black text-orange-700 uppercase tracking-widest">Produk</div>
                  <div className="text-sm font-black text-slate-800">Pakan Racikan Grower</div>
                  <div className="text-[9px] text-slate-500">{jumlahSetel} setel dihasilkan</div>
                </div>
              </div>

              {/* Stock Warnings */}
              {stockWarnings.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-1">
                  <div className="flex items-center gap-2 text-rose-700">
                    <AlertTriangle size={13} />
                    <span className="text-[10px] font-black uppercase tracking-wider">Peringatan Stok Tidak Cukup</span>
                  </div>
                  {stockWarnings.map((w, i) => (
                    <div key={i} className="text-[10px] text-rose-600 font-semibold pl-5">
                      • {w.nama}: butuh {w.dibutuhkan}, tersedia {w.tersedia}
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleSubmitProduksi}
                disabled={isSubmittingProduksi || stockWarnings.length > 0}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black uppercase tracking-widest rounded-xl h-11 shadow-lg"
              >
                {isSubmittingProduksi ? 'Memproses...' : '🏭 Produksi Sekarang'}
              </Button>
            </CardContent>
          </Card>

          {/* Riwayat Produksi */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                <ClipboardList size={15} className="text-slate-500" />
                Riwayat Produksi
              </CardTitle>
              <select
                value={monthFilter}
                onChange={e => setMonthFilter(e.target.value)}
                className="text-[10px] font-black border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600"
              >
                <option value="all">Semua Bulan</option>
                {availableMonths.filter(m => m !== 'all').map(m => {
                  const [yr, mo] = m.split('-');
                  const label = new Date(Number(yr), Number(mo) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                  return <option key={m} value={m}>{label}</option>;
                })}
              </select>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {filteredProduksi.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <FlaskConical size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">Belum ada riwayat produksi</p>
                  <p className="text-xs">Gunakan form di atas untuk mencatat produksi pertama</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProduksi.map(p => (
                    <div key={p.id} className="border border-slate-100 rounded-xl overflow-hidden">
                      <div
                        className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setExpandedProduksiId(expandedProduksiId === p.id ? null : p.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <FlaskConical size={14} className="text-amber-600" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-800">{p.nama_produk}</div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {new Date(p.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                              {p.keterangan && ` · ${p.keterangan}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <div className="text-xs font-black text-violet-700">{p.jumlah_setel} setel</div>
                            <div className="text-[10px] text-slate-400">HPP: {formatMoney(p.hpp_per_setel)}/setel</div>
                          </div>
                          <Badge className="bg-orange-100 text-orange-700 font-black text-[9px] px-2">
                            {formatMoney(p.total_biaya)}
                          </Badge>
                          {userRole !== 'viewer' && (
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteProduksi(p); }}
                              className="text-slate-300 hover:text-rose-500 transition-colors ml-1"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                          {expandedProduksiId === p.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                        </div>
                      </div>
                      {expandedProduksiId === p.id && (
                        <div className="bg-slate-50 border-t border-slate-100 px-4 py-3">
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Rincian Bahan yang Dipakai</div>
                          <Table>
                            <TableHeader>
                              <TableRow className="hover:bg-transparent">
                                <TableHead className="h-6 text-[8px] font-black text-slate-400 uppercase p-0">Bahan</TableHead>
                                <TableHead className="h-6 text-[8px] font-black text-slate-400 uppercase p-0 text-right">Qty</TableHead>
                                <TableHead className="h-6 text-[8px] font-black text-slate-400 uppercase p-0 text-right">Harga/sat</TableHead>
                                <TableHead className="h-6 text-[8px] font-black text-slate-400 uppercase p-0 text-right">Subtotal</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(p.details || []).map((d, i) => {
                                const item = feedItems.find(f => String(f.id) === String(d.bahan_id));
                                return (
                                  <TableRow key={i} className="hover:bg-transparent border-b border-slate-100">
                                    <TableCell className="py-1 text-[10px] font-semibold text-slate-700 p-0">{item?.nama_bahan || `ID:${d.bahan_id}`}</TableCell>
                                    <TableCell className="py-1 text-[10px] font-bold text-slate-700 p-0 text-right tabular-nums">{d.qty_used} {item?.satuan}</TableCell>
                                    <TableCell className="py-1 text-[10px] text-slate-500 p-0 text-right tabular-nums">{formatMoney(d.harga_satuan)}</TableCell>
                                    <TableCell className="py-1 text-[10px] font-black text-slate-800 p-0 text-right tabular-nums">{formatMoney(d.subtotal)}</TableCell>
                                  </TableRow>
                                );
                              })}
                              <TableRow className="hover:bg-transparent border-t-2 border-slate-300">
                                <TableCell colSpan={3} className="py-1.5 text-[10px] font-black text-slate-900 uppercase p-0">Total Biaya</TableCell>
                                <TableCell className="py-1.5 text-[10px] font-black text-orange-700 p-0 text-right tabular-nums">{formatMoney(p.total_biaya)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─────── SECTION: RESEP ─────── */}
      {activeSection === 'resep' && (
        <div className="space-y-5">
          {/* Form Resep */}
          <Card className="border border-slate-100 shadow-sm">
            <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black text-slate-800 flex items-center gap-2">
                <ClipboardList size={15} className="text-slate-500" />
                {editingResep ? `Edit Resep: ${editingResep.nama_resep}` : 'Tambah Resep Baru'}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowResepForm(v => !v); if (editingResep) { setEditingResep(null); setResepNama('Pakan Racikan Grower'); setResepBahan([{ bahan_id: '', qty_per_batch: 0 }]); }}}
                className="text-[10px] font-black uppercase h-7 px-3"
              >
                {showResepForm ? 'Tutup' : <><Plus size={12} className="mr-1" />Resep Baru</>}
              </Button>
            </CardHeader>
            {showResepForm && (
              <CardContent className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nama Resep</label>
                    <input type="text" value={resepNama} onChange={e => setResepNama(e.target.value)} className="w-full h-9 px-3 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Hasil per Batch (setel)</label>
                    <input type="number" min={1} value={resepHasilSetel} onChange={e => setResepHasilSetel(Number(e.target.value))} className="w-full h-9 px-3 text-sm font-black border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Deskripsi (opsional)</label>
                  <input type="text" value={resepDeskripsi} onChange={e => setResepDeskripsi(e.target.value)} placeholder="Contoh: Formula untuk ayam grower umur 10-16 minggu" className="w-full h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Komposisi Bahan (per {resepHasilSetel} setel)</label>
                  <div className="space-y-2">
                    {resepBahan.map((b, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <select
                          value={b.bahan_id}
                          onChange={e => setResepBahan(prev => prev.map((row, idx) => idx === i ? { ...row, bahan_id: e.target.value } : row))}
                          className="flex-1 h-8 text-xs font-semibold border border-slate-200 rounded-md px-2 bg-white"
                        >
                          <option value="">-- Pilih Bahan --</option>
                          {feedItems.map(f => <option key={f.id} value={f.id}>{f.nama_bahan} ({f.satuan})</option>)}
                        </select>
                        <input
                          type="number"
                          min={0}
                          value={b.qty_per_batch}
                          onChange={e => setResepBahan(prev => prev.map((row, idx) => idx === i ? { ...row, qty_per_batch: Number(e.target.value) } : row))}
                          placeholder="Qty"
                          className="w-24 h-8 text-xs font-black text-right border border-slate-200 rounded-md px-2"
                        />
                        <button onClick={() => setResepBahan(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-rose-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setResepBahan(prev => [...prev, { bahan_id: '', qty_per_batch: 0 }])}
                    className="mt-2 flex items-center gap-1.5 text-[10px] font-black text-orange-500 hover:text-orange-700 uppercase tracking-widest"
                  >
                    <Plus size={12} /> Tambah Bahan
                  </button>
                </div>
                <Button
                  onClick={handleSubmitResep}
                  disabled={isSubmittingResep}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest rounded-xl h-10"
                >
                  {isSubmittingResep ? 'Menyimpan...' : (editingResep ? 'Perbarui Resep' : 'Simpan Resep')}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Daftar Resep */}
          <div className="space-y-3">
            {resepList.length === 0 ? (
              <Card className="border-dashed border-slate-200">
                <CardContent className="py-10 text-center text-slate-400">
                  <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-semibold">Belum ada resep</p>
                  <p className="text-xs">Klik "Resep Baru" untuk membuat resep pertama</p>
                </CardContent>
              </Card>
            ) : resepList.map(r => (
              <Card key={r.id} className="border border-slate-100 shadow-sm">
                <CardContent className="px-5 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-black text-slate-900">{r.nama_resep}</div>
                      {r.deskripsi && <div className="text-[10px] text-slate-400 mt-0.5">{r.deskripsi}</div>}
                      <Badge className="mt-1 bg-amber-100 text-amber-700 text-[9px] font-black px-2">
                        {r.hasil_setel} setel per batch
                      </Badge>
                    </div>
                    {userRole !== 'viewer' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEditResep(r)} className="text-[10px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-widest">Edit</button>
                        <button onClick={() => handleDeleteResep(r.id, r.nama_resep)} className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest">Hapus</button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {(r.details || []).map((d, i) => {
                      const item = feedItems.find(f => String(f.id) === String(d.bahan_id));
                      return (
                        <div key={i} className="bg-slate-50 rounded-lg px-3 py-2 flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-600">{item?.nama_bahan || '?'}</span>
                          <span className="text-[10px] font-black text-slate-900 tabular-nums">{d.qty_per_batch} {item?.satuan}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </SectionContainer>
  );
}
