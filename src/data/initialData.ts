import {
  Lokasi,
  Pengampu,
  LogInspeksi,
  LogPengaduan,
  ChecklistItem,
  SaranPelayanan,
  RatingReview,
  GreetingMessage
} from '../types';

export const INITIAL_PENGAMPU: Pengampu[] = [
  {
    ID_Pengampu: 'PGP-001',
    Nama_Petugas: 'Budi Santoso',
    Username: 'budi',
    Password: '123',
    Role: 'Petugas',
    Kontak_Telegram: '@budi_cleaner (ID: 102938475)',
    Telepon: '081234567890'
  },
  {
    ID_Pengampu: 'PGP-002',
    Nama_Petugas: 'Siti Rahmawati',
    Username: 'siti',
    Password: '123',
    Role: 'Petugas',
    Kontak_Telegram: '@siti_rahma (ID: 987654321)',
    Telepon: '081398765432'
  },
  {
    ID_Pengampu: 'PGP-003',
    Nama_Petugas: 'Joko Widodo Putra',
    Username: 'joko',
    Password: '123',
    Role: 'Petugas',
    Kontak_Telegram: '@joko_ops (ID: 554433221)',
    Telepon: '082155443322'
  },
  {
    ID_Pengampu: 'PGP-004',
    Nama_Petugas: 'Dewi Lestari',
    Username: 'dewi',
    Password: '123',
    Role: 'Petugas',
    Kontak_Telegram: '@dewi_facility (ID: 887766554)',
    Telepon: '085788776655'
  },
  {
    ID_Pengampu: 'SPV-001',
    Nama_Petugas: 'Agus Hendrawan, S.T. (Supervisor)',
    Username: 'admin',
    Password: 'admin123',
    Role: 'Supervisor',
    Kontak_Telegram: '@agus_supervisor (ID: 123456789)',
    Telepon: '081122334455'
  }
];

