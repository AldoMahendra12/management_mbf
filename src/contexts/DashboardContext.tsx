import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { useFinancialEngine } from '../hooks/useFinancialEngine';

interface DashboardContextType {
  // Auth & Roles
  user: any;
  userRole: 'admin' | 'editor' | 'viewer' | null;
  
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  // Notifications
  notification: { show: boolean; message: string; type: 'success' | 'error' };
  showToast: (message: string, type?: 'success' | 'error') => void;
  
  // Data from Hooks
  supabase: any;
  isLoading: boolean;
  feedItems: any[];
  eggStock: any;
  eggTransactions: any[];
  feedTransactions: any[];
  summaryTelur: any;
  summaryPakan: any;
  eggReceivables: any[];
  eggPayables: any[];
  feedRecv: any[];
  feedPayables: any[];
  sisaUtangTelur: number;
  sisaUtangPakan: number;
  financialData: any;
  dashboardStats: any;
  recentCombinedActivities: any[];
  
  // Modals & Forms (Shared)
  mitraName: string;
  setMitraName: (name: string) => void;
  
  // Egg Modal State
  eggModalType: 'terima' | 'jual' | null;
  setEggModalType: (type: 'terima' | 'jual' | null) => void;
  eggDate: string;
  setEggDate: (date: string) => void;
  eggIkat: number;
  setEggIkat: (ikat: number) => void;
  eggQty: number;
  eggPrice: number;
  setEggPrice: (price: number) => void;
  eggNotes: string;
  setEggNotes: (notes: string) => void;
  eggType: string;
  setEggType: (type: string) => void;
  isSubmittingEggs: boolean;
  handleSubmitEgg: () => void;
  
  // Feed Modal State
  feedModalType: 'beli' | 'jual' | null;
  setFeedModalType: (type: 'beli' | 'jual' | null) => void;
  feedCart: any[];
  setFeedCart: (cart: any[]) => void;
  addFeedCartRow: () => void;
  removeFeedCartRow: (index: number) => void;
  updateFeedCartRow: (index: number, field: string, value: any) => void;
  handleBahanChange: (index: number, id: string) => void;
  feedCartTotal: number;
  feedNotes: string;
  setFeedNotes: (notes: string) => void;
  isSubmittingFeed: boolean;
  handleSubmitFeed: () => void;
  
  // Filters
  eggSearchQuery: string;
  setEggSearchQuery: (q: string) => void;
  eggTypeFilter: 'Semua' | 'Beli Telur' | 'Jual Telur';
  setEggTypeFilter: (f: 'Semua' | 'Beli Telur' | 'Jual Telur') => void;
  eggMonthFilter: string;
  setEggMonthFilter: (f: string) => void;
  eggMitraFilter: string;
  setEggMitraFilter: (f: string) => void;
  
  feedSearchQuery: string;
  setFeedSearchQuery: (q: string) => void;
  feedTypeFilter: 'Semua' | 'Beli Pakan' | 'Jual Pakan';
  setFeedTypeFilter: (f: 'Semua' | 'Beli Pakan' | 'Jual Pakan') => void;
  feedMonthFilter: string;
  setFeedMonthFilter: (f: string) => void;
  feedMitraFilter: string;
  setFeedMitraFilter: (f: string) => void;

  // Details
  selectedEggDetail: any;
  setSelectedEggDetail: (d: any) => void;
  isEggDetailOpen: boolean;
  setIsEggDetailOpen: (o: boolean) => void;
  selectedFeedDetail: any;
  setSelectedFeedDetail: (d: any) => void;
  isFeedDetailOpen: boolean;
  setIsFeedDetailOpen: (o: boolean) => void;
  isPopulationModalOpen: boolean;
  setIsPopulationModalOpen: (o: boolean) => void;
  eventEntryType: 'Ayam Masuk' | 'Afkir';
  setEventEntryType: (type: 'Ayam Masuk' | 'Afkir') => void;
  isSubmittingPopulation: boolean;
  handleSubmitPopulation: () => void;
  
