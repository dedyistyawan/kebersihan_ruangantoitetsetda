import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Lokasi,
  Pengampu,
  LogInspeksi,
  LogPengaduan,
  TelegramNotification,
  StatusWarna,
  ChecklistItem,
  SaranPelayanan,
  RatingReview,
  GreetingMessage,
  TelegramConfig,
  SupervisorSubTab
} from '../types';
import {
  INITIAL_LOKASI,
  INITIAL_PENGAMPU,
  INITIAL_INSPEKSI,
  INITIAL_PENGADUAN,
  INITIAL_CHECKLIST,
  INITIAL_SARAN,
  INITIAL_RATINGS,
  INITIAL_GREETINGS
} from '../data/initialData';

export type AppViewTab =
  | 'dasbor-publik'
  | 'sim-qr'
  | 'petugas'
  | 'supervisor'
  | 'database'
  | 'hostinger-deploy'
  | 'login';

interface AppContextType {
  // Data States
  lokasiList: Lokasi[];
  pengampuList: Pengampu[];
  inspeksiList: LogInspeksi[];
  pengaduanList: LogPengaduan[];
  checklistItems: ChecklistItem[];
  saranList: SaranPelayanan[];
  ratingList: RatingReview[];
  greetingMessages: GreetingMessage[];
  telegramLogs: TelegramNotification[];
  telegramConfig: TelegramConfig;

  // Session & UI States
  currentUser: Pengampu | null;
  activeTab: AppViewTab;
  selectedRoomForQr: string;
  serverStatus: {
    connected: boolean;
    engine: string;
    nodeVersion: string;
    dbHost?: string;
    dbName?: string;
  };
  databaseDetails: {
    connected: boolean;
    engine: string;
    host?: string;
    database?: string;
    allTablesReady: boolean;
    tables: { table: string; rows: number }[];
    message?: string;
  };
  initHostingerDatabase: () => Promise<{ success: boolean; message: string; tables?: any[] }>;
  connectAndInitHostingerDatabase: (creds: {
    host: string;
    port?: string;
    user: string;
    password?: string;
    database: string;
  }) => Promise<{ success: boolean; message: string; tables?: any[] }>;
  syncFromDatabase: () => Promise<{ success: boolean; message?: string; source?: string; counts?: any }>;
  syncToDatabase: () => Promise<{ success: boolean; message: string }>;
  refreshDatabaseStatus: () => Promise<void>;
  generateLiveSqlScript: () => string;

  // UI Actions
  setActiveTab: (tab: AppViewTab) => void;
  supervisorSubTab: SupervisorSubTab;
  setSupervisorSubTab: (sub: SupervisorSubTab) => void;
  setSelectedRoomForQr: (id: string) => void;
  setCurrentUser: (user: Pengampu | null) => void;
  loginUser: (username: string, pass: string) => { success: boolean; message?: string };
  logoutUser: () => void;

  // Form Pengunjung 3 Menu
  submitPengaduan: (
    idLokasi: string,
    namaPelapor: string,
    detailKeluhan: string,
    kontakPelapor?: string,
    kategoriKeluhan?: string,
    fotoBukti?: string
  ) => Promise<{ success: boolean; id: string }>;

  submitSaran: (
    idLokasi: string,
    namaPemberiSaran: string,
    kategoriSaran: SaranPelayanan['Kategori_Saran'],
    judulSaran: string,
    detailSaran: string,
    prioritas: SaranPelayanan['Prioritas'],
    kontak?: string
  ) => Promise<{ success: boolean; id: string }>;

  submitRating: (
    idLokasi: string,
    namaReviewer: string,
    bintang: number,
    subRatings: {
      lantai: number;
      air: number;
      aroma: number;
      petugas: number;
    },
    komentarReview: string,
    rekomendasikan: boolean
  ) => Promise<{ success: boolean; id: string }>;

  // Supervisor Ceklis Inspeksi (Tambah, Kurang, Edit, Aktifkan)
  addChecklistItem: (item: {
    nama: string;
    kategori: 'Semua' | 'Toilet' | 'Ruangan';
    deskripsi: string;
    bobot: number;
  }) => Promise<{ success: boolean; item: ChecklistItem }>;
  updateChecklistItem: (id: string, updated: Partial<ChecklistItem>) => Promise<boolean>;
  deleteChecklistItem: (id: string) => Promise<boolean>;
  toggleChecklistItem: (id: string) => Promise<boolean>;

  // Tindak Lanjut & Inspeksi
  submitInspeksi: (
    idLokasi: string,
    idPengampu: string,
    checklistResults: Record<string, boolean>,
    catatanKritis: string
  ) => { skor: number; status: StatusWarna };
  resolvePengaduan: (
    idPengaduan: string,
    idLokasi: string,
    catatanPenyelesaian?: string,
    petugasPenangan?: string
  ) => void;

  // CRUD Lokasi & Pengampu
  saveLokasi: (lokasi: Lokasi, isEdit: boolean) => void;
  deleteLokasi: (idLokasi: string) => void;
  savePengampu: (pengampu: Pengampu, isEdit: boolean) => void;
  deletePengampu: (idPengampu: string) => void;

  // Telegram Bot Operations
  testTelegramBot: (
    botToken: string,
    chatId: string
  ) => Promise<{ success: boolean; message: string }>;
  updateTelegramConfig: (newConfig: Partial<TelegramConfig>) => void;
  dismissTelegramNotification: (id: string) => void;
  clearAllTelegramLogs: () => void;

  // Footer Greeting Card Operations
  submitGreeting: (nama: string, pesan: string, instansi?: string, emoji?: string) => void;

  // Analytics & Rekapitulasi Helper
  getRekapStats: () => {
    totalPengaduan: number;
    pendingCount: number;
    selesaiCount: number;
    penyelesaianPersen: number;
    rataRataDurasi: string;
    topKategori: Array<{ kategori: string; count: number; persen: number }>;
    topRuangan: Array<{ idLokasi: string; namaRuangan: string; count: number }>;
    avgRating: number;
    totalReview: number;
    totalSaran: number;
    ratingBreakdown: Record<number, number>;
  };

  resetDatabaseToDefault: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistence States
  const [lokasiList, setLokasiList] = useState<Lokasi[]>(() => {
    const saved = localStorage.getItem('simktr_lokasi_v2');
    return saved ? JSON.parse(saved) : INITIAL_LOKASI;
  });

  const [pengampuList, setPengampuList] = useState<Pengampu[]>(() => {
    const saved = localStorage.getItem('simktr_pengampu_v2');
    return saved ? JSON.parse(saved) : INITIAL_PENGAMPU;
  });

  const [inspeksiList, setInspeksiList] = useState<LogInspeksi[]>(() => {
    const saved = localStorage.getItem('simktr_inspeksi_v2');
    return saved ? JSON.parse(saved) : INITIAL_INSPEKSI;
  });

