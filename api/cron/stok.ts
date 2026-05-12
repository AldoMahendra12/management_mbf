import { createClient } from '@supabase/supabase-js';

// Configuration (Must be set in Vercel Environment Variables)
const WA_PHONE = process.env.VITE_WA_PHONE; // Example: +628123456789
const WA_APIKEY = process.env.VITE_WA_APIKEY; // API Key from CallMeBot
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req: any, res: any) {
  // 1. Security Check
  const authHeader = req.headers['authorization'];
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized access to cron' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials missing');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 2. Fetch master pakan
    const { data: items, error } = await supabase
      .from('master_pakan')
      .select('nama_bahan, stok_sekarang, batas_minimum, satuan')
      .order('nama_bahan', { ascending: true });

    if (error) throw error;

    // 3. Filter critical items
    const criticalItems = (items || []).filter(
      item => Number(item.stok_sekarang) <= Number(item.batas_minimum)
    );

    if (criticalItems.length === 0) {
      return res.status(200).json({ 
        message: 'All stocks are healthy. No notification sent.',
        checked_at: new Date().toISOString()
      });
    }

    // 4. Format WhatsApp Message (CallMeBot uses URL encoding for formatting)
    let message = `⚠️ *LAPORAN STOK KRITIS PAKAN* ⚠️\n`;
    message += `*PT MBF & CV BEF*\n\n`;
    message += `Halo Bos, berikut daftar pakan yang perlu segera di-restock hari ini:\n\n`;

    criticalItems.forEach((item, index) => {
      message += `${index + 1}. *${item.nama_bahan}*\n`;
      message += `   Sisa: ${item.stok_sekarang} ${item.satuan} (Min: ${item.batas_minimum} ${item.satuan})\n\n`;
    });

    message += `Silakan hubungi supplier segera. Terimakasih! 🙏`;

    // 5. Send via CallMeBot WhatsApp API
    if (WA_PHONE && WA_APIKEY) {
      // Endpoint format: https://api.callmebot.com/whatsapp.php?phone=[phone]&text=[message]&apikey=[apikey]
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(WA_PHONE)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(WA_APIKEY)}`;
      
      const waResponse = await fetch(url, {
        method: 'GET'
      });

      const responseText = await waResponse.text();
      
      return res.status(200).json({ 
        success: true, 
        message_sent: waResponse.ok,
        critical_count: criticalItems.length,
        api_response: responseText,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(200).json({
        success: true,
        message_sent: false,
        reason: 'WA_PHONE or WA_APIKEY missing',
        critical_items: criticalItems
      });
    }

  } catch (err: any) {
    console.error('Cron Error:', err.message);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
}
