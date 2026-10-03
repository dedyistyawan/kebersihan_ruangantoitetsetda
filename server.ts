import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import mysql, { Pool } from 'mysql2/promise';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

// CORS & Preflight handler agar tidak ada request diblokir atau menghasilkan respons tak terduga
app.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ----------------------------------------------------------------------------
// IN-MEMORY FALLBACK STORE (Digunakan jika koneksi MySQL belum dikonfigurasi)
// ----------------------------------------------------------------------------
let pengampuStore = [
  { ID_Pengampu: 'PGP-001', Nama_Petugas: 'Budi Santoso', Username: 'budi', Password: '123', Role: 'Petugas', Kontak_Telegram: '@budi_cleaner (ID: 102938475)', Telepon: '081234567890' },
  { ID_Pengampu: 'PGP-002', Nama_Petugas: 'Siti Rahmawati', Username: 'siti', Password: '123', Role: 'Petugas', Kontak_Telegram: '@siti_rahma (ID: 987654321)', Telepon: '081398765432' },
  { ID_Pengampu: 'PGP-003', Nama_Petugas: 'Joko Widodo Putra', Username: 'joko', Password: '123', Role: 'Petugas', Kontak_Telegram: '@joko_ops (ID: 554433221)', Telepon: '082155443322' },
  { ID_Pengampu: 'PGP-004', Nama_Petugas: 'Dewi Lestari', Username: 'dewi', Password: '123', Role: 'Petugas', Kontak_Telegram: '@dewi_facility (ID: 887766554)', Telepon: '085788776655' },
  { ID_Pengampu: 'SPV-001', Nama_Petugas: 'Agus Hendrawan, S.T. (Supervisor)', Username: 'admin', Password: 'admin123', Role: 'Supervisor', Kontak_Telegram: '@agus_supervisor (ID: 123456789)', Telepon: '081122334455' }
];

let lokasiStore = [
  { ID_Lokasi: 'LOK-001', Nama_Ruangan: 'Toilet Pria Lantai 1 (Lobby)', Kategori: 'Toilet', ID_Pengampu: 'PGP-001', Status_Terkini: 'Hijau', Gedung: 'Gedung Rektorat', Lantai: 'Lantai 1', Last_Update: '2026-09-25 07:30' },
  { ID_Lokasi: 'LOK-002', Nama_Ruangan: 'Toilet Wanita Lantai 1 (Lobby)', Kategori: 'Toilet', ID_Pengampu: 'PGP-002', Status_Terkini: 'Merah', Gedung: 'Gedung Rektorat', Lantai: 'Lantai 1', Last_Update: '2026-09-25 08:15' },
  { ID_Lokasi: 'LOK-003', Nama_Ruangan: 'Toilet Pria Lantai 2 (Sayap Barat)', Kategori: 'Toilet', ID_Pengampu: 'PGP-001', Status_Terkini: 'Kuning', Gedung: 'Gedung Rektorat', Lantai: 'Lantai 2', Last_Update: '2026-09-25 06:45' },
  { ID_Lokasi: 'LOK-004', Nama_Ruangan: 'Toilet Wanita Lantai 2 (Sayap Timur)', Kategori: 'Toilet', ID_Pengampu: 'PGP-002', Status_Terkini: 'Hijau', Gedung: 'Gedung Rektorat', Lantai: 'Lantai 2', Last_Update: '2026-09-25 07:10' },
  { ID_Lokasi: 'LOK-005', Nama_Ruangan: 'Toilet Difabel & Tamu VIP', Kategori: 'Toilet', ID_Pengampu: 'PGP-001', Status_Terkini: 'Hijau', Gedung: 'Gedung Rektorat', Lantai: 'Lantai 1', Last_Update: '2026-09-25 08:00' },
  { ID_Lokasi: 'LOK-006', Nama_Ruangan: 'Ruang Rapat Utama Singosari', Kategori: 'Ruangan', ID_Pengampu: 'PGP-003', Status_Terkini: 'Hijau', Gedung: 'Gedung Rektorat', Lantai: 'Lantai 2', Last_Update: '2026-09-25 07:00' },
  { ID_Lokasi: 'LOK-007', Nama_Ruangan: 'Aula Serbaguna Graha Wiyata', Kategori: 'Ruangan', ID_Pengampu: 'PGP-003', Status_Terkini: 'Kuning', Gedung: 'Gedung Serbaguna', Lantai: 'Lantai 1', Last_Update: '2026-09-24 16:30' },
  { ID_Lokasi: 'LOK-008', Nama_Ruangan: 'Toilet Umum Gedung Serbaguna Pria', Kategori: 'Toilet', ID_Pengampu: 'PGP-003', Status_Terkini: 'Merah', Gedung: 'Gedung Serbaguna', Lantai: 'Lantai 1', Last_Update: '2026-09-25 08:10' },
  { ID_Lokasi: 'LOK-009', Nama_Ruangan: 'Toilet Umum Gedung Serbaguna Wanita', Kategori: 'Toilet', ID_Pengampu: 'PGP-004', Status_Terkini: 'Hijau', Gedung: 'Gedung Serbaguna', Lantai: 'Lantai 1', Last_Update: '2026-09-25 07:45' },
  { ID_Lokasi: 'LOK-010', Nama_Ruangan: 'Ruang Dosen & Senat Akademik', Kategori: 'Ruangan', ID_Pengampu: 'PGP-004', Status_Terkini: 'Hijau', Gedung: 'Gedung F', Lantai: 'Lantai 3', Last_Update: '2026-09-25 06:30' },
  { ID_Lokasi: 'LOK-011', Nama_Ruangan: 'Toilet Laboratorium Komputer Terpadu', Kategori: 'Toilet', ID_Pengampu: 'PGP-004', Status_Terkini: 'Hijau', Gedung: 'Gedung Lab', Lantai: 'Lantai 2', Last_Update: '2026-09-25 07:20' },
  { ID_Lokasi: 'LOK-012', Nama_Ruangan: 'Perpustakaan Pusat - Ruang Baca', Kategori: 'Ruangan', ID_Pengampu: 'PGP-003', Status_Terkini: 'Hijau', Gedung: 'Perpustakaan', Lantai: 'Lantai 1', Last_Update: '2026-09-25 07:05' },
  { ID_Lokasi: 'LOK-013', Nama_Ruangan: 'Toilet Perpustakaan Lantai 1', Kategori: 'Toilet', ID_Pengampu: 'PGP-003', Status_Terkini: 'Kuning', Gedung: 'Perpustakaan', Lantai: 'Lantai 1', Last_Update: '2026-09-25 06:50' },
  { ID_Lokasi: 'LOK-014', Nama_Ruangan: 'Kantin Pusat & Food Court', Kategori: 'Ruangan', ID_Pengampu: 'PGP-001', Status_Terkini: 'Hijau', Gedung: 'Student Center', Lantai: 'Lantai 1', Last_Update: '2026-09-25 07:15' },
  { ID_Lokasi: 'LOK-015', Nama_Ruangan: 'Toilet Mahasiswa Student Center', Kategori: 'Toilet', ID_Pengampu: 'PGP-001', Status_Terkini: 'Merah', Gedung: 'Student Center', Lantai: 'Lantai 1', Last_Update: '2026-09-25 08:20' }
];

let checklistStore = [
  { id: 'CHK-001', nama: 'Ketersediaan Tisu (Toilet / Wastafel)', kategori: 'Toilet', deskripsi: 'Tisu gulung dan tisu pengering tangan terisi penuh & higienis', bobot: 1, aktif: true, urutan: 1 },
  { id: 'CHK-002', nama: 'Pengharum Ruangan Aktif & Wangi Segar', kategori: 'Semua', deskripsi: 'Dispenser aroma berfungsi otomatis dan ruangan bebas bau apek', bobot: 1, aktif: true, urutan: 2 },
  { id: 'CHK-003', nama: 'Lantai Kering, Bersih & Bebas Noda/Licin', kategori: 'Semua', deskripsi: 'Lantai dipel disinfektan, tidak ada genangan air atau noda membandel', bobot: 1, aktif: true, urutan: 3 },
  { id: 'CHK-004', nama: 'Keran & Saluran Pembuangan Air Lancar', kategori: 'Toilet', deskripsi: 'Air mengalir kencang, tidak ada kebocoran, dan tidak tersumbat', bobot: 1, aktif: true, urutan: 4 },
  { id: 'CHK-005', nama: 'Kunci Selot Pintu & Engsel Berfungsi Baik', kategori: 'Semua', deskripsi: 'Pintu dapat dikunci dengan rapat dan aman oleh pengguna', bobot: 1, aktif: true, urutan: 5 },
  { id: 'CHK-006', nama: 'Wastafel, Sabun Cuci Tangan & Cermin Bersih', kategori: 'Toilet', deskripsi: 'Sabun cair terisi, wastafel bebas kerak, cermin bening mengkilap', bobot: 1, aktif: true, urutan: 6 },
  { id: 'CHK-007', nama: 'Kloset / Urinoir Higienis & Bebas Bau', kategori: 'Toilet', deskripsi: 'Kloset duduk/jongkok disikat bersih, flush siram berfungsi optimal', bobot: 1, aktif: true, urutan: 7 },
  { id: 'CHK-008', nama: 'Tempat Sampah Dikosongkan & Berplastik Baru', kategori: 'Semua', deskripsi: 'Tidak ada tumpukan sampah meluap, plastik sampah terpasang rapi', bobot: 1, aktif: true, urutan: 8 }
];

let inspeksiStore: any[] = [];

let pengaduanStore = [
  { id: 'LAP-101', Timestamp: '2026-09-25 08:15', ID_Lokasi: 'LOK-002', Nama_Pelapor: 'Rina (Pengunjung)', Detail_Keluhan: 'Air keran wastafel tidak mengalir dan lantai depan bilik 2 becek licin.', Status_Tindak_Lanjut: 'Pending', Kategori_Keluhan: 'Keran Rusak & Lantai Basah' },
  { id: 'LAP-102', Timestamp: '2026-09-25 08:10', ID_Lokasi: 'LOK-008', Nama_Pelapor: 'Ahmad Fauzi', Detail_Keluhan: 'Bau tak sedap menyengat dan sabun cuci tangan habis.', Status_Tindak_Lanjut: 'Pending', Kategori_Keluhan: 'Bau & Habis Sabun' },
  { id: 'LAP-103', Timestamp: '2026-09-25 08:20', ID_Lokasi: 'LOK-015', Nama_Pelapor: 'Dimas Kurnia', Detail_Keluhan: 'Tempat sampah meluap dan kunci pintu bilik nomor 1 rusak macet.', Status_Tindak_Lanjut: 'Pending', Kategori_Keluhan: 'Fasilitas Rusak' },
  { id: 'LAP-099', Timestamp: '2026-09-24 14:10', ID_Lokasi: 'LOK-001', Nama_Pelapor: 'Fajar Nugraha', Detail_Keluhan: 'Tisu gulung habis di bilik tengah.', Status_Tindak_Lanjut: 'Selesai', Waktu_Selesai: '2026-09-24 14:25', Catatan_Penyelesaian: 'Tisu sudah diganti dengan rol baru oleh Budi Santoso.', Petugas_Penangan: 'Budi Santoso' }
];

