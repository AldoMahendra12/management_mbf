import { useState, useCallback } from 'react';

// Fallback static data
const FALLBACK_FEED_ITEMS = [
  { id: 'f1',  nama_bahan: 'Katul',           satuan: 'kg',  stok_sekarang: 1800, batas_minimum: 500,  harga_jual_default: 6600 },
  { id: 'f2',  nama_bahan: 'Jagung',          satuan: 'kg',  stok_sekarang: 620,  batas_minimum: 1000, harga_jual_default: 4500 },
  { id: 'f3',  nama_bahan: 'Konsentrat',      satuan: 'kg',  stok_sekarang: 450,  batas_minimum: 200,  harga_jual_default: 387500 },
  { id: 'f4',  nama_bahan: 'Premix',          satuan: 'kg',  stok_sekarang: 80,   batas_minimum: 50,   harga_jual_default: 410000 },
  { id: 'f5',  nama_bahan: 'Pakan Jadi',      satuan: 'setel', stok_sekarang: 24, batas_minimum: 10,   harga_jual_default: 416500 },
];

export const useSupabaseData = (supabase: any) => {
  const [feedItems, setFeedItems] = useState<any[]>(FALLBACK_FEED_ITEMS);
  const [isLoadingFeedItems, setIsLoadingFeedItems] = useState(false);
  
  const [eggStock, setEggStock] = useState<any>({ horn: 0, arab: 0 });
  
  const [feedTransactions, setFeedTransactions] = useState<any[]>([]);
  const [isLoadingFeedTrx, setIsLoadingFeedTrx] = useState(false);
  
  const [eggTransactions, setEggTransactions] = useState<any[]>([]);
  const [isLoadingEggs, setIsLoadingEggs] = useState(false);
  
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);

  const fetchFeedMaster = useCallback(async () => {
    setIsLoadingFeedItems(true);
    if (!supabase) {
      setFeedItems(FALLBACK_FEED_ITEMS);
      setIsLoadingFeedItems(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('master_pakan')
        .select('*')
        .order('nama_bahan', { ascending: true });

      if (error) {
        setFeedItems(FALLBACK_FEED_ITEMS);
      } else if (!data || data.length === 0) {
        setFeedItems(FALLBACK_FEED_ITEMS);
      } else {
        setFeedItems(data);
      }
    } catch (err) {
      console.error('Error fetching feed master:', err);
      setFeedItems(FALLBACK_FEED_ITEMS);
    } finally {
      setIsLoadingFeedItems(false);
    }
  }, [supabase]);

  const fetchEggStock = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('transaksi_telur')
        .select('jumlah_kg, jenis_transaksi, keterangan');

      if (error) throw error;
      
      const stock = (data || []).reduce((acc, curr) => {
        // Parse egg type from keterangan since dedicated column doesn't exist
        const isArab = curr.keterangan?.includes('Jenis: Telur Ayam Arab');
        // If it's specifically Arab, it's Arab. Otherwise, we assume Horn (default)
        const isHorn = !isArab; 
        
        const amount = Number(curr.jumlah_kg) || 0;

        const isAdd = ['Terima Setoran', 'Beli Telur'].includes(curr.jenis_transaksi);
        const isSub = ['Jual ke Luar', 'Jual Telur'].includes(curr.jenis_transaksi);

        if (isAdd) {
          if (isHorn) acc.horn += amount;
          else if (isArab) acc.arab += amount;
        } else if (isSub) {
          if (isHorn) acc.horn -= amount;
          else if (isArab) acc.arab -= amount;
        }
        return acc;
      }, { horn: 0, arab: 0 });
      
      setEggStock(stock);
    } catch (err) {
      console.error('Error fetching egg stock:', err);
    }
  }, [supabase]);

  const fetchFeedTransactions = useCallback(async () => {
    setIsLoadingFeedTrx(true);
    if (!supabase) {
        setIsLoadingFeedTrx(false);
        return;
    }
    try {
      const { data, error } = await supabase
        .from('transaksi_pakan')
        .select(`
          *,
          details:detail_transaksi_pakan(*)
        `)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeedTransactions(data || []);
    } catch (err) {
      console.error('Error fetching feed transactions:', err);
    } finally {
      setIsLoadingFeedTrx(false);
    }
  }, [supabase]);

  const fetchEggTransactions = useCallback(async () => {
    setIsLoadingEggs(true);
    if (!supabase) {
        setIsLoadingEggs(false);
        return;
    }
    try {
      const { data, error } = await supabase
        .from('transaksi_telur')
        .select('*')
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEggTransactions(data || []);
    } catch (err) {
      console.error('Error fetching egg transactions:', err);
    } finally {
      setIsLoadingEggs(false);
    }
  }, [supabase]);

  const fetchPaymentHistory = useCallback(async (transaksi_id: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('log_pembayaran')
        .select('*')
        .eq('transaksi_id', transaksi_id)
        .order('tanggal', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        // Table may not exist yet — fail silently
        console.warn('log_pembayaran not available:', error.message);
        setPaymentHistory([]);
        return;
      }
      setPaymentHistory(data || []);
    } catch (err) {
      console.warn('Payment history fetch skipped:', err);
      setPaymentHistory([]);
    }
  }, [supabase]);

  const isLoading = isLoadingFeedItems || isLoadingFeedTrx || isLoadingEggs;

  return {
    feedItems, fetchFeedMaster, isLoadingFeedItems,
    eggStock, fetchEggStock,
    feedTransactions, fetchFeedTransactions, isLoadingFeedTrx,
    eggTransactions, fetchEggTransactions, isLoadingEggs,
    paymentHistory, fetchPaymentHistory, setPaymentHistory,
    isLoading
  };
};
