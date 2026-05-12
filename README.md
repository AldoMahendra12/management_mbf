# MBF Management System (PT MBF & CV BEF)

Sistem manajemen operasional dan keuangan terintegrasi yang dirancang khusus untuk pengelolaan peternakan ayam petelur dan distribusi pakan. Aplikasi ini mengonsolidasikan data dari dua entitas (**PT Mitra Barokah Farm** dan **CV Berkah Egg Farm**) ke dalam satu dashboard eksekutif yang interaktif.

### 🚀 Fitur Utama
*   **Consolidated Finance Dashboard**: Pantau arus kas (Uang Masuk/Keluar) secara real-time dengan rincian *drill-down* untuk setiap transaksi.
*   **Inventory & Warehouse Tracking**: Manajemen stok telur dan pakan yang akurat dengan pencatatan otomatis setiap ada transaksi masuk/keluar.
*   **Billing & Receivables (Piutang)**: Sistem penagihan otomatis dengan fitur *aging analysis* (umur piutang) untuk membantu pemantauan utang/piutang mitra.
*   **Professional Invoice System**: Pembuatan invoice siap cetak dalam format *landscape* (continuous form) dengan kode invoice otomatis (MBF/BEF).
*   **Population Management**: Pencatatan populasi ayam (masuk/afkir) untuk memantau produktivitas peternakan.
*   **Premium UI/UX**: Antarmuka modern yang responsif, menggunakan skema warna high-contrast (Slate & Orange) untuk kenyamanan penggunaan operasional.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in [.env](.env)
3. Run the app:
   `npm run dev`
