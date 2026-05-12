import React from 'react';
import { Plus, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionContainer } from '../layout/SectionContainer';
import { cn } from '@/lib/utils';

import { useDashboard } from '../../contexts/DashboardContext';

const POPULATION_EVENTS = [
  { id: 1, date: '20 Apr 2026', type: 'Afkir', amount: 12, kandang: 'Kandang B2', note: 'Indikasi penyakit pernafasan (Kematian)', color: 'bg-red-500' },
  { id: 2, date: '15 Apr 2026', type: 'Afkir', amount: 45, kandang: 'Kandang A1', note: 'Produksi menurun signifikan (Afkir)', color: 'bg-red-500' },
  { id: 3, date: '12 Apr 2026', type: 'Ayam Masuk', amount: 2500, kandang: 'Kandang D1', note: 'Batch baru dari supplier', color: 'bg-blue-500' },
  { id: 4, date: '1 Apr 2026', type: 'Afkir', amount: 80, kandang: 'Kandang A2', note: 'Batch akhir masa produksi', color: 'bg-red-500' },
  { id: 5, date: '22 Mar 2026', type: 'Afkir', amount: 8, kandang: 'Kandang B1', note: 'Heat stress (Kematian)', color: 'bg-red-500' },
];

export function PopulationView() {
  const { userRole, setIsPopulationModalOpen } = useDashboard();
  return (
    <SectionContainer className="space-y-6">
      <div className="flex items-center justify-between bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Populasi</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pantau data populasi ayam, mortalitas, dan mutasi kandang</p>
        </div>
        <Button 
          disabled={userRole === 'viewer'}
          className="bg-orange-600 hover:bg-orange-700 text-white h-11 px-6 gap-2 shadow-lg shadow-orange-500/20 font-black text-xs uppercase tracking-widest rounded-lg" 
          onClick={() => setIsPopulationModalOpen(true)}
        >
          <Plus size={18} />
          Catat Kejadian
        </Button>
      </div>

      {/* Population Summary (3 large cards) */}
      <div className="grid grid-cols-3 gap-6">
        {[
          { label: 'Total Populasi Aktif', val: '28.450 ekor', sub: 'Per hari ini, semua kandang' },
          { label: 'Kandang Baterai (Bertelur)', val: '26.200 ekor', sub: 'Siap bertelur aktif' },
          { label: 'Kandang Grower', val: '2.250 ekor', sub: 'Dalam masa pembesaran' },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-slate-100 p-6 rounded-lg shadow-sm flex flex-col justify-between h-[160px]">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{card.label}</p>
             <div>
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{card.val}</h3>
               <p className="text-[10px] font-bold text-slate-400 mt-2 opacity-70 tracking-tight">{card.sub}</p>
             </div>
          </div>
        ))}
      </div>

       <div className="p-6 bg-slate-900 rounded-xl border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div>
               <h4 className="text-xs font-black text-orange-500 uppercase tracking-[0.3em] mb-2">Manajemen Terpusat</h4>
               <h3 className="text-2xl font-black text-white tracking-tight">Total Populasi Kandang MBF</h3>
               <p className="text-[10px] font-bold text-slate-400 mt-2 max-w-md leading-relaxed uppercase tracking-widest">Seluruh ayam dikelola secara kolektif oleh PT. MBF. Tidak ada pembagian data per owner individu dalam sistem.</p>
             </div>
            <div className="flex gap-4">
              <div className="px-6 py-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Kapasitas</p>
                 <p className="text-xl font-black text-white tracking-tighter">35.000 Ekor</p>
              </div>
              <div className="px-6 py-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">utilitas Kandang</p>
                 <p className="text-xl font-black text-orange-500 tracking-tighter">81.3%</p>
              </div>
            </div>
         </div>
      </div>

      {/* Full Width Layout */}
      <div className="pb-6">
        {/* Left Column: Timeline (now full width) */}
        <Card className="border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-6 py-5">
            <CardTitle className="text-base font-black text-slate-800 uppercase tracking-tight">Riwayat Kejadian</CardTitle>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-70 italic">Dicatat hanya saat terjadi. Tidak ada kewajiban input harian.</p>
            
            <div className="flex items-center mt-6">
               <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-inner">
                  {['Semua', 'Ayam Masuk', 'Afkir'].map((t) => (
                    <button key={t} className={cn("px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all rounded-md", t === 'Semua' ? "bg-slate-900 text-white shadow-sm" : "text-slate-400 hover:text-slate-600")}>
                      {t}
                    </button>
                  ))}
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
             <div className="relative space-y-8">
                {/* Timeline backbone */}
                <div className="absolute left-[3px] top-2 bottom-0 w-0.5 bg-slate-100" />

                {POPULATION_EVENTS.map((event) => (
                  <div key={event.id} className="relative pl-8 flex flex-col gap-2 group">
                     <div className={cn("absolute left-0 top-1.5 w-2 h-2 rounded-full border-2 border-white ring-2 ring-slate-50", event.color)} />
                     
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{event.date}</span>
                           <Badge className={cn(
                              "text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border-none shadow-none",
                              event.type === 'Kematian' ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                           )}>
                              {event.type}
                           </Badge>
                           <span className="text-xs font-black text-slate-900">{event.amount} ekor</span>
                        </div>
                     </div>

                     <div className="flex flex-col gap-1">
                        <p className="text-xs font-black text-slate-800 tracking-tight">{event.kandang}</p>
                        <p className="text-xs font-medium text-slate-400 italic">"{event.note}"</p>
                     </div>
                  </div>
                ))}
             </div>
             
             <Button variant="link" className="p-0 h-auto text-[10px] font-black text-orange-600 uppercase tracking-widest hover:no-underline mt-10 group">
                Lihat semua riwayat <ArrowUpRight size={14} className="ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
             </Button>
          </CardContent>
        </Card>

      </div>
    </SectionContainer>
  );
}
