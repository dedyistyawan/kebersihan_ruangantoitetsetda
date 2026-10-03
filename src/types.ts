export type KategoriRuangan = 'Toilet' | 'Ruangan';

export type StatusWarna = 'Hijau' | 'Kuning' | 'Merah';

export type RoleUser = 'Petugas' | 'Supervisor';

export type SupervisorSubTab =
  | 'realtime'
  | 'pengaduan'
  | 'ceklis-master'
  | 'saran-review'
  | 'telegram-config'
  | 'hostinger-guide'
  | 'crud-lokasi'
  | 'crud-pengampu';

export interface Lokasi {
  ID_Lokasi: string;
  Nama_Ruangan: string;
  Kategori: KategoriRuangan;
  ID_Pengampu: string;
  Status_Terkini: StatusWarna;
  Last_Update: string;
  Gedung?: string;
  Lantai?: string;
}

export interface Pengampu {
  ID_Pengampu: string;
  Nama_Petugas: string;
  Username: string;
  Password: string;
  Role: RoleUser;
  Kontak_Telegram: string;
  Telepon?: string;
}

// Item Ceklis Inspeksi yang dapat ditambah / dikurangi oleh Supervisor
export interface ChecklistItem {
  id: string; // e.g. CHK-001
  nama: string; // e.g. Ketersediaan Tisu (Toilet/Wastafel)
  kategori: 'Semua' | 'Toilet' | 'Ruangan';
  deskripsi: string;
  bobot: number; // e.g. 1
  aktif: boolean;
  urutan: number;
}

// Log Inspeksi Kebersihan oleh Petugas
export interface LogInspeksi {
  id?: string;
  Timestamp: string;
  ID_Lokasi: string;
  ID_Pengampu: string;
  Skor_Kebersihan: number; // 0 - 100
  Status_Warna: StatusWarna;
  Catatan_Kritis: string;
  Detail_Ceklis?: Record<string, boolean>; // id ChecklistItem -> boolean
  Total_Item_Diperiksa?: number;
  Total_Item_Lolos?: number;
}

// Form 1: Laporan Pengaduan Pengunjung
export interface LogPengaduan {
  id: string;
  Timestamp: string;
  ID_Lokasi: string;
  Nama_Pelapor: string;
  Kontak_Pelapor?: string;
  Detail_Keluhan: string;
  Status_Tindak_Lanjut: 'Pending' | 'Proses' | 'Selesai';
  Kategori_Keluhan?: string;
  Foto_Bukti?: string;
  Waktu_Selesai?: string;
  Catatan_Penyelesaian?: string;
  Petugas_Penangan?: string;
}

// Form 2: Saran & Masukan untuk Meningkatkan Kualitas Pelayanan
export interface SaranPelayanan {
  id: string;
  Timestamp: string;
  ID_Lokasi: string;
  Nama_Pemberi_Saran: string;
  Kontak?: string;
  Kategori_Saran:
    | 'Fasilitas & Sarana'
    | 'Ketersediaan Air & Sabun'
    | 'Aroma & Kesegaran'
    | 'Respon & Kinerja Petugas'
    | 'Aksesibilitas / Difabel'
    | 'Kebersihan Umum & Lingkungan'
    | 'Lainnya';
  Judul_Saran: string;
  Detail_Saran: string;
  Prioritas: 'Biasa' | 'Penting' | 'Mendesak';
  Status_Tinjauan: 'Diterima' | 'Diproses' | 'Diimplementasikan';
  Tanggapan_Supervisor?: string;
}

// Form 3: Rating Pelayanan (Bintang 1-5) & Review Pengunjung
export interface RatingReview {
  id: string;
  Timestamp: string;
  ID_Lokasi: string;
  Nama_Reviewer: string;
  Bintang: number; // 1 to 5
  Rating_Kebersihan_Lantai: number; // 1 - 5
  Rating_Ketersediaan_Air_Sabun: number; // 1 - 5
  Rating_Aroma_Keharuman: number; // 1 - 5
  Rating_Kesigapan_Petugas: number; // 1 - 5
  Komentar_Review: string;
  Rekomendasikan: boolean;
}

// Log Notifikasi Telegram
export interface TelegramNotification {
  id: string;
  timestamp: string;
  chatId: string;
  targetName: string;
  message: string;
  type: 'pengaduan' | 'merah' | 'inspeksi' | 'saran' | 'rating' | 'test';
  status: 'sent' | 'queued' | 'simulated';
}

// Konfigurasi Bot Telegram
export interface TelegramConfig {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
  notifyOnComplaint: boolean;
  notifyOnRedStatus: boolean;
  notifyOnLowRating: boolean;
}

// Pesan Kartu Ucapan Footer
export interface GreetingMessage {
  id: string;
  nama: string;
  instansi?: string;
  pesan: string;
  waktu: string;
  emoji: string;
}