export const INITIAL_LOKASI: Lokasi[] = [
  {
    ID_Lokasi: 'LOK-001',
    Nama_Ruangan: 'Toilet Pria Lantai 1 (Lobby)',
    Kategori: 'Toilet',
    ID_Pengampu: 'PGP-001',
    Status_Terkini: 'Hijau',
    Last_Update: '2026-09-25 07:30',
    Gedung: 'Gedung Rektorat',
    Lantai: 'Lantai 1'
  },
  {
    ID_Lokasi: 'LOK-002',
    Nama_Ruangan: 'Toilet Wanita Lantai 1 (Lobby)',
    Kategori: 'Toilet',
    ID_Pengampu: 'PGP-002',
    Status_Terkini: 'Merah',
    Last_Update: '2026-09-25 08:15',
    Gedung: 'Gedung Rektorat',
    Lantai: 'Lantai 1'
  },
  {
    ID_Lokasi: 'LOK-003',
    Nama_Ruangan: 'Toilet Pria Lantai 2 (Sayap Barat)',
    Kategori: 'Toilet',
    ID_Pengampu: 'PGP-001',
    Status_Terkini: 'Kuning',
    Last_Update: '2026-09-25 06:45',
    Gedung: 'Gedung Rektorat',
    Lantai: 'Lantai 2'
  },
  {
    ID_Lokasi: 'LOK-004',
    Nama_Ruangan: 'Toilet Wanita Lantai 2 (Sayap Timur)',
    Kategori: 'Toilet',
    ID_Pengampu: 'PGP-002',
    Status_Terkini: 'Hijau',
    Last_Update: '2026-09-25 07:10',
    Gedung: 'Gedung Rektorat',
    Lantai: 'Lantai 2'
  },
  {
    ID_Lokasi: 'LOK-005',
    Nama_Ruangan: 'Toilet Difabel & Tamu VIP',
    Kategori: 'Toilet',
    ID_Pengampu: 'PGP-001',
    Status_Terkini: 'Hijau',
    Last_Update: '2026-09-25 08:00',
    Gedung: 'Gedung Rektorat',
    Lantai: 'Lantai 1'
  },
  {
    ID_Lokasi: 'LOK-006',
    Nama_Ruangan: 'Ruang Rapat Utama Singosari',
    Kategori: 'Ruangan',
    ID_Pengampu: 'PGP-003',
    Status_Terkini: 'Hijau',
    Last_Update: '2026-09-25 07:00',
    Gedung: 'Gedung Rektorat',
    Lantai: 'Lantai 2'
  },
  {
    ID_Lokasi: 'LOK-007',
    Nama_Ruangan: 'Aula Serbaguna Graha Wiyata',
    Kategori: 'Ruangan',
    ID_Pengampu: 'PGP-003',
    Status_Terkini: 'Kuning',
    Last_Update: '2026-09-24 16:30',
    Gedung: 'Gedung Serbaguna',
    Lantai: 'Lantai 1'
  },
  {
    ID_Lokasi: 'LOK-008',
    Nama_Ruangan: 'Toilet Umum Gedung Serbaguna Pria',
    Kategori: 'Toilet',
    ID_Pengampu: 'PGP-003',
    Status_Terkini: 'Merah',
    Last_Update: '2026-09-25 08:10',
    Gedung: 'Gedung Serbaguna',
    Lantai: 'Lantai 1'
  },
  {
    ID_Lokasi: 'LOK-009',
    Nama_Ruangan: 'Toilet Umum Gedung Serbaguna Wanita',
    Kategori: 'Toilet',
    ID_Pengampu: 'PGP-004',
    Status_Terkini: 'Hijau',
    Last_Update: '2026-09-25 07:45',
    Gedung: 'Gedung Serbaguna',
    Lantai: 'Lantai 1'
  },
  {
    ID_Lokasi: 'LOK-010',
    Nama_Ruangan: 'Ruang Dosen & Senat Akademik',
    Kategori: 'Ruangan',
    ID_Pengampu: 'PGP-004',
    Status_Terkini: 'Hijau',
    Last_Update: '2026-09-25 06:30',
    Gedung: 'Gedung F',
    Lantai: 'Lantai 3'
  },
  {
    ID_Lokasi: 'LOK-011',
    Nama_Ruangan: 'Toilet Laboratorium Komputer Terpadu',
    Kategori: 'Toilet',
    ID_Pengampu: 'PGP-004',
    Status_Terkini: 'Hijau',
    Last_Update: '2026-09-25 07:20',
    Gedung: 'Gedung Lab',
    Lantai: 'Lantai 2'
  },
  {
    ID_Lokasi: 'LOK-012',
    Nama_Ruangan: 'Perpustakaan Pusat - Ruang Baca',
    Kategori: 'Ruangan',
    ID_Pengampu: 'PGP-003',
    Status_Terkini: 'Hijau',
    Last_Update: '2026-09-25 07:05',
    Gedung: 'Perpustakaan',
    Lantai: 'Lantai 1'
  },
  {
    ID_Lokasi: 'LOK-013',
    Nama_Ruangan: 'Toilet Perpustakaan Lantai 1',
    Kategori: 'Toilet',
    ID_Pengampu: 'PGP-003',
    Status_Terkini: 'Kuning',
    Last_Update: '2026-09-25 06:50',
    Gedung: 'Perpustakaan',
    Lantai: 'Lantai 1'
  },
  {
    ID_Lokasi: 'LOK-014',
    Nama_Ruangan: 'Kantin Pusat & Food Court',
    Kategori: 'Ruangan',
    ID_Pengampu: 'PGP-001',
    Status_Terkini: 'Hijau',
    Last_Update: '2026-09-25 07:15',
    Gedung: 'Student Center',
    Lantai: 'Lantai 1'
  },
  {
    ID_Lokasi: 'LOK-015',
    Nama_Ruangan: 'Toilet Mahasiswa Student Center',
    Kategori: 'Toilet',
    ID_Pengampu: 'PGP-001',
    Status_Terkini: 'Merah',
    Last_Update: '2026-09-25 08:20',
    Gedung: 'Student Center',
    Lantai: 'Lantai 1'
  }
];

