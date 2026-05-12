import { createClient } from '@supabase/supabase-js';

// Configuration (Must be set in Vercel Environment Variables)
const TELEGRAM_BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.VITE_TELEGRAM_CHAT_ID;
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

    // 4. Format Telegram Message
    let message = `⚠️ <b>LAPORAN STOK KRITIS PAKAN</b> ⚠️\n`;
    message += `<b>PT MBF & CV BEF</b>\n\n`;
    message += `Halo Bos, berikut daftar pakan yang perlu segera di-restock hari ini:\n\n`;

    criticalItems.forEach((item, index) => {
      message += `${index + 1}. <b>${item.nama_bahan}</b>\n`;
      message += `   Sisa: ${item.stok_sekarang} ${item.satuan} (Min: ${item.batas_minimum} ${item.satuan})\n\n`;
    });

    message += `Silakan hubungi supplier segera. Terimakasih! 🙏`;

    // 5. Send via Telegram Bot API
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const telegramResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      });

      const telegramResult = await telegramResponse.json();
      
      return res.status(200).json({ 
        success: true, 
        message_sent: true,
        critical_count: criticalItems.length,
        telegram_api_status: telegramResult.ok,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(200).json({
        success: true,
        message_sent: false,
        reason: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing',
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
