import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function updateStockFinal() {
  const { data, error } = await supabase
    .from('transaksi_telur')
    .update({
        jumlah_kg: 740.3,
        keterangan: 'Penyesuaian stok awal Telur Krem (40 tumpuk + 5.3 kg ditambahkan kompensasi transaksi 135 kg) | JSON:[{"type":"Telur Ayam Horn","grade":"Krem","ikat":49,"qty":740.3,"price":0,"notes":""}]'
    })
    .like('keterangan', '%Penyesuaian stok awal Telur Krem%');
    
  console.log(error || 'Success');
}
updateStockFinal();