  const [pengaduanList, setPengaduanList] = useState<LogPengaduan[]>(() => {
    const saved = localStorage.getItem('simktr_pengaduan_v2');
    return saved ? JSON.parse(saved) : INITIAL_PENGADUAN;
  });

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem('simktr_checklist_v2');
    return saved ? JSON.parse(saved) : INITIAL_CHECKLIST;
  });

  const [saranList, setSaranList] = useState<SaranPelayanan[]>(() => {
    const saved = localStorage.getItem('simktr_saran_v2');
    return saved ? JSON.parse(saved) : INITIAL_SARAN;
  });

  const [ratingList, setRatingList] = useState<RatingReview[]>(() => {
    const saved = localStorage.getItem('simktr_rating_v2');
    return saved ? JSON.parse(saved) : INITIAL_RATINGS;
  });

  const [greetingMessages, setGreetingMessages] = useState<GreetingMessage[]>(() => {
    const saved = localStorage.getItem('simktr_greetings_v2');
    return saved ? JSON.parse(saved) : INITIAL_GREETINGS;
  });

  const [telegramLogs, setTelegramLogs] = useState<TelegramNotification[]>(() => {
    const saved = localStorage.getItem('simktr_telegram_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>(() => {
    const saved = localStorage.getItem('simktr_tg_config');
    return saved
      ? JSON.parse(saved)
      : {
          botToken: '',
          chatId: '-1001234567890',
          isEnabled: true,
          notifyOnComplaint: true,
          notifyOnRedStatus: true,
          notifyOnLowRating: true
        };
  });

  const [serverStatus, setServerStatus] = useState({
    connected: false,
    engine: 'In-Memory / Local Storage',
    nodeVersion: 'Node.js 22.x',
    dbHost: 'localhost',
    dbName: 'simktr_db'
  });

  const [databaseDetails, setDatabaseDetails] = useState<{
    connected: boolean;
    engine: string;
    host?: string;
    database?: string;
    allTablesReady: boolean;
    tables: { table: string; rows: number }[];
    message?: string;
  }>({
    connected: false,
    engine: 'In-Memory Simulation',
    allTablesReady: false,
    tables: []
  });

  /**
   * Helper pemanggilan API dengan proteksi anti-crash JSON.parse.
   * Mencegah error "JSON.parse: unexpected character at line 1 column 1"
   * ketika web server (Hostinger/Passenger/LiteSpeed/Proxy) mengembalikan respons HTML.
   */
  const safeFetchJson = async <T = any>(
    url: string,
    options?: RequestInit
  ): Promise<{ success: boolean; data?: T; message?: string; status?: number; raw?: string }> => {
    try {
      const res = await fetch(url, options);
      const rawText = await res.text();

      if (!rawText || !rawText.trim()) {
        return {
          success: res.ok,
          status: res.status,
          message: res.ok ? 'Sukses' : `Server mengembalikan status ${res.status} tanpa konten.`
        };
      }

      const trimmed = rawText.trim();

      // Deteksi jika server mengembalikan halaman HTML (misal error 404, 500, 502, 503 dari Hostinger / Passenger / Reverse Proxy)
      if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype')) {
        let friendlyError = `Server mengembalikan halaman HTML (Status ${res.status} ${res.statusText || ''}). `;
        if (res.status === 404) {
          friendlyError += 'Endpoint API tidak ditemukan (404). Pastikan backend server Node.js aktif di Hostinger.';
        } else if (res.status === 502 || res.status === 503) {
          friendlyError += 'Layanan Node.js sedang tidak aktif atau gagal dimuat oleh web server (502/503). Periksa Setup Node.js App di Hostinger hPanel.';
        } else if (res.status === 500) {
          friendlyError += 'Terjadi kendala internal pada server Node.js (500).';
        } else {
          friendlyError += 'Kemungkinan rute backend belum tersambung ke proses Node.js.';
        }

        return {
          success: false,
          status: res.status,
          message: friendlyError,
          raw: trimmed.slice(0, 300)
        };
      }

      // Coba parsing JSON yang valid
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          const isSuccess = parsed.success !== undefined ? Boolean(parsed.success) : res.ok;
          return {
            success: isSuccess,
            status: res.status,
            message: parsed.message || (isSuccess ? 'Operasi berhasil' : `Permintaan gagal (status ${res.status})`),
            data: parsed
          };
        }
      } catch {
        return {
          success: false,
          status: res.status,
          message: `Format respon server tidak valid (${trimmed.slice(0, 80)}...)`,
          raw: trimmed
        };
      }

      return {
        success: res.ok,
        status: res.status,
        message: trimmed.slice(0, 150)
      };
    } catch (netErr: any) {
      return {
        success: false,
        message: netErr?.message || 'Gagal menghubungi server (Koneksi jaringan terputus atau backend tidak dapat diakses).'
      };
    }
  };

  const refreshDatabaseStatus = async () => {
    try {
      const res = await safeFetchJson<any>('/api/database/status');
      if (res.success && res.data) {
        const data = res.data;
        setDatabaseDetails({
          connected: Boolean(data.connected),
          engine: data.engine || 'In-Memory Simulation',
          host: data.host,
          database: data.database,
          allTablesReady: Boolean(data.allTablesReady),
          tables: data.tables || [],
          message: data.message
        });
        setServerStatus(prev => ({
          ...prev,
          connected: Boolean(data.connected),
          engine: data.engine || prev.engine,
          dbHost: data.host || prev.dbHost,
          dbName: data.database || prev.dbName
        }));
      }
    } catch {
      // offline / client-only fallback
    }
  };

  const loadDataFromBackend = async () => {
    try {
      const res = await safeFetchJson<any>('/api/database/pull-all');
      if (res.success && res.data && res.data.data) {
        const result = res.data;
        const { lokasi, pengampu, checklist, inspeksi, pengaduan, saran, rating, greetings } = result.data;
        if (Array.isArray(lokasi) && lokasi.length > 0) setLokasiList(lokasi);
        if (Array.isArray(pengampu) && pengampu.length > 0) setPengampuList(pengampu);
        if (Array.isArray(checklist) && checklist.length > 0) setChecklistItems(checklist);
        if (Array.isArray(inspeksi)) setInspeksiList(inspeksi);
        if (Array.isArray(pengaduan)) setPengaduanList(pengaduan);
        if (Array.isArray(saran)) setSaranList(saran);
        if (Array.isArray(rating)) setRatingList(rating);
        if (Array.isArray(greetings)) setGreetingMessages(greetings);

        return {
          success: true,
          source: result.source || (result.connected ? 'MySQL Hostinger' : 'Memori'),
          counts: result.counts,
          message: `Berhasil memuat data dari ${result.source || 'Database'}!`
        };
      } else if (!res.success) {
        return { success: false, message: res.message || 'Gagal memuat data dari server' };
      }
    } catch (err: any) {
      console.warn('Gagal memuat data dari API pull-all:', err);
    }
    return { success: false, message: 'Gagal memuat data dari server' };
  };

  const syncFromDatabase = async () => {
    await refreshDatabaseStatus();
    return await loadDataFromBackend();
  };

  const syncToDatabase = async () => {
    try {
      const res = await safeFetchJson<any>('/api/database/push-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lokasi: lokasiList,
          pengampu: pengampuList,
          checklist: checklistItems,
          inspeksi: inspeksiList,
          pengaduan: pengaduanList,
          saran: saranList,
          rating: ratingList,
          greetings: greetingMessages
        })
      });
      await refreshDatabaseStatus();
      if (res.success) {
        return {
          success: true,
          message: res.message || 'Data aplikasi berhasil disinkronkan ke database server!'
        };
      } else {
        return {
          success: false,
          message: res.message || 'Gagal mengirim data ke server. Anda dapat menggunakan fitur "Salin SQL Data Input Terkini" untuk langsung menyinkronkannya ke phpMyAdmin Hostinger.'
        };
      }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal mengirim data ke server' };
    }
  };

  /**
   * Helper pembuat skrip SQL live yang 100% merefleksikan seluruh data input terkini
   * dari aplikasi (Aduan Pengunjung, Saran, Rating, Ceklis Inspeksi, Ruangan, & Petugas).
   * Siap disalin atau diimpor langsung ke tab "SQL" di phpMyAdmin Hostinger!
   */
  const generateLiveSqlScript = (): string => {
    const now = getNowTimestamp();
    const esc = (val: any) => {
      if (val === null || val === undefined) return '';
      return String(val)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\r/g, '')
        .replace(/\n/g, '\\n');
    };

    let sql = `-- ============================================================================\n`;
    sql += `-- SKRIP SINKRONISASI DATA INPUT TERKINI SIM-KTR KE MYSQL HOSTINGER\n`;
    sql += `-- Waktu Ekspor: ${now}\n`;
    sql += `-- Total: ${pengaduanList.length} Aduan, ${saranList.length} Saran, ${ratingList.length} Rating, ${inspeksiList.length} Log Inspeksi, ${lokasiList.length} Ruangan\n`;
    sql += `-- Format: MySQL 8.0+, MariaDB 10.4+, phpMyAdmin Hostinger (Aman tanpa error #1044)\n`;
    sql += `-- ============================================================================\n\n`;

    // 1. Lokasi
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `-- 1. TABEL & DATA MASTER LOKASI (TOILET & RUANGAN)\n`;
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`lokasi\` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    for (const l of lokasiList) {
      sql += `INSERT INTO \`lokasi\` (\`id_lokasi\`, \`nama_ruangan\`, \`kategori\`, \`id_pengampu\`, \`status_terkini\`, \`gedung\`, \`lantai\`, \`last_update\`) ` +
        `VALUES ('${esc(l.ID_Lokasi)}', '${esc(l.Nama_Ruangan)}', '${esc(l.Kategori)}', '${esc(l.ID_Pengampu)}', '${esc(l.Status_Terkini)}', '${esc(l.Gedung || 'Gedung Utama')}', '${esc(l.Lantai || 'Lantai 1')}', '${esc(l.Last_Update || now)}') ` +
        `ON DUPLICATE KEY UPDATE \`nama_ruangan\`=VALUES(\`nama_ruangan\`), \`kategori\`=VALUES(\`kategori\`), \`id_pengampu\`=VALUES(\`id_pengampu\`), \`status_terkini\`=VALUES(\`status_terkini\`), \`gedung\`=VALUES(\`gedung\`), \`lantai\`=VALUES(\`lantai\`), \`last_update\`=VALUES(\`last_update\`);\n`;
    }
    sql += `\n`;

    // 2. Pengampu
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `-- 2. TABEL & DATA PETUGAS & SUPERVISOR\n`;
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`pengampu\` (
  \`id_pengampu\` VARCHAR(20) NOT NULL PRIMARY KEY,
  \`nama_petugas\` VARCHAR(100) NOT NULL,
  \`username\` VARCHAR(50) NOT NULL UNIQUE,
  \`password\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('Petugas', 'Supervisor') NOT NULL DEFAULT 'Petugas',
  \`kontak_telegram\` VARCHAR(100) DEFAULT NULL,
  \`telepon\` VARCHAR(30) DEFAULT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    for (const p of pengampuList) {
      sql += `INSERT INTO \`pengampu\` (\`id_pengampu\`, \`nama_petugas\`, \`username\`, \`password\`, \`role\`, \`kontak_telegram\`, \`telepon\`) ` +
        `VALUES ('${esc(p.ID_Pengampu)}', '${esc(p.Nama_Petugas)}', '${esc(p.Username)}', '${esc(p.Password)}', '${esc(p.Role)}', '${esc(p.Kontak_Telegram || '')}', '${esc(p.Telepon || '')}') ` +
        `ON DUPLICATE KEY UPDATE \`nama_petugas\`=VALUES(\`nama_petugas\`), \`username\`=VALUES(\`username\`), \`password\`=VALUES(\`password\`), \`role\`=VALUES(\`role\`), \`kontak_telegram\`=VALUES(\`kontak_telegram\`), \`telepon\`=VALUES(\`telepon\`);\n`;
    }
    sql += `\n`;

    // 3. Checklist Master
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `-- 3. TABEL & DATA MASTER INDIKATOR CEKLIS\n`;
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`checklist_master\` (
  \`id\` VARCHAR(20) NOT NULL PRIMARY KEY,
  \`nama\` VARCHAR(200) NOT NULL,
  \`kategori\` ENUM('Semua', 'Toilet', 'Ruangan') NOT NULL DEFAULT 'Semua',
  \`deskripsi\` TEXT DEFAULT NULL,
  \`bobot\` INT NOT NULL DEFAULT 1,
  \`aktif\` TINYINT(1) NOT NULL DEFAULT 1,
  \`urutan\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    for (const c of checklistItems) {
      sql += `INSERT INTO \`checklist_master\` (\`id\`, \`nama\`, \`kategori\`, \`deskripsi\`, \`bobot\`, \`aktif\`, \`urutan\`) ` +
        `VALUES ('${esc(c.id)}', '${esc(c.nama)}', '${esc(c.kategori)}', '${esc(c.deskripsi || '')}', ${Number(c.bobot) || 1}, ${c.aktif ? 1 : 0}, ${Number(c.urutan) || 0}) ` +
        `ON DUPLICATE KEY UPDATE \`nama\`=VALUES(\`nama\`), \`kategori\`=VALUES(\`kategori\`), \`deskripsi\`=VALUES(\`deskripsi\`), \`bobot\`=VALUES(\`bobot\`), \`aktif\`=VALUES(\`aktif\`), \`urutan\`=VALUES(\`urutan\`);\n`;
    }
    sql += `\n`;

    // 4. Log Pengaduan
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `-- 4. TABEL & DATA LAPORAN PENGADUAN PENGUNJUNG TERKINI (${pengaduanList.length} Data)\n`;
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`log_pengaduan\` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    for (const a of pengaduanList) {
      const ws = a.Waktu_Selesai ? `'${esc(a.Waktu_Selesai)}'` : 'NULL';
      const cp = a.Catatan_Penyelesaian ? `'${esc(a.Catatan_Penyelesaian)}'` : 'NULL';
      const pt = a.Petugas_Penangan ? `'${esc(a.Petugas_Penangan)}'` : 'NULL';
      sql += `INSERT INTO \`log_pengaduan\` (\`id\`, \`timestamp\`, \`id_lokasi\`, \`nama_pelapor\`, \`kontak_pelapor\`, \`detail_keluhan\`, \`status_tindak_lanjut\`, \`kategori_keluhan\`, \`foto_bukti\`, \`waktu_selesai\`, \`catatan_penyelesaian\`, \`petugas_penangan\`) ` +
        `VALUES ('${esc(a.id)}', '${esc(a.Timestamp)}', '${esc(a.ID_Lokasi)}', '${esc(a.Nama_Pelapor)}', '${esc(a.Kontak_Pelapor || '')}', '${esc(a.Detail_Keluhan)}', '${esc(a.Status_Tindak_Lanjut)}', '${esc(a.Kategori_Keluhan || '')}', '${esc(a.Foto_Bukti || '')}', ${ws}, ${cp}, ${pt}) ` +
        `ON DUPLICATE KEY UPDATE \`status_tindak_lanjut\`=VALUES(\`status_tindak_lanjut\`), \`waktu_selesai\`=VALUES(\`waktu_selesai\`), \`catatan_penyelesaian\`=VALUES(\`catatan_penyelesaian\`), \`petugas_penangan\`=VALUES(\`petugas_penangan\`);\n`;
    }
    sql += `\n`;

    // 5. Saran Pelayanan
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `-- 5. TABEL & DATA SARAN PELAYANAN PENGUNJUNG TERKINI (${saranList.length} Data)\n`;
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`saran_pelayanan\` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    for (const s of saranList) {
      const tsSpv = s.Tanggapan_Supervisor ? `'${esc(s.Tanggapan_Supervisor)}'` : 'NULL';
      sql += `INSERT INTO \`saran_pelayanan\` (\`id\`, \`timestamp\`, \`id_lokasi\`, \`nama_pemberi_saran\`, \`kontak\`, \`kategori_saran\`, \`judul_saran\`, \`detail_saran\`, \`prioritas\`, \`status_tinjauan\`, \`tanggapan_supervisor\`) ` +
        `VALUES ('${esc(s.id)}', '${esc(s.Timestamp)}', '${esc(s.ID_Lokasi)}', '${esc(s.Nama_Pemberi_Saran)}', '${esc(s.Kontak || '')}', '${esc(s.Kategori_Saran)}', '${esc(s.Judul_Saran)}', '${esc(s.Detail_Saran)}', '${esc(s.Prioritas)}', '${esc(s.Status_Tinjauan)}', ${tsSpv}) ` +
        `ON DUPLICATE KEY UPDATE \`status_tinjauan\`=VALUES(\`status_tinjauan\`), \`tanggapan_supervisor\`=VALUES(\`tanggapan_supervisor\`);\n`;
    }
    sql += `\n`;

    // 6. Rating Review
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `-- 6. TABEL & DATA RATING & REVIEW PENGUNJUNG TERKINI (${ratingList.length} Data)\n`;
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`rating_review\` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    for (const r of ratingList) {
      sql += `INSERT INTO \`rating_review\` (\`id\`, \`timestamp\`, \`id_lokasi\`, \`nama_reviewer\`, \`bintang\`, \`rating_kebersihan_lantai\`, \`rating_ketersediaan_air_sabun\`, \`rating_aroma_keharuman\`, \`rating_kesigapan_petugas\`, \`komentar_review\`, \`rekomendasikan\`) ` +
        `VALUES ('${esc(r.id)}', '${esc(r.Timestamp)}', '${esc(r.ID_Lokasi)}', '${esc(r.Nama_Reviewer)}', ${Number(r.Bintang) || 5}, ${Number(r.Rating_Kebersihan_Lantai) || 5}, ${Number(r.Rating_Ketersediaan_Air_Sabun) || 5}, ${Number(r.Rating_Aroma_Keharuman) || 5}, ${Number(r.Rating_Kesigapan_Petugas) || 5}, '${esc(r.Komentar_Review || '')}', ${r.Rekomendasikan ? 1 : 0}) ` +
        `ON DUPLICATE KEY UPDATE \`komentar_review\`=VALUES(\`komentar_review\`);\n`;
    }
    sql += `\n`;

    // 7. Log Inspeksi
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `-- 7. TABEL & DATA RIWAYAT INSPEKSI PETUGAS (${inspeksiList.length} Data)\n`;
    sql += `-- ----------------------------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS \`log_inspeksi\` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

    for (const i of inspeksiList) {
      const detailStr = esc(JSON.stringify(i.Detail_Ceklis || {}));
      sql += `INSERT INTO \`log_inspeksi\` (\`id\`, \`timestamp\`, \`id_lokasi\`, \`id_pengampu\`, \`skor_kebersihan\`, \`status_warna\`, \`catatan_kritis\`, \`detail_ceklis_json\`, \`total_item_diperiksa\`, \`total_item_lolos\`) ` +
        `VALUES ('${esc(i.id)}', '${esc(i.Timestamp)}', '${esc(i.ID_Lokasi)}', '${esc(i.ID_Pengampu)}', ${Number(i.Skor_Kebersihan) || 100}, '${esc(i.Status_Warna)}', '${esc(i.Catatan_Kritis || '')}', '${detailStr}', ${Number(i.Total_Item_Diperiksa) || 8}, ${Number(i.Total_Item_Lolos) || 8}) ` +
        `ON DUPLICATE KEY UPDATE \`skor_kebersihan\`=VALUES(\`skor_kebersihan\`), \`status_warna\`=VALUES(\`status_warna\`), \`catatan_kritis\`=VALUES(\`catatan_kritis\`);\n`;
    }
    sql += `\n`;

    return sql;
  };

  const initHostingerDatabase = async () => {
    try {
      const res = await safeFetchJson<any>('/api/database/init', { method: 'POST' });
      await refreshDatabaseStatus();
      if (res.success) {
        await loadDataFromBackend();
      }
      return {
        success: res.success,
        message: res.message || (res.success ? 'Tabel berhasil dibuat' : 'Gagal menginisialisasi tabel database'),
        tables: res.data?.tables
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Koneksi ke endpoint gagal' };
    }
  };

  const connectAndInitHostingerDatabase = async (creds: {
    host: string;
    port?: string;
    user: string;
    password?: string;
    database: string;
  }) => {
    try {
      const res = await safeFetchJson<any>('/api/database/connect-and-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });

      await refreshDatabaseStatus();
      if (res.success) {
        await loadDataFromBackend();
      }

      return {
        success: res.success,
        message: res.message || (res.success ? 'Database berhasil tersambung!' : 'Gagal menyambungkan ke database'),
        tables: res.data?.tables
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Koneksi ke endpoint gagal' };
    }
  };

  // UI & Session States
  const [currentUser, setCurrentUser] = useState<Pengampu | null>(() => {
    const saved = localStorage.getItem('simktr_session_v2');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<AppViewTab>('dasbor-publik');
  const [supervisorSubTab, setSupervisorSubTab] = useState<SupervisorSubTab>('pengaduan');
  const [selectedRoomForQr, setSelectedRoomForQr] = useState<string>('LOK-001');

  // Check URL Query on mount (?lokasi=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('lokasi');
    if (roomParam) {
      setSelectedRoomForQr(roomParam);
      setActiveTab('sim-qr');
    }
  }, []);

  // Fetch Server Health & Database Status on mount
  useEffect(() => {
    safeFetchJson<any>('/api/health')
      .then(res => {
        if (res.success && res.data && res.data.database) {
          const data = res.data;
          setServerStatus(prev => ({
            ...prev,
            connected: data.database.connected,
            engine: data.database.engine,
            nodeVersion: data.nodeVersion || 'Node.js 22.x',
            dbHost: data.database.host,
            dbName: data.database.database
          }));
        }
      })
      .catch(() => {});

    refreshDatabaseStatus();
    loadDataFromBackend();
  }, []);

  // Synchronize to localStorage
  useEffect(() => {
    localStorage.setItem('simktr_lokasi_v2', JSON.stringify(lokasiList));
  }, [lokasiList]);

  useEffect(() => {
    localStorage.setItem('simktr_pengampu_v2', JSON.stringify(pengampuList));
  }, [pengampuList]);

  useEffect(() => {
    localStorage.setItem('simktr_inspeksi_v2', JSON.stringify(inspeksiList));
  }, [inspeksiList]);

  useEffect(() => {
    localStorage.setItem('simktr_pengaduan_v2', JSON.stringify(pengaduanList));
  }, [pengaduanList]);

  useEffect(() => {
    localStorage.setItem('simktr_checklist_v2', JSON.stringify(checklistItems));
  }, [checklistItems]);

  useEffect(() => {
    localStorage.setItem('simktr_saran_v2', JSON.stringify(saranList));
  }, [saranList]);

  useEffect(() => {
    localStorage.setItem('simktr_rating_v2', JSON.stringify(ratingList));
  }, [ratingList]);

  useEffect(() => {
    localStorage.setItem('simktr_greetings_v2', JSON.stringify(greetingMessages));
  }, [greetingMessages]);

  useEffect(() => {
    localStorage.setItem('simktr_telegram_v2', JSON.stringify(telegramLogs));
  }, [telegramLogs]);

  useEffect(() => {
    localStorage.setItem('simktr_tg_config', JSON.stringify(telegramConfig));
  }, [telegramConfig]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('simktr_session_v2', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('simktr_session_v2');
    }
  }, [currentUser]);

  // Helper timestamp generator
  const getNowTimestamp = () => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Helper trigger Telegram Notification
  const emitTelegramNotification = async (
    message: string,
    type: TelegramNotification['type'],
    targetStaff?: Pengampu
  ) => {
    const timestamp = getNowTimestamp();
    const targetChatId = targetStaff?.Kontak_Telegram || telegramConfig.chatId || '@petugas_kebersihan';
    const newLog: TelegramNotification = {
      id: 'TG-' + Date.now(),
      timestamp,
      chatId: targetChatId,
      targetName: targetStaff?.Nama_Petugas || 'Petugas & Supervisor',
      message,
      type,
      status: telegramConfig.botToken ? 'sent' : 'simulated'
    };

    setTelegramLogs(prev => [newLog, ...prev]);

    // 1. Coba kirim via server backend
    let sentSuccessfully = false;
    try {
      const res = await fetch('/api/telegram/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          type,
          chatId: targetChatId
        })
      });
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data.success) sentSuccessfully = true;
      } catch {
        // Balasan bukan JSON (misal Hostinger HTML fallback)
      }
    } catch {
      // Backend request error
    }

    // 2. Jika backend belum berhasil terkirim dan token bot ada di client, kirim langsung via Telegram API resmi
    if (!sentSuccessfully && telegramConfig.botToken && telegramConfig.isEnabled) {
      try {
        await fetch(`https://api.telegram.org/bot${telegramConfig.botToken.trim()}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: targetChatId.trim(),
            text: message,
            parse_mode: 'Markdown'
          })
        });
      } catch (err) {
        console.warn('Direct telegram sending error:', err);
      }
    }
  };

  // Auth
  const loginUser = (username: string, pass: string) => {
    const found = pengampuList.find(
      p => p.Username.toLowerCase() === username.trim().toLowerCase() && p.Password === pass.trim()
    );
    if (found) {
      setCurrentUser(found);
      if (found.Role === 'Supervisor') {
        setActiveTab('supervisor');
      } else {
        setActiveTab('petugas');
      }
      return { success: true };
    }
    return { success: false, message: 'Username atau Password salah! Periksa tabel Master Pengampu.' };
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('simktr_session_v2');
    setActiveTab('dasbor-publik');
  };

  // --------------------------------------------------------------------------
  // FORM 1: LAPORAN PENGADUAN PENGUNJUNG
  // --------------------------------------------------------------------------
  const submitPengaduan = async (
    idLokasi: string,
    namaPelapor: string,
    detailKeluhan: string,
    kontakPelapor?: string,
    kategoriKeluhan?: string,
    fotoBukti?: string
  ) => {
    const time = getNowTimestamp();
    const newId = 'LAP-' + Math.floor(100 + Math.random() * 900);
    const newPengaduan: LogPengaduan = {
      id: newId,
      Timestamp: time,
      ID_Lokasi: idLokasi,
      Nama_Pelapor: namaPelapor,
      Kontak_Pelapor: kontakPelapor || '',
      Detail_Keluhan: detailKeluhan,
      Status_Tindak_Lanjut: 'Pending',
      Kategori_Keluhan: kategoriKeluhan || 'Keluhan Umum',
      Foto_Bukti: fotoBukti || ''
    };

    setPengaduanList(prev => [newPengaduan, ...prev]);

    // Set Room Status to Merah
    const targetRoom = lokasiList.find(r => r.ID_Lokasi === idLokasi);
    const staff = pengampuList.find(p => p.ID_Pengampu === targetRoom?.ID_Pengampu);

    setLokasiList(prev =>
      prev.map(r =>
        r.ID_Lokasi === idLokasi
          ? { ...r, Status_Terkini: 'Merah' as StatusWarna, Last_Update: time }
          : r
      )
    );

    // Call backend API if running
    fetch('/api/laporan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idLokasi,
        namaPelapor,
        kontakPelapor,
        detailKeluhan,
        kategoriKeluhan,
        fotoBukti
      })
    }).catch(() => {});

    // Notify Telegram
    const tgMessage =
      `🚨 *PENGADUAN PENGUNJUNG BARU!*\n\n` +
      `📍 *Ruangan:* ${targetRoom?.Nama_Ruangan || idLokasi} (${idLokasi})\n` +
      `👤 *Pelapor:* ${namaPelapor} ${kontakPelapor ? `(${kontakPelapor})` : ''}\n` +
      `📝 *Keluhan:* "${detailKeluhan}"\n` +
      `🏷️ *Kategori:* ${kategoriKeluhan || 'Fasilitas'}\n` +
      `⚠️ *Status Ruangan:* 🔴 MERAH (Segera ditangani)\n` +
      `👷 *Pengampu:* ${staff?.Nama_Petugas || 'Petugas Piket'}\n` +
      `⏰ *Waktu:* ${time}`;

    emitTelegramNotification(tgMessage, 'pengaduan', staff);

    return { success: true, id: newId };
  };

  // --------------------------------------------------------------------------
  // FORM 2: SARAN & MASUKAN PENINGKATAN PELAYANAN
  // --------------------------------------------------------------------------
  const submitSaran = async (
    idLokasi: string,
    namaPemberiSaran: string,
    kategoriSaran: SaranPelayanan['Kategori_Saran'],
    judulSaran: string,
    detailSaran: string,
    prioritas: SaranPelayanan['Prioritas'],
    kontak?: string
  ) => {
    const time = getNowTimestamp();
    const newId = 'SRN-' + Math.floor(100 + Math.random() * 900);
    const newSaran: SaranPelayanan = {
      id: newId,
      Timestamp: time,
      ID_Lokasi: idLokasi,
      Nama_Pemberi_Saran: namaPemberiSaran || 'Pengunjung Ramah',
      Kontak: kontak || '',
      Kategori_Saran: kategoriSaran,
      Judul_Saran: judulSaran,
      Detail_Saran: detailSaran,
      Prioritas: prioritas,
      Status_Tinjauan: 'Diterima'
    };

    setSaranList(prev => [newSaran, ...prev]);

    fetch('/api/saran', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSaran)
    }).catch(() => {});

    const room = lokasiList.find(r => r.ID_Lokasi === idLokasi);
    const tgMessage =
      `💡 *SARAN PELAYANAN BARU DITERIMA!*\n\n` +
      `📍 *Lokasi:* ${room?.Nama_Ruangan || idLokasi}\n` +
      `👤 *Pengirim:* ${newSaran.Nama_Pemberi_Saran}\n` +
      `📌 *Kategori:* ${kategoriSaran} [Prioritas: ${prioritas}]\n` +
      `🎯 *Judul:* "${judulSaran}"\n` +
      `📝 *Detail:* "${detailSaran}"\n` +
      `⏰ *Waktu:* ${time}`;

    emitTelegramNotification(tgMessage, 'saran');

    return { success: true, id: newId };
  };

  // --------------------------------------------------------------------------
  // FORM 3: RATING PELAYANAN (BINTANG 1-5) & REVIEW PENGUNJUNG
  // --------------------------------------------------------------------------
  const submitRating = async (
    idLokasi: string,
    namaReviewer: string,
    bintang: number,
    subRatings: {
      lantai: number;
      air: number;
      aroma: number;
      petugas: number;
    },
    komentarReview: string,
    rekomendasikan: boolean
  ) => {
    const time = getNowTimestamp();
    const newId = 'RAT-' + Math.floor(100 + Math.random() * 900);
    const newRating: RatingReview = {
      id: newId,
      Timestamp: time,
      ID_Lokasi: idLokasi,
      Nama_Reviewer: namaReviewer || 'Pengunjung',
      Bintang: bintang,
      Rating_Kebersihan_Lantai: subRatings.lantai,
      Rating_Ketersediaan_Air_Sabun: subRatings.air,
      Rating_Aroma_Keharuman: subRatings.aroma,
      Rating_Kesigapan_Petugas: subRatings.petugas,
      Komentar_Review: komentarReview,
      Rekomendasikan: rekomendasikan
    };

    setRatingList(prev => [newRating, ...prev]);

    fetch('/api/rating', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRating)
    }).catch(() => {});

    if (bintang <= 3 && telegramConfig.notifyOnLowRating) {
      const room = lokasiList.find(r => r.ID_Lokasi === idLokasi);
      const tgMessage =
        `⚠️ *EVALUASI: RATING BINTANG ${bintang}/5 DITERIMA*\n\n` +
        `📍 *Lokasi:* ${room?.Nama_Ruangan || idLokasi}\n` +
        `⭐ *Rating:* ${'⭐'.repeat(bintang)} (${bintang} dari 5)\n` +
        `👤 *Penilai:* ${namaReviewer}\n` +
        `💬 *Ulasan:* "${komentarReview || '-'}"\n` +
        `📌 *Aspek:* Lantai ${subRatings.lantai}★ | Air ${subRatings.air}★ | Aroma ${subRatings.aroma}★ | Respon ${subRatings.petugas}★\n` +
        `⏰ *Waktu:* ${time}`;

      emitTelegramNotification(tgMessage, 'rating');
    }

    return { success: true, id: newId };
  };

  // --------------------------------------------------------------------------
  // SUPERVISOR: KELOLA CEKLIS INSPEKSI DINAMIS (TAMBAH / KURANG / EDIT)
  // --------------------------------------------------------------------------
  const addChecklistItem = async (itemData: {
    nama: string;
    kategori: 'Semua' | 'Toilet' | 'Ruangan';
    deskripsi: string;
    bobot: number;
  }) => {
    let nextNum = checklistItems.length + 1;
    let newId = `CHK-${nextNum.toString().padStart(3, '0')}`;
    while (checklistItems.some(c => c.id === newId)) {
      nextNum++;
      newId = `CHK-${nextNum.toString().padStart(3, '0')}`;
    }

    const newItem: ChecklistItem = {
      id: newId,
      nama: itemData.nama,
      kategori: itemData.kategori,
      deskripsi: itemData.deskripsi,
      bobot: itemData.bobot || 1,
      aktif: true,
      urutan: checklistItems.length + 1
    };

    setChecklistItems(prev => [...prev, newItem]);

    fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem)
    }).catch(() => {});

    return { success: true, item: newItem };
  };

  const updateChecklistItem = async (id: string, updated: Partial<ChecklistItem>) => {
    setChecklistItems(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updated } : c))
    );

    fetch(`/api/checklist/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    }).catch(() => {});

    return true;
  };

  const deleteChecklistItem = async (id: string) => {
    setChecklistItems(prev => prev.filter(c => c.id !== id));

    fetch(`/api/checklist/${id}`, {
      method: 'DELETE'
    }).catch(() => {});

    return true;
  };

  const toggleChecklistItem = async (id: string) => {
    const item = checklistItems.find(c => c.id === id);
    if (!item) return false;
    const newStatus = !item.aktif;

    setChecklistItems(prev =>
      prev.map(c => (c.id === id ? { ...c, aktif: newStatus } : c))
    );

    fetch(`/api/checklist/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktif: newStatus })
    }).catch(() => {});

    return true;
  };

  // --------------------------------------------------------------------------
  // PETUGAS: SUBMIT INSPEKSI DENGAN CEKLIS DINAMIS
  // --------------------------------------------------------------------------
  const submitInspeksi = (
    idLokasi: string,
    idPengampu: string,
    checklistResults: Record<string, boolean>,
    catatanKritis: string
  ): { skor: number; status: StatusWarna } => {
    const time = getNowTimestamp();
    const room = lokasiList.find(r => r.ID_Lokasi === idLokasi);
    const applicableItems = checklistItems.filter(
      c => c.aktif && (c.kategori === 'Semua' || c.kategori === room?.Kategori)
    );

    let totalBobot = 0;
    let totalLolosBobot = 0;
    let itemLolosCount = 0;

    applicableItems.forEach(item => {
      const bobot = item.bobot || 1;
      totalBobot += bobot;
      if (checklistResults[item.id]) {
        totalLolosBobot += bobot;
        itemLolosCount++;
      }
    });

    const skor = totalBobot > 0 ? Math.round((totalLolosBobot / totalBobot) * 100) : 100;

    let statusWarna: StatusWarna = 'Hijau';
    if (skor < 70) {
      statusWarna = 'Merah';
    } else if (skor < 85) {
      statusWarna = 'Kuning';
    }

    const newLog: LogInspeksi = {
      id: 'INSP-' + Date.now(),
      Timestamp: time,
      ID_Lokasi: idLokasi,
      ID_Pengampu: idPengampu,
      Skor_Kebersihan: skor,
      Status_Warna: statusWarna,
      Catatan_Kritis: catatanKritis || 'Inspeksi berkala selesai sesuai ceklis',
      Detail_Ceklis: checklistResults,
      Total_Item_Diperiksa: applicableItems.length,
      Total_Item_Lolos: itemLolosCount
    };

    setInspeksiList(prev => [newLog, ...prev]);

    // Update Room status
    setLokasiList(prev =>
      prev.map(r =>
        r.ID_Lokasi === idLokasi
          ? { ...r, Status_Terkini: statusWarna, Last_Update: time }
          : r
      )
    );

    // Kirim log inspeksi ke backend MySQL
    fetch('/api/inspeksi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLog)
    }).catch(() => {});

    // If Merah, alert Supervisor via Telegram
    if (statusWarna === 'Merah' && telegramConfig.notifyOnRedStatus) {
      const spvStaff = pengampuList.find(p => p.Role === 'Supervisor');
      const tgMsg =
        `🚨 *PERINGATAN INSPEKSI KONDISI MERAH!*\n\n` +
        `📍 *Ruangan:* ${room?.Nama_Ruangan || idLokasi}\n` +
        `📊 *Skor Kebersihan:* ${skor}% (Lolos ${itemLolosCount} dari ${applicableItems.length} item ceklis)\n` +
        `⚠️ *Kondisi:* Perlu Pembersihan Segera\n` +
        `📝 *Catatan Petugas:* "${catatanKritis || 'Tidak ada catatan khusus'}"\n` +
        `👷 *Diperiksa oleh:* ${idPengampu}\n` +
        `⏰ *Waktu:* ${time}`;

      emitTelegramNotification(tgMsg, 'merah', spvStaff);
    }

    return { skor, status: statusWarna };
  };

  // --------------------------------------------------------------------------
  // RESOLVE PENGADUAN
  // --------------------------------------------------------------------------
  const resolvePengaduan = (
    idPengaduan: string,
    idLokasi: string,
    catatanPenyelesaian?: string,
    petugasPenangan?: string
  ) => {
    const time = getNowTimestamp();
    const actionNote = catatanPenyelesaian?.trim() || 'Telah dibersihkan dan dipel rapi oleh petugas.';

    setPengaduanList(prev =>
      prev.map(p =>
        p.id === idPengaduan
          ? {
              ...p,
              Status_Tindak_Lanjut: 'Selesai' as const,
              Waktu_Selesai: time,
              Catatan_Penyelesaian: actionNote,
              Petugas_Penangan: petugasPenangan || currentUser?.Nama_Petugas || 'Petugas Kebersihan'
            }
          : p
      )
    );

    // Check other pending complaints for this room
    const remainingPending = pengaduanList.filter(
      p => p.id !== idPengaduan && p.ID_Lokasi === idLokasi && p.Status_Tindak_Lanjut === 'Pending'
    );

    if (remainingPending.length === 0) {
      setLokasiList(prev =>
        prev.map(r =>
          r.ID_Lokasi === idLokasi
            ? { ...r, Status_Terkini: 'Hijau' as StatusWarna, Last_Update: time }
            : r
        )
      );
    }

    fetch(`/api/laporan/${idPengaduan}/resolve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idLokasi,
        catatanPenyelesaian: actionNote,
        petugasPenangan: petugasPenangan || currentUser?.Nama_Petugas
      })
    }).catch(() => {});

    const room = lokasiList.find(r => r.ID_Lokasi === idLokasi);
    const tgMsg =
      `✅ *ADUAN SELESAI DITANGANI!*\n\n` +
      `🆔 *ID Aduan:* ${idPengaduan}\n` +
      `📍 *Ruangan:* ${room?.Nama_Ruangan || idLokasi}\n` +
      `🛠️ *Tindakan:* "${actionNote}"\n` +
      `👷 *Petugas Penangan:* ${petugasPenangan || currentUser?.Nama_Petugas || 'Petugas Kebersihan'}\n` +
      `🔄 *Status Ruangan:* ${remainingPending.length === 0 ? '🟢 HIJAU (Normal)' : '🔴 Masih ada aduan lain'}\n` +
      `⏰ *Waktu Selesai:* ${time}`;

    emitTelegramNotification(tgMsg, 'inspeksi');
  };

  // CRUD Lokasi & Pengampu
  const saveLokasi = (lokasi: Lokasi, isEdit: boolean) => {
    const time = getNowTimestamp();
    if (isEdit) {
      setLokasiList(prev =>
        prev.map(r => (r.ID_Lokasi === lokasi.ID_Lokasi ? { ...lokasi, Last_Update: time } : r))
      );
      fetch(`/api/lokasi/${lokasi.ID_Lokasi}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lokasi)
      }).catch(() => {});
    } else {
      const newLoc = { ...lokasi, Last_Update: time, Status_Terkini: 'Hijau' as StatusWarna };
      setLokasiList(prev => [...prev, newLoc]);
      fetch('/api/lokasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLoc)
      }).catch(() => {});
    }
  };

  const deleteLokasi = (idLokasi: string) => {
    setLokasiList(prev => prev.filter(r => r.ID_Lokasi !== idLokasi));
    fetch(`/api/lokasi/${idLokasi}`, { method: 'DELETE' }).catch(() => {});
  };

  const savePengampu = (pengampu: Pengampu, isEdit: boolean) => {
    if (isEdit) {
      setPengampuList(prev =>
        prev.map(p => (p.ID_Pengampu === pengampu.ID_Pengampu ? pengampu : p))
      );
      fetch(`/api/pengampu/${pengampu.ID_Pengampu}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pengampu)
      }).catch(() => {});
    } else {
      setPengampuList(prev => [...prev, pengampu]);
      fetch('/api/pengampu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pengampu)
      }).catch(() => {});
    }
  };

  const deletePengampu = (idPengampu: string) => {
    setPengampuList(prev => prev.filter(p => p.ID_Pengampu !== idPengampu));
    fetch(`/api/pengampu/${idPengampu}`, { method: 'DELETE' }).catch(() => {});
  };

  // Telegram Test
  const testTelegramBot = async (botToken: string, chatId: string) => {
    const cleanToken = botToken.trim();
    const cleanChatId = chatId.trim();

    if (!cleanToken || !cleanChatId) {
      return { success: false, message: 'Bot Token dan Chat ID wajib diisi untuk melakukan pengujian.' };
    }

    const testText =
      `🔔 *UJI COBA NOTIFIKASI BOT TELEGRAM SIM-KTR*\n\n` +
      `✅ *Status:* Terhubung Normal!\n` +
      `🏢 *Sistem:* SIM-KTR Monitoring Kebersihan Toilet & Ruangan\n` +
      `⏰ *Waktu Uji:* ${new Date().toLocaleString('id-ID')}\n\n` +
      `_Bot Telegram ini berhasil dihubungkan dan siap menerima laporan aduan serta peringatan kebersihan._`;

    // 1. Coba lewat backend server Node.js terlebih dahulu
    try {
      const res = await fetch('/api/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: cleanToken, chatId: cleanChatId })
      });

      const rawText = await res.text();
      // Periksa apakah balasan adalah JSON yang valid
      if (rawText && !rawText.trim().startsWith('<')) {
        try {
          const data = JSON.parse(rawText);
          if (data.success) {
            emitTelegramNotification(
              `🔔 Pesan Uji Coba Bot Telegram SIM-KTR berhasil terkirim via server Node.js!`,
              'test'
            );
          }
          return data;
        } catch {
          // Abaikan error JSON parse, lanjut ke Direct Client Fallback
        }
      }
    } catch {
      // Backend request error, lanjut ke Direct Client Fallback
    }

    // 2. Direct Fallback: Panggil langsung ke Official Telegram Bot API dari browser (CORS didukung oleh Telegram)
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          text: testText,
          parse_mode: 'Markdown'
        })
      });

      const tgRawText = await tgRes.text();
      let tgData: any = {};
      try {
        tgData = JSON.parse(tgRawText);
      } catch {
        return {
          success: false,
          message: 'Gagal membaca respon dari Telegram API.'
        };
      }

      if (tgData.ok) {
        emitTelegramNotification(
          `🔔 Pesan Uji Coba Bot Telegram SIM-KTR berhasil terkirim langsung via Telegram API!`,
          'test'
        );
        return {
          success: true,
          message: 'Pesan uji coba berhasil terkirim ke Telegram Anda!'
        };
      } else {
        let errorMsg = tgData.description || 'Gagal mengirim pesan ke Telegram';
        if (errorMsg.includes('Not Found')) {
          errorMsg = 'Bot Token tidak valid (Not Found). Pastikan token yang disalin dari @BotFather benar.';
        } else if (errorMsg.includes('chat not found')) {
          errorMsg = 'Chat ID tidak ditemukan. Pastikan Anda sudah menekan "Start" pada bot atau bot sudah dimasukkan ke dalam grup/channel.';
        } else if (errorMsg.includes('Unauthorized')) {
          errorMsg = 'Akses ditolak (Unauthorized). Bot Token Anda keliru.';
        }

        return {
          success: false,
          message: `Telegram: ${errorMsg}`
        };
      }
    } catch (clientErr: any) {
      return {
        success: false,
        message: `Koneksi ke Telegram gagal: ${clientErr.message || 'Periksa koneksi internet Anda.'}`
      };
    }
  };

  const updateTelegramConfig = (newConfig: Partial<TelegramConfig>) => {
    setTelegramConfig(prev => ({ ...prev, ...newConfig }));
  };

  const dismissTelegramNotification = (id: string) => {
    setTelegramLogs(prev => prev.filter(l => l.id !== id));
  };

  const clearAllTelegramLogs = () => {
    setTelegramLogs([]);
  };

  // Greeting Message
  const submitGreeting = (nama: string, pesan: string, instansi?: string, emoji?: string) => {
    const newGreeting: GreetingMessage = {
      id: 'GRT-' + Date.now(),
      nama: nama.trim() || 'Pengunjung Ramah',
      instansi: instansi?.trim() || 'Civitas',
      pesan: pesan.trim(),
      waktu: 'Baru saja',
      emoji: emoji || '🌸'
    };
    setGreetingMessages(prev => [newGreeting, ...prev]);

    fetch('/api/greetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGreeting)
    }).catch(() => {});
  };

  // Rekapitulasi Helper (Untuk Side Panel & Dashboard)
  const getRekapStats = () => {
    const totalPengaduan = pengaduanList.length;
    const pendingCount = pengaduanList.filter(p => p.Status_Tindak_Lanjut === 'Pending').length;
    const selesaiCount = pengaduanList.filter(p => p.Status_Tindak_Lanjut === 'Selesai').length;
    const penyelesaianPersen = totalPengaduan > 0 ? Math.round((selesaiCount / totalPengaduan) * 100) : 100;

    // Top Kategori Keluhan
    const kategoriCount: Record<string, number> = {};
    pengaduanList.forEach(p => {
      const kat = p.Kategori_Keluhan || 'Lain-lain';
      kategoriCount[kat] = (kategoriCount[kat] || 0) + 1;
    });

    const topKategori = Object.entries(kategoriCount)
      .map(([kategori, count]) => ({
        kategori,
        count,
        persen: totalPengaduan > 0 ? Math.round((count / totalPengaduan) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Top Ruangan Paling Banyak Dilaporkan
    const roomCount: Record<string, number> = {};
    pengaduanList.forEach(p => {
      roomCount[p.ID_Lokasi] = (roomCount[p.ID_Lokasi] || 0) + 1;
    });

    const topRuangan = Object.entries(roomCount)
      .map(([idLokasi, count]) => {
        const room = lokasiList.find(r => r.ID_Lokasi === idLokasi);
        return {
          idLokasi,
          namaRuangan: room?.Nama_Ruangan || idLokasi,
          count
        };
      })
      .sort((a, b) => b.count - a.count);

    // Average Rating
    const totalStars = ratingList.reduce((acc, r) => acc + (r.Bintang || 0), 0);
    const avgRating = ratingList.length > 0 ? Number((totalStars / ratingList.length).toFixed(1)) : 5.0;

    const ratingBreakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingList.forEach(r => {
      const b = Math.min(5, Math.max(1, Math.round(r.Bintang || 5)));
      ratingBreakdown[b] = (ratingBreakdown[b] || 0) + 1;
    });

    return {
      totalPengaduan,
      pendingCount,
      selesaiCount,
      penyelesaianPersen,
      rataRataDurasi: '12 - 18 Menit (SLA 30 Menit)',
      topKategori,
      topRuangan,
      avgRating,
      totalReview: ratingList.length,
      totalSaran: saranList.length,
      ratingBreakdown
    };
  };

  const resetDatabaseToDefault = () => {
    setLokasiList(INITIAL_LOKASI);
    setPengampuList(INITIAL_PENGAMPU);
    setInspeksiList(INITIAL_INSPEKSI);
    setPengaduanList(INITIAL_PENGADUAN);
    setChecklistItems(INITIAL_CHECKLIST);
    setSaranList(INITIAL_SARAN);
    setRatingList(INITIAL_RATINGS);
    setGreetingMessages(INITIAL_GREETINGS);
    setTelegramLogs([]);
    localStorage.clear();
  };

  return (
    <AppContext.Provider
      value={{
        lokasiList,
        pengampuList,
        inspeksiList,
        pengaduanList,
        checklistItems,
        saranList,
        ratingList,
        greetingMessages,
        telegramLogs,
        telegramConfig,
        currentUser,
        activeTab,
        selectedRoomForQr,
        serverStatus,
        databaseDetails,
        initHostingerDatabase,
        connectAndInitHostingerDatabase,
        syncFromDatabase,
        syncToDatabase,
        refreshDatabaseStatus,
        generateLiveSqlScript,
        setActiveTab,
        supervisorSubTab,
        setSupervisorSubTab,
        setSelectedRoomForQr,
        setCurrentUser,
        loginUser,
        logoutUser,
        submitPengaduan,
        submitSaran,
        submitRating,
        addChecklistItem,
        updateChecklistItem,
        deleteChecklistItem,
        toggleChecklistItem,
        submitInspeksi,
        resolvePengaduan,
        saveLokasi,
        deleteLokasi,
        savePengampu,
        deletePengampu,
        testTelegramBot,
        updateTelegramConfig,
        dismissTelegramNotification,
        clearAllTelegramLogs,
        submitGreeting,
        getRekapStats,
        resetDatabaseToDefault
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
