import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function addStock() {
  const { data, error } = await supabase.from('transaksi_telur').insert({
    jenis_transaksi: 'Stok Awal',
    jumlah_kg: 620.3,
    harga_per_kg: 0,
    total_harga: 0,
    jumlah_dibayar: 0,
    keterangan: 'Penyesuaian stok awal Telur Krem (41 tumpuk + 5.3 kg) | JSON:[{"type":"Telur Ayam Horn","grade":"Krem","ikat":41,"qty":620.3,"price":0,"notes":""}]',
    tanggal: new Date().toISOString()
  });
  console.log(error || 'Success');
}
addStock();