let saranStore = [
  { id: 'SRN-001', Timestamp: '2026-09-25 08:30', ID_Lokasi: 'LOK-001', Nama_Pemberi_Saran: 'Drs. Hendro Wibowo', Kontak: 'hendro@kampus.ac.id', Kategori_Saran: 'Fasilitas & Sarana', Judul_Saran: 'Penambahan Hand Dryer Otomatis', Detail_Saran: 'Mohon dipertimbangkan pemasangan hand dryer otomatis di dekat wastafel agar lebih higienis dan menghemat penggunaan tisu kertas.', Prioritas: 'Sedang', Status_Tinjauan: 'Diproses' },
  { id: 'SRN-002', Timestamp: '2026-09-25 09:15', ID_Lokasi: 'LOK-005', Nama_Pemberi_Saran: 'Nadia Putri', Kontak: 'nadia.putri@email.com', Kategori_Saran: 'Aksesibilitas / Difabel', Judul_Saran: 'Pegangan Tangan di Toilet Difabel Perlu Sedikit Ditinggikan', Detail_Saran: 'Pegangan tangan (handrail) sudah sangat membantu, jika memungkinkan dibuat sedikit lebih kokoh dan ditambah tombol darurat bel difabel.', Prioritas: 'Penting', Status_Tinjauan: 'Diimplementasikan' }
];

let ratingStore = [
  { id: 'RAT-001', Timestamp: '2026-09-25 09:00', ID_Lokasi: 'LOK-001', Nama_Reviewer: 'drg. Maya Anggraini', Bintang: 5, Rating_Kebersihan_Lantai: 5, Rating_Ketersediaan_Air_Sabun: 5, Rating_Aroma_Keharuman: 5, Rating_Kesigapan_Petugas: 5, Komentar_Review: 'Sangat bersih, wangi, sabun cuci tangan wangi apel dan lantai selalu kering. Petugas sangat sigap dan ramah!', Rekomendasikan: true },
  { id: 'RAT-002', Timestamp: '2026-09-25 08:45', ID_Lokasi: 'LOK-004', Nama_Reviewer: 'Annisa Fitriani', Bintang: 5, Rating_Kebersihan_Lantai: 5, Rating_Ketersediaan_Air_Sabun: 5, Rating_Aroma_Keharuman: 4, Rating_Kesigapan_Petugas: 5, Komentar_Review: 'Kaca cermin sangat bening, ada tisu tebal, pencahayaan terang dan terasa nyaman digunakan.', Rekomendasikan: true }
];

let greetingMessagesStore = [
  { id: 'GRT-001', nama: 'Keluarga Besar Cleaning Service', instansi: 'Divisi Kebersihan & Sanitasi', pesan: 'Terima kasih telah membuang sampah pada tempatnya dan menyiram kembali setelah digunakan. Senyum Anda adalah semangat kami!', waktu: 'Hari Ini, 07:00 WIB', emoji: '🌸' },
  { id: 'GRT-002', Bapak_Rektorat: 'Bapak Rektorat & Pimpinan', nama: 'Bapak Rektorat & Pimpinan', instansi: 'Manajemen Kampus', pesan: 'Kebersihan adalah sebagian dari iman dan cermin peradaban luhur. Mari jaga fasilitas bersama dengan penuh rasa saling menghargai.', waktu: 'Kemarin, 16:00 WIB', emoji: '🏛️' }
];

let telegramLogsStore: any[] = [];

// ----------------------------------------------------------------------------
// MYSQL HOSTINGER POOL & AUTOMATIC TABLE MIGRATION
// ----------------------------------------------------------------------------
let mysqlPool: Pool | null = null;
let isMysqlConnected = false;
let mysqlLastError = '';
let tablesStatus: { table: string; rows: number }[] = [];

// Fungsi Pembuatan & Inisialisasi Seluruh Tabel Otomatis di MySQL Hostinger
const initializeMysqlTables = async (pool: Pool) => {
  console.log('[MySQL Hostinger] Memeriksa & membuat struktur tabel otomatis...');

  const tableQueries = [
    // 1. pengampu
    `CREATE TABLE IF NOT EXISTS \`pengampu\` (
      \`id_pengampu\` VARCHAR(20) NOT NULL PRIMARY KEY,
      \`nama_petugas\` VARCHAR(100) NOT NULL,
      \`username\` VARCHAR(50) NOT NULL UNIQUE,
      \`password\` VARCHAR(255) NOT NULL,
      \`role\` ENUM('Petugas', 'Supervisor') NOT NULL DEFAULT 'Petugas',
      \`kontak_telegram\` VARCHAR(100) DEFAULT NULL,
      \`telepon\` VARCHAR(30) DEFAULT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 2. lokasi
    `CREATE TABLE IF NOT EXISTS \`lokasi\` (
      \`id_lokasi\` VARCHAR(20) NOT NULL PRIMARY KEY,
      \`nama_ruangan\` VARCHAR(150) NOT NULL,
      \`kategori\` ENUM('Toilet', 'Ruangan') NOT NULL DEFAULT 'Toilet',
      \`id_pengampu\` VARCHAR(20) NOT NULL,
      \`status_terkini\` ENUM('Hijau', 'Kuning', 'Merah') NOT NULL DEFAULT 'Hijau',
      \`gedung\` VARCHAR(100) DEFAULT 'Gedung Utama',
      \`lantai\` VARCHAR(50) DEFAULT 'Lantai 1',
      \`last_update\` VARCHAR(50) DEFAULT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 3. checklist_master
    `CREATE TABLE IF NOT EXISTS \`checklist_master\` (
      \`id\` VARCHAR(20) NOT NULL PRIMARY KEY,
      \`nama\` VARCHAR(200) NOT NULL,
      \`kategori\` ENUM('Semua', 'Toilet', 'Ruangan') NOT NULL DEFAULT 'Semua',
      \`deskripsi\` TEXT DEFAULT NULL,
      \`bobot\` INT NOT NULL DEFAULT 1,
      \`aktif\` TINYINT(1) NOT NULL DEFAULT 1,
      \`urutan\` INT NOT NULL DEFAULT 0,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 4. log_inspeksi
    `CREATE TABLE IF NOT EXISTS \`log_inspeksi\` (
      \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
      \`timestamp\` VARCHAR(50) NOT NULL,
      \`id_lokasi\` VARCHAR(20) NOT NULL,
      \`id_pengampu\` VARCHAR(20) NOT NULL,
      \`skor_kebersihan\` INT NOT NULL DEFAULT 100,
      \`status_warna\` ENUM('Hijau', 'Kuning', 'Merah') NOT NULL DEFAULT 'Hijau',
      \`catatan_kritis\` TEXT DEFAULT NULL,
      \`detail_ceklis_json\` LONGTEXT DEFAULT NULL,
      \`total_item_diperiksa\` INT DEFAULT 8,
      \`total_item_lolos\` INT DEFAULT 8,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 5. log_pengaduan
    `CREATE TABLE IF NOT EXISTS \`log_pengaduan\` (
      \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
      \`timestamp\` VARCHAR(50) NOT NULL,
      \`id_lokasi\` VARCHAR(20) NOT NULL,
      \`nama_pelapor\` VARCHAR(100) NOT NULL,
      \`kontak_pelapor\` VARCHAR(50) DEFAULT NULL,
      \`detail_keluhan\` TEXT NOT NULL,
      \`status_tindak_lanjut\` ENUM('Pending', 'Proses', 'Selesai') NOT NULL DEFAULT 'Pending',
      \`kategori_keluhan\` VARCHAR(100) DEFAULT NULL,
      \`foto_bukti\` LONGTEXT DEFAULT NULL,
      \`waktu_selesai\` VARCHAR(50) DEFAULT NULL,
      \`catatan_penyelesaian\` TEXT DEFAULT NULL,
      \`petugas_penangan\` VARCHAR(100) DEFAULT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 6. saran_pelayanan
    `CREATE TABLE IF NOT EXISTS \`saran_pelayanan\` (
      \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
      \`timestamp\` VARCHAR(50) NOT NULL,
      \`id_lokasi\` VARCHAR(20) NOT NULL,
      \`nama_pemberi_saran\` VARCHAR(100) NOT NULL,
      \`kontak\` VARCHAR(100) DEFAULT NULL,
      \`kategori_saran\` VARCHAR(100) NOT NULL,
      \`judul_saran\` VARCHAR(200) NOT NULL,
      \`detail_saran\` TEXT NOT NULL,
      \`prioritas\` ENUM('Biasa', 'Penting', 'Mendesak') NOT NULL DEFAULT 'Biasa',
      \`status_tinjauan\` ENUM('Diterima', 'Diproses', 'Diimplementasikan') NOT NULL DEFAULT 'Diterima',
      \`tanggapan_supervisor\` TEXT DEFAULT NULL,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 7. rating_review
    `CREATE TABLE IF NOT EXISTS \`rating_review\` (
      \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
      \`timestamp\` VARCHAR(50) NOT NULL,
      \`id_lokasi\` VARCHAR(20) NOT NULL,
      \`nama_reviewer\` VARCHAR(100) NOT NULL,
      \`bintang\` TINYINT NOT NULL DEFAULT 5,
      \`rating_kebersihan_lantai\` TINYINT DEFAULT 5,
      \`rating_ketersediaan_air_sabun\` TINYINT DEFAULT 5,
      \`rating_aroma_keharuman\` TINYINT DEFAULT 5,
      \`rating_kesigapan_petugas\` TINYINT DEFAULT 5,
      \`komentar_review\` TEXT DEFAULT NULL,
      \`rekomendasikan\` TINYINT(1) DEFAULT 1,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 8. telegram_logs
    `CREATE TABLE IF NOT EXISTS \`telegram_logs\` (
      \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
      \`timestamp\` VARCHAR(50) NOT NULL,
      \`chat_id\` VARCHAR(100) NOT NULL,
      \`target_name\` VARCHAR(100) NOT NULL,
      \`message\` TEXT NOT NULL,
      \`type\` VARCHAR(30) NOT NULL,
      \`status\` VARCHAR(20) NOT NULL DEFAULT 'sent',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

    // 9. greeting_messages
    `CREATE TABLE IF NOT EXISTS \`greeting_messages\` (
      \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
      \`nama\` VARCHAR(100) NOT NULL,
      \`instansi\` VARCHAR(100) DEFAULT NULL,
      \`pesan\` TEXT NOT NULL,
      \`waktu\` VARCHAR(50) NOT NULL,
      \`emoji\` VARCHAR(20) DEFAULT '🌸',
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
  ];

  for (const q of tableQueries) {
    try {
      await pool.query(q);
    } catch (err: any) {
      console.error('[MySQL Hostinger Table Error]:', err.message);
    }
  }

  // Cek apakah tabel pengampu sudah memiliki data
  try {
    const [rows]: any = await pool.query('SELECT COUNT(*) as count FROM pengampu');
    const count = rows[0]?.count || 0;

    if (count === 0) {
      console.log('[MySQL Hostinger] Tabel masih kosong. Melakukan seeding data awal...');

      // Seed Pengampu
      for (const p of pengampuStore) {
        await pool.query(
          'INSERT INTO pengampu (id_pengampu, nama_petugas, username, password, role, kontak_telegram, telepon) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [p.ID_Pengampu, p.Nama_Petugas, p.Username, p.Password, p.Role, p.Kontak_Telegram, p.Telepon]
        );
      }

      // Seed Lokasi
      for (const l of lokasiStore) {
        await pool.query(
          'INSERT INTO lokasi (id_lokasi, nama_ruangan, kategori, id_pengampu, status_terkini, gedung, lantai, last_update) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [l.ID_Lokasi, l.Nama_Ruangan, l.Kategori, l.ID_Pengampu, l.Status_Terkini, l.Gedung, l.Lantai, l.Last_Update]
        );
      }

      // Seed Checklist
      for (const c of checklistStore) {
        await pool.query(
          'INSERT INTO checklist_master (id, nama, kategori, deskripsi, bobot, aktif, urutan) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [c.id, c.nama, c.kategori, c.deskripsi, c.bobot, c.aktif ? 1 : 0, c.urutan]
        );
      }

      // Seed Pengaduan
      for (const a of pengaduanStore) {
        await pool.query(
          'INSERT INTO log_pengaduan (id, timestamp, id_lokasi, nama_pelapor, detail_keluhan, status_tindak_lanjut, kategori_keluhan) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [a.id, a.Timestamp, a.ID_Lokasi, a.Nama_Pelapor, a.Detail_Keluhan, a.Status_Tindak_Lanjut, a.Kategori_Keluhan]
        );
      }

      // Seed Saran
      for (const s of saranStore) {
        await pool.query(
          'INSERT INTO saran_pelayanan (id, timestamp, id_lokasi, nama_pemberi_saran, kontak, kategori_saran, judul_saran, detail_saran, prioritas, status_tinjauan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [s.id, s.Timestamp, s.ID_Lokasi, s.Nama_Pemberi_Saran, s.Kontak, s.Kategori_Saran, s.Judul_Saran, s.Detail_Saran, s.Prioritas, s.Status_Tinjauan]
        );
      }

      // Seed Rating
      for (const r of ratingStore) {
        await pool.query(
          'INSERT INTO rating_review (id, timestamp, id_lokasi, nama_reviewer, bintang, rating_kebersihan_lantai, rating_ketersediaan_air_sabun, rating_aroma_keharuman, rating_kesigapan_petugas, komentar_review, rekomendasikan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [r.id, r.Timestamp, r.ID_Lokasi, r.Nama_Reviewer, r.Bintang, r.Rating_Kebersihan_Lantai, r.Rating_Ketersediaan_Air_Sabun, r.Rating_Aroma_Keharuman, r.Rating_Kesigapan_Petugas, r.Komentar_Review, r.Rekomendasikan ? 1 : 0]
        );
      }

      // Seed Greetings
      for (const g of greetingMessagesStore) {
        await pool.query(
          'INSERT INTO greeting_messages (id, nama, instansi, pesan, waktu, emoji) VALUES (?, ?, ?, ?, ?, ?)',
          [g.id, g.nama, g.instansi, g.pesan, g.waktu, g.emoji]
        );
      }

      console.log('[MySQL Hostinger] ✅ Seeding data awal berhasil diselesaikan!');
    }
  } catch (err: any) {
    console.error('[MySQL Hostinger Seeding Error]:', err.message);
  }

  // Update Status Tabel untuk API Status
  await refreshTablesStatus(pool);
};

const refreshTablesStatus = async (pool: Pool) => {
  const tableNames = [
    'pengampu',
    'lokasi',
    'checklist_master',
    'log_inspeksi',
    'log_pengaduan',
    'saran_pelayanan',
    'rating_review',
    'telegram_logs',
    'greeting_messages'
  ];

  const results: { table: string; rows: number }[] = [];
  for (const tbl of tableNames) {
    try {
      const [res]: any = await pool.query(`SELECT COUNT(*) as count FROM \`${tbl}\``);
      results.push({ table: tbl, rows: res[0]?.count || 0 });
    } catch {
      results.push({ table: tbl, rows: -1 }); // -1 berarti belum ada
    }
  }
  tablesStatus = results;
};

