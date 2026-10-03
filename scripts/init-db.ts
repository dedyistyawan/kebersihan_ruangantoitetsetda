import 'dotenv/config';
import mysql from 'mysql2/promise';

async function initDbCli() {
  console.log('\n======================================================');
  console.log('🚀 SIM-KTR: Inisialisasi Otomatis Database MySQL Hostinger');
  console.log('======================================================\n');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME;

  if (!user || !database) {
    console.error('❌ GAGAL: DB_USER atau DB_NAME belum disetel di file .env');
    console.log('Pastikan file .env memiliki konfigurasi:');
    console.log('  DB_HOST=localhost');
    console.log('  DB_PORT=3306');
    console.log('  DB_USER=u123456789_simktr');
    console.log('  DB_PASSWORD=password_anda');
    console.log('  DB_NAME=u123456789_simktr_db\n');
    process.exit(1);
  }

  console.log(`📡 Menghubungkan ke MySQL di ${host}:${port} (Database: ${database})...`);

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      multipleStatements: true
    });

    console.log('✅ Berhasil terhubung ke server MySQL!\n');
    console.log('📦 Membuat 9 tabel sistem jika belum ada:');

    const tables = [
      {
        name: 'pengampu',
        sql: `CREATE TABLE IF NOT EXISTS \`pengampu\` (
          \`id_pengampu\` VARCHAR(20) NOT NULL PRIMARY KEY,
          \`nama_petugas\` VARCHAR(100) NOT NULL,
          \`username\` VARCHAR(50) NOT NULL UNIQUE,
          \`password\` VARCHAR(255) NOT NULL,
          \`role\` ENUM('Petugas', 'Supervisor') NOT NULL DEFAULT 'Petugas',
          \`kontak_telegram\` VARCHAR(100) DEFAULT NULL,
          \`telepon\` VARCHAR(30) DEFAULT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: 'lokasi',
        sql: `CREATE TABLE IF NOT EXISTS \`lokasi\` (
          \`id_lokasi\` VARCHAR(20) NOT NULL PRIMARY KEY,
          \`nama_ruangan\` VARCHAR(150) NOT NULL,
          \`kategori\` ENUM('Toilet', 'Ruangan') NOT NULL DEFAULT 'Toilet',
          \`id_pengampu\` VARCHAR(20) NOT NULL,
          \`status_terkini\` ENUM('Hijau', 'Kuning', 'Merah') NOT NULL DEFAULT 'Hijau',
          \`gedung\` VARCHAR(100) DEFAULT 'Gedung Utama',
          \`lantai\` VARCHAR(50) DEFAULT 'Lantai 1',
          \`last_update\` VARCHAR(50) DEFAULT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`fk_lokasi_pengampu\` FOREIGN KEY (\`id_pengampu\`) REFERENCES \`pengampu\` (\`id_pengampu\`) ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: 'checklist_master',
        sql: `CREATE TABLE IF NOT EXISTS \`checklist_master\` (
          \`id\` VARCHAR(20) NOT NULL PRIMARY KEY,
          \`nama\` VARCHAR(200) NOT NULL,
          \`kategori\` ENUM('Semua', 'Toilet', 'Ruangan') NOT NULL DEFAULT 'Semua',
          \`deskripsi\` TEXT DEFAULT NULL,
          \`bobot\` INT NOT NULL DEFAULT 1,
          \`aktif\` TINYINT(1) NOT NULL DEFAULT 1,
          \`urutan\` INT NOT NULL DEFAULT 0,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: 'log_inspeksi',
        sql: `CREATE TABLE IF NOT EXISTS \`log_inspeksi\` (
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
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT \`fk_inspeksi_lokasi\` FOREIGN KEY (\`id_lokasi\`) REFERENCES \`lokasi\` (\`id_lokasi\`) ON UPDATE CASCADE,
          CONSTRAINT \`fk_inspeksi_pengampu\` FOREIGN KEY (\`id_pengampu\`) REFERENCES \`pengampu\` (\`id_pengampu\`) ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: 'log_pengaduan',
        sql: `CREATE TABLE IF NOT EXISTS \`log_pengaduan\` (
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
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`fk_pengaduan_lokasi\` FOREIGN KEY (\`id_lokasi\`) REFERENCES \`lokasi\` (\`id_lokasi\`) ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: 'saran_pelayanan',
        sql: `CREATE TABLE IF NOT EXISTS \`saran_pelayanan\` (
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
          \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT \`fk_saran_lokasi\` FOREIGN KEY (\`id_lokasi\`) REFERENCES \`lokasi\` (\`id_lokasi\`) ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: 'rating_review',
        sql: `CREATE TABLE IF NOT EXISTS \`rating_review\` (
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
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT \`fk_rating_lokasi\` FOREIGN KEY (\`id_lokasi\`) REFERENCES \`lokasi\` (\`id_lokasi\`) ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: 'telegram_logs',
        sql: `CREATE TABLE IF NOT EXISTS \`telegram_logs\` (
          \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
          \`timestamp\` VARCHAR(50) NOT NULL,
          \`chat_id\` VARCHAR(100) NOT NULL,
          \`target_name\` VARCHAR(100) NOT NULL,
          \`message\` TEXT NOT NULL,
          \`type\` VARCHAR(30) NOT NULL,
          \`status\` VARCHAR(20) NOT NULL DEFAULT 'sent',
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      },
      {
        name: 'greeting_messages',
        sql: `CREATE TABLE IF NOT EXISTS \`greeting_messages\` (
          \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
          \`nama\` VARCHAR(100) NOT NULL,
          \`instansi\` VARCHAR(100) DEFAULT NULL,
          \`pesan\` TEXT NOT NULL,
          \`waktu\` VARCHAR(50) NOT NULL,
          \`emoji\` VARCHAR(20) DEFAULT '🌸',
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
      }
    ];

    for (const t of tables) {
      await connection.query(t.sql);
      console.log(`  ✓ Tabel \`${t.name}\` siap.`);
    }

    // Periksa apakah data awal perlu di-seed
    const [rows]: any = await connection.query('SELECT COUNT(*) as count FROM pengampu');
    if (rows[0]?.count === 0) {
      console.log('\n🌱 Mengisi data awal (seeding 5 petugas & 15 ruangan)...');

      // Seed 5 petugas default
      const petugas = [
        ['PGP-001', 'Budi Santoso', 'budi', '123', 'Petugas', '@budi_cleaner (ID: 102938475)', '081234567890'],
        ['PGP-002', 'Siti Rahmawati', 'siti', '123', 'Petugas', '@siti_rahma (ID: 987654321)', '081398765432'],
        ['PGP-003', 'Joko Widodo Putra', 'joko', '123', 'Petugas', '@joko_ops (ID: 554433221)', '082155443322'],
        ['PGP-004', 'Dewi Lestari', 'dewi', '123', 'Petugas', '@dewi_facility (ID: 887766554)', '085788776655'],
        ['SPV-001', 'Agus Hendrawan, S.T. (Supervisor)', 'admin', 'admin123', 'Supervisor', '@agus_supervisor (ID: 123456789)', '081122334455']
      ];
      for (const p of petugas) {
        await connection.query(
          'INSERT INTO pengampu (id_pengampu, nama_petugas, username, password, role, kontak_telegram, telepon) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama_petugas=VALUES(nama_petugas)',
          p
        );
      }

      // Seed 15 lokasi default
      const lokasi = [
        ['LOK-001', 'Toilet Pria Lantai 1 (Lobby)', 'Toilet', 'PGP-001', 'Hijau', 'Gedung Rektorat', 'Lantai 1'],
        ['LOK-002', 'Toilet Wanita Lantai 1 (Lobby)', 'Toilet', 'PGP-002', 'Merah', 'Gedung Rektorat', 'Lantai 1'],
        ['LOK-003', 'Toilet Pria Lantai 2 (Sayap Barat)', 'Toilet', 'PGP-001', 'Kuning', 'Gedung Rektorat', 'Lantai 2'],
        ['LOK-004', 'Toilet Wanita Lantai 2 (Sayap Timur)', 'Toilet', 'PGP-002', 'Hijau', 'Gedung Rektorat', 'Lantai 2'],
        ['LOK-005', 'Toilet Difabel & Tamu VIP', 'Toilet', 'PGP-001', 'Hijau', 'Gedung Rektorat', 'Lantai 1'],
        ['LOK-006', 'Ruang Rapat Utama Singosari', 'Ruangan', 'PGP-003', 'Hijau', 'Gedung Rektorat', 'Lantai 2'],
        ['LOK-007', 'Aula Serbaguna Graha Wiyata', 'Ruangan', 'PGP-003', 'Kuning', 'Gedung Serbaguna', 'Lantai 1'],
        ['LOK-008', 'Toilet Umum Gedung Serbaguna Pria', 'Toilet', 'PGP-003', 'Merah', 'Gedung Serbaguna', 'Lantai 1'],
        ['LOK-009', 'Toilet Umum Gedung Serbaguna Wanita', 'Toilet', 'PGP-004', 'Hijau', 'Gedung Serbaguna', 'Lantai 1'],
        ['LOK-010', 'Ruang Dosen & Senat Akademik', 'Ruangan', 'PGP-004', 'Hijau', 'Gedung F', 'Lantai 3'],
        ['LOK-011', 'Toilet Laboratorium Komputer Terpadu', 'Toilet', 'PGP-004', 'Hijau', 'Gedung Lab', 'Lantai 2'],
        ['LOK-012', 'Perpustakaan Pusat - Ruang Baca', 'Ruangan', 'PGP-003', 'Hijau', 'Perpustakaan', 'Lantai 1'],
        ['LOK-013', 'Toilet Perpustakaan Lantai 1', 'Toilet', 'PGP-003', 'Kuning', 'Perpustakaan', 'Lantai 1'],
        ['LOK-014', 'Kantin Pusat & Food Court', 'Ruangan', 'PGP-001', 'Hijau', 'Student Center', 'Lantai 1'],
        ['LOK-015', 'Toilet Mahasiswa Student Center', 'Toilet', 'PGP-001', 'Merah', 'Student Center', 'Lantai 1']
      ];
      for (const l of lokasi) {
        await connection.query(
          'INSERT INTO lokasi (id_lokasi, nama_ruangan, kategori, id_pengampu, status_terkini, gedung, lantai, last_update) VALUES (?, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE nama_ruangan=VALUES(nama_ruangan)',
          l
        );
      }

      console.log('✅ Seeding data awal berhasil!');
    }

    await connection.end();
    console.log('\n🎉 Selesai! Seluruh tabel database MySQL siap digunakan.\n');
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ Terjadi kesalahan saat migrasi database:', err.message);
    process.exit(1);
  }
}

initDbCli();