// Master Ceklis Inspeksi Kebersihan yang dapat ditambah/dikurangi oleh Supervisor
export const INITIAL_CHECKLIST: ChecklistItem[] = [
  {
    id: 'CHK-001',
    nama: 'Ketersediaan Tisu (Toilet / Wastafel)',
    kategori: 'Toilet',
    deskripsi: 'Tisu gulung dan tisu pengering tangan terisi penuh & higienis',
    bobot: 1,
    aktif: true,
    urutan: 1
  },
  {
    id: 'CHK-002',
    nama: 'Pengharum Ruangan Aktif & Wangi Segar',
    kategori: 'Semua',
    deskripsi: 'Dispenser aroma berfungsi otomatis dan ruangan bebas bau apek',
    bobot: 1,
    aktif: true,
    urutan: 2
  },
  {
    id: 'CHK-003',
    nama: 'Lantai Kering, Bersih & Bebas Noda/Licin',
    kategori: 'Semua',
    deskripsi: 'Lantai dipel disinfektan, tidak ada genangan air atau noda membandel',
    bobot: 1,
    aktif: true,
    urutan: 3
  },
  {
    id: 'CHK-004',
    nama: 'Keran & Saluran Pembuangan Air Lancar',
    kategori: 'Toilet',
    deskripsi: 'Air mengalir kencang, tidak ada kebocoran, dan tidak tersumbat',
    bobot: 1,
    aktif: true,
    urutan: 4
  },
  {
    id: 'CHK-005',
    nama: 'Kunci Selot Pintu & Engsel Berfungsi Baik',
    kategori: 'Semua',
    deskripsi: 'Pintu dapat dikunci dengan rapat dan aman oleh pengguna',
    bobot: 1,
    aktif: true,
    urutan: 5
  },
  {
    id: 'CHK-006',
    nama: 'Wastafel, Sabun Cuci Tangan & Cermin Bersih',
    kategori: 'Toilet',
    deskripsi: 'Sabun cair terisi, wastafel bebas kerak, cermin bening mengkilap',
    bobot: 1,
    aktif: true,
    urutan: 6
  },
  {
    id: 'CHK-007',
    nama: 'Kloset / Urinoir Higienis & Bebas Bau',
    kategori: 'Toilet',
    deskripsi: 'Kloset duduk/jongkok disikat bersih, flush siram berfungsi optimal',
    bobot: 1,
    aktif: true,
    urutan: 7
  },
  {
    id: 'CHK-008',
    nama: 'Tempat Sampah Dikosongkan & Berplastik Baru',
    kategori: 'Semua',
    deskripsi: 'Tidak ada tumpukan sampah meluap, plastik sampah terpasang rapi',
    bobot: 1,
    aktif: true,
    urutan: 8
  }
];

export const INITIAL_INSPEKSI: LogInspeksi[] = [
  {
    id: 'INSP-101',
    Timestamp: '2026-09-25 07:30',
    ID_Lokasi: 'LOK-001',
    ID_Pengampu: 'PGP-001',
    Skor_Kebersihan: 100,
    Status_Warna: 'Hijau',
    Catatan_Kritis: 'Semua item dalam kondisi prima dan harum.',
    Total_Item_Diperiksa: 8,
    Total_Item_Lolos: 8,
    Detail_Ceklis: {
      'CHK-001': true,
      'CHK-002': true,
      'CHK-003': true,
      'CHK-004': true,
      'CHK-005': true,
      'CHK-006': true,
      'CHK-007': true,
      'CHK-008': true
    }
  },
  {
    id: 'INSP-102',
    Timestamp: '2026-09-25 06:45',
    ID_Lokasi: 'LOK-003',
    ID_Pengampu: 'PGP-001',
    Skor_Kebersihan: 75,
    Status_Warna: 'Kuning',
    Catatan_Kritis: 'Stok tisu menipis, pengharum ruangan habis.',
    Total_Item_Diperiksa: 8,
    Total_Item_Lolos: 6,
    Detail_Ceklis: {
      'CHK-001': false,
      'CHK-002': false,
      'CHK-003': true,
      'CHK-004': true,
      'CHK-005': true,
      'CHK-006': true,
      'CHK-007': true,
      'CHK-008': true
    }
  },
  {
    id: 'INSP-103',
    Timestamp: '2026-09-25 07:10',
    ID_Lokasi: 'LOK-004',
    ID_Pengampu: 'PGP-002',
    Skor_Kebersihan: 100,
    Status_Warna: 'Hijau',
    Catatan_Kritis: 'Lantai dipel kering dan diberi disinfektan.',
    Total_Item_Diperiksa: 8,
    Total_Item_Lolos: 8,
    Detail_Ceklis: {
      'CHK-001': true,
      'CHK-002': true,
      'CHK-003': true,
      'CHK-004': true,
      'CHK-005': true,
      'CHK-006': true,
      'CHK-007': true,
      'CHK-008': true
    }
  }
];