const initMysqlConnection = async () => {
  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);

  if (!dbHost || !dbUser || !dbName) {
    console.log('[MySQL Hostinger] Info: Kredensial DB_HOST/DB_USER/DB_NAME belum disetel di .env. Menggunakan Storage Engine Memori/Simulasi.');
    return;
  }

  try {
    mysqlPool = mysql.createPool({
      host: dbHost,
      port: dbPort,
      user: dbUser,
      password: dbPassword || '',
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 8000,
      multipleStatements: true
    });

    const conn = await mysqlPool.getConnection();
    await conn.ping();
    conn.release();

    isMysqlConnected = true;
    mysqlLastError = '';
    console.log(`[MySQL Hostinger] ✅ Berhasil terhubung ke database "${dbName}" di ${dbHost}:${dbPort}!`);

    // Inisialisasi struktur tabel otomatis
    await initializeMysqlTables(mysqlPool);
  } catch (err: any) {
    isMysqlConnected = false;
    mysqlLastError = err.message || 'Koneksi gagal';
    console.warn(`[MySQL Hostinger] ⚠️ Peringatan: Tidak dapat terhubung ke MySQL (${mysqlLastError}). Aplikasi beralih ke engine memori internal.`);
  }
};

initMysqlConnection();

// ----------------------------------------------------------------------------
// API ROUTES
// ----------------------------------------------------------------------------

// 1. Health & Server Info
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'SIM-KTR Kebersihan (Node.js & MySQL Hostinger)',
    nodeVersion: process.version,
    uptime: Math.round(process.uptime()),
    database: {
      connected: isMysqlConnected,
      engine: isMysqlConnected ? 'MySQL Hostinger' : 'In-Memory / Local Storage Fallback',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'simktr_db',
      lastError: mysqlLastError || null
    },
    telegram: {
      configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      chatIdConfigured: Boolean(process.env.TELEGRAM_CHAT_ID)
    }
  });
});

// 2. Database Status & Manual Table Initialization Endpoint (1-Click Fix dari UI)
app.get('/api/database/status', async (req: Request, res: Response) => {
  if (isMysqlConnected && mysqlPool) {
    await refreshTablesStatus(mysqlPool);
    const allTablesReady = tablesStatus.every(t => t.rows >= 0);
    return res.json({
      success: true,
      connected: true,
      engine: 'MySQL Hostinger',
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      allTablesReady,
      tables: tablesStatus
    });
  }

  res.json({
    success: true,
    connected: false,
    engine: 'In-Memory Simulation',
    message: mysqlLastError || 'DB_HOST / DB_USER / DB_NAME belum disetel pada .env di Hostinger.',
    tables: [
      { table: 'pengampu', rows: pengampuStore.length },
      { table: 'lokasi', rows: lokasiStore.length },
      { table: 'checklist_master', rows: checklistStore.length },
      { table: 'log_pengaduan', rows: pengaduanStore.length },
      { table: 'saran_pelayanan', rows: saranStore.length },
      { table: 'rating_review', rows: ratingStore.length },
      { table: 'greeting_messages', rows: greetingMessagesStore.length }
    ]
  });
});

