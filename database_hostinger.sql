-- ============================================================================
-- SKRIP DATABASE MYSQL HOSTINGER: SIM-KTR (Sistem Informasi Monitoring Kebersihan)
-- Kompatibel dengan: MySQL 8.0+, MariaDB 10.4+, phpMyAdmin Hostinger
-- Kompatibel Runtime Node.js: 18.x, 20.x, 22.x, dan 24.x
-- Karakter: utf8mb4_unicode_ci
--
-- PANDUAN IMPORT DI HOSTINGER PHPMYADMIN:
-- 1. Buka hPanel Hostinger -> Databases -> phpMyAdmin
-- 2. Klik nama database Anda di panel kiri (misal: u123456789_db)
-- 3. Klik tab "Import" di menu atas
-- 4. Pilih file ini dan klik "Go / Kirim"
-- (Catatan: Skrip ini TIDAK menggunakan perintah CREATE DATABASE/USE agar
--  bebas dari error hak akses #1044 di Hostinger!)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TABEL PENGAMPU (Petugas Kebersihan & Supervisor)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pengampu` (
  `id_pengampu` VARCHAR(20) NOT NULL PRIMARY KEY,
  `nama_petugas` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('Petugas', 'Supervisor') NOT NULL DEFAULT 'Petugas',
  `kontak_telegram` VARCHAR(100) DEFAULT NULL,
  `telepon` VARCHAR(30) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. TABEL LOKASI (Toilet & Ruangan Terdaftar)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `lokasi` (
  `id_lokasi` VARCHAR(20) NOT NULL PRIMARY KEY,
  `nama_ruangan` VARCHAR(150) NOT NULL,
  `kategori` ENUM('Toilet', 'Ruangan') NOT NULL DEFAULT 'Toilet',
  `id_pengampu` VARCHAR(20) NOT NULL,
  `status_terkini` ENUM('Hijau', 'Kuning', 'Merah') NOT NULL DEFAULT 'Hijau',
  `gedung` VARCHAR(100) DEFAULT 'Gedung Utama',
  `lantai` VARCHAR(50) DEFAULT 'Lantai 1',
  `last_update` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_lokasi_pengampu` FOREIGN KEY (`id_pengampu`) REFERENCES `pengampu` (`id_pengampu`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. TABEL MASTER CEKLIS INSPEKSI (Dapat ditambah/dikurangi oleh Supervisor)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `checklist_master` (
  `id` VARCHAR(20) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(200) NOT NULL,
  `kategori` ENUM('Semua', 'Toilet', 'Ruangan') NOT NULL DEFAULT 'Semua',
  `deskripsi` TEXT DEFAULT NULL,
  `bobot` INT NOT NULL DEFAULT 1,
  `aktif` TINYINT(1) NOT NULL DEFAULT 1,
  `urutan` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. TABEL LOG INSPEKSI KEBERSIHAN OLEH PETUGAS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `log_inspeksi` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `timestamp` VARCHAR(50) NOT NULL,
  `id_lokasi` VARCHAR(20) NOT NULL,
  `id_pengampu` VARCHAR(20) NOT NULL,
  `skor_kebersihan` INT NOT NULL DEFAULT 100,
  `status_warna` ENUM('Hijau', 'Kuning', 'Merah') NOT NULL DEFAULT 'Hijau',
  `catatan_kritis` TEXT DEFAULT NULL,
  `detail_ceklis_json` LONGTEXT DEFAULT NULL,
  `total_item_diperiksa` INT DEFAULT 8,
  `total_item_lolos` INT DEFAULT 8,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_inspeksi_lokasi` FOREIGN KEY (`id_lokasi`) REFERENCES `lokasi` (`id_lokasi`) ON UPDATE CASCADE,
  CONSTRAINT `fk_inspeksi_pengampu` FOREIGN KEY (`id_pengampu`) REFERENCES `pengampu` (`id_pengampu`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. TABEL FORM 1: LOG PENGADUAN / LAPORAN PENGUNJUNG
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `log_pengaduan` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `timestamp` VARCHAR(50) NOT NULL,
  `id_lokasi` VARCHAR(20) NOT NULL,
  `nama_pelapor` VARCHAR(100) NOT NULL,
  `kontak_pelapor` VARCHAR(50) DEFAULT NULL,
  `detail_keluhan` TEXT NOT NULL,
  `status_tindak_lanjut` ENUM('Pending', 'Proses', 'Selesai') NOT NULL DEFAULT 'Pending',
  `kategori_keluhan` VARCHAR(100) DEFAULT NULL,
  `foto_bukti` LONGTEXT DEFAULT NULL,
  `waktu_selesai` VARCHAR(50) DEFAULT NULL,
  `catatan_penyelesaian` TEXT DEFAULT NULL,
  `petugas_penangan` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_pengaduan_lokasi` FOREIGN KEY (`id_lokasi`) REFERENCES `lokasi` (`id_lokasi`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. TABEL FORM 2: SARAN & MASUKAN PENINGKATAN PELAYANAN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `saran_pelayanan` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `timestamp` VARCHAR(50) NOT NULL,
  `id_lokasi` VARCHAR(20) NOT NULL,
  `nama_pemberi_saran` VARCHAR(100) NOT NULL,
  `kontak` VARCHAR(100) DEFAULT NULL,
  `kategori_saran` VARCHAR(100) NOT NULL,
  `judul_saran` VARCHAR(200) NOT NULL,
  `detail_saran` TEXT NOT NULL,
  `prioritas` ENUM('Biasa', 'Penting', 'Mendesak') NOT NULL DEFAULT 'Biasa',
  `status_tinjauan` ENUM('Diterima', 'Diproses', 'Diimplementasikan') NOT NULL DEFAULT 'Diterima',
  `tanggapan_supervisor` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_saran_lokasi` FOREIGN KEY (`id_lokasi`) REFERENCES `lokasi` (`id_lokasi`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. TABEL FORM 3: RATING PELAYANAN & REVIEW PENGUNJUNG (BINTANG 1-5)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rating_review` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `timestamp` VARCHAR(50) NOT NULL,
  `id_lokasi` VARCHAR(20) NOT NULL,
  `nama_reviewer` VARCHAR(100) NOT NULL,
  `bintang` TINYINT NOT NULL DEFAULT 5,
  `rating_kebersihan_lantai` TINYINT DEFAULT 5,
  `rating_ketersediaan_air_sabun` TINYINT DEFAULT 5,
  `rating_aroma_keharuman` TINYINT DEFAULT 5,
  `rating_kesigapan_petugas` TINYINT DEFAULT 5,
  `komentar_review` TEXT DEFAULT NULL,
  `rekomendasikan` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_rating_lokasi` FOREIGN KEY (`id_lokasi`) REFERENCES `lokasi` (`id_lokasi`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. TABEL LOG NOTIFIKASI TELEGRAM
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `telegram_logs` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `timestamp` VARCHAR(50) NOT NULL,
  `chat_id` VARCHAR(100) NOT NULL,
  `target_name` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(30) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'sent',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. TABEL KARTU UCAPAN / APRESIASI FOOTER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `greeting_messages` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `nama` VARCHAR(100) NOT NULL,
  `instansi` VARCHAR(100) DEFAULT NULL,
  `pesan` TEXT NOT NULL,
  `waktu` VARCHAR(50) NOT NULL,
  `emoji` VARCHAR(20) DEFAULT '🌸',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- DATA AWAL (SEED DATA)
-- ============================================================================

INSERT INTO `pengampu` (`id_pengampu`, `nama_petugas`, `username`, `password`, `role`, `kontak_telegram`, `telepon`) VALUES
('PGP-001', 'Budi Santoso', 'budi', '123', 'Petugas', '@budi_cleaner (ID: 102938475)', '081234567890'),
('PGP-002', 'Siti Rahmawati', 'siti', '123', 'Petugas', '@siti_rahma (ID: 987654321)', '081398765432'),
('PGP-003', 'Joko Widodo Putra', 'joko', '123', 'Petugas', '@joko_ops (ID: 554433221)', '082155443322'),
('PGP-004', 'Dewi Lestari', 'dewi', '123', 'Petugas', '@dewi_facility (ID: 887766554)', '085788776655'),
('SPV-001', 'Agus Hendrawan, S.T. (Supervisor)', 'admin', 'admin123', 'Supervisor', '@agus_supervisor (ID: 123456789)', '081122334455')
ON DUPLICATE KEY UPDATE `nama_petugas`=VALUES(`nama_petugas`);

INSERT INTO `lokasi` (`id_lokasi`, `nama_ruangan`, `kategori`, `id_pengampu`, `status_terkini`, `gedung`, `lantai`, `last_update`) VALUES
('LOK-001', 'Toilet Pria Lantai 1 (Lobby)', 'Toilet', 'PGP-001', 'Hijau', 'Gedung Rektorat', 'Lantai 1', '2026-09-25 07:30'),
('LOK-002', 'Toilet Wanita Lantai 1 (Lobby)', 'Toilet', 'PGP-002', 'Merah', 'Gedung Rektorat', 'Lantai 1', '2026-09-25 08:15'),
('LOK-003', 'Toilet Pria Lantai 2 (Sayap Barat)', 'Toilet', 'PGP-001', 'Kuning', 'Gedung Rektorat', 'Lantai 2', '2026-09-25 06:45'),
('LOK-004', 'Toilet Wanita Lantai 2 (Sayap Timur)', 'Toilet', 'PGP-002', 'Hijau', 'Gedung Rektorat', 'Lantai 2', '2026-09-25 07:10'),
('LOK-005', 'Toilet Difabel & Tamu VIP', 'Toilet', 'PGP-001', 'Hijau', 'Gedung Rektorat', 'Lantai 1', '2026-09-25 08:00'),
('LOK-006', 'Ruang Rapat Utama Singosari', 'Ruangan', 'PGP-003', 'Hijau', 'Gedung Rektorat', 'Lantai 2', '2026-09-25 07:00'),
('LOK-007', 'Aula Serbaguna Graha Wiyata', 'Ruangan', 'PGP-003', 'Kuning', 'Gedung Serbaguna', 'Lantai 1', '2026-09-24 16:30'),
('LOK-008', 'Toilet Umum Gedung Serbaguna Pria', 'Toilet', 'PGP-003', 'Merah', 'Gedung Serbaguna', 'Lantai 1', '2026-09-25 08:10'),
('LOK-009', 'Toilet Umum Gedung Serbaguna Wanita', 'Toilet', 'PGP-004', 'Hijau', 'Gedung Serbaguna', 'Lantai 1', '2026-09-25 07:45'),
('LOK-010', 'Ruang Dosen & Senat Akademik', 'Ruangan', 'PGP-004', 'Hijau', 'Gedung F', 'Lantai 3', '2026-09-25 06:30'),
('LOK-011', 'Toilet Laboratorium Komputer Terpadu', 'Toilet', 'PGP-004', 'Hijau', 'Gedung Lab', 'Lantai 2', '2026-09-25 07:20'),
('LOK-012', 'Perpustakaan Pusat - Ruang Baca', 'Ruangan', 'PGP-003', 'Hijau', 'Perpustakaan', 'Lantai 1', '2026-09-25 07:05'),
('LOK-013', 'Toilet Perpustakaan Lantai 1', 'Toilet', 'PGP-003', 'Kuning', 'Perpustakaan', 'Lantai 1', '2026-09-25 06:50'),
('LOK-014', 'Kantin Pusat & Food Court', 'Ruangan', 'PGP-001', 'Hijau', 'Student Center', 'Lantai 1', '2026-09-25 07:15'),
('LOK-015', 'Toilet Mahasiswa Student Center', 'Toilet', 'PGP-001', 'Merah', 'Student Center', 'Lantai 1', '2026-09-25 08:20')
ON DUPLICATE KEY UPDATE `nama_ruangan`=VALUES(`nama_ruangan`);

INSERT INTO `checklist_master` (`id`, `nama`, `kategori`, `deskripsi`, `bobot`, `aktif`, `urutan`) VALUES
('CHK-001', 'Ketersediaan Tisu (Toilet / Wastafel)', 'Toilet', 'Tisu gulung dan tisu pengering tangan terisi penuh & higienis', 1, 1, 1),
('CHK-002', 'Pengharum Ruangan Aktif & Wangi Segar', 'Semua', 'Dispenser aroma berfungsi otomatis dan ruangan bebas bau apek', 1, 1, 2),
('CHK-003', 'Lantai Kering, Bersih & Bebas Noda/Licin', 'Semua', 'Lantai dipel disinfektan, tidak ada genangan air atau noda membandel', 1, 1, 3),
('CHK-004', 'Keran & Saluran Pembuangan Air Lancar', 'Toilet', 'Air mengalir kencang, tidak ada kebocoran, dan tidak tersumbat', 1, 1, 4),
('CHK-005', 'Kunci Selot Pintu & Engsel Berfungsi Baik', 'Semua', 'Pintu dapat dikunci dengan rapat dan aman oleh pengguna', 1, 1, 5),
('CHK-006', 'Wastafel, Sabun Cuci Tangan & Cermin Bersih', 'Toilet', 'Sabun cair terisi, wastafel bebas kerak, cermin bening mengkilap', 1, 1, 6),
('CHK-007', 'Kloset / Urinoir Higienis & Bebas Bau', 'Toilet', 'Kloset duduk/jongkok disikat bersih, flush siram berfungsi optimal', 1, 1, 7),
('CHK-008', 'Tempat Sampah Dikosongkan & Berplastik Baru', 'Semua', 'Tidak ada tumpukan sampah meluap, plastik sampah terpasang rapi', 1, 1, 8)
ON DUPLICATE KEY UPDATE `nama`=VALUES(`nama`);

INSERT INTO `log_pengaduan` (`id`, `timestamp`, `id_lokasi`, `nama_pelapor`, `kontak_pelapor`, `detail_keluhan`, `status_tindak_lanjut`, `kategori_keluhan`) VALUES
('LAP-101', '2026-09-25 08:15', 'LOK-002', 'Rina (Pengunjung Seminar)', '081298761234', 'Air keran wastafel tidak mengalir dan lantai depan bilik 2 becek licin.', 'Pending', 'Keran Rusak & Lantai Basah'),
('LAP-102', '2026-09-25 08:10', 'LOK-008', 'Ahmad Fauzi', '085712345678', 'Bau tak sedap menyengat dan sabun cuci tangan habis.', 'Pending', 'Bau & Habis Sabun'),
('LAP-103', '2026-09-25 08:20', 'LOK-015', 'Dimas Kurnia', '082199887766', 'Tempat sampah meluap dan kunci pintu bilik nomor 1 rusak macet.', 'Pending', 'Fasilitas Rusak'),
('LAP-099', '2026-09-24 14:10', 'LOK-001', 'Fajar Nugraha', NULL, 'Tisu gulung habis di bilik tengah.', 'Selesai', 'Perlengkapan Habis')
ON DUPLICATE KEY UPDATE `nama_pelapor`=VALUES(`nama_pelapor`);

INSERT INTO `saran_pelayanan` (`id`, `timestamp`, `id_lokasi`, `nama_pemberi_saran`, `kontak`, `kategori_saran`, `judul_saran`, `detail_saran`, `prioritas`, `status_tinjauan`) VALUES
('SRN-001', '2026-09-25 08:30', 'LOK-001', 'Drs. Hendro Wibowo', 'hendro@kampus.ac.id', 'Fasilitas & Sarana', 'Penambahan Hand Dryer Otomatis', 'Mohon dipertimbangkan pemasangan hand dryer otomatis di dekat wastafel agar lebih higienis dan menghemat penggunaan tisu kertas.', 'Sedang', 'Diproses'),
('SRN-002', '2026-09-25 09:15', 'LOK-005', 'Nadia Putri', 'nadia.putri@email.com', 'Aksesibilitas / Difabel', 'Pegangan Tangan di Toilet Difabel Perlu Sedikit Ditinggikan', 'Pegangan tangan (handrail) sudah sangat membantu, jika memungkinkan dibuat sedikit lebih kokoh dan ditambah tombol darurat bel difabel.', 'Penting', 'Diimplementasikan')
ON DUPLICATE KEY UPDATE `judul_saran`=VALUES(`judul_saran`);

INSERT INTO `rating_review` (`id`, `timestamp`, `id_lokasi`, `nama_reviewer`, `bintang`, `rating_kebersihan_lantai`, `rating_ketersediaan_air_sabun`, `rating_aroma_keharuman`, `rating_kesigapan_petugas`, `komentar_review`, `rekomendasikan`) VALUES
('RAT-001', '2026-09-25 09:00', 'LOK-001', 'drg. Maya Anggraini', 5, 5, 5, 5, 5, 'Sangat bersih, wangi, sabun cuci tangan wangi apel dan lantai selalu kering. Petugas sangat sigap dan ramah!', 1),
('RAT-002', '2026-09-25 08:45', 'LOK-004', 'Annisa Fitriani', 5, 5, 5, 4, 5, 'Kaca cermin sangat bening, ada tisu tebal, pencahayaan terang dan terasa nyaman digunakan.', 1),
('RAT-003', '2026-09-25 08:12', 'LOK-002', 'Surya Pratama', 2, 2, 2, 3, 3, 'Tadi pagi ada sedikit genangan di dekat pintu masuk dan sabun kosong. Mohon dipercepat pembersihannya.', 0)
ON DUPLICATE KEY UPDATE `nama_reviewer`=VALUES(`nama_reviewer`);

INSERT INTO `greeting_messages` (`id`, `nama`, `instansi`, `pesan`, `waktu`, `emoji`) VALUES
('GRT-001', 'Keluarga Besar Cleaning Service', 'Divisi Kebersihan & Sanitasi', 'Terima kasih telah membuang sampah pada tempatnya dan menyiram kembali setelah digunakan. Senyum Anda adalah semangat kami!', 'Hari Ini, 07:00 WIB', '🌸'),
('GRT-002', 'Bapak Rektorat & Pimpinan', 'Manajemen Kampus', 'Kebersihan adalah sebagian dari iman dan cermin peradaban luhur. Mari jaga fasilitas bersama dengan penuh rasa saling menghargai.', 'Kemarin, 16:00 WIB', '🏛️'),
('GRT-003', 'Dewan Mahasiswa & Pengunjung', 'Civitas Akademika', 'Apresiasi setinggi-tingginya untuk seluruh petugas kebersihan yang bekerja tanpa lelah menjaga lingkungan kita tetap asri dan wangi!', 'Kemarin, 11:30 WIB', '✨')
ON DUPLICATE KEY UPDATE `nama`=VALUES(`nama`);

COMMIT;