export const INITIAL_PENGADUAN: LogPengaduan[] = [
  {
    id: 'LAP-101',
    Timestamp: '2026-09-25 08:15',
    ID_Lokasi: 'LOK-002',
    Nama_Pelapor: 'Rina (Pengunjung Seminar)',
    Kontak_Pelapor: '081298761234',
    Detail_Keluhan: 'Air keran wastafel tidak mengalir dan lantai depan bilik 2 becek licin.',
    Status_Tindak_Lanjut: 'Pending',
    Kategori_Keluhan: 'Keran Rusak & Lantai Basah'
  },
  {
    id: 'LAP-102',
    Timestamp: '2026-09-25 08:10',
    ID_Lokasi: 'LOK-008',
    Nama_Pelapor: 'Ahmad Fauzi',
    Kontak_Pelapor: '085712345678',
    Detail_Keluhan: 'Bau tak sedap menyengat dan sabun cuci tangan habis.',
    Status_Tindak_Lanjut: 'Pending',
    Kategori_Keluhan: 'Bau & Habis Sabun'
  },
  {
    id: 'LAP-103',
    Timestamp: '2026-09-25 08:20',
    ID_Lokasi: 'LOK-015',
    Nama_Pelapor: 'Dimas Kurnia',
    Kontak_Pelapor: '082199887766',
    Detail_Keluhan: 'Tempat sampah meluap dan kunci pintu bilik nomor 1 rusak macet.',
    Status_Tindak_Lanjut: 'Pending',
    Kategori_Keluhan: 'Fasilitas Rusak'
  },
  {
    id: 'LAP-099',
    Timestamp: '2026-09-24 14:10',
    ID_Lokasi: 'LOK-001',
    Nama_Pelapor: 'Fajar Nugraha',
    Detail_Keluhan: 'Tisu gulung habis di bilik tengah.',
    Status_Tindak_Lanjut: 'Selesai',
    Waktu_Selesai: '2026-09-24 14:25',
    Catatan_Penyelesaian: 'Tisu sudah diganti dengan rol baru oleh Budi Santoso.',
    Petugas_Penangan: 'Budi Santoso'
  }
];

// Initial Data untuk Form 2: Saran & Masukan
export const INITIAL_SARAN: SaranPelayanan[] = [
  {
    id: 'SRN-001',
    Timestamp: '2026-09-25 08:30',
    ID_Lokasi: 'LOK-001',
    Nama_Pemberi_Saran: 'Drs. Hendro Wibowo',
    Kontak: 'hendro@kampus.ac.id',
    Kategori_Saran: 'Fasilitas & Sarana',
    Judul_Saran: 'Penambahan Hand Dryer Otomatis',
    Detail_Saran: 'Mohon dipertimbangkan pemasangan hand dryer otomatis di dekat wastafel agar lebih higienis dan menghemat penggunaan tisu kertas.',
    Prioritas: 'Penting',
    Status_Tinjauan: 'Diproses',
    Tanggapan_Supervisor: 'Usulan telah dimasukkan dalam pengadaan sarana sanitasi triwulan IV.'
  },
  {
    id: 'SRN-002',
    Timestamp: '2026-09-25 09:15',
    ID_Lokasi: 'LOK-005',
    Nama_Pemberi_Saran: 'Nadia Putri (Alumni)',
    Kontak: 'nadia.putri@email.com',
    Kategori_Saran: 'Aksesibilitas / Difabel',
    Judul_Saran: 'Pegangan Tangan di Toilet Difabel Perlu Sedikit Ditinggikan',
    Detail_Saran: 'Pegangan tangan (handrail) sudah sangat membantu, jika memungkinkan dibuat sedikit lebih kokoh dan ditambah tombol darurat bel difabel.',
    Prioritas: 'Penting',
    Status_Tinjauan: 'Diimplementasikan',
    Tanggapan_Supervisor: 'Tim teknis fasilitas telah memeriksa dan memasang bel wireless darurat.'
  },
  {
    id: 'SRN-003',
    Timestamp: '2026-09-24 11:20',
    ID_Lokasi: 'LOK-014',
    Nama_Pemberi_Saran: 'Anonim (Pengunjung Kantin)',
    Kategori_Saran: 'Aroma & Kesegaran',
    Judul_Saran: 'Pengharum Ruangan Aroma Kopi / Jeruk Segar',
    Detail_Saran: 'Aroma kopi atau lemongrass sangat cocok untuk area sekitar kantin agar terasa lebih asri dan nyaman.',
    Prioritas: 'Biasa',
    Status_Tinjauan: 'Diterima',
    Tanggapan_Supervisor: 'Ide sangat menarik, akan diujicobakan pada pergantian isi aroma minggu depan.'
  }
];

