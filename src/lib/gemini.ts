
/**
 * Utility for interacting with Google Gemini API for OCR and Data Extraction.
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-1.5-flash";

export interface OCRResult {
  tanggal?: string;
  nama_mitra?: string;
  jumlah_kg?: number;
  harga_per_kg?: number;
  total_harga?: number;
  items?: Array<{
    nama_bahan: string;
    qty: number;
    harga: number;
  }>;
}

/**
 * Converts a File object to a base64 string for Gemini API.
 */
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string, mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts data from an image file using Gemini 1.5 Flash.
 */
export async function extractDataFromReceipt(file: File, type: 'egg' | 'feed'): Promise<OCRResult | null> {
  if (!GEMINI_API_KEY) {
    console.error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
    throw new Error("API Key missing");
  }

  const imageData = await fileToGenerativePart(file);
  
  const prompt = type === 'egg' 
    ? "Extract data from this egg transaction receipt. Look for date (tanggal), merchant name (nama_mitra), total weight in kg (jumlah_kg), and price per kg (harga_per_kg). Return only a JSON object."
    : "Extract data from this feed/pakan receipt. Look for date (tanggal), merchant name (nama_mitra), and list of items (name, qty, price). Return only a JSON object.";

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              imageData
            ]
          }
        ],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "Failed to call Gemini API");
    }

    const result = await response.json();
    const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (textResponse) {
      return JSON.parse(textResponse) as OCRResult;
    }
    
    return null;
  } catch (error) {
    console.error("OCR Extraction Error:", error);
    throw error;
  }
}