  // Payment Modal
  invoiceModalMode: 'bayar' | 'detail' | null;
  setInvoiceModalMode: (mode: 'bayar' | 'detail' | null) => void;
  selectedInvoice: any;
  setSelectedInvoice: (inv: any) => void;
  paymentAmount: number;
  setPaymentAmount: (amt: number) => void;
  paymentDate: string;
  paymentNotes: string;
  setPaymentNotes: (notes: string) => void;
  setPaymentDate: (date: string) => void;
  paymentHistory: any[];
  fetchPaymentHistory: (id: string) => void;

  // Billing Specific
  billingMode: 'telur' | 'pakan';
  setBillingMode: (mode: 'telur' | 'pakan') => void;
  billingSubMode: 'piutang' | 'hutang';
  setBillingSubMode: (mode: 'piutang' | 'hutang') => void;
  
  // Refetch Methods
  fetchFeedMaster: () => void;
  fetchEggStock: () => void;
  fetchEggTransactions: () => void;
  fetchFeedTransactions: () => void;
  handleDeleteEggTransaction: (id: string) => Promise<void>;
  handleDeleteFeedTransaction: (id: string) => Promise<void>;
  
  // Payment Submission
  isSubmittingPayment: boolean;
  setIsSubmittingPayment: (val: boolean) => void;
  handleSubmitPayment: () => Promise<void>;
  
  setNotification: (n: { show: boolean, message: string, type: 'success' | 'error' }) => void;

    confirmModal: {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'confirm' | 'alert';
    onConfirm: () => void;
  };
  setConfirmModal: (state: any) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  showAlert: (title: string, message: string) => void;

  // Utility
  formatMoney: (amount: number, short?: boolean) => string;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const { user, userRole, supabase } = useAuth();
  const [activeTab, setActiveTab] = useState('Beranda');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

  // Shared State
  const [mitraName, setMitraName] = useState('');

  // Egg State
  const [eggModalType, setEggModalType] = useState<'terima' | 'jual' | null>(null);
  const [eggDate, setEggDate] = useState(new Date().toISOString().split('T')[0]);
  const [eggIkat, setEggIkat] = useState<number>(0);
  const [eggPrice, setEggPrice] = useState<number>(0);
  const [eggNotes, setEggNotes] = useState<string>('');
  const [eggType, setEggType] = useState<string>('Telur Ayam Horn');
  const [isSubmittingEggs, setIsSubmittingEggs] = useState(false);
  const eggQty = useMemo(() => eggIkat * 15, [eggIkat]);

