# DailyOS — Personal Accountability & Project Tracker

Aplikasi web modern yang dirancang khusus untuk mahasiswa dan developer independen: melacak tugas kuliah, mengelola personal project, serta menjaga akuntabilitas harian (Sholat 5 Waktu, 100 Menit Deep Work, 100 Menit Belajar Kuliah, dan Habit Kustom).

---

## ✨ Fitur Utama

1. **Daily Accountability & Rutinitas Wajib**:
   - 🕌 **Sholat 5 Waktu** (Subuh, Dzuhur, Ashar, Maghrib, Isya) dengan indikator visual dan animasi perayaan saat tuntas.
   - ⚡ **100 Menit Deep Work Tracker**: Target fokus harian dengan tombol quick-add (+15m, +30m, +50m) dan live timer.
   - 🎓 **100 Menit Belajar Kuliah**: Target belajar mandiri harian.
   - ✨ **Custom Habits**: Tambah kebiasaan fleksibel (Baca Qur'an/Buku, Olahraga, Minum 2L air, Tidur teratur).
   - 🔥 **Streak & Consistency Heatmap**: Tracker konsistensi 35 hari terakhir bergaya GitHub commit heatmap.

2. **Tugas Kuliah & Akademik**:
   - Filter mata kuliah, prioritas (Penting, Sedang, Rendah), dan status (To Do, In Progress, Submitted).
   - Pengingat deadline otomatis (Hari ini, Besok, sisa hari, atau Terlewat).
   - Catatan tugas & link referensi materi/dokumen.

3. **Personal Projects**:
   - Kelola project pribadi, portofolio, atau ide startup.
   - Checklist milestone / subtask dengan progress bar otomatis.
   - Status project (Planning, Active, Completed, On Hold).

4. **Focus Timer (Pomodoro & Stopwatch Terintegrasi)**:
   - Mode Deep Work atau Belajar Kuliah.
   - Preset durasi: 15m, 25m (Pomodoro), 45m, 50m, 100m.
   - Suara chime / alarm sintetis Web Audio API tanpa perlu file eksternal.
   - Otomatis mencatat menit sesi ke log hari ini saat selesai.

5. **Akses Single-User & Sinkronisasi HP / Laptop**:
   - 🔒 **PIN Lock Pribadi**: Lindungi data Anda dengan 4-6 digit keypad PIN.
   - ☁️ **Supabase Cloud Sync (Gratis)**: Sinkronisasi instan realtime antar perangkat (buka di HP dan Laptop secara bersamaan, data otomatis sinkron).
   - 💾 **Local-First & Offline**: Tetap bisa digunakan offline lewat localStorage.
   - 📦 **Ekspor & Impor JSON**: Cadangkan seluruh data kapan saja ke file JSON.

---

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
