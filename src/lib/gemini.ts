const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface OCRResult {
  tanggal?: string;
  nama_mitra?: string;
  jumlah_kg?: number;
  harga_per_kg?: number;
  items?: Array<{
    name: string;
    qty: number;
    price: number;
  }>;
}

function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}

export async function extractDataFromReceipt(
  imageInput: string | File | Blob,
  type: 'egg' | 'feed'
): Promise<OCRResult> {
  if (!GEMINI_API_KEY) throw new Error("VITE_GEMINI_API_KEY tidak ditemukan di .env");

  // Normalisasi input
  let base64Image: string;
  if (typeof imageInput === 'string') {
    base64Image = imageInput;
  } else {
    base64Image = await fileToBase64(imageInput);
  }

  const base64Data = typeof base64Image === 'string' && base64Image.includes(',')
    ? base64Image.split(',')[1]
    : base64Image;

  // Fallback aman jika format tidak sesuai
  const mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" =
    base64Image.startsWith('data:image/png') ? 'image/png' :
    base64Image.startsWith('data:image/webp') ? 'image/webp' :
    base64Image.startsWith('data:image/gif') ? 'image/gif' :
    'image/jpeg'; // default fallback

  const prompt = type === 'egg'
    ? `Kamu adalah OCR struk transaksi telur. Ekstrak:
       - tanggal (format YYYY-MM-DD, konversi dari format apapun)
       - nama_mitra (nama toko/perusahaan supplier di bagian atas nota)
       - jumlah_kg (angka saja)
       - harga_per_kg (angka saja tanpa titik/koma)
       Balas HANYA JSON, tanpa markdown.`
    : `Kamu adalah OCR untuk nota/surat jalan pembelian pakan ternak.
       Ekstrak data berikut dari gambar:
       - tanggal: konversi ke format YYYY-MM-DD (contoh: "14/04/2026" → "2026-04-14")
       - nama_mitra: nama perusahaan/toko supplier (biasanya di pojok kiri atas, contoh: "PT. Sumber Kelapa Beky")
       - items: array berisi semua baris barang, masing-masing:
           - name: nama barang (contoh: "KIK S 36 SPR", "KLK SUPER 36")
           - qty: jumlah dalam KG (ambil dari kolom "Qty Dasar" atau kolom KG, bukan SAK)
           - price: harga satuan per KG jika ada, jika tidak ada isi 0
       
       Jika ini surat jalan tanpa harga, tetap ekstrak name dan qty, isi price dengan 0.
       Balas HANYA JSON valid tanpa markdown. Contoh format:
       {"tanggal":"2026-04-14","nama_mitra":"PT. Sumber Kelapa Beky","items":[{"name":"KIK S 36 SPR","qty":2500,"price":0}]}`;

  // Fetch langsung ke REST API menggunakan model terbaru
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || `HTTP ${response.status}`);
  }

  const data = await response.json();

  // Cek jika response blocked atau kosong
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("Tidak ada hasil dari API: " + JSON.stringify(data));
  }

  let text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!text) throw new Error("Response teks kosong dari Gemini");

  text = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(text) as OCRResult;
  } catch {
    throw new Error('Gagal memparse hasil OCR: ' + text);
  }
}
