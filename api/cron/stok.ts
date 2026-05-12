import { createClient } from '@supabase/supabase-js';

// Configuration (Must be set in Vercel Environment Variables)
const WA_TOKEN = process.env.WA_TOKEN;
const WA_TARGET = process.env.WA_TARGET; 
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(req: any, res: any) {
  // 1. Security Check
  // Vercel sends a specific header for cron jobs if CRON_SECRET is set
  const authHeader = req.headers['authorization'];
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized access to cron' });
  }

  // Handle only GET requests (Vercel Cron uses GET)
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

    // 4. Format WhatsApp Message
    let message = `⚠️ *LAPORAN STOK KRITIS PAKAN* ⚠️\n`;
    message += `*PT MBF & CV BEF*\n\n`;
    message += `Halo Bos, berikut daftar pakan yang perlu segera di-restock hari ini:\n\n`;

    criticalItems.forEach((item, index) => {
      message += `${index + 1}. *${item.nama_bahan}*\n`;
      message += `   Sisa: ${item.stok_sekarang} ${item.satuan} (Min: ${item.batas_minimum} ${item.satuan})\n\n`;
    });

    message += `Silakan hubungi supplier segera. Terimakasih! 🙏`;

    // 5. Send via WhatsApp API (Fonnte Example)
    if (WA_TOKEN && WA_TARGET) {
      const waResponse = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 
          'Authorization': WA_TOKEN 
        },
        body: new URLSearchParams({
          'target': WA_TARGET,
          'message': message,
          'countryCode': '62'
        })
      });

      const waResult = await waResponse.json();
      
      return res.status(200).json({ 
        success: true, 
        message_sent: true,
        critical_count: criticalItems.length,
        wa_api_status: waResult.status,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(200).json({
        success: true,
        message_sent: false,
        reason: 'WA_TOKEN or WA_TARGET missing',
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
