import React, { useState, useRef, useEffect } from 'react';
import { 
  AlertCircle, 
  FileText, 
  Search, 
  Printer,
  Filter,
  MessageCircle
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionContainer } from '../layout/SectionContainer';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/EmptyState';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { generateInvoiceCode } from '@/lib/invoice-utils';
import logoBEF from '../../assets/logo_BEF.png';
import logoMBF from '../../assets/logo_MBF.png';

import { useDashboard } from '../../contexts/DashboardContext';

const printStyles = `
  @media print {
    @page { size: landscape; margin: 0; }
    body { -webkit-print-color-adjust: exact; }
    .print-hide { display: none !important; }
  }
`;

export function BillingView() {
  const {
    billingMode,
    setBillingMode,
    setSelectedInvoice,
    setSelectedEggDetail,
    setIsEggDetailOpen,
    setSelectedFeedDetail,
    setIsFeedDetailOpen,
    setInvoiceModalMode,
    fetchPaymentHistory,
    summaryTelur,
    summaryPakan,
    eggReceivables,
    feedRecv,
    billingSubMode,
    setBillingSubMode,
    formatMoney,
    eggPayables,
    feedPayables,
    feedItems,
    isLoading,
    fetchEggTransactions,
    fetchEggStock,
    fetchFeedTransactions,
    fetchFeedMaster
  } = useDashboard();

  // Grouping logic for feedRecv to combine multiple items/transactions by same customer on same day
  const groupedFeedRecv = React.useMemo(() => {
    const list = feedRecv || [];
    const grouped: Record<string, any> = {};
    list.forEach((row: any) => {
      const customer = row.nama_mitra || (row.keterangan || "").split("|")[0]?.replace("Mitra: ", "").trim() || "Peternak";
      const date = new Date(row.tanggal || row.created_at).toLocaleDateString("id-ID");
      const key = `${customer}-${date}`;
      
      if (!grouped[key]) {
        grouped[key] = { 
          ...row, 
          details: row.details ? [...row.details] : [],
          total_tagihan: row.total_tagihan || 0,
          dibayar_hari_ini: row.dibayar_hari_ini || 0
        };
      } else {
        grouped[key].total_tagihan += (row.total_tagihan || 0);
        grouped[key].dibayar_hari_ini += (row.dibayar_hari_ini || 0);
        if (row.details) grouped[key].details.push(...row.details);
      }
    });
    return Object.values(grouped);
  }, [feedRecv]);

  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const printContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expandedInvoice && printContainerRef.current) {
      setTimeout(() => {
        printContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [expandedInvoice]);
  const [agingFilter, setAgingFilter] = useState<'all' | 'lancar' | 'perhatian' | 'macet'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Belum Lunas' | 'Lunas'>('Semua');

  // Helper: resolves the paid amount for both egg (jumlah_dibayar) and feed (dibayar_hari_ini) schemas
  const getPaid = (row: any) => {
    const val = row.jumlah_dibayar !== undefined ? row.jumlah_dibayar : row.dibayar_hari_ini;
    return Number(val || 0);
  };
  // Aging helper
  const getAgingDays = (date: string) => {
    const now = new Date();
    const trxDate = new Date(date);
    return Math.floor((now.getTime() - trxDate.getTime()) / (1000 * 60 * 60 * 24));
  };
  const getAgingCat = (date: string): 'lancar' | 'perhatian' | 'macet' => {
    const d = getAgingDays(date);
    if (d < 7) return 'lancar';
    if (d < 30) return 'perhatian';
    return 'macet';
  };
  
  const printRefTelur = useRef<HTMLDivElement>(null);
  const handlePrintTelur = useReactToPrint({ contentRef: printRefTelur, documentTitle: " " });

  const printRefPakan = useRef<HTMLDivElement>(null);
  const handlePrintPakan = useReactToPrint({ contentRef: printRefPakan, documentTitle: " " });

  const handleKirimWA = (invoice: any, isTelur: boolean) => {
    if (!invoice) return;
    const diff = (invoice.total_tagihan || invoice.total_harga || 0) - getPaid(invoice);
    const code = generateInvoiceCode(invoice.id, invoice.created_at || invoice.tanggal, isTelur ? 'BEF' : 'MBF');
    const text = `Halo,\nBerikut adalah detail tagihan dari ${isTelur ? 'CV BERKAH EGG FARM' : 'PT. MITRA BAROKAH FARM'}:\nNo. Invoice: ${code}\nTanggal: ${new Date(invoice.created_at || Date.now()).toLocaleDateString('id-ID')}\n\nTotal Tagihan: Rp${(invoice.total_tagihan || invoice.total_harga || 0).toLocaleString('id-ID')}\nSisa Piutang: Rp${diff.toLocaleString('id-ID')}\n\nTerima kasih.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <SectionContainer className="grid grid-cols-12 gap-6 pb-4">
      <style>{printStyles}</style>
      <div className="col-span-12 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tagihan</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kelola penagihan telur dan pakan mitra</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { fetchEggTransactions(); fetchEggStock(); fetchFeedTransactions(); fetchFeedMaster(); }}
              className="h-9 w-9 p-0 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-all shadow-sm"
              title="Segarkan Data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform duration-500", isLoading ? "animate-spin" : "hover:rotate-180")}>
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
            </Button>
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 shadow-inner">
              <button 
                onClick={() => setBillingMode('telur')}
                className={cn(
                  "px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  billingMode === 'telur' ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Tagihan Telur (CV BEF)
              </button>
              <button 
                onClick={() => setBillingMode('pakan')}
                className={cn(
                  "px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  billingMode === 'pakan' ? "bg-orange-500 text-white shadow-md shadow-orange-500/20" : "text-slate-600 hover:text-slate-900"
                )}
              >
                Tagihan Pakan (PT MBF)
              </button>
            </div>
          </div>
        </div>

        {billingMode === 'telur' ? (
          <div className="space-y-4">
            {/* Summary Strip (Telur) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(summaryTelur || []).map((card, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm flex flex-col border border-slate-200/60">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
                  <h4 className="text-lg font-black text-slate-900 leading-none">
                    {typeof card.val === 'number' ? formatMoney(card.val) : card.val}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-500 mt-2 opacity-70">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Aging Piutang Telur */}
            {billingSubMode === 'piutang' && (() => {
              const safeReceivables = eggReceivables || [];
              const unpaid = safeReceivables.filter(t => (t.total_harga - (t.jumlah_dibayar||0)) > 0);
              const cats = {
                lancar: unpaid.filter(t => getAgingCat(t.created_at || t.tanggal) === 'lancar'),
                perhatian: unpaid.filter(t => getAgingCat(t.created_at || t.tanggal) === 'perhatian'),
                macet: unpaid.filter(t => getAgingCat(t.created_at || t.tanggal) === 'macet'),
              };
              return (
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Analisis Umur Piutang Belum Lunas</p>
                    {agingFilter !== 'all' && (
                      <button onClick={() => setAgingFilter('all')} className="text-[9px] font-black text-black hover:text-slate-700 uppercase tracking-widest underline underline-offset-2">Reset Filter</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([
                      { key: 'lancar' as const, label: '< 7 Hari', sub: 'Baru & lancar', color: 'green', items: cats.lancar },
                      { key: 'perhatian' as const, label: '7 – 30 Hari', sub: 'Perlu follow-up', color: 'amber', items: cats.perhatian },
                      { key: 'macet' as const, label: '> 30 Hari', sub: 'Perlu tindakan', color: 'red', items: cats.macet },
                    ]).map(chip => (
                      <button
                        key={chip.key}
                        onClick={() => setAgingFilter(agingFilter === chip.key ? 'all' : chip.key)}
                        className={cn(
                          'rounded-xl p-4 text-left transition-all border-2',
                          agingFilter === chip.key
                            ? chip.color === 'green' ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/20'
                              : chip.color === 'amber' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                              : 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                            : chip.color === 'green' ? 'bg-green-50 border-green-100 hover:border-green-300'
                              : chip.color === 'amber' ? 'bg-amber-50 border-amber-100 hover:border-amber-300'
                              : 'bg-red-50 border-red-100 hover:border-red-300'
                        )}
                      >
                        <div className="flex items-end justify-between">
                          <div>
                            <p className={cn('text-[9px] font-black uppercase tracking-widest mb-1', agingFilter === chip.key ? 'text-white/70' : chip.color === 'green' ? 'text-green-600' : chip.color === 'amber' ? 'text-amber-600' : 'text-red-500')}>{chip.label}</p>
                            <p className={cn('text-2xl font-black tracking-tighter', agingFilter === chip.key ? 'text-white' : 'text-black')}>{chip.items.length}</p>
                            <p className={cn('text-[9px] font-bold mt-1', agingFilter === chip.key ? 'text-white/60' : 'text-black')}>{chip.sub}</p>
                          </div>
                          <p className={cn('text-xs font-black', agingFilter === chip.key ? 'text-white/80' : 'text-slate-600')}>
                            {formatMoney(chip.items.reduce((s, t) => s + (t.total_harga - (t.jumlah_dibayar||0)), 0))}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-12 gap-6 items-start">
              <Card className="col-span-12 border-slate-200/60 shadow-sm overflow-hidden min-h-[600px]">
                <CardHeader className="bg-slate-50/50 border-b border-slate-200 flex flex-col gap-4">
                  <CardTitle className="text-base font-black text-slate-900 uppercase tracking-tight">Invoice & Piutang Telur</CardTitle>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                      {['Semua', 'Belum Lunas', 'Lunas'].map((s: any) => (
                        <button 
                          key={s} 
                          onClick={() => setStatusFilter(s as any)}
                          className={cn(
                            "px-3 py-1 rounded-md text-[9px] font-black transition-all uppercase tracking-widest", 
                            statusFilter === s ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20" : "text-black hover:text-slate-700"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
                        <button 
                          onClick={() => setBillingSubMode('piutang')}
                          className={cn("px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all", billingSubMode === 'piutang' ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20" : "text-slate-600 hover:text-slate-900")}
                        >
                          Piutang (Diterima)
                        </button>
                        <button 
                          onClick={() => setBillingSubMode('hutang')}
                          className={cn("px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all", billingSubMode === 'hutang' ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20" : "text-slate-600 hover:text-slate-900")}
                        >
                          Hutang (Dibayar)
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter size={14} className="text-slate-300" />
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input 
                            type="text" 
                            placeholder="Cari invoice..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs font-bold w-48 outline-none focus:border-orange-200" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto w-full min-w-0">
                  <Table>
                    <TableHeader className="bg-slate-50/30">
                      <TableRow className="border-slate-100">
                        <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-6">Invoice</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Customer</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sisa</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest pr-6 text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        let list = (billingSubMode === 'piutang' ? eggReceivables : eggPayables) || [];
                        
                        if (billingSubMode === 'piutang' && agingFilter !== 'all') {
                          list = list.filter((t: any) => getAgingCat(t.created_at || t.tanggal) === agingFilter);
                        }

                        if (statusFilter !== 'Semua') {
                          list = list.filter((row: any) => {
                            const diff = (row.total_harga || 0) - (row.jumlah_dibayar || 0);
                            const status = diff === 0 ? 'Lunas' : 'Belum Lunas';
                            return status === statusFilter;
                          });
                        }

                        if (searchQuery) {
                          const q = searchQuery.toLowerCase();
                          list = list.filter((row: any) => {
                            const customer = (row.keterangan || '').toLowerCase();
                            const invCode = generateInvoiceCode(row.id, row.created_at || row.tanggal, 'BEF').toLowerCase();
                            return customer.includes(q) || invCode.includes(q);
                          });
                        }

                        if (list.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={5}>
                                <EmptyState 
                                  icon={FileText} 
                                  title="Invoice Tidak Ditemukan" 
                                  description="Tidak ada catatan tagihan telur yang sesuai dengan filter saat ini." 
                                />
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return list.map((row: any, i: number) => {
                          const diff = (row.total_harga || 0) - (row.jumlah_dibayar || 0);
                          const status = diff === 0 ? 'Lunas' : row.jumlah_dibayar > 0 ? 'Sebagian' : 'Belum Bayar';
                          const customer = (row.keterangan || '').split('|')[0]?.replace('Mitra: ', '').trim() || '-';

                          return (
                            <TableRow key={row.id || i} className="group border-slate-50 hover:bg-slate-50 transition-colors">
                               <TableCell className="pl-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-900 tracking-tight uppercase">
                                      {generateInvoiceCode(row.id, row.created_at || row.tanggal, 'BEF')}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 mt-0.5">
                                      {new Date(row.tanggal || Date.now()).toLocaleDateString('id-ID')}
                                    </span>
                                  </div>
                               </TableCell>
                               <TableCell className="text-xs font-black text-slate-700 uppercase">{customer}</TableCell>
                               <TableCell className="text-xs font-black text-slate-900">{formatMoney(diff)}</TableCell>
                               <TableCell className="text-left">
                                  <Badge className={cn(
                                    "text-[8px] font-black uppercase border-none px-2 py-0.5",
                                    status === 'Lunas' ? "bg-green-100 text-green-600" :
                                    status === 'Sebagian' ? "bg-orange-100 text-orange-500" :
                                    "bg-red-100 text-red-600"
                                  )}>
                                    {status}
                                  </Badge>
                               </TableCell>
                               <TableCell className="pr-6 text-center flex items-center justify-center gap-2">
                                  {billingSubMode === 'piutang' && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedInvoice(expandedInvoice === row.id ? null : row.id);
                                      }}
                                      className={cn(
                                        "h-8 w-8 p-0 rounded-lg transition-all border-none",
                                        expandedInvoice === row.id ? "bg-orange-100 text-orange-500" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                                      )}
                                    >
                                      <FileText size={14} />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInvoice(row);
                                      setInvoiceModalMode('bayar');
                                      fetchPaymentHistory(row.id);
                                    }}
                                    className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest bg-orange-500 hover:bg-orange-600 text-white border-none shadow-sm shadow-orange-500/20"
                                  >
                                    Bayar
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEggDetail(row);
                                      setIsEggDetailOpen(true);
                                      fetchPaymentHistory(row.id);
                                    }}
                                    className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:bg-orange-50"
                                  >
                                    Detail
                                  </Button>
                                </TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Print Preview (Telur) */}
            <div className="mt-6" ref={billingMode === 'telur' ? printContainerRef : undefined}>
                 {(() => {
                    if (!expandedInvoice || billingSubMode !== 'piutang') return null;
                    const safeList = billingSubMode === 'piutang' ? eggReceivables : eggPayables;
                    const activeInvoice = (safeList || []).find(r => r.id === expandedInvoice);
                    if (!activeInvoice) return null;
                    
                    const invDisplay = generateInvoiceCode(activeInvoice.id, activeInvoice.created_at || activeInvoice.tanggal, 'BEF');
                    const customer = (activeInvoice.keterangan || "").split("|")[0]?.replace("Mitra: ", "").trim() || "Customer";
                    const total = activeInvoice.total_harga;
                    const dateStr = new Date(activeInvoice.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                    
                    return (
                      <div className="flex flex-col gap-4">
                         <div ref={printRefTelur} className="print:m-0 print:p-0 flex justify-center print:block">
                            <div className="w-full max-w-[9.5in] h-[5.5in] mx-auto bg-white text-black px-10 pt-8 pb-4 flex flex-col relative overflow-hidden border border-slate-200 shadow-md print:border-none print:shadow-none print:rounded-none rounded-xl print:w-[9.5in] print:h-[5.5in]">
                               <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-20">
                                  <img src={logoBEF} alt="" className="w-[60%] h-auto object-contain" />
                               </div>

                               <div className="relative z-10 h-full w-full flex flex-col gap-4">
                                 <div className="flex justify-between items-center border-b-2 border-black pb-4">
                                    <div className="flex gap-4 items-center">
                                       <img src={logoBEF} alt="BEF" className="w-16 h-16 object-contain" />
                                       <div>
                                          <h1 className="text-xl font-black tracking-tighter text-black uppercase">CV BERKAH EGG FARM</h1>
                                          <p className="text-[10px] font-bold text-black uppercase tracking-widest leading-tight">Pengepul & Supplier Telur Ayam<br/>Tulungagung, Jawa Timur</p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <h2 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">INVOICE</h2>
                                       <p className="text-xs font-black text-black mt-1 uppercase tracking-widest">{invDisplay}</p>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-1">
                                       <p className="text-[9px] font-black text-black uppercase tracking-widest">Kepada Yth:</p>
                                       <p className="text-sm font-black text-black uppercase">{customer}</p>
                                       <p className="text-[9px] font-bold text-black uppercase tracking-tight italic">Pelanggan Setia CV. Berkah Egg Farm</p>
                                    </div>
                                    <div className="text-right">
                                       <p className="text-[9px] font-black text-black uppercase tracking-widest">Tanggal</p>
                                       <p className="text-[11px] font-black text-black">{dateStr}</p>
                                    </div>
                                 </div>

                                 <div className="flex-1">
                                    <table className="w-full border-collapse">
                                       <thead>
                                          <tr className="border-b-2 border-black">
                                             <th className="text-left py-2 text-[10px] font-black uppercase tracking-widest text-black">Keterangan Produk</th>
                                             <th className="text-right py-2 text-[10px] font-black uppercase tracking-widest text-black w-24">Jumlah</th>
                                             <th className="text-right py-2 text-[10px] font-black uppercase tracking-widest text-black w-28">Harga</th>
                                             <th className="text-right py-2 text-[10px] font-black uppercase tracking-widest text-black w-28">Total</th>
                                          </tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-100">
                                          <tr>
                                             <td className="py-3 text-xs font-black text-black uppercase">
                                                {(() => { 
                                                   const ket = activeInvoice.keterangan || "";
                                                   if (ket.includes("Telur Ayam Horn")) return "Telur Ayam Horn";
                                                   if (ket.includes("Telur Ayam Arab")) return "Telur Ayam Arab";
                                                   const parts = ket.split('|');
                                                   const jenisPart = parts.find(p => p.includes('Jenis:'));
                                                   if (jenisPart) return jenisPart.replace('Jenis:', '').trim();
                                                   return "Telur Ayam Horn";
                                                })()}
                                                {(() => { 
                                                   const ket = activeInvoice.keterangan || "";
                                                   const parts = ket.split('|');
                                                   const ketPart = parts.find(p => p.includes('Ket:'));
                                                   if (ketPart) return <span className="block text-[10px] text-black/60 normal-case font-bold mt-0.5">{ketPart.replace('Ket:', '').trim()}</span>;
                                                   return null;
                                                })()}
                                             </td>
                                             <td className="py-3 text-right text-xs font-black text-black">{(activeInvoice.jumlah_kg || activeInvoice.total_kg || 0).toLocaleString('id-ID')} kg</td>
                                             <td className="py-3 text-right text-xs font-black text-black">{formatMoney(activeInvoice.harga_per_kg || 0)}</td>
                                             <td className="py-3 text-right text-xs font-black text-black">{formatMoney(total)}</td>
                                          </tr>
                                       </tbody>
                                    </table>
                                 </div>

                                 <div className="flex justify-between items-end gap-4 mt-auto">
                                    <div className="flex gap-16 text-center">
                                       <div className="space-y-4">
                                          <p className="text-[9px] font-black uppercase tracking-widest text-black">Hormat Kami</p>
                                          <div className="w-24 border-b border-black mx-auto" />
                                       </div>
                                    </div>
                                    <div className="w-64 space-y-1">
                                       <div className="flex justify-between items-center pt-1">
                                          <span className="text-[11px] font-black uppercase text-black tracking-widest">Grand Total</span>
                                          <span className="text-lg font-black text-black tracking-tighter leading-none">{formatMoney(total)}</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                         </div>

                         <div className="flex gap-2 justify-center">
                            <Button onClick={() => handlePrintTelur()} className="w-64 btn-primary h-11 gap-2 rounded-lg text-xs font-black uppercase tracking-widest">
                               <Printer size={16} /> Cetak Invoice
                            </Button>
                            <Button onClick={() => handleKirimWA(activeInvoice, true)} variant="outline" className="w-64 h-11 gap-2 rounded-lg text-xs font-black uppercase tracking-widest text-slate-600 bg-slate-100 hover:bg-slate-200 border-none">
                               <MessageCircle size={16} className="text-green-600" /> WA Invoice
                            </Button>
                         </div>
                      </div>
                    );
                 })()}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Strip (Pakan) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(summaryPakan || []).map((card, i) => (
                <div key={i} className="bg-white p-4 rounded-xl shadow-sm flex flex-col border border-slate-200/60">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{card.label}</p>
                  <h4 className="text-lg font-black text-slate-900 leading-none">
                    {typeof card.val === 'number' ? formatMoney(card.val) : card.val}
                  </h4>
                  <p className="text-[9px] font-bold text-slate-500 mt-2 opacity-70">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Aging Piutang Pakan */}
            {billingSubMode === 'piutang' && (() => {
              const safeFeedRecv = feedRecv || [];
              const unpaid = safeFeedRecv.filter(t => (t.total_tagihan - getPaid(t)) > 0);
              const cats = {
                lancar: unpaid.filter(t => getAgingCat(t.created_at || t.tanggal) === 'lancar'),
                perhatian: unpaid.filter(t => getAgingCat(t.created_at || t.tanggal) === 'perhatian'),
                macet: unpaid.filter(t => getAgingCat(t.created_at || t.tanggal) === 'macet'),
              };
              return (
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Analisis Umur Piutang Belum Lunas</p>
                    {agingFilter !== 'all' && (
                      <button onClick={() => setAgingFilter('all')} className="text-[9px] font-black text-black hover:text-slate-700 uppercase tracking-widest underline underline-offset-2">Reset Filter</button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([
                      { key: 'lancar' as const, label: '< 7 Hari', sub: 'Baru & lancar', color: 'green', items: cats.lancar },
                      { key: 'perhatian' as const, label: '7 – 30 Hari', sub: 'Perlu follow-up', color: 'amber', items: cats.perhatian },
                      { key: 'macet' as const, label: '> 30 Hari', sub: 'Perlu tindakan', color: 'red', items: cats.macet },
                    ]).map(chip => (
                      <button
                        key={chip.key}
                        onClick={() => setAgingFilter(agingFilter === chip.key ? 'all' : chip.key)}
                        className={cn(
                          'rounded-xl p-4 text-left transition-all border-2',
                          agingFilter === chip.key
                            ? chip.color === 'green' ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/20'
                              : chip.color === 'amber' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                              : 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                            : chip.color === 'green' ? 'bg-green-50 border-green-100 hover:border-green-300'
                              : chip.color === 'amber' ? 'bg-amber-50 border-amber-100 hover:border-amber-300'
                              : 'bg-red-50 border-red-100 hover:border-red-300'
                        )}
                      >
                        <div className="flex items-end justify-between">
                          <div>
                            <p className={cn('text-[9px] font-black uppercase tracking-widest mb-1', agingFilter === chip.key ? 'text-white/70' : chip.color === 'green' ? 'text-green-600' : chip.color === 'amber' ? 'text-amber-600' : 'text-red-500')}>{chip.label}</p>
                            <p className={cn('text-2xl font-black tracking-tighter', agingFilter === chip.key ? 'text-white' : 'text-black')}>{chip.items.length}</p>
                            <p className={cn('text-[9px] font-bold mt-1', agingFilter === chip.key ? 'text-white/60' : 'text-black')}>{chip.sub}</p>
                          </div>
                          <p className={cn('text-xs font-black', agingFilter === chip.key ? 'text-white/80' : 'text-slate-600')}>
                            {formatMoney(chip.items.reduce((s, t) => s + ((t.total_tagihan||0) - getPaid(t)), 0))}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-12 gap-6 items-start">
              <Card className="col-span-12 border-slate-200/60 shadow-sm overflow-hidden min-h-[600px]">
                <CardHeader className="bg-slate-50/50 border-b border-slate-200 flex flex-col gap-4">
                  <CardTitle className="text-base font-black text-slate-900 uppercase tracking-tight">Invoice & Piutang Pakan (PT MBF)</CardTitle>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl">
                      {['Semua', 'Belum Lunas', 'Lunas'].map((s: any) => (
                        <button 
                          key={s} 
                          onClick={() => setStatusFilter(s as any)}
                          className={cn(
                            "px-3 py-1 rounded-md text-[9px] font-black transition-all uppercase tracking-widest", 
                            statusFilter === s ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20" : "text-black hover:text-slate-700"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
                        <button onClick={() => setBillingSubMode('piutang')} className={cn("px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all", billingSubMode === 'piutang' ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20" : "text-slate-600 hover:text-slate-900")}>Piutang</button>
                        <button onClick={() => setBillingSubMode('hutang')} className={cn("px-4 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all", billingSubMode === 'hutang' ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20" : "text-slate-600 hover:text-slate-900")}>Hutang</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter size={14} className="text-slate-300" />
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input type="text" placeholder="Cari invoice pakan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-white border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs font-bold w-48 outline-none focus:border-orange-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto w-full min-w-0">
                  <Table>
                    <TableHeader className="bg-slate-50/30">
                      <TableRow className="border-slate-100">
                        <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-6">Invoice</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pelanggan</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Piutang</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-500 uppercase tracking-widest pr-6 text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        let list = (billingSubMode === "piutang" ? groupedFeedRecv : feedPayables) || [];
                        if (billingSubMode === 'piutang' && agingFilter !== 'all') list = list.filter((t: any) => getAgingCat(t.created_at || t.tanggal) === agingFilter);
                        if (statusFilter !== 'Semua') {
                          list = list.filter((row: any) => {
                            const total = Number(row.total_tagihan) || 0;
                            const paid = Number(getPaid(row)) || 0;
                            const diff = total - paid;
                            return (diff <= 0 ? 'Lunas' : 'Belum Lunas') === statusFilter;
                          });
                        }
                        if (searchQuery) {
                          const q = searchQuery.toLowerCase();
                          list = list.filter((row: any) => {
                            const name = (row.nama_mitra || '').toLowerCase();
                            const ket = (row.keterangan || '').toLowerCase();
                            return name.includes(q) || ket.includes(q);
                          });
                        }

                        if (list.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={5}>
                                <EmptyState 
                                  icon={FileText} 
                                  title="Invoice Tidak Ditemukan" 
                                  description="Tidak ada catatan tagihan pakan yang sesuai dengan filter saat ini." 
                                />
                              </TableCell>
                            </TableRow>
                          );
                        }

                        return list.map((row: any, i: number) => {
                          const diff = (row.total_tagihan || 0) - getPaid(row);
                          const status = diff === 0 ? 'Lunas' : getPaid(row) > 0 ? 'Sebagian' : 'Belum Bayar';
                          const customer = row.nama_mitra || row.keterangan?.replace('Mitra: ', '') || '-';
                          return (
                            <TableRow key={row.id || i} className="group border-slate-50 hover:bg-slate-50 transition-colors">
                               <TableCell className="pl-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-900 tracking-tight uppercase">{generateInvoiceCode(row.id, row.created_at || row.tanggal, 'MBF')}</span>
                                    <span className="text-[9px] font-bold text-slate-400 mt-0.5">{new Date(row.tanggal || Date.now()).toLocaleDateString('id-ID')}</span>
                                  </div>
                               </TableCell>
                               <TableCell className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                  <span>{customer.split('|')[0].trim()}</span>
                               </TableCell>
                               <TableCell className="text-xs font-black text-slate-900">{formatMoney(diff)}</TableCell>
                               <TableCell className="text-left">
                                  <Badge className={cn("text-[8px] font-black uppercase border-none px-2 py-0.5", status === 'Lunas' ? "bg-green-100 text-green-600" : status === 'Sebagian' ? "bg-orange-100 text-orange-500" : "bg-red-100 text-red-600")}>{status}</Badge>
                               </TableCell>
                               <TableCell className="pr-6 text-center flex items-center justify-center gap-2">
                                  {billingSubMode === 'piutang' && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={(e) => { e.stopPropagation(); setExpandedInvoice(expandedInvoice === row.id ? null : row.id); }}
                                      className={cn("h-8 w-8 p-0 rounded-lg transition-all border-none", expandedInvoice === row.id ? "bg-orange-100 text-orange-500" : "bg-slate-50 text-slate-400 hover:bg-slate-100")}
                                    >
                                      <FileText size={14} />
                                    </Button>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={(e) => { e.stopPropagation(); setSelectedInvoice(row); setInvoiceModalMode('bayar'); fetchPaymentHistory(row.id); }}
                                    className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest bg-orange-500 hover:bg-orange-600 text-white border-none shadow-sm shadow-orange-500/20"
                                  >
                                    Bayar
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={(e) => { e.stopPropagation(); setSelectedFeedDetail(row); setIsFeedDetailOpen(true); fetchPaymentHistory(row.id); }}
                                    className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:bg-orange-50"
                                  >
                                    Detail
                                  </Button>
                                </TableCell>
                            </TableRow>
                          );
                        });
                      })()}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Print Preview (Pakan) */}
            <div className="mt-6" ref={billingMode === 'pakan' ? printContainerRef : undefined}>
                 {(() => {
                    if (!expandedInvoice || billingSubMode === 'hutang') return null;
                    const safeList = billingSubMode === 'piutang' ? groupedFeedRecv : feedPayables;
                    const activeInvoice = (safeList || []).find(r => r.id === expandedInvoice);
                    if (!activeInvoice) return null;
                    
                    const invDisplay = generateInvoiceCode(activeInvoice.id, activeInvoice.created_at || activeInvoice.tanggal, 'MBF');
                    const customer = activeInvoice.nama_mitra || activeInvoice.keterangan?.replace('Mitra: ', '') || 'Peternak';
                    const total = activeInvoice.total_tagihan || 0;
                    const dateStr = new Date(activeInvoice.created_at || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                    
                    return (
                      <div className="flex flex-col gap-4">
                         <div ref={printRefPakan} className="print:m-0 print:p-0 flex justify-center print:block">
                            <div className="w-full max-w-[9.5in] h-[5.5in] mx-auto bg-white text-black px-10 pt-8 pb-4 flex flex-col relative overflow-hidden border border-slate-200 shadow-md print:border-none print:shadow-none print:rounded-none rounded-xl print:w-[9.5in] print:h-[5.5in]">
                               <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none opacity-20">
                                  <img src={logoMBF} alt="" className="w-[60%] h-auto object-contain" />
                               </div>

                               <div className="relative z-10 h-full w-full flex flex-col gap-4">
                                  <div className="flex justify-between items-center border-b-2 border-black pb-4">
                                     <div className="flex gap-4 items-center">
                                        <img src={logoMBF} alt="MBF" className="w-16 h-16 object-contain" />
                                        <div>
                                           <h1 className="text-xl font-black tracking-tighter text-black uppercase">PT. MITRA BAROKAH FARM</h1>
                                           <p className="text-[10px] font-bold text-black uppercase tracking-widest leading-tight">Divisi Distribusi Pakan Ternak<br/>Tulungagung, Jawa Timur</p>
                                        </div>
                                     </div>
                                     <div className="text-right">
                                        <h2 className="text-2xl font-black text-black tracking-tighter uppercase leading-none">NOTA PENJUALAN</h2>
                                        <p className="text-xs font-black text-black mt-1 uppercase tracking-widest">{invDisplay}</p>
                                     </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-10">
                                     <div className="space-y-1 text-left">
                                        <p className="text-[9px] font-black text-black uppercase tracking-widest">Kepada Yth:</p>
                                        <p className="text-sm font-black text-black uppercase">{customer}</p>
                                        <p className="text-[9px] font-bold text-black uppercase tracking-tight italic opacity-70">Pelanggan Setia PT. Mitra Barokah Farm</p>
                                     </div>
                                     <div className="text-right">
                                        <p className="text-[9px] font-black text-black uppercase tracking-widest">Tanggal</p>
                                        <p className="text-[11px] font-black text-black">{dateStr}</p>
                                     </div>
                                  </div>

                                 <div className="flex-1">
                                    <table className="w-full border-collapse">
                                       <thead>
                                          <tr className="border-b-2 border-black">
                                             <th className="text-left py-2 text-[10px] font-black uppercase tracking-widest text-black">Keterangan Produk</th>
                                             <th className="text-right py-2 text-[10px] font-black uppercase tracking-widest text-black w-24">Qty</th>
                                             <th className="text-right py-2 text-[10px] font-black uppercase tracking-widest text-black w-32">Harga Satuan</th>
                                             <th className="text-right py-2 text-[10px] font-black uppercase tracking-widest text-black w-32">Total</th>
                                          </tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-100">
                                          {(activeInvoice.details && activeInvoice.details.length > 0) ? activeInvoice.details.map((det: any, di: number) => {
                                             const itemMaster = feedItems.find((fi: any) => String(fi.id) === String(det.id_bahan || det.bahan_id));
                                             const itemName = itemMaster?.nama_bahan || det.nama_bahan || 'Pakan Ternak';
                                             const itemSatuan = itemMaster?.satuan || det.satuan || 'kg';
                                             return (
                                                <tr key={di}>
                                                   <td className="py-2 text-xs font-black text-black uppercase">{itemName}</td>
                                                   <td className="py-2 text-right text-xs font-black text-black">{(det.qty || det.quantity || 0).toLocaleString('id-ID')} {itemSatuan}</td>
                                                   <td className="py-2 text-right text-xs font-black text-black">{formatMoney(det.harga_per_satuan || det.harga_satuan || 0)}/{itemSatuan}</td>
                                                   <td className="py-2 text-right text-xs font-black text-black">{formatMoney((det.qty || det.quantity || 0) * (det.harga_per_satuan || det.harga_satuan || 0))}</td>
                                                </tr>
                                             );
                                          }) : (
                                             <tr>
                                                <td className="py-3 text-xs font-black text-black uppercase">Pakan Ternak Konsentrat (Bulk)</td>
                                                <td className="py-3 text-right text-xs font-black text-black">1 Unit</td>
                                                <td className="py-3 text-right text-xs font-black text-black">{formatMoney(total)}</td>
                                                <td className="py-3 text-right text-xs font-black text-black">{formatMoney(total)}</td>
                                             </tr>
                                          )}
                                       </tbody>
                                    </table>
                                 </div>

                                 <div className="flex justify-between items-end gap-4 mt-auto">
                                    <div className="flex gap-16 text-center">
                                       <div className="space-y-4">
                                          <p className="text-[9px] font-black uppercase tracking-widest text-black">Dikirimkan,</p>
                                          <div className="pt-4"><div className="w-32 border-b border-black mx-auto" /><p className="text-[9px] font-black uppercase tracking-widest text-black mt-1">Pengemudi</p></div>
                                       </div>
                                       <div className="space-y-4">
                                          <p className="text-[9px] font-black uppercase tracking-widest text-black">Diterima,</p>
                                          <div className="pt-4"><div className="w-32 border-b border-black mx-auto" /><p className="text-[9px] font-black uppercase tracking-widest text-black mt-1">Pelanggan</p></div>
                                       </div>
                                    </div>
                                    <div className="w-64 space-y-1">
                                       <div className="flex justify-between items-center pt-1"><span className="text-[11px] font-black uppercase text-black tracking-widest">Grand Total</span><span className="text-lg font-black text-black tracking-tighter leading-none">{formatMoney(total)}</span></div>
                                    </div>
                                 </div>
                              </div>
                           </div>
                         </div>

                         <div className="flex gap-2 justify-center">
                            <Button onClick={() => handlePrintPakan()} className="w-64 btn-primary h-11 gap-2 rounded-lg text-xs font-black uppercase tracking-widest">
                               <Printer size={16} /> Cetak Invoice
                            </Button>
                            <Button onClick={() => handleKirimWA(activeInvoice, false)} variant="outline" className="w-64 h-11 gap-2 rounded-lg text-xs font-black uppercase tracking-widest text-slate-600 bg-slate-100 hover:bg-slate-200 border-none">
                               <MessageCircle size={16} className="text-green-600" /> Kirim WA
                            </Button>
                         </div>
                      </div>
                    );
                 })()}
            </div>
          </div>
        )}
      </div>
    </SectionContainer>
  );
}