app.post('/api/database/init', async (req: Request, res: Response) => {
  if (!isMysqlConnected || !mysqlPool) {
    // Coba hubungkan ulang jika kredensial ada
    await initMysqlConnection();
    if (!isMysqlConnected || !mysqlPool) {
      return res.status(400).json({
        success: false,
        message: `Database MySQL Hostinger belum terhubung: ${mysqlLastError || 'Periksa DB_HOST, DB_USER, DB_PASSWORD, DB_NAME di file .env Anda atau gunakan Form Sambungkan Database.'}`
      });
    }
  }

  try {
    await initializeMysqlTables(mysqlPool);
    res.json({
      success: true,
      message: 'Seluruh tabel dan data awal berhasil dibuat di database MySQL Hostinger!',
      tables: tablesStatus
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Gagal menginisialisasi tabel: ${err.message}`
    });
  }
});

// Endpoint Sambungkan Database & Buat Tabel Langsung dari Web UI
app.post(['/api/database/connect-and-init', '/api/database/connect-and-init/'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { host, port, user, password, database } = req.body;

  if (!host || !user || !database) {
    return res.status(400).json({
      success: false,
      message: 'Parameter Host, User, dan Nama Database wajib diisi.'
    });
  }

  const dbPort = parseInt(port || '3306', 10);
  const cleanHost = String(host).trim();
  const cleanUser = String(user).trim();
  const cleanPass = String(password || '').trim();
  const cleanDb = String(database).trim();

  try {
    const testPool = mysql.createPool({
      host: cleanHost,
      port: dbPort,
      user: cleanUser,
      password: cleanPass,
      database: cleanDb,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 8000,
      multipleStatements: true
    });

    const conn = await testPool.getConnection();
    await conn.ping();
    conn.release();

    // Tutup pool sebelumnya jika ada
    if (mysqlPool) {
      try { await mysqlPool.end(); } catch {}
    }

    mysqlPool = testPool;
    isMysqlConnected = true;
    mysqlLastError = '';
    process.env.DB_HOST = cleanHost;
    process.env.DB_PORT = String(dbPort);
    process.env.DB_USER = cleanUser;
    process.env.DB_PASSWORD = cleanPass;
    process.env.DB_NAME = cleanDb;

    // Buat ke-9 tabel dan seed data awal
    await initializeMysqlTables(mysqlPool);

    // Simpan ke file .env di server agar saat restart tetap terhubung
    try {
      const envPath = path.resolve(__dirname, '.env');
      const envContent = `# Hostinger Node.js Environment Config (Auto-saved)
PORT=${PORT || 3000}
NODE_ENV=${process.env.NODE_ENV || 'production'}
DB_HOST=${cleanHost}
DB_PORT=${dbPort}
DB_USER=${cleanUser}
DB_PASSWORD=${cleanPass}
DB_NAME=${cleanDb}
TELEGRAM_BOT_TOKEN=${process.env.TELEGRAM_BOT_TOKEN || ''}
TELEGRAM_CHAT_ID=${process.env.TELEGRAM_CHAT_ID || ''}
`;
      fs.writeFileSync(envPath, envContent, 'utf-8');
      console.log('[MySQL Hostinger] Berhasil menyimpan konfigurasi ke file .env!');
    } catch (saveErr: any) {
      console.warn('[MySQL Hostinger] Catatan simpan .env:', saveErr.message);
    }

    res.json({
      success: true,
      message: `Selamat! Berhasil terhubung ke database "${cleanDb}" di ${cleanHost} dan seluruh 9 tabel sistem telah sukses dibuat di phpMyAdmin Anda!`,
      database: {
        host: cleanHost,
        database: cleanDb,
        user: cleanUser
      },
      tables: tablesStatus
    });
  } catch (err: any) {
    console.error('[MySQL Connection Attempt Error]:', err);
    let friendlyMsg = err.message || 'Koneksi ke MySQL gagal.';
    if (err.code === 'ER_BAD_DB_ERROR' || err.errno === 1049) {
      friendlyMsg = `Database "${cleanDb}" belum dibuat di Hostinger hPanel. Di Hostinger, database harus dibuat terlebih dahulu di menu hPanel -> Databases -> MySQL Databases.`;
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.errno === 1045) {
      friendlyMsg = `Akses ditolak (Username atau Password keliru). Pastikan user "${cleanUser}" dan password yang dimasukkan sesuai dengan yang Anda buat di hPanel Hostinger.`;
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
        friendlyMsg = `Koneksi ke localhost ditolak. Host "localhost" hanya berlaku ketika aplikasi Node.js dijalankan langsung di server Hostinger yang sama dengan database MySQL. Jika Anda menguji dari pratinjau browser / cloud luar, gunakan Host MySQL publik/remote Hostinger (misal: srvXXX.hstgr.io atau IP server) dan aktifkan "Remote MySQL" di hPanel Hostinger, ATAU gunakan Metode B (Salin Skrip SQL ke phpMyAdmin) yang 100% instan tanpa kendala jaringan.`;
      } else {
        friendlyMsg = `Tidak dapat menghubungi server MySQL di "${cleanHost}:${dbPort}". Pastikan alamat host benar dan port 3306 terbuka.`;
      }
    } else if (err.code === 'ETIMEDOUT') {
      friendlyMsg = `Koneksi timeout ke "${cleanHost}:${dbPort}". Server MySQL tidak merespons. Jika menghubungkan dari luar Hostinger, buka hPanel -> Databases -> Remote MySQL, lalu tambahkan IP "%" (izinkan semua IP) dan tautkan user database Anda.`;
    }

    res.status(400).json({
      success: false,
      message: friendlyMsg,
      errorCode: err.code || 'DB_CONNECT_ERROR'
    });
  }
});

// Endpoint untuk menyajikan skrip SQL siap import di Hostinger phpMyAdmin
app.get(['/database_hostinger.sql', '/api/database/sql'], (req: Request, res: Response) => {
  const sqlPath = path.resolve(__dirname, 'database_hostinger.sql');
  if (fs.existsSync(sqlPath)) {
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="database_hostinger.sql"');
    return res.sendFile(sqlPath);
  }
  res.status(404).send('-- File database_hostinger.sql tidak ditemukan');
});

// ============================================================================
// MASTER SYNC ENDPOINTS: PULL ALL & PUSH ALL
// Menjamin konsistensi data antara database MySQL Hostinger dan Aplikasi 100%
// ============================================================================
app.get(['/api/database/pull-all', '/api/database/pull-all/'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  if (isMysqlConnected && mysqlPool) {
    try {
      const [lokasiRows]: any = await mysqlPool.query(
        'SELECT id_lokasi as ID_Lokasi, nama_ruangan as Nama_Ruangan, kategori as Kategori, id_pengampu as ID_Pengampu, status_terkini as Status_Terkini, gedung as Gedung, lantai as Lantai, last_update as Last_Update FROM lokasi ORDER BY id_lokasi ASC'
      );
      const [pengampuRows]: any = await mysqlPool.query(
        'SELECT id_pengampu as ID_Pengampu, nama_petugas as Nama_Petugas, username as Username, password as Password, role as Role, kontak_telegram as Kontak_Telegram, telepon as Telepon FROM pengampu ORDER BY id_pengampu ASC'
      );
      const [checklistRows]: any = await mysqlPool.query(
        'SELECT id, nama, kategori, deskripsi, bobot, aktif=1 as aktif, urutan FROM checklist_master ORDER BY urutan ASC, created_at ASC'
      );
      const [inspeksiRows]: any = await mysqlPool.query(
        'SELECT id, timestamp as Timestamp, id_lokasi as ID_Lokasi, id_pengampu as ID_Pengampu, skor_kebersihan as Skor_Kebersihan, status_warna as Status_Warna, catatan_kritis as Catatan_Kritis, detail_ceklis_json, total_item_diperiksa as Total_Item_Diperiksa, total_item_lolos as Total_Item_Lolos FROM log_inspeksi ORDER BY created_at DESC'
      );
      const [pengaduanRows]: any = await mysqlPool.query(
        'SELECT id, timestamp as Timestamp, id_lokasi as ID_Lokasi, nama_pelapor as Nama_Pelapor, kontak_pelapor as Kontak_Pelapor, detail_keluhan as Detail_Keluhan, status_tindak_lanjut as Status_Tindak_Lanjut, kategori_keluhan as Kategori_Keluhan, foto_bukti as Foto_Bukti, waktu_selesai as Waktu_Selesai, catatan_penyelesaian as Catatan_Penyelesaian, petugas_penangan as Petugas_Penangan FROM log_pengaduan ORDER BY created_at DESC'
      );
      const [saranRows]: any = await mysqlPool.query(
        'SELECT id, timestamp as Timestamp, id_lokasi as ID_Lokasi, nama_pemberi_saran as Nama_Pemberi_Saran, kontak as Kontak, kategori_saran as Kategori_Saran, judul_saran as Judul_Saran, detail_saran as Detail_Saran, prioritas as Prioritas, status_tinjauan as Status_Tinjauan, tanggapan_supervisor as Tanggapan_Supervisor FROM saran_pelayanan ORDER BY created_at DESC'
      );
      const [ratingRows]: any = await mysqlPool.query(
        'SELECT id, timestamp as Timestamp, id_lokasi as ID_Lokasi, nama_reviewer as Nama_Reviewer, bintang as Bintang, rating_kebersihan_lantai as Rating_Kebersihan_Lantai, rating_ketersediaan_air_sabun as Rating_Ketersediaan_Air_Sabun, rating_aroma_keharuman as Rating_Aroma_Keharuman, rating_kesigapan_petugas as Rating_Kesigapan_Petugas, komentar_review as Komentar_Review, rekomendasikan=1 as Rekomendasikan FROM rating_review ORDER BY created_at DESC'
      );
      const [greetingRows]: any = await mysqlPool.query(
        'SELECT id, nama, instansi, pesan, waktu, emoji FROM greeting_messages ORDER BY created_at DESC'
      );

      const parsedChecklist = checklistRows.map((c: any) => ({ ...c, aktif: Boolean(c.aktif) }));
      const parsedInspeksi = inspeksiRows.map((r: any) => {
        let detail = {};
        if (typeof r.detail_ceklis_json === 'string') {
          try { detail = JSON.parse(r.detail_ceklis_json); } catch {}
        } else if (r.detail_ceklis_json && typeof r.detail_ceklis_json === 'object') {
          detail = r.detail_ceklis_json;
        }
        return { ...r, Detail_Ceklis: detail };
      });
      const parsedRating = ratingRows.map((r: any) => ({ ...r, Rekomendasikan: Boolean(r.Rekomendasikan) }));

      // Sinkronkan juga cache memori
      if (lokasiRows.length > 0) lokasiStore = lokasiRows;
      if (pengampuRows.length > 0) pengampuStore = pengampuRows;
      if (parsedChecklist.length > 0) checklistStore = parsedChecklist;

      return res.json({
        success: true,
        source: 'MySQL Hostinger',
        connected: true,
        data: {
          lokasi: lokasiRows,
          pengampu: pengampuRows,
          checklist: parsedChecklist,
          inspeksi: parsedInspeksi,
          pengaduan: pengaduanRows,
          saran: saranRows,
          rating: parsedRating,
          greetings: greetingRows
        },
        counts: {
          lokasi: lokasiRows.length,
          pengampu: pengampuRows.length,
          checklist: parsedChecklist.length,
          inspeksi: parsedInspeksi.length,
          pengaduan: pengaduanRows.length,
          saran: saranRows.length,
          rating: parsedRating.length,
          greetings: greetingRows.length
        }
      });
    } catch (err: any) {
      console.error('[MySQL pull-all error]:', err.message);
    }
  }

  res.json({
    success: true,
    source: 'In-Memory Simulation',
    connected: false,
    data: {
      lokasi: lokasiStore,
      pengampu: pengampuStore,
      checklist: checklistStore,
      inspeksi: inspeksiStore,
      pengaduan: pengaduanStore,
      saran: saranStore,
      rating: ratingStore,
      greetings: greetingMessagesStore
    },
    counts: {
      lokasi: lokasiStore.length,
      pengampu: pengampuStore.length,
      checklist: checklistStore.length,
      inspeksi: inspeksiStore.length,
      pengaduan: pengaduanStore.length,
      saran: saranStore.length,
      rating: ratingStore.length,
      greetings: greetingMessagesStore.length
    }
  });
});

app.post(['/api/database/push-all', '/api/database/push-all/'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { lokasi, pengampu, checklist, inspeksi, pengaduan, saran, rating, greetings } = req.body;

  if (Array.isArray(lokasi) && lokasi.length > 0) lokasiStore = lokasi;
  if (Array.isArray(pengampu) && pengampu.length > 0) pengampuStore = pengampu;
  if (Array.isArray(checklist) && checklist.length > 0) checklistStore = checklist;
  if (Array.isArray(inspeksi)) inspeksiStore = inspeksi;
  if (Array.isArray(pengaduan)) pengaduanStore = pengaduan;
  if (Array.isArray(saran)) saranStore = saran;
  if (Array.isArray(rating)) ratingStore = rating;
  if (Array.isArray(greetings)) greetingMessagesStore = greetings;

  if (isMysqlConnected && mysqlPool) {
    try {
      // 1. Push Pengampu
      if (Array.isArray(pengampu)) {
        for (const p of pengampu) {
          await mysqlPool.query(
            'INSERT INTO pengampu (id_pengampu, nama_petugas, username, password, role, kontak_telegram, telepon) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama_petugas=VALUES(nama_petugas), username=VALUES(username), password=VALUES(password), role=VALUES(role), kontak_telegram=VALUES(kontak_telegram), telepon=VALUES(telepon)',
            [p.ID_Pengampu, p.Nama_Petugas, p.Username, p.Password, p.Role, p.Kontak_Telegram, p.Telepon || '']
          );
        }
      }

      // 2. Push Lokasi
      if (Array.isArray(lokasi)) {
        for (const l of lokasi) {
          await mysqlPool.query(
            'INSERT INTO lokasi (id_lokasi, nama_ruangan, kategori, id_pengampu, status_terkini, gedung, lantai, last_update) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama_ruangan=VALUES(nama_ruangan), kategori=VALUES(kategori), id_pengampu=VALUES(id_pengampu), status_terkini=VALUES(status_terkini), gedung=VALUES(gedung), lantai=VALUES(lantai), last_update=VALUES(last_update)',
            [l.ID_Lokasi, l.Nama_Ruangan, l.Kategori, l.ID_Pengampu, l.Status_Terkini, l.Gedung || 'Gedung Utama', l.Lantai || 'Lantai 1', l.Last_Update]
          );
        }
      }

      // 3. Push Checklist
      if (Array.isArray(checklist)) {
        for (const c of checklist) {
          await mysqlPool.query(
            'INSERT INTO checklist_master (id, nama, kategori, deskripsi, bobot, aktif, urutan) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama=VALUES(nama), kategori=VALUES(kategori), deskripsi=VALUES(deskripsi), bobot=VALUES(bobot), aktif=VALUES(aktif), urutan=VALUES(urutan)',
            [c.id, c.nama, c.kategori, c.deskripsi || '', c.bobot, c.aktif ? 1 : 0, c.urutan]
          );
        }
      }

      // 4. Push Inspeksi
      if (Array.isArray(inspeksi)) {
        for (const i of inspeksi) {
          await mysqlPool.query(
            'INSERT INTO log_inspeksi (id, timestamp, id_lokasi, id_pengampu, skor_kebersihan, status_warna, catatan_kritis, detail_ceklis_json, total_item_diperiksa, total_item_lolos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE skor_kebersihan=VALUES(skor_kebersihan), status_warna=VALUES(status_warna), catatan_kritis=VALUES(catatan_kritis)',
            [i.id || ('INSP-' + Date.now()), i.Timestamp, i.ID_Lokasi, i.ID_Pengampu, i.Skor_Kebersihan, i.Status_Warna, i.Catatan_Kritis, JSON.stringify(i.Detail_Ceklis || {}), i.Total_Item_Diperiksa || 8, i.Total_Item_Lolos || 8]
          );
        }
      }

      // 5. Push Pengaduan
      if (Array.isArray(pengaduan)) {
        for (const a of pengaduan) {
          await mysqlPool.query(
            'INSERT INTO log_pengaduan (id, timestamp, id_lokasi, nama_pelapor, kontak_pelapor, detail_keluhan, status_tindak_lanjut, kategori_keluhan, foto_bukti, waktu_selesai, catatan_penyelesaian, petugas_penangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status_tindak_lanjut=VALUES(status_tindak_lanjut), waktu_selesai=VALUES(waktu_selesai), catatan_penyelesaian=VALUES(catatan_penyelesaian), petugas_penangan=VALUES(petugas_penangan)',
            [a.id, a.Timestamp, a.ID_Lokasi, a.Nama_Pelapor, a.Kontak_Pelapor || '', a.Detail_Keluhan, a.Status_Tindak_Lanjut, a.Kategori_Keluhan || '', a.Foto_Bukti || '', a.Waktu_Selesai || null, a.Catatan_Penyelesaian || null, a.Petugas_Penangan || null]
          );
        }
      }

      // 6. Push Saran
      if (Array.isArray(saran)) {
        for (const s of saran) {
          await mysqlPool.query(
            'INSERT INTO saran_pelayanan (id, timestamp, id_lokasi, nama_pemberi_saran, kontak, kategori_saran, judul_saran, detail_saran, prioritas, status_tinjauan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status_tinjauan=VALUES(status_tinjauan)',
            [s.id, s.Timestamp, s.ID_Lokasi, s.Nama_Pemberi_Saran, s.Kontak || '', s.Kategori_Saran, s.Judul_Saran, s.Detail_Saran, s.Prioritas, s.Status_Tinjauan]
          );
        }
      }

      // 7. Push Rating
      if (Array.isArray(rating)) {
        for (const r of rating) {
          await mysqlPool.query(
            'INSERT INTO rating_review (id, timestamp, id_lokasi, nama_reviewer, bintang, rating_kebersihan_lantai, rating_ketersediaan_air_sabun, rating_aroma_keharuman, rating_kesigapan_petugas, komentar_review, rekomendasikan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE komentar_review=VALUES(komentar_review)',
            [r.id, r.Timestamp, r.ID_Lokasi, r.Nama_Reviewer, r.Bintang, r.Rating_Kebersihan_Lantai, r.Rating_Ketersediaan_Air_Sabun, r.Rating_Aroma_Keharuman, r.Rating_Kesigapan_Petugas, r.Komentar_Review || '', r.Rekomendasikan ? 1 : 0]
          );
        }
      }

      // 8. Push Greetings
      if (Array.isArray(greetings)) {
        for (const g of greetings) {
          await mysqlPool.query(
            'INSERT INTO greeting_messages (id, nama, instansi, pesan, waktu, emoji) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE pesan=VALUES(pesan)',
            [g.id, g.nama, g.instansi || '', g.pesan, g.waktu, g.emoji || '🌸']
          );
        }
      }

      return res.json({
        success: true,
        message: 'Seluruh data aplikasi sukses disimpan dan disinkronkan ke database MySQL Hostinger!'
      });
    } catch (err: any) {
      console.error('[MySQL push-all error]:', err.message);
      return res.status(500).json({ success: false, message: `Gagal sinkronisasi ke MySQL: ${err.message}` });
    }
  }

  res.json({
    success: true,
    message: 'Data tersimpan ke memori server (Koneksikan database MySQL di tab Hostinger Deploy untuk penyimpanan permanen).'
  });
});

// 3. MASTER LOKASI (Toilet & Ruangan)
app.get('/api/lokasi', async (req: Request, res: Response) => {
  if (isMysqlConnected && mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query('SELECT id_lokasi as ID_Lokasi, nama_ruangan as Nama_Ruangan, kategori as Kategori, id_pengampu as ID_Pengampu, status_terkini as Status_Terkini, gedung as Gedung, lantai as Lantai, last_update as Last_Update FROM lokasi ORDER BY id_lokasi ASC');
      return res.json({ success: true, data: rows });
    } catch (err: any) {
      console.error('[MySQL Query Error Lokasi]:', err.message);
    }
  }
  res.json({ success: true, data: lokasiStore });
});

app.post('/api/lokasi', async (req: Request, res: Response) => {
  const { ID_Lokasi, Nama_Ruangan, Kategori, ID_Pengampu, Status_Terkini, Gedung, Lantai } = req.body;
  const newLokasi = {
    ID_Lokasi: ID_Lokasi || `LOK-${Math.floor(100 + Math.random() * 900)}`,
    Nama_Ruangan: Nama_Ruangan || 'Ruangan Baru',
    Kategori: Kategori || 'Toilet',
    ID_Pengampu: ID_Pengampu || 'PGP-001',
    Status_Terkini: Status_Terkini || 'Hijau',
    Gedung: Gedung || 'Gedung Utama',
    Lantai: Lantai || 'Lantai 1',
    Last_Update: new Date().toLocaleString('id-ID')
  };

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO lokasi (id_lokasi, nama_ruangan, kategori, id_pengampu, status_terkini, gedung, lantai, last_update) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama_ruangan=VALUES(nama_ruangan), kategori=VALUES(kategori), id_pengampu=VALUES(id_pengampu), status_terkini=VALUES(status_terkini), gedung=VALUES(gedung), lantai=VALUES(lantai), last_update=VALUES(last_update)',
        [newLokasi.ID_Lokasi, newLokasi.Nama_Ruangan, newLokasi.Kategori, newLokasi.ID_Pengampu, newLokasi.Status_Terkini, newLokasi.Gedung, newLokasi.Lantai, newLokasi.Last_Update]
      );
      return res.json({ success: true, data: newLokasi, message: 'Ruangan berhasil disimpan ke MySQL' });
    } catch (err: any) {
      console.error('[MySQL Insert Lokasi Error]:', err.message);
    }
  }

  const existingIdx = lokasiStore.findIndex(l => l.ID_Lokasi === newLokasi.ID_Lokasi);
  if (existingIdx !== -1) {
    lokasiStore[existingIdx] = newLokasi;
  } else {
    lokasiStore.push(newLokasi);
  }
  res.json({ success: true, data: newLokasi, message: 'Ruangan berhasil disimpan' });
});

app.put('/api/lokasi/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { Nama_Ruangan, Kategori, ID_Pengampu, Status_Terkini, Gedung, Lantai } = req.body;
  const lastUpdate = new Date().toLocaleString('id-ID');

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'UPDATE lokasi SET nama_ruangan=?, kategori=?, id_pengampu=?, status_terkini=?, gedung=?, lantai=?, last_update=? WHERE id_lokasi=?',
        [Nama_Ruangan, Kategori, ID_Pengampu, Status_Terkini, Gedung, Lantai, lastUpdate, id]
      );
      return res.json({ success: true, message: 'Lokasi berhasil diperbarui di database' });
    } catch (err: any) {
      console.error('[MySQL Update Lokasi Error]:', err.message);
    }
  }

  const idx = lokasiStore.findIndex(l => l.ID_Lokasi === id);
  if (idx !== -1) {
    lokasiStore[idx] = { ...lokasiStore[idx], ...req.body, Last_Update: lastUpdate };
  }
  res.json({ success: true, message: 'Lokasi berhasil diperbarui' });
});

app.delete('/api/lokasi/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM lokasi WHERE id_lokasi=?', [id]);
      return res.json({ success: true, message: 'Lokasi berhasil dihapus dari database' });
    } catch (err: any) {
      console.error('[MySQL Delete Lokasi Error]:', err.message);
    }
  }
  lokasiStore = lokasiStore.filter(l => l.ID_Lokasi !== id);
  res.json({ success: true, message: 'Lokasi berhasil dihapus' });
});

// 4. MASTER PENGAMPU (Petugas & Supervisor)
app.get('/api/pengampu', async (req: Request, res: Response) => {
  if (isMysqlConnected && mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query('SELECT id_pengampu as ID_Pengampu, nama_petugas as Nama_Petugas, username as Username, password as Password, role as Role, kontak_telegram as Kontak_Telegram, telepon as Telepon FROM pengampu ORDER BY id_pengampu ASC');
      return res.json({ success: true, data: rows });
    } catch (err: any) {
      console.error('[MySQL Query Error Pengampu]:', err.message);
    }
  }
  res.json({ success: true, data: pengampuStore });
});

app.post('/api/pengampu', async (req: Request, res: Response) => {
  const { ID_Pengampu, Nama_Petugas, Username, Password, Role, Kontak_Telegram, Telepon } = req.body;
  if (!Nama_Petugas || !Username) {
    return res.status(400).json({ success: false, message: 'Nama Petugas dan Username wajib diisi' });
  }

  const newStaff = {
    ID_Pengampu: ID_Pengampu || `PGP-${Math.floor(100 + Math.random() * 900)}`,
    Nama_Petugas,
    Username,
    Password: Password || '123',
    Role: Role || 'Petugas',
    Kontak_Telegram: Kontak_Telegram || '@petugas',
    Telepon: Telepon || ''
  };

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO pengampu (id_pengampu, nama_petugas, username, password, role, kontak_telegram, telepon) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama_petugas=VALUES(nama_petugas), username=VALUES(username), password=VALUES(password), role=VALUES(role), kontak_telegram=VALUES(kontak_telegram), telepon=VALUES(telepon)',
        [newStaff.ID_Pengampu, newStaff.Nama_Petugas, newStaff.Username, newStaff.Password, newStaff.Role, newStaff.Kontak_Telegram, newStaff.Telepon]
      );
      return res.json({ success: true, data: newStaff, message: 'Petugas berhasil disimpan ke MySQL' });
    } catch (err: any) {
      console.error('[MySQL Insert Pengampu Error]:', err.message);
    }
  }

  const existingIdx = pengampuStore.findIndex(p => p.ID_Pengampu === newStaff.ID_Pengampu);
  if (existingIdx !== -1) {
    pengampuStore[existingIdx] = newStaff;
  } else {
    pengampuStore.push(newStaff);
  }
  res.json({ success: true, data: newStaff, message: 'Petugas berhasil disimpan' });
});

app.put('/api/pengampu/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { Nama_Petugas, Username, Password, Role, Kontak_Telegram, Telepon } = req.body;

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'UPDATE pengampu SET nama_petugas=?, username=?, password=?, role=?, kontak_telegram=?, telepon=? WHERE id_pengampu=?',
        [Nama_Petugas, Username, Password, Role, Kontak_Telegram, Telepon, id]
      );
      return res.json({ success: true, message: 'Data petugas berhasil diperbarui di database' });
    } catch (err: any) {
      console.error('[MySQL Update Pengampu Error]:', err.message);
    }
  }

  const idx = pengampuStore.findIndex(p => p.ID_Pengampu === id);
  if (idx !== -1) {
    pengampuStore[idx] = { ...pengampuStore[idx], ...req.body };
  }
  res.json({ success: true, message: 'Data petugas berhasil diperbarui' });
});

app.delete('/api/pengampu/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM pengampu WHERE id_pengampu=?', [id]);
      return res.json({ success: true, message: 'Petugas berhasil dihapus dari database' });
    } catch (err: any) {
      console.error('[MySQL Delete Pengampu Error]:', err.message);
    }
  }
  pengampuStore = pengampuStore.filter(p => p.ID_Pengampu !== id);
  res.json({ success: true, message: 'Petugas berhasil dihapus' });
});

// 5. Checklist Master (Supervisor Tambah / Hapus / Edit)
app.get('/api/checklist', async (req: Request, res: Response) => {
  if (isMysqlConnected && mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query('SELECT id, nama, kategori, deskripsi, bobot, aktif=1 as aktif, urutan FROM checklist_master ORDER BY urutan ASC, created_at ASC');
      return res.json({ success: true, data: rows });
    } catch (err: any) {
      console.error('MySQL Query Error:', err.message);
    }
  }
  res.json({ success: true, data: checklistStore });
});

app.post('/api/checklist', async (req: Request, res: Response) => {
  const { nama, kategori, deskripsi, bobot, aktif } = req.body;
  if (!nama) {
    return res.status(400).json({ success: false, message: 'Nama item ceklis wajib diisi' });
  }

  const newItem = {
    id: 'CHK-' + Math.floor(100 + Math.random() * 900),
    nama,
    kategori: kategori || 'Semua',
    deskripsi: deskripsi || '',
    bobot: Number(bobot) || 1,
    aktif: aktif !== false,
    urutan: checklistStore.length + 1
  };

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO checklist_master (id, nama, kategori, deskripsi, bobot, aktif, urutan) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [newItem.id, newItem.nama, newItem.kategori, newItem.deskripsi, newItem.bobot, newItem.aktif ? 1 : 0, newItem.urutan]
      );
      return res.json({ success: true, data: newItem, message: 'Ceklis berhasil ditambahkan ke database MySQL' });
    } catch (err: any) {
      console.error('MySQL Insert Error:', err.message);
    }
  }

  checklistStore.push(newItem);
  res.json({ success: true, data: newItem, message: 'Ceklis berhasil ditambahkan' });
});

app.put('/api/checklist/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { nama, kategori, deskripsi, bobot, aktif, urutan } = req.body;

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'UPDATE checklist_master SET nama=?, kategori=?, deskripsi=?, bobot=?, aktif=?, urutan=? WHERE id=?',
        [nama, kategori, deskripsi, bobot, aktif ? 1 : 0, urutan, id]
      );
      return res.json({ success: true, message: 'Ceklis berhasil diperbarui' });
    } catch (err: any) {
      console.error('MySQL Update Error:', err.message);
    }
  }

  const idx = checklistStore.findIndex(c => c.id === id);
  if (idx !== -1) {
    checklistStore[idx] = { ...checklistStore[idx], ...req.body };
    return res.json({ success: true, data: checklistStore[idx], message: 'Ceklis berhasil diperbarui' });
  }

  res.status(404).json({ success: false, message: 'Item ceklis tidak ditemukan' });
});

app.delete('/api/checklist/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query('DELETE FROM checklist_master WHERE id=?', [id]);
      return res.json({ success: true, message: 'Ceklis berhasil dihapus dari database' });
    } catch (err: any) {
      console.error('MySQL Delete Error:', err.message);
    }
  }

  checklistStore = checklistStore.filter(c => c.id !== id);
  res.json({ success: true, message: 'Item ceklis berhasil dihapus' });
});

// 6. Form 1: Laporan / Pengaduan Pengunjung
app.get('/api/laporan', async (req: Request, res: Response) => {
  if (isMysqlConnected && mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query('SELECT id, timestamp as Timestamp, id_lokasi as ID_Lokasi, nama_pelapor as Nama_Pelapor, kontak_pelapor as Kontak_Pelapor, detail_keluhan as Detail_Keluhan, status_tindak_lanjut as Status_Tindak_Lanjut, kategori_keluhan as Kategori_Keluhan, foto_bukti as Foto_Bukti, waktu_selesai as Waktu_Selesai, catatan_penyelesaian as Catatan_Penyelesaian, petugas_penangan as Petugas_Penangan FROM log_pengaduan ORDER BY created_at DESC');
      return res.json({ success: true, data: rows });
    } catch (err: any) {
      console.error('MySQL Error:', err.message);
    }
  }
  res.json({ success: true, data: pengaduanStore });
});

app.post('/api/laporan', async (req: Request, res: Response) => {
  const { idLokasi, namaPelapor, kontakPelapor, detailKeluhan, kategoriKeluhan, fotoBukti } = req.body;

  if (!idLokasi || !namaPelapor || !detailKeluhan) {
    return res.status(400).json({ success: false, message: 'ID Lokasi, Nama Pelapor, dan Detail Keluhan wajib diisi' });
  }

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const newLaporan = {
    id: 'LAP-' + Math.floor(100 + Math.random() * 900),
    Timestamp: timestamp,
    ID_Lokasi: idLokasi,
    Nama_Pelapor: namaPelapor,
    Kontak_Pelapor: kontakPelapor || '',
    Detail_Keluhan: detailKeluhan,
    Status_Tindak_Lanjut: 'Pending' as const,
    Kategori_Keluhan: kategoriKeluhan || 'Keluhan Umum',
    Foto_Bukti: fotoBukti || ''
  };

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO log_pengaduan (id, timestamp, id_lokasi, nama_pelapor, kontak_pelapor, detail_keluhan, status_tindak_lanjut, kategori_keluhan, foto_bukti) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newLaporan.id, newLaporan.Timestamp, newLaporan.ID_Lokasi, newLaporan.Nama_Pelapor, newLaporan.Kontak_Pelapor, newLaporan.Detail_Keluhan, newLaporan.Status_Tindak_Lanjut, newLaporan.Kategori_Keluhan, newLaporan.Foto_Bukti]
      );
      await mysqlPool.query('UPDATE lokasi SET status_terkini="Merah", last_update=? WHERE id_lokasi=?', [timestamp, idLokasi]);
    } catch (err: any) {
      console.error('MySQL Insert Error:', err.message);
    }
  }

  pengaduanStore.unshift(newLaporan);

  // Trigger Telegram Notification
  sendTelegramMessage(
    `🚨 *PENGADUAN KEBERSIHAN BARU!*\n\n` +
    `📍 *Lokasi:* ${idLokasi}\n` +
    `👤 *Pelapor:* ${namaPelapor} ${kontakPelapor ? `(${kontakPelapor})` : ''}\n` +
    `📝 *Keluhan:* "${detailKeluhan}"\n` +
    `🏷️ *Kategori:* ${kategoriKeluhan || 'Umum'}\n` +
    `⚠️ *Status Ruangan:* 🔴 MERAH (Harap Ditangani Segera)\n` +
    `⏰ *Waktu:* ${timestamp}`,
    'pengaduan'
  ).catch(err => console.error('Telegram Trigger Error:', err));

  res.json({ success: true, data: newLaporan, message: 'Laporan pengaduan berhasil dikirim' });
});

app.put('/api/laporan/:id/resolve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { idLokasi, catatanPenyelesaian, petugasPenangan } = req.body;

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'UPDATE log_pengaduan SET status_tindak_lanjut="Selesai", waktu_selesai=?, catatan_penyelesaian=?, petugas_penangan=? WHERE id=?',
        [timestamp, catatanPenyelesaian || 'Telah dibersihkan', petugasPenangan || 'Petugas', id]
      );
      if (idLokasi) {
        await mysqlPool.query('UPDATE lokasi SET status_terkini="Hijau", last_update=? WHERE id_lokasi=?', [timestamp, idLokasi]);
      }
    } catch (err: any) {
      console.error('MySQL Update Error:', err.message);
    }
  }

  const found = pengaduanStore.find(p => p.id === id);
  if (found) {
    found.Status_Tindak_Lanjut = 'Selesai';
    (found as any).Waktu_Selesai = timestamp;
    (found as any).Catatan_Penyelesaian = catatanPenyelesaian || 'Telah dibersihkan dan dipel';
    (found as any).Petugas_Penangan = petugasPenangan || 'Petugas';
  }

  // Notifikasi Telegram bahwa aduan sudah selesai
  sendTelegramMessage(
    `✅ *PENANGANAN ADUAN SELESAI!*\n\n` +
    `🆔 *ID Aduan:* ${id}\n` +
    `📍 *Lokasi:* ${idLokasi || found?.ID_Lokasi || '-'}\n` +
    `🛠️ *Tindakan:* ${catatanPenyelesaian || 'Telah dibersihkan menyeluruh'}\n` +
    `👷 *Petugas:* ${petugasPenangan || 'Petugas Kebersihan'}\n` +
    `🟢 *Status Ruangan:* Dipulihkan Normal (HIJAU)\n` +
    `⏰ *Waktu Selesai:* ${timestamp}`,
    'inspeksi'
  ).catch(err => console.error('Telegram Resolve Alert Error:', err));

  res.json({ success: true, message: 'Pengaduan berhasil ditandai selesai' });
});

// 7. Form 2: Saran & Masukan untuk Peningkatan Pelayanan
app.get('/api/saran', async (req: Request, res: Response) => {
  if (isMysqlConnected && mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query('SELECT id, timestamp as Timestamp, id_lokasi as ID_Lokasi, nama_pemberi_saran as Nama_Pemberi_Saran, kontak as Kontak, kategori_saran as Kategori_Saran, judul_saran as Judul_Saran, detail_saran as Detail_Saran, prioritas as Prioritas, status_tinjauan as Status_Tinjauan, tanggapan_supervisor as Tanggapan_Supervisor FROM saran_pelayanan ORDER BY created_at DESC');
      return res.json({ success: true, data: rows });
    } catch (err: any) {
      console.error('MySQL Error:', err.message);
    }
  }
  res.json({ success: true, data: saranStore });
});

app.post('/api/saran', async (req: Request, res: Response) => {
  const { idLokasi, namaPemberiSaran, kontak, kategoriSaran, judulSaran, detailSaran, prioritas } = req.body;

  if (!idLokasi || !judulSaran || !detailSaran) {
    return res.status(400).json({ success: false, message: 'ID Lokasi, Judul, dan Detail Saran wajib diisi' });
  }

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const newSaran = {
    id: 'SRN-' + Math.floor(100 + Math.random() * 900),
    Timestamp: timestamp,
    ID_Lokasi: idLokasi,
    Nama_Pemberi_Saran: namaPemberiSaran || 'Anonim (Pengunjung)',
    Kontak: kontak || '',
    Kategori_Saran: kategoriSaran || 'Fasilitas & Sarana',
    Judul_Saran: judulSaran,
    Detail_Saran: detailSaran,
    Prioritas: prioritas || 'Biasa',
    Status_Tinjauan: 'Diterima' as const
  };

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO saran_pelayanan (id, timestamp, id_lokasi, nama_pemberi_saran, kontak, kategori_saran, judul_saran, detail_saran, prioritas, status_tinjauan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newSaran.id, newSaran.Timestamp, newSaran.ID_Lokasi, newSaran.Nama_Pemberi_Saran, newSaran.Kontak, newSaran.Kategori_Saran, newSaran.Judul_Saran, newSaran.Detail_Saran, newSaran.Prioritas, newSaran.Status_Tinjauan]
      );
    } catch (err: any) {
      console.error('MySQL Insert Error:', err.message);
    }
  }

  saranStore.unshift(newSaran);

  sendTelegramMessage(
    `💡 *SARAN & MASUKAN PENGUNJUNG BARU!*\n\n` +
    `📍 *Lokasi:* ${idLokasi}\n` +
    `👤 *Pengirim:* ${newSaran.Nama_Pemberi_Saran}\n` +
    `📌 *Kategori:* ${newSaran.Kategori_Saran}\n` +
    `🎯 *Judul:* "${judulSaran}"\n` +
    `📝 *Ulasan:* "${detailSaran}"\n` +
    `⏰ *Waktu:* ${timestamp}`,
    'saran'
  ).catch(err => console.error('Telegram Saran Alert Error:', err));

  res.json({ success: true, data: newSaran, message: 'Terima kasih! Saran & masukan Anda berhasil dikirim.' });
});

// 8. Form 3: Rating Pelayanan & Review Pengunjung (Bintang 1-5)
app.get('/api/rating', async (req: Request, res: Response) => {
  if (isMysqlConnected && mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query('SELECT id, timestamp as Timestamp, id_lokasi as ID_Lokasi, nama_reviewer as Nama_Reviewer, bintang as Bintang, rating_kebersihan_lantai as Rating_Kebersihan_Lantai, rating_ketersediaan_air_sabun as Rating_Ketersediaan_Air_Sabun, rating_aroma_keharuman as Rating_Aroma_Keharuman, rating_kesigapan_petugas as Rating_Kesigapan_Petugas, komentar_review as Komentar_Review, rekomendasikan=1 as Rekomendasikan FROM rating_review ORDER BY created_at DESC');
      return res.json({ success: true, data: rows });
    } catch (err: any) {
      console.error('MySQL Error:', err.message);
    }
  }
  res.json({ success: true, data: ratingStore });
});

app.post('/api/rating', async (req: Request, res: Response) => {
  const { idLokasi, namaReviewer, bintang, ratingLantai, ratingAirSabun, ratingAroma, ratingPetugas, komentarReview, rekomendasikan } = req.body;

  const starCount = Math.max(1, Math.min(5, Number(bintang) || 5));
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const newRating = {
    id: 'RAT-' + Math.floor(100 + Math.random() * 900),
    Timestamp: timestamp,
    ID_Lokasi: idLokasi || 'LOK-001',
    Nama_Reviewer: namaReviewer || 'Pengunjung Ramah',
    Bintang: starCount,
    Rating_Kebersihan_Lantai: Number(ratingLantai) || starCount,
    Rating_Ketersediaan_Air_Sabun: Number(ratingAirSabun) || starCount,
    Rating_Aroma_Keharuman: Number(ratingAroma) || starCount,
    Rating_Kesigapan_Petugas: Number(ratingPetugas) || starCount,
    Komentar_Review: komentarReview || 'Pelayanan sangat memuaskan.',
    Rekomendasikan: rekomendasikan !== false
  };

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO rating_review (id, timestamp, id_lokasi, nama_reviewer, bintang, rating_kebersihan_lantai, rating_ketersediaan_air_sabun, rating_aroma_keharuman, rating_kesigapan_petugas, komentar_review, rekomendasikan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [newRating.id, newRating.Timestamp, newRating.ID_Lokasi, newRating.Nama_Reviewer, newRating.Bintang, newRating.Rating_Kebersihan_Lantai, newRating.Rating_Ketersediaan_Air_Sabun, newRating.Rating_Aroma_Keharuman, newRating.Rating_Kesigapan_Petugas, newRating.Komentar_Review, newRating.Rekomendasikan ? 1 : 0]
      );
    } catch (err: any) {
      console.error('MySQL Insert Error:', err.message);
    }
  }

  ratingStore.unshift(newRating);

  if (starCount <= 3) {
    sendTelegramMessage(
      `⭐ *RATING KEPUASAN RENDAH DITERIMA!*\n\n` +
      `📍 *Lokasi:* ${idLokasi}\n` +
      `⭐ *Skor:* ${'⭐'.repeat(starCount)} (${starCount}/5)\n` +
      `👤 *Penilai:* ${newRating.Nama_Reviewer}\n` +
      `💬 *Ulasan:* "${komentarReview || '-'}"\n` +
      `⚠️ *Catatan:* Perlu evaluasi kebersihan & respon petugas di lokasi ini.\n` +
      `⏰ *Waktu:* ${timestamp}`,
      'rating'
    ).catch(err => console.error('Telegram Low Rating Alert Error:', err));
  }

  res.json({ success: true, data: newRating, message: 'Rating & ulasan Anda berhasil disimpan. Terima kasih!' });
});

// 9. Log Inspeksi Petugas
app.get('/api/inspeksi', async (req: Request, res: Response) => {
  if (isMysqlConnected && mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query('SELECT id, timestamp as Timestamp, id_lokasi as ID_Lokasi, id_pengampu as ID_Pengampu, skor_kebersihan as Skor_Kebersihan, status_warna as Status_Warna, catatan_kritis as Catatan_Kritis, detail_ceklis_json, total_item_diperiksa as Total_Item_Diperiksa, total_item_lolos as Total_Item_Lolos FROM log_inspeksi ORDER BY created_at DESC');
      const parsed = rows.map((r: any) => {
        let detail = {};
        if (typeof r.detail_ceklis_json === 'string') {
          try { detail = JSON.parse(r.detail_ceklis_json); } catch {}
        } else if (r.detail_ceklis_json && typeof r.detail_ceklis_json === 'object') {
          detail = r.detail_ceklis_json;
        }
        return {
          ...r,
          Detail_Ceklis: detail
        };
      });
      return res.json({ success: true, data: parsed });
    } catch (err: any) {
      console.error('[MySQL Query Inspeksi Error]:', err.message);
    }
  }
  res.json({ success: true, data: inspeksiStore });
});

app.post('/api/inspeksi', async (req: Request, res: Response) => {
  const idLokasi = req.body.ID_Lokasi || req.body.idLokasi;
  const idPengampu = req.body.ID_Pengampu || req.body.idPengampu || 'PGP-001';
  const skorKebersihan = Number(req.body.Skor_Kebersihan ?? req.body.skorKebersihan ?? 100);
  const statusWarna = req.body.Status_Warna || req.body.statusWarna || 'Hijau';
  const catatanKritis = req.body.Catatan_Kritis || req.body.catatanKritis || '';
  const detailCeklis = req.body.Detail_Ceklis || req.body.detailCeklis || {};
  const totalDiperiksa = Number(req.body.Total_Item_Diperiksa ?? req.body.totalDiperiksa ?? 8);
  const totalLolos = Number(req.body.Total_Item_Lolos ?? req.body.totalLolos ?? 8);

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = req.body.Timestamp || req.body.timestamp || `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const newLog = {
    id: req.body.id || ('INSP-' + Date.now()),
    Timestamp: timestamp,
    ID_Lokasi: idLokasi,
    ID_Pengampu: idPengampu,
    Skor_Kebersihan: skorKebersihan,
    Status_Warna: statusWarna,
    Catatan_Kritis: catatanKritis,
    Detail_Ceklis: detailCeklis,
    Total_Item_Diperiksa: totalDiperiksa,
    Total_Item_Lolos: totalLolos
  };

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO log_inspeksi (id, timestamp, id_lokasi, id_pengampu, skor_kebersihan, status_warna, catatan_kritis, detail_ceklis_json, total_item_diperiksa, total_item_lolos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE skor_kebersihan=VALUES(skor_kebersihan), status_warna=VALUES(status_warna), catatan_kritis=VALUES(catatan_kritis)',
        [newLog.id, newLog.Timestamp, newLog.ID_Lokasi, newLog.ID_Pengampu, newLog.Skor_Kebersihan, newLog.Status_Warna, newLog.Catatan_Kritis, JSON.stringify(detailCeklis), newLog.Total_Item_Diperiksa, newLog.Total_Item_Lolos]
      );
      if (idLokasi) {
        await mysqlPool.query('UPDATE lokasi SET status_terkini=?, last_update=? WHERE id_lokasi=?', [newLog.Status_Warna, timestamp, idLokasi]);
      }
    } catch (err: any) {
      console.error('[MySQL Insert Inspeksi Error]:', err.message);
    }
  }

  inspeksiStore.unshift(newLog);

  // Update memory store lokasi
  const loc = lokasiStore.find(l => l.ID_Lokasi === idLokasi);
  if (loc) {
    loc.Status_Terkini = newLog.Status_Warna;
    loc.Last_Update = timestamp;
  }

  res.json({ success: true, data: newLog, message: 'Inspeksi berhasil disimpan' });
});

// 10. Kartu Ucapan & Apresiasi
app.get('/api/greetings', async (req: Request, res: Response) => {
  if (isMysqlConnected && mysqlPool) {
    try {
      const [rows]: any = await mysqlPool.query('SELECT id, nama, instansi, pesan, waktu, emoji FROM greeting_messages ORDER BY created_at DESC');
      return res.json({ success: true, data: rows });
    } catch (err: any) {
      console.error('MySQL Greetings Error:', err.message);
    }
  }
  res.json({ success: true, data: greetingMessagesStore });
});

app.post('/api/greetings', async (req: Request, res: Response) => {
  const { nama, instansi, pesan, emoji } = req.body;
  if (!nama || !pesan) {
    return res.status(400).json({ success: false, message: 'Nama dan pesan ucapan wajib diisi' });
  }

  const newGrt = {
    id: 'GRT-' + Date.now(),
    nama,
    instansi: instansi || 'Pengunjung Fasilitas',
    pesan,
    waktu: 'Hari Ini, ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    emoji: emoji || '🌸'
  };

  if (isMysqlConnected && mysqlPool) {
    try {
      await mysqlPool.query(
        'INSERT INTO greeting_messages (id, nama, instansi, pesan, waktu, emoji) VALUES (?, ?, ?, ?, ?, ?)',
        [newGrt.id, newGrt.nama, newGrt.instansi, newGrt.pesan, newGrt.waktu, newGrt.emoji]
      );
    } catch (err: any) {
      console.error('MySQL Insert Greetings Error:', err.message);
    }
  }

  greetingMessagesStore.unshift(newGrt);
  res.json({ success: true, data: newGrt, message: 'Kartu ucapan terima kasih berhasil dikirim' });
});

// 11. Endpoint Rekapitulasi Analitik
app.get('/api/rekap', (req: Request, res: Response) => {
  const totalPengaduan = pengaduanStore.length;
  const pendingCount = pengaduanStore.filter(p => p.Status_Tindak_Lanjut === 'Pending').length;
  const selesaiCount = pengaduanStore.filter(p => p.Status_Tindak_Lanjut === 'Selesai').length;
  const penyelesaianPersen = totalPengaduan > 0 ? Math.round((selesaiCount / totalPengaduan) * 100) : 100;

  const kategoriMap: Record<string, number> = {};
  pengaduanStore.forEach(p => {
    const kat = p.Kategori_Keluhan || 'Lain-lain';
    kategoriMap[kat] = (kategoriMap[kat] || 0) + 1;
  });

  const totalBintang = ratingStore.reduce((acc, r) => acc + (r.Bintang || 0), 0);
  const avgRating = ratingStore.length > 0 ? (totalBintang / ratingStore.length).toFixed(1) : '5.0';

  res.json({
    success: true,
    data: {
      totalPengaduan,
      pendingCount,
      selesaiCount,
      penyelesaianPersen,
      rataRataWaktuPenanganan: '14 Menit (SLA <30 Menit)',
      topKategori: Object.entries(kategoriMap).map(([kategori, jumlah]) => ({ kategori, jumlah })).sort((a, b) => b.jumlah - a.jumlah),
      totalSaran: saranStore.length,
      totalReview: ratingStore.length,
      avgRating: Number(avgRating)
    }
  });
});

// ----------------------------------------------------------------------------
// TELEGRAM BOT NOTIFICATION API ENGINE
// ----------------------------------------------------------------------------
const sendTelegramMessage = async (messageText: string, type: string = 'pengaduan', customChatId?: string) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = customChatId || process.env.TELEGRAM_CHAT_ID || '-1001234567890';
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const logEntry = {
    id: 'TG-' + Date.now(),
    timestamp,
    chatId,
    targetName: 'Bot Telegram SIM-KTR',
    message: messageText,
    type,
    status: 'simulated'
  };

  if (!token) {
    console.log('[Telegram Bot API] Token belum disetel di .env. Simulasi notifikasi dicatat ke riwayat log.');
    telegramLogsStore.unshift(logEntry);
    return { success: true, simulated: true, log: logEntry };
  }

  try {
    const telegramEndpoint = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(telegramEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'Markdown'
      })
    });

    const result = (await response.json()) as any;
    if (result.ok) {
      logEntry.status = 'sent';
      console.log(`[Telegram Bot API] Berhasil mengirim notifikasi Telegram ke chat ID ${chatId}!`);
    } else {
      logEntry.status = 'simulated';
      console.warn(`[Telegram Bot API] Gagal kirim ke Telegram: ${result.description}`);
    }

    if (isMysqlConnected && mysqlPool) {
      mysqlPool.query(
        'INSERT INTO telegram_logs (id, timestamp, chat_id, target_name, message, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [logEntry.id, logEntry.timestamp, logEntry.chatId, logEntry.targetName, logEntry.message, logEntry.type, logEntry.status]
      ).catch(() => {});
    }

    telegramLogsStore.unshift(logEntry);
    return { success: result.ok, telegramResponse: result, log: logEntry };
  } catch (error: any) {
    console.error('[Telegram Bot API] Exception saat memanggil Telegram API:', error.message);
    telegramLogsStore.unshift(logEntry);
    return { success: false, error: error.message, log: logEntry };
  }
};

