# DailyOS - Personal Accountability & Project Tracker

Aplikasi web modern yang dirancang khusus untuk mahasiswa dan developer independen: melacak tugas kuliah, mengelola personal project, serta menjaga akuntabilitas harian (Sholat 5 Waktu, 100 Menit Deep Work, 100 Menit Belajar Kuliah, dan Habit Kustom).

---

## Fitur

**Tantangan 100 hari.** Tanggal mulai diatur sendiri, counter hari berjalan, dan hitungan miss. Hari sempurna = 5/5 sholat + target Deep Work + target Belajar Kuliah + semua habit aktif. Kurang sedikit pun dihitung miss. Hari berganti pukul 00:00 WIB, bukan tengah malam perangkat.

**Kalender konsistensi.** Satu sel per hari, warnanya skor hari itu dari merah ke hijau. Hari lampau tanpa data tetap merah karena itu memang miss. Border amber menandai hari yang lewat target. Titik kecil menandai deadline. Klik tanggal untuk membuka lognya.

**Log sesi kerja.** Setiap sesi, baik dari timer maupun dicatat manual, wajib disertai catatan apa yang dikerjakan. Tanpa catatan menitnya tidak masuk. Total menit harian adalah jumlah sesi, bukan angka yang ditambah-tambah, sehingga dua perangkat bisa mencatat bersamaan tanpa saling menimpa.

**Tugas dan project dalam satu daftar.** Satu entitas dengan deadline opsional dan subtask opsional. Urut deadline terdekat, warna tepi kiri mengikuti urgensi.

**Habit.** Definisi berlaku setiap hari, centangnya per hari. Menghapus habit berarti mengarsipkan, jadi skor hari lampau tidak ikut berubah.

**Kunci edit.** Hanya hari ini dan kemarin yang bisa diubah. Lebih lama dari itu terkunci.

**Sinkronisasi.** Supabase realtime antara HP dan laptop, satu baris JSONB. Merge per hari dan per item, dengan tombstone untuk penghapusan. PIN dan kunci Supabase tidak pernah ikut terkirim ke cloud. Tetap jalan offline lewat localStorage.

**Lainnya.** PIN lock, QR magic link untuk menyambungkan HP, ekspor dan impor JSON.


## 🚀 Cara Menjalankan di Laptop

1. Buka terminal di folder project:
   ```bash
   cd "todo apps"
   ```
2. Jalankan development server:
   ```bash
   npm run dev
   ```
3. Buka browser di URL yang tertera (biasanya `http://localhost:5173`).

---

## 🌐 Cara Hosting Gratis (Agar Bisa Diakses di HP & Laptop)

### Opsi Termudah: Deploy ke Vercel (Gratis 100%)
1. Push project ini ke repository GitHub pribadi Anda (atau upload folder ke GitHub).
2. Buka [Vercel](https://vercel.com) dan login dengan akun GitHub Anda.
3. Klik **"Add New Project"** lalu pilih repositori `todo apps`.
4. Biarkan konfigurasi default (Vite) lalu klik **Deploy**.
5. Dalam 1 menit, Anda akan mendapatkan URL publik gratis (contoh: `https://dailyos-ryan.vercel.app`) yang bisa dibuka di browser HP maupun laptop!

---

## ☁️ Cara Setup Cloud Sync (Supabase) Gratis

Agar data yang diisi di HP otomatis masuk ke Laptop secara realtime:

1. Buat akun gratis di [Supabase](https://supabase.com).
2. Buat Project baru (pilih nama bebas & region Singapore).
3. Buka menu **SQL Editor** di dashboard Supabase, klik **New Query**, paste script SQL berikut lalu klik **Run**:

```sql
CREATE TABLE IF NOT EXISTS accountability_sync (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

ALTER TABLE accountability_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON accountability_sync;
CREATE POLICY "Allow all for anon" ON accountability_sync
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE accountability_sync;
```

4. Buka **Project Settings > API** di Supabase, lalu salin:
   - **Project URL**
   - **anon public key**
5. Di aplikasi DailyOS Anda (di laptop atau HP):
   - Klik ikon **Settings** (roda gigi) di kanan atas.
   - Masukkan Project URL dan Anon Key.
   - Klik **Tes Koneksi** lalu klik **Simpan Perubahan**.
6. Selesai! Data Anda sekarang tersinkronisasi 24/7 di semua perangkat Anda.

---

## 📱 Pasang di HP (Tampilan Seperti Aplikasi Asli)

Setelah dihosting di Vercel:
- **Di iPhone / Safari**: Buka link web Anda -> tekan tombol **Share** -> pilih **Add to Home Screen** (Tambahkan ke Layar Utama).
- **Di Android / Chrome**: Buka link web Anda -> tekan menu titik tiga -> pilih **Install App** atau **Add to Home screen**.
