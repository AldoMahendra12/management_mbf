import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkKrem() {
  const { data, error } = await supabase
    .from('transaksi_telur')
    .select('jumlah_kg, keterangan, jenis_transaksi')
    .like('keterangan', '%Krem%');
  console.log('Error:', error);
  console.log('Data:', data);
}
checkKrem();