app.post(['/api/telegram/notify', '/api/telegram/notify/'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { message, type, chatId } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Parameter message wajib disertakan' });
  }

  const result = await sendTelegramMessage(message, type || 'pengaduan', chatId);
  res.json({ success: true, data: result });
});

app.post(['/api/telegram/test', '/api/telegram/test/'], async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  const { botToken, chatId } = req.body;
  const tokenToUse = botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatIdToUse = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!tokenToUse || !chatIdToUse) {
    return res.status(400).json({
      success: false,
      message: 'Token Bot Telegram dan Chat ID wajib diisi untuk melakukan uji coba koneksi.'
    });
  }

  try {
    const telegramEndpoint = `https://api.telegram.org/bot${tokenToUse}/sendMessage`;
    const testText =
      `🔔 *UJI COBA NOTIFIKASI BOT TELEGRAM SIM-KTR*\n\n` +
      `✅ *Status:* Terhubung Normal!\n` +
      `🏢 *Sistem:* SIM-KTR Monitoring Kebersihan Toilet & Ruangan\n` +
      `🌐 *Host:* Hostinger Node.js Runtime (${process.version})\n` +
      `⏰ *Waktu Uji:* ${new Date().toLocaleString('id-ID')}\n\n` +
      `_Bot ini siap menerima notifikasi pengaduan pengunjung & peringatan kondisi toilet._`;

    const response = await fetch(telegramEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatIdToUse,
        text: testText,
        parse_mode: 'Markdown'
      })
    });

    const result = (await response.json()) as any;
    if (result.ok) {
      return res.json({
        success: true,
        message: 'Pesan uji coba berhasil terkirim ke Telegram Anda!',
        details: result.result
      });
    } else {
      return res.status(400).json({
        success: false,
        message: `Telegram Error: ${result.description || 'Gagal mengirim pesan'}`,
        errorCode: result.error_code
      });
    }
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: `Koneksi gagal: ${err.message}`
    });
  }
});

// Middleware Global Error Handler: Mencegah Express mengembalikan stack trace HTML
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[API Server Error]:', err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Terjadi kesalahan internal pada server backend Node.js',
      errorCode: err.code || 'INTERNAL_SERVER_ERROR'
    });
  }
});

// Tangkap semua route /api/* yang tidak cocok dan kembalikan JSON (bukan HTML)
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint API tidak ditemukan: ${req.method} ${req.originalUrl}`
  });
});

// ----------------------------------------------------------------------------
// VITE DEV SERVER / PRODUCTION STATIC SERVING
// ----------------------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('[Dev Server] Vite middleware mode aktif.');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
      console.log('[Prod Server] Melayani file statis dari direktori /dist.');
    } else {
      console.warn('[Prod Server] Folder /dist belum ditemukan. Harap jalankan "npm run build".');
    }
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`🚀 SIM-KTR Backend Server berjalan pada http://0.0.0.0:${PORT}`);
    console.log(`📦 Node.js Versi: ${process.version}`);
    console.log(`🗄️ Database Engine: ${isMysqlConnected ? 'MySQL Hostinger' : 'In-Memory Simulation'}`);
    console.log(`=======================================================`);
  });
}

startServer();
