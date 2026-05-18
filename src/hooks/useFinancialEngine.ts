import { useMemo } from 'react';

export const useFinancialEngine = (
  eggTransactions: any[],
  feedTransactions: any[],
  afkirTransactions: any[],
  eggStock: number,
  feedItems: any[]
) => {
  // --- DYNAMIC BILLING CALCULATIONS ---
  const eggReceivables = useMemo(() => eggTransactions.filter((trx: any) => {
    const t = (trx.jenis_transaksi || '').toLowerCase();
    return t.includes('jual') || t.includes('keluar');
  }), [eggTransactions]);
  const totalRecvTelur = useMemo(() => eggReceivables.reduce((acc: number, t: any) => acc + (Number(t.total_harga) || 0), 0), [eggReceivables]);
  const totalPaidTelur = useMemo(() => eggReceivables.reduce((acc: number, t: any) => acc + (Number(t.jumlah_dibayar) || 0), 0), [eggReceivables]);
  const sisaTelur = totalRecvTelur - totalPaidTelur;
  
  const eggPayables = useMemo(() => eggTransactions.filter((trx: any) => {
    const t = (trx.jenis_transaksi || '').toLowerCase();
    return t.includes('terima') || t.includes('beli') || t.includes('setoran') || t.includes('masuk');
  }), [eggTransactions]);
  const totalDebtTelur = useMemo(() => eggPayables.reduce((acc: number, t: any) => acc + (Number(t.total_harga) || 0), 0), [eggPayables]);
  const totalPaidDebtTelur = useMemo(() => eggPayables.reduce((acc: number, t: any) => acc + (Number(t.jumlah_dibayar) || 0), 0), [eggPayables]);
  const sisaUtangTelur = totalDebtTelur - totalPaidDebtTelur;

  const summaryTelur = useMemo(() => [
    { label: 'Total Piutang Telur', val: sisaTelur, sub: `Dari ${eggReceivables.length} transaksi` },
    { label: 'Total Terbayar', val: totalPaidTelur, sub: 'Akumulasi bayar diterima' },
    { label: 'Invoice Lunas', val: eggReceivables.filter((t: any) => (t.total_harga - (t.jumlah_dibayar || 0)) === 0).length, sub: 'Transaksi selesai' },
    { label: 'Belum Lunas', val: eggReceivables.filter((t: any) => (t.total_harga - (t.jumlah_dibayar || 0)) > 0).length, sub: 'Perlu follow up' },
  ], [sisaTelur, eggReceivables.length, totalPaidTelur, eggReceivables]);

  const feedRecv = useMemo(() => feedTransactions.filter((trx: any) => {
    const t = (trx.jenis_transaksi || '').toLowerCase();
    return t.includes('jual') || t.includes('keluar');
  }), [feedTransactions]);
  const totalRecvPakan = useMemo(() => feedRecv.reduce((acc: number, t: any) => acc + (Number(t.total_tagihan) || 0), 0), [feedRecv]);
  const totalPaidPakan = useMemo(() => feedRecv.reduce((acc: number, t: any) => acc + (Number(t.dibayar_hari_ini) || 0), 0), [feedRecv]);
  const sisaPakan = totalRecvPakan - totalPaidPakan;

  const feedPayables = useMemo(() => feedTransactions.filter((trx: any) => {
    const t = (trx.jenis_transaksi || '').toLowerCase();
    return t.includes('beli') || t.includes('masuk') || t.includes('supplier') || t.includes('terima') || t.includes('setoran');
  }), [feedTransactions]);
  const totalDebtPakan = useMemo(() => feedPayables.reduce((acc: number, t: any) => acc + (Number(t.total_tagihan) || 0), 0), [feedPayables]);
  const totalPaidDebtPakan = useMemo(() => feedPayables.reduce((acc: number, t: any) => acc + (Number(t.dibayar_hari_ini) || 0), 0), [feedPayables]);
  const sisaUtangPakan = totalDebtPakan - totalPaidDebtPakan;

  const summaryPakan = useMemo(() => [
    { label: 'Total Piutang Pakan', val: sisaPakan, sub: `Dari ${feedRecv.length} transaksi` },
    { label: 'Total Terbayar', val: totalPaidPakan, sub: 'Akumulasi bayar diterima' },
    { label: 'Invoice Lunas', val: feedRecv.filter((t: any) => (t.total_tagihan - (t.dibayar_hari_ini || 0)) === 0).length, sub: 'Transaksi selesai' },
    { label: 'Belum Lunas', val: feedRecv.filter((t: any) => (t.total_tagihan - (t.dibayar_hari_ini || 0)) > 0).length, sub: 'Perlu follow up' },
  ], [sisaPakan, feedRecv.length, totalPaidPakan, feedRecv]);

  // --- DYNAMIC DASHBOARD CALCULATIONS ---
  const dashboardStats = useMemo(() => ({
    piutang: sisaTelur + sisaPakan,
    hutang: eggTransactions
      .filter((t: any) => {
        const j = (t.jenis_transaksi || '').toLowerCase();
        return j.includes('terima') || j.includes('beli') || j.includes('setoran') || j.includes('masuk');
      })
      .reduce((s: number, t: any) => s + ((Number(t.total_harga) || 0) - (Number(t.jumlah_dibayar) || 0)), 0) +
      feedTransactions
      .filter((t: any) => {
        const j = (t.jenis_transaksi || '').toLowerCase();
        return j.includes('beli') || j.includes('masuk') || j.includes('supplier') || j.includes('terima') || j.includes('setoran');
      })
      .reduce((s: number, t: any) => s + ((Number(t.total_tagihan) || 0) - (Number(t.dibayar_hari_ini) || 0)), 0),
    stokTelur: (Number((eggStock as any)?.horn) || 0) + (Number((eggStock as any)?.arab) || 0),
    criticalFeed: feedItems.filter((i: any) => (Number(i.stok_sekarang) || 0) <= (Number(i.batas_minimum) || 50)).length
  }), [sisaTelur, sisaPakan, eggTransactions, feedTransactions, eggStock, feedItems, sisaTelur, sisaPakan]);

  const recentCombinedActivities = useMemo(() => [
    ...eggTransactions.slice(0, 15).map(t => ({ ...t, source: 'Telur' })),
    ...feedTransactions.slice(0, 15).map(t => ({ ...t, source: 'Pakan' })),
    ...afkirTransactions.slice(0, 15).map(t => ({ ...t, source: 'Afkir' }))
  ].sort((a, b) => new Date(b.created_at || b.tanggal).getTime() - new Date(a.created_at || a.tanggal).getTime())
   .slice(0, 15), [eggTransactions, feedTransactions, afkirTransactions]);

  // --- FINANCIAL ENGINE ---
  const financialData = useMemo(() => {
    let totalKas = 100000000; // Asumsi modal awal 100jt (bisa disesuaikan)
    let totalPiutang = 0;
    let totalUtang = 0;
    const ledgerMap: Record<string, any> = {};

    const processTrx = (trx: any, isTelur: boolean) => {
      const jt = trx.jenis_transaksi?.toLowerCase() || '';
      const isMasuk = jt === 'terima setoran' || jt === 'beli telur' || jt === 'masuk gudang' || jt === 'beli pakan' || jt === 'beli dari supplier';
      const mitra = trx.nama_mitra || trx.mitra_name || trx.keterangan?.replace('Mitra: ', '') || 'Pelanggan Umum';
      const tagihan = trx.total_harga || trx.total_tagihan || 0;
      const dibayar = trx.jumlah_dibayar || trx.dibayar_hari_ini || 0;
      const sisa = tagihan - dibayar;

      if (!ledgerMap[mitra]) ledgerMap[mitra] = { name: mitra, type: isTelur ? 'Telur' : 'Pakan', balance: 0 };

      if (isMasuk) {
        totalKas -= dibayar; // Uang keluar bayar supplier
        totalUtang += sisa;
        ledgerMap[mitra].balance -= sisa;
      } else {
        totalKas += dibayar; // Uang masuk dari customer
        totalPiutang += sisa;
        ledgerMap[mitra].balance += sisa;
      }
    };

    eggTransactions.forEach(t => processTrx(t, true));
    feedTransactions.forEach(t => processTrx(t, false));
    afkirTransactions.forEach(t => {
      const tagihan = t.total_harga || 0;
      const dibayar = t.jumlah_dibayar || 0;
      totalKas += dibayar;
      totalPiutang += (tagihan - dibayar);
    });

    return { 
      totalKas, totalPiutang, totalUtang, 
      ledgerArray: Object.values(ledgerMap).filter(l => l.balance !== 0) 
    };
  }, [eggTransactions, feedTransactions, afkirTransactions]);

  return {
    eggReceivables, sisaTelur, summaryTelur,
    eggPayables, sisaUtangTelur,
    feedRecv, sisaPakan, summaryPakan,
    feedPayables, sisaUtangPakan,
    dashboardStats, recentCombinedActivities, financialData
  };
};