// Initial Data untuk Form 3: Rating & Review Pengunjung
export const INITIAL_RATINGS: RatingReview[] = [
  {
    id: 'RAT-001',
    Timestamp: '2026-09-25 09:00',
    ID_Lokasi: 'LOK-001',
    Nama_Reviewer: 'drg. Maya Anggraini',
    Bintang: 5,
    Rating_Kebersihan_Lantai: 5,
    Rating_Ketersediaan_Air_Sabun: 5,
    Rating_Aroma_Keharuman: 5,
    Rating_Kesigapan_Petugas: 5,
    Komentar_Review: 'Sangat bersih, wangi, sabun cuci tangan wangi apel dan lantai selalu kering. Petugas sangat sigap dan ramah!',
    Rekomendasikan: true
  },
  {
    id: 'RAT-002',
    Timestamp: '2026-09-25 08:45',
    ID_Lokasi: 'LOK-004',
    Nama_Reviewer: 'Annisa Fitriani (Mahasiswi)',
    Bintang: 5,
    Rating_Kebersihan_Lantai: 5,
    Rating_Ketersediaan_Air_Sabun: 5,
    Rating_Aroma_Keharuman: 4,
    Rating_Kesigapan_Petugas: 5,
    Komentar_Review: 'Kaca cermin sangat bening, ada tisu tebal, pencahayaan terang dan terasa nyaman digunakan.',
    Rekomendasikan: true
  },
  {
    id: 'RAT-003',
    Timestamp: '2026-09-25 08:12',
    ID_Lokasi: 'LOK-002',
    Nama_Reviewer: 'Surya Pratama',
    Bintang: 2,
    Rating_Kebersihan_Lantai: 2,
    Rating_Ketersediaan_Air_Sabun: 2,
    Rating_Aroma_Keharuman: 3,
    Rating_Kesigapan_Petugas: 3,
    Komentar_Review: 'Tadi pagi ada sedikit genangan di dekat pintu masuk dan sabun kosong. Mohon dipercepat pembersihannya.',
    Rekomendasikan: false
  },
  {
    id: 'RAT-004',
    Timestamp: '2026-09-24 15:30',
    ID_Lokasi: 'LOK-006',
    Nama_Reviewer: 'Bambang Sudarmono (Narasumber)',
    Bintang: 5,
    Rating_Kebersihan_Lantai: 5,
    Rating_Ketersediaan_Air_Sabun: 5,
    Rating_Aroma_Keharuman: 5,
    Rating_Kesigapan_Petugas: 5,
    Komentar_Review: 'Ruang rapat bersih dan steril. Sangat mendukung kenyamanan acara rapat senat.',
    Rekomendasikan: true
  }
];

// Initial Data untuk Pesan Kartu Ucapan Footer
export const INITIAL_GREETINGS: GreetingMessage[] = [
  {
    id: 'GRT-001',
    nama: 'Keluarga Besar Cleaning Service',
    instansi: 'Divisi Kebersihan & Sanitasi',
    pesan: 'Terima kasih telah membuang sampah pada tempatnya dan menyiram kembali setelah digunakan. Senyum Anda adalah semangat kami!',
    waktu: 'Hari Ini, 07:00 WIB',
    emoji: '🌸'
  },
  {
    id: 'GRT-002',
    nama: 'Bapak Rektorat & Pimpinan',
    instansi: 'Manajemen Kampus',
    pesan: 'Kebersihan adalah sebagian dari iman dan cermin peradaban luhur. Mari jaga fasilitas bersama dengan penuh rasa saling menghargai.',
    waktu: 'Kemarin, 16:00 WIB',
    emoji: '🏛️'
  },
  {
    id: 'GRT-003',
    nama: 'Dewan Mahasiswa & Pengunjung',
    instansi: 'Civitas Akademika',
    pesan: 'Apresiasi setinggi-tingginya untuk seluruh petugas kebersihan yang bekerja tanpa lelah menjaga lingkungan kita tetap asri dan wangi!',
    waktu: 'Kemarin, 11:30 WIB',
    emoji: '✨'
  }
];