  // Feed State
  const [feedModalType, setFeedModalType] = useState<'beli' | 'jual' | null>(null);
  const [feedDate, setFeedDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedCart, setFeedCart] = useState<any[]>([{ id_bahan: '', qty: 0, harga_per_satuan: 0 }]);
  const [isSubmittingFeed, setIsSubmittingFeed] = useState(false);
  const [feedNotes, setFeedNotes] = useState<string>('');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'confirm' | 'alert';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'confirm',
    onConfirm: () => {}
  });

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm
    });
  }, []);

  const showAlert = useCallback((title: string, message: string) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => {}
    });
  }, []);

  // Filters
  const [eggSearchQuery, setEggSearchQuery] = useState('');
  const [eggTypeFilter, setEggTypeFilter] = useState<'Semua' | 'Beli Telur' | 'Jual Telur'>('Semua');
  const [eggMonthFilter, setEggMonthFilter] = useState<string>('all');
  const [eggMitraFilter, setEggMitraFilter] = useState('Semua');

  const [feedSearchQuery, setFeedSearchQuery] = useState('');
  const [feedTypeFilter, setFeedTypeFilter] = useState<'Semua' | 'Beli Pakan' | 'Jual Pakan'>('Semua');
  const [feedMonthFilter, setFeedMonthFilter] = useState<string>('all');
  const [feedMitraFilter, setFeedMitraFilter] = useState('Semua');

  // Details
  const [selectedEggDetail, setSelectedEggDetail] = useState<any>(null);
  const [isEggDetailOpen, setIsEggDetailOpen] = useState(false);
  const [selectedFeedDetail, setSelectedFeedDetail] = useState<any>(null);
  const [isFeedDetailOpen, setIsFeedDetailOpen] = useState(false);
  const [isPopulationModalOpen, setIsPopulationModalOpen] = useState(false);
  const [eventEntryType, setEventEntryType] = useState<'Ayam Masuk' | 'Afkir'>('Ayam Masuk');
  const [isSubmittingPopulation, setIsSubmittingPopulation] = useState(false);

  // Payment
  const [invoiceModalMode, setInvoiceModalMode] = useState<'bayar' | 'detail' | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [billingMode, setBillingMode] = useState<'telur' | 'pakan'>('telur');
  const [billingSubMode, setBillingSubMode] = useState<'piutang' | 'hutang'>('piutang');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Data Hooks
  const {
    isLoading: isDataLoading,
    feedItems,
    eggStock,
    eggTransactions,
    feedTransactions,
    paymentHistory,
    fetchFeedMaster,
    fetchEggStock,
    fetchEggTransactions,
    fetchFeedTransactions,
    fetchPaymentHistory
  } = useSupabaseData(supabase);

  const {
    summaryTelur,
    summaryPakan,
    eggReceivables,
    eggPayables,
    feedRecv,
    feedPayables,
    sisaUtangTelur,
    sisaUtangPakan,
    financialData,
    dashboardStats,
    recentCombinedActivities
  } = useFinancialEngine(eggTransactions, feedTransactions, eggStock, feedItems);

  // Handlers
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  }, []);

  const handleSubmitEgg = useCallback(async () => {
    if (!mitraName || eggIkat <= 0) {
      showToast('Mohon lengkapi data transaksi', 'error');
      return;
    }
    setIsSubmittingEggs(true);
    
    const jenis = eggModalType === 'terima' ? 'Beli Telur' : 'Jual Telur';
    const total_kg = eggIkat * 15;
    
    try {
      if (supabase) {
        const { error } = await supabase
          .from('transaksi_telur')
          .insert([{
            tanggal: eggDate,
            jenis_transaksi: jenis,
            // Column 'jenis_telur' and 'nama_mitra' do not exist in the schema, 
            // so we include them in the keterangan field for now.
            keterangan: `Mitra: ${mitraName} | Jenis: ${eggType}${eggNotes ? ` | Ket: ${eggNotes}` : ''}`,
            jumlah_kg: total_kg,
            harga_per_kg: eggPrice,
            total_harga: total_kg * eggPrice,
            jumlah_dibayar: 0
          }]);
          
        if (error) throw error;
        
        await fetchEggTransactions();
        await fetchEggStock();
        showToast(`Berhasil mencatat ${eggModalType === 'terima' ? 'pembelian' : 'penjualan'} telur`);
        setEggModalType(null);
        setEggNotes('');
      } else {
        // Fallback for demo without DB
        setTimeout(() => {
          showToast(`Berhasil mencatat ${eggModalType === 'terima' ? 'setoran' : 'penjualan'} telur (Demo)`);
          setEggModalType(null);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error submitting egg transaction:', err);
      showToast(err.message || 'Gagal menyimpan transaksi', 'error');
    } finally {
      setIsSubmittingEggs(false);
    }
  }, [
    mitraName, eggIkat, eggModalType, eggPrice, eggDate, eggType, eggNotes,
    fetchEggTransactions, fetchEggStock, showToast, supabase
  ]);

  const addFeedCartRow = useCallback(() => {
    setFeedCart(prev => [...prev, { id_bahan: '', qty: 0, harga_per_satuan: 0 }]);
  }, []);

  const removeFeedCartRow = useCallback((index: number) => {
    setFeedCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateFeedCartRow = useCallback((index: number, field: string, value: any) => {
    setFeedCart(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  }, []);

  const handleBahanChange = useCallback((index: number, id: string) => {
    const item = feedItems.find(f => String(f.id) === String(id));
    if (item) {
      updateFeedCartRow(index, 'id_bahan', id);
      updateFeedCartRow(index, 'harga_per_satuan', item.harga_jual_default || 0);
    }
  }, [feedItems, updateFeedCartRow]);

  const feedCartTotal = useMemo(() => {
    return feedCart.reduce((acc, curr) => acc + ((curr.qty || 0) * (curr.harga_per_satuan || 0)), 0);
  }, [feedCart]);

  const handleSubmitFeed = useCallback(async () => {
    if (!mitraName || feedCart.some(i => !i.id_bahan || i.qty <= 0)) {
      showToast('Mohon lengkapi data keranjang pakan', 'error');
      return;
    }
    setIsSubmittingFeed(true);

    const jenis = feedModalType === 'beli' ? 'Beli Pakan' : 'Jual Pakan';
    
    try {
      if (supabase) {
        // 1. Insert header — matches actual transaksi_pakan schema
        const { data: insertedHeaders, error: headerError } = await supabase
          .from('transaksi_pakan')
          .insert([{
            tanggal: feedDate,
            jenis_transaksi: jenis,
            nama_mitra: mitraName,
            total_tagihan: feedCartTotal,
            dibayar_hari_ini: 0,
            keterangan: `Mitra: ${mitraName}${feedNotes ? ` | Ket: ${feedNotes}` : ''}`
          }])
          .select();

        if (headerError) throw headerError;
        if (!insertedHeaders || insertedHeaders.length === 0) throw new Error('Header insert returned empty');
        const header = insertedHeaders[0];

        // 2. Insert details — matches actual detail_transaksi_pakan schema
        const details = feedCart.map(item => ({
          transaksi_pakan_id: header.id,
          bahan_id: item.id_bahan,
          qty: item.qty,
          harga_satuan: item.harga_per_satuan,
          subtotal: item.qty * item.harga_per_satuan
        }));

        const { error: detailError } = await supabase
          .from('detail_transaksi_pakan')
          .insert(details);

        if (detailError) throw detailError;

        // 3. Update stock in master_pakan
        for (const item of feedCart) {
          const currentItem = feedItems.find(f => String(f.id) === String(item.id_bahan));
          if (currentItem) {
            const newStock = jenis === 'Beli Pakan' 
              ? currentItem.stok_sekarang + item.qty
              : currentItem.stok_sekarang - item.qty;
              
            await supabase
              .from('master_pakan')
              .update({ stok_sekarang: newStock })
              .eq('id', item.id_bahan);
          }
        }

        await fetchFeedTransactions();
        await fetchFeedMaster();
        showToast(`Berhasil mencatat ${feedModalType === 'beli' ? 'pembelian' : 'penjualan'} pakan`);
        setFeedModalType(null);
        setMitraName('');
        setFeedNotes('');
        setFeedCart([{ id_bahan: '', qty: 0, harga_per_satuan: 0 }]);
      } else {
        setTimeout(() => {
          showToast(`Berhasil mencatat ${feedModalType === 'beli' ? 'pembelian' : 'penjualan'} pakan (Demo)`);
          setFeedModalType(null);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Error submitting feed transaction:', err);
      showToast(err.message || 'Gagal menyimpan transaksi pakan', 'error');
    } finally {
      setIsSubmittingFeed(false);
    }
  }, [mitraName, feedCart, feedModalType, feedDate, feedCartTotal, feedItems, fetchFeedTransactions, fetchFeedMaster, showToast, supabase]);

  const handleSubmitPopulation = useCallback(async () => {
    setIsSubmittingPopulation(true);
    setTimeout(() => {
      setIsSubmittingPopulation(false);
      setIsPopulationModalOpen(false);
      showToast('Berhasil mencatat kejadian populasi');
    }, 1000);
  }, [showToast]);

  const formatMoney = useCallback((amount: number, short: boolean = false) => {
    if (short && amount >= 1000000) {
      return `Rp ${(amount / 1000000).toFixed(1)}jt`;
    }
    const formatted = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount);
    return `Rp ${formatted}`;
  }, []);

  const handleDeleteEggTransaction = useCallback(async (id: string) => {
    showConfirm(
      'Hapus Transaksi?',
      'Transaksi ini akan dihapus permanen dari database.',
      async () => {
        try {
          if (supabase) {
            const { error } = await supabase.from('transaksi_telur').delete().eq('id', id);
            if (error) throw error;
            await fetchEggTransactions();
            await fetchEggStock();
            showToast('Transaksi telur berhasil dihapus');
          }
        } catch (err) {
          console.error('Error deleting egg trx:', err);
          showToast('Gagal menghapus transaksi', 'error');
        }
      }
    );
  }, [supabase, fetchEggTransactions, fetchEggStock, showToast, showConfirm]);

  const handleDeleteFeedTransaction = useCallback(async (id: string) => {
    showConfirm(
      'Hapus Transaksi Pakan?',
      'Stok pakan akan otomatis dikembalikan ke gudang.',
      async () => {
        try {
          if (supabase) {
            // Get details first to revert stock
            const { data: details, error: detErr } = await supabase
              .from('detail_transaksi_pakan')
              .select('*')
              .eq('transaksi_pakan_id', id);
            
            if (detErr) throw detErr;

            const { data: trxHeader } = await supabase.from('transaksi_pakan').select('jenis_transaksi').eq('id', id).single();

            // Revert stock
            if (details && trxHeader) {
              for (const item of details) {
                const currentItem = feedItems.find(f => String(f.id) === String(item.bahan_id));
                if (currentItem) {
                  const newStock = trxHeader.jenis_transaksi === 'Beli Pakan'
                    ? currentItem.stok_sekarang - item.qty
                    : currentItem.stok_sekarang + item.qty;
                  
                  await supabase.from('master_pakan').update({ stok_sekarang: newStock }).eq('id', item.bahan_id);
                }
              }
            }

            // Delete details and header
            await supabase.from('detail_transaksi_pakan').delete().eq('transaksi_pakan_id', id);
            const { error } = await supabase.from('transaksi_pakan').delete().eq('id', id);
            
            if (error) throw error;
            await fetchFeedTransactions();
            await fetchFeedMaster();
            showToast('Transaksi pakan berhasil dihapus');
          }
        } catch (err) {
          console.error('Error deleting feed trx:', err);
          showToast('Gagal menghapus transaksi', 'error');
        }
      }
    );
  }, [supabase, feedItems, fetchFeedTransactions, fetchFeedMaster, showToast, showConfirm]);

  const handleSubmitPayment = useCallback(async () => {
    if (paymentAmount <= 0) {
      showAlert('Nominal Tidak Valid', 'Nominal pembayaran harus lebih dari Rp 0.');
      return;
    }
    if (!selectedInvoice || !supabase) {
      showAlert('Error', 'Data invoice atau koneksi database tidak tersedia.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      // 1. Insert log payment
      const { error: logError } = await supabase
        .from('log_pembayaran')
        .insert([{
          transaksi_id: selectedInvoice.id,
          nominal: paymentAmount,
          tanggal: paymentDate,
          keterangan: paymentNotes,
          created_at: new Date().toISOString()
        }]);

      if (logError) throw logError;

      // 2. Update parent transaction total paid
      const currentPaid = selectedInvoice.jumlah_dibayar ?? selectedInvoice.dibayar_hari_ini ?? 0;
      const newTotalPaid = currentPaid + paymentAmount;

      if (billingMode === 'telur') {
        const { error: updError } = await supabase
          .from('transaksi_telur')
          .update({ jumlah_dibayar: newTotalPaid })
          .eq('id', selectedInvoice.id);
        if (updError) throw updError;
      } else {
        const { error: updError } = await supabase
          .from('transaksi_pakan')
          .update({ dibayar_hari_ini: newTotalPaid })
          .eq('id', selectedInvoice.id);
        if (updError) throw updError;
      }

      // 3. Refresh all data
      await Promise.all([
        fetchEggTransactions(),
        fetchFeedTransactions(),
        fetchPaymentHistory(selectedInvoice.id)
      ]);

      // 4. Update local detail states if they match the current invoice
      if (selectedEggDetail && selectedEggDetail.id === selectedInvoice.id) {
        setSelectedEggDetail((prev: any) => ({ ...prev, [billingMode === 'telur' ? 'jumlah_dibayar' : 'dibayar_hari_ini']: newTotalPaid }));
      }
      if (selectedFeedDetail && selectedFeedDetail.id === selectedInvoice.id) {
        setSelectedFeedDetail((prev: any) => ({ ...prev, [billingMode === 'telur' ? 'jumlah_dibayar' : 'dibayar_hari_ini']: newTotalPaid }));
      }
      
      showAlert('Pembayaran Berhasil', `Berhasil mencatat pembayaran sebesar ${formatMoney(paymentAmount)}.`);
      setPaymentAmount(0);
      setPaymentNotes('');
      setInvoiceModalMode(null);
    } catch (err: any) {
      console.error('Error saving payment:', err);
      showAlert('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menghubungi server.');
    } finally {
      setIsSubmittingPayment(false);
    }
  }, [
    paymentAmount, paymentDate, paymentNotes, selectedInvoice, supabase, 
    billingMode, fetchEggTransactions, fetchFeedTransactions, fetchPaymentHistory, 
    formatMoney, showAlert, setInvoiceModalMode
  ]);

  // Initial Fetch
  useEffect(() => {
    if (supabase) {
      fetchFeedMaster();
      fetchEggStock();
      fetchEggTransactions();
      fetchFeedTransactions();
    }
  }, [supabase, fetchFeedMaster, fetchEggStock, fetchEggTransactions, fetchFeedTransactions]);

  // Refresh stock on modal open
  useEffect(() => {
    if (eggModalType || feedModalType) {
      fetchEggStock();
      fetchFeedMaster();
    }
  }, [eggModalType, feedModalType, fetchEggStock, fetchFeedMaster]);

  const isLoading = isDataLoading && user !== null;

  const value = {
    user,
    userRole: userRole as any,
    activeTab,
    setActiveTab,
    notification,
    showToast,
    supabase,
    isLoading,
    feedItems,
    eggStock,
    eggTransactions,
    feedTransactions,
    summaryTelur,
    summaryPakan,
    eggReceivables,
    eggPayables,
    feedRecv,
    feedPayables,
    sisaUtangTelur,
    sisaUtangPakan,
    financialData,
    dashboardStats,
    recentCombinedActivities,
    mitraName,
    setMitraName,
    eggModalType,
    setEggModalType,
    eggDate,
    setEggDate,
    eggIkat,
    setEggIkat,
    eggQty,
    eggPrice,
    setEggPrice,
    eggNotes,
    setEggNotes,
    eggType,
    setEggType,
    feedNotes,
    setFeedNotes,
    isSubmittingEggs,
    handleSubmitEgg,
    feedModalType,
    setFeedModalType,
    feedCart,
    setFeedCart,
    addFeedCartRow,
    removeFeedCartRow,
    updateFeedCartRow,
    handleBahanChange,
    feedCartTotal,
    isSubmittingFeed,
    handleSubmitFeed,
    eggSearchQuery,
    setEggSearchQuery,
    eggTypeFilter,
    setEggTypeFilter,
    eggMonthFilter,
    setEggMonthFilter,
    eggMitraFilter,
    setEggMitraFilter,
    feedSearchQuery,
    setFeedSearchQuery,
    feedTypeFilter,
    setFeedTypeFilter,
    feedMonthFilter,
    setFeedMonthFilter,
    feedMitraFilter,
    setFeedMitraFilter,
    selectedEggDetail,
    setSelectedEggDetail,
    isEggDetailOpen,
    setIsEggDetailOpen,
    selectedFeedDetail,
    setSelectedFeedDetail,
    isFeedDetailOpen,
    setIsFeedDetailOpen,
    isPopulationModalOpen,
    setIsPopulationModalOpen,
    eventEntryType,
    setEventEntryType,
    isSubmittingPopulation,
    handleSubmitPopulation,
    invoiceModalMode,
    setInvoiceModalMode,
    selectedInvoice,
    setSelectedInvoice,
    paymentAmount,
    setPaymentAmount,
    paymentDate,
    setPaymentDate,
    paymentNotes,
    setPaymentNotes,
    paymentHistory,
    fetchPaymentHistory,
    fetchFeedMaster,
    fetchEggStock,
    fetchEggTransactions,
    fetchFeedTransactions,
    handleDeleteEggTransaction,
    handleDeleteFeedTransaction,
    handleSubmitPayment,
    isSubmittingPayment,
    setIsSubmittingPayment,
    feedDate,
    setFeedDate,
    billingMode,
    setBillingMode,
    billingSubMode,
    setBillingSubMode,
    formatMoney,
    setNotification,
    confirmModal,
    setConfirmModal,
    showConfirm,
    showAlert
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
