export interface GasFile {
  name: string;
  type: 'server' | 'html';
  description: string;
  code: string;
}

export const GAS_FILES: Record<string, GasFile> = {
  'Code.gs': {
    name: 'Code.gs',
    type: 'server',
    description: 'Logika server GAS: routing doGet, koneksi Google Sheets, kalkulasi skor kebersihan, notifikasi Telegram & API google.script.run',
    code: `/**
 * ============================================================================
 * SISTEM INFORMASI MONITORING KEBERSIHAN TOILET & RUANGAN (SIM-KTR)
 * Berbasis Google Apps Script (GAS) & Google Sheets Database
 * ============================================================================
 */

// KONFIGURASI TELEGRAM BOT (Ganti dengan Token & Chat ID Anda)
const TELEGRAM_CONFIG = {
  BOT_TOKEN: 'YOUR_TELEGRAM_BOT_TOKEN_HERE', // Contoh: '678912345:AAHdxx...
  DEFAULT_SUPERVISOR_CHAT_ID: 'YOUR_SUPERVISOR_CHAT_ID_HERE', // Contoh: '123456789'
  ENABLE_NOTIFICATION: true // Ubah false jika belum ingin mengirim notifikasi riil
};

// NAMA SHEET DATABASE
const SHEET_NAMES = {
  LOKASI: 'Master_Lokasi',
  PENGAMPU: 'Master_Pengampu',
  INSPEKSI: 'Log_Inspeksi',
  PENGADUAN: 'Log_Pengaduan'
};

/**
 * Helper untuk menyisipkan file HTML modular ke dalam template utama
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * ROUTING UTAMA (doGet)
 * Menangani routing dinamis berdasarkan parameter URL:
 * - Jika ?lokasi=ID_LOKASI -> Render Pengaduan.html (Publik)
 * - Jika ?page=publik -> Render Publik.html (Dasbor Publik Standalone)
 * - Jika tanpa parameter -> Render Index.html (Dasbor Publik, Login & Petugas/Supervisor)
 */
function doGet(e) {
  const params = e ? e.parameter : {};
  const idLokasi = params.lokasi;
  const page = params.page;

  if (idLokasi) {
    // Mode Publik: Pengaduan via Scan QR Code
    const template = HtmlService.createTemplateFromFile('Pengaduan');
    const roomInfo = getRoomInfoById(idLokasi);
    template.idLokasi = idLokasi;
    template.namaRuangan = roomInfo ? roomInfo.Nama_Ruangan : 'Ruangan Tidak Dikenal';
    template.kategori = roomInfo ? roomInfo.Kategori : 'Toilet';
    template.statusTerkini = roomInfo ? roomInfo.Status_Terkini : 'Kuning';
    
    return template.evaluate()
      .setTitle('Form Pengaduan Kebersihan - ' + (roomInfo ? roomInfo.Nama_Ruangan : idLokasi))
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else if (page === 'publik') {
    // Mode Khusus: Dasbor Publik Mandiri
    const template = HtmlService.createTemplateFromFile('Publik');
    return template.evaluate()
      .setTitle('Dasbor Monitoring Kebersihan Publik - SIM-KTR')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else {
    // Mode Aplikasi Utama: Shell Navigasi Lengkap
    const template = HtmlService.createTemplateFromFile('Index');
    return template.evaluate()
      .setTitle('SIM-KTR - Monitoring Kebersihan Toilet & Ruangan')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * DASBOR PUBLIK (Dapat diakses publik tanpa login)
 * Mengembalikan daftar kondisi toilet/ruangan dan riwayat laporan pengaduan
 */
function apiGetPublicDashboard() {
  const ss = getDb();
  const sheetLokasi = ss.getSheetByName(SHEET_NAMES.LOKASI);
  const sheetPengaduan = ss.getSheetByName(SHEET_NAMES.PENGADUAN);

  const lokasiList = [];
  const pengaduanList = [];

  if (sheetLokasi) {
    const dataLok = sheetLokasi.getDataRange().getValues();
    for (let i = 1; i < dataLok.length; i++) {
      lokasiList.push({
        ID_Lokasi: dataLok[i][0],
        Nama_Ruangan: dataLok[i][1],
        Kategori: dataLok[i][2],
        Status_Terkini: dataLok[i][4],
        Last_Update: dataLok[i][5]
      });
    }
  }

  if (sheetPengaduan) {
    const dataAdu = sheetPengaduan.getDataRange().getValues();
    for (let j = 1; j < dataAdu.length; j++) {
      pengaduanList.push({
        id: dataAdu[j][0],
        Timestamp: dataAdu[j][1],
        ID_Lokasi: dataAdu[j][2],
        Nama_Pelapor: dataAdu[j][3],
        Detail_Keluhan: dataAdu[j][4],
        Status_Tindak_Lanjut: dataAdu[j][5]
      });
    }
    pengaduanList.reverse(); // Terbaru di atas
  }

  return {
    success: true,
    lokasiList: lokasiList,
    pengaduanList: pengaduanList
  };
}

/**
 * Mendapatkan Spreadsheet yang aktif
 */
function getDb() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Inisialisasi otomatis sheet dan header jika belum ada
 * Jalankan fungsi ini 1x di Script Editor jika Spreadsheet masih kosong.
 */
function inisialisasiDatabase() {
  const ss = getDb();
  
  // 1. Master_Lokasi
  let sheetLokasi = ss.getSheetByName(SHEET_NAMES.LOKASI);
  if (!sheetLokasi) {
    sheetLokasi = ss.insertSheet(SHEET_NAMES.LOKASI);
    sheetLokasi.appendRow(['ID_Lokasi', 'Nama_Ruangan', 'Kategori', 'ID_Pengampu', 'Status_Terkini', 'Last_Update']);
    sheetLokasi.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#E2E8F0');
    // Sample Data
    sheetLokasi.appendRow(['LOK-001', 'Toilet Pria Lantai 1 (Lobby)', 'Toilet', 'PGP-001', 'Hijau', new Date().toLocaleString('id-ID')]);
    sheetLokasi.appendRow(['LOK-002', 'Toilet Wanita Lantai 1 (Lobby)', 'Toilet', 'PGP-002', 'Merah', new Date().toLocaleString('id-ID')]);
    sheetLokasi.appendRow(['LOK-003', 'Ruang Rapat Singosari Lt 2', 'Ruangan', 'PGP-001', 'Hijau', new Date().toLocaleString('id-ID')]);
  }

  // 2. Master_Pengampu
  let sheetPengampu = ss.getSheetByName(SHEET_NAMES.PENGAMPU);
  if (!sheetPengampu) {
    sheetPengampu = ss.insertSheet(SHEET_NAMES.PENGAMPU);
    sheetPengampu.appendRow(['ID_Pengampu', 'Nama_Petugas', 'Username', 'Password', 'Role', 'Kontak_Telegram']);
    sheetPengampu.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#E2E8F0');
    // Sample Staff
    sheetPengampu.appendRow(['PGP-001', 'Budi Santoso', 'budi', '123', 'Petugas', '@budi_cleaner']);
    sheetPengampu.appendRow(['PGP-002', 'Siti Rahmawati', 'siti', '123', 'Petugas', '@siti_rahma']);
    sheetPengampu.appendRow(['SPV-001', 'Agus Hendrawan (Supervisor)', 'admin', 'admin123', 'Supervisor', '@agus_supervisor']);
  }

  // 3. Log_Inspeksi
  let sheetInspeksi = ss.getSheetByName(SHEET_NAMES.INSPEKSI);
  if (!sheetInspeksi) {
    sheetInspeksi = ss.insertSheet(SHEET_NAMES.INSPEKSI);
    sheetInspeksi.appendRow([
      'Timestamp', 'ID_Lokasi', 'ID_Pengampu', 'Skor_Kebersihan', 'Status_Warna', 'Catatan_Kritis',
      'Param_Tisu', 'Param_Pengharum', 'Param_LantaiBersih', 'Param_KeranFungsi', 
      'Param_KunciBaik', 'Param_WastafelBersih', 'Param_KlosetHigienis', 'Param_TempatSampahKosong'
    ]);
    sheetInspeksi.getRange(1, 1, 1, 14).setFontWeight('bold').setBackground('#E2E8F0');
  }

  // 4. Log_Pengaduan
  let sheetPengaduan = ss.getSheetByName(SHEET_NAMES.PENGADUAN);
  if (!sheetPengaduan) {
    sheetPengaduan = ss.insertSheet(SHEET_NAMES.PENGADUAN);
    sheetPengaduan.appendRow(['ID_Pengaduan', 'Timestamp', 'ID_Lokasi', 'Nama_Pelapor', 'Detail_Keluhan', 'Status_Tindak_Lanjut']);
    sheetPengaduan.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#E2E8F0');
  }

  return { success: true, message: 'Database 4 sheet berhasil diinisialisasi!' };
}

/**
 * Helper: Ambil informasi ruangan berdasarkan ID_Lokasi
 */
function getRoomInfoById(idLokasi) {
  const ss = getDb();
  const sheet = ss.getSheetByName(SHEET_NAMES.LOKASI);
  if (!sheet) return null;
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == idLokasi) {
      return {
        ID_Lokasi: data[i][0],
        Nama_Ruangan: data[i][1],
        Kategori: data[i][2],
        ID_Pengampu: data[i][3],
        Status_Terkini: data[i][4],
        Last_Update: data[i][5]
      };
    }
  }
  return null;
}

/**
 * Autentikasi Login Petugas & Supervisor
 */
function apiLogin(username, password) {
  const ss = getDb();
  const sheet = ss.getSheetByName(SHEET_NAMES.PENGAMPU);
  if (!sheet) return { success: false, message: 'Database Master_Pengampu belum dibuat' };
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowUser = String(data[i][2]).trim();
    const rowPass = String(data[i][3]).trim();
    
    if (rowUser.toLowerCase() === String(username).trim().toLowerCase() && rowPass === String(password).trim()) {
      return {
        success: true,
        user: {
          ID_Pengampu: data[i][0],
          Nama_Petugas: data[i][1],
          Username: data[i][2],
          Role: data[i][4],
          Kontak_Telegram: data[i][5]
        }
      };
    }
  }
  return { success: false, message: 'Username atau Password salah!' };
}

/**
 * Mendapatkan data khusus Dasbor Petugas
 */
function apiGetPetugasDashboard(idPengampu) {
  const ss = getDb();
  const sheetLokasi = ss.getSheetByName(SHEET_NAMES.LOKASI);
  const sheetPengaduan = ss.getSheetByName(SHEET_NAMES.PENGADUAN);
  
  const lokasiList = [];
  const pendingPengaduan = [];
  
  if (sheetLokasi) {
    const dataLok = sheetLokasi.getDataRange().getValues();
    for (let i = 1; i < dataLok.length; i++) {
      if (dataLok[i][3] == idPengampu) {
        lokasiList.push({
          ID_Lokasi: dataLok[i][0],
          Nama_Ruangan: dataLok[i][1],
          Kategori: dataLok[i][2],
          ID_Pengampu: dataLok[i][3],
          Status_Terkini: dataLok[i][4],
          Last_Update: dataLok[i][5]
        });
      }
    }
  }

  if (sheetPengaduan) {
    const dataAdu = sheetPengaduan.getDataRange().getValues();
    // Filter pengaduan pending untuk ruangan milik pengampu ini
    const myRoomIds = lokasiList.map(r => r.ID_Lokasi);
    for (let j = 1; j < dataAdu.length; j++) {
      const roomAdu = dataAdu[j][2];
      const statusAdu = dataAdu[j][5];
      if (myRoomIds.includes(roomAdu) && statusAdu === 'Pending') {
        pendingPengaduan.push({
          id: dataAdu[j][0],
          Timestamp: dataAdu[j][1],
          ID_Lokasi: dataAdu[j][2],
          Nama_Pelapor: dataAdu[j][3],
          Detail_Keluhan: dataAdu[j][4],
          Status_Tindak_Lanjut: dataAdu[j][5]
        });
      }
    }
  }

  return {
    success: true,
    lokasiList: lokasiList,
    pendingPengaduan: pendingPengaduan
  };
}

/**
 * SUBMIT PENGADUAN PUBLIK (Dari Scan QR Code)
 * 1. Simpan ke Sheet 'Log_Pengaduan'
 * 2. Ubah Status_Terkini ruangan menjadi '🔴 Merah'
 * 3. Kirim notifikasi Telegram ke Petugas Pengampu & Supervisor
 */
function apiSubmitPengaduan(idLokasi, namaPelapor, detailKeluhan) {
  const ss = getDb();
  const sheetAdu = ss.getSheetByName(SHEET_NAMES.PENGADUAN);
  const sheetLok = ss.getSheetByName(SHEET_NAMES.LOKASI);
  const sheetPengampu = ss.getSheetByName(SHEET_NAMES.PENGAMPU);
  
  if (!sheetAdu || !sheetLok) {
    return { success: false, message: 'Database belum siap.' };
  }

  const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
  const idPengaduan = 'ADU-' + new Date().getTime().toString().slice(-6);

  // 1. Simpan log pengaduan
  sheetAdu.appendRow([idPengaduan, timestamp, idLokasi, namaPelapor, detailKeluhan, 'Pending']);

  // 2. Ubah status ruangan menjadi Merah di Master_Lokasi
  const dataLok = sheetLok.getDataRange().getValues();
  let namaRuangan = idLokasi;
  let idPengampu = '';
  
  for (let i = 1; i < dataLok.length; i++) {
    if (dataLok[i][0] == idLokasi) {
      namaRuangan = dataLok[i][1];
      idPengampu = dataLok[i][3];
      // Update Kolom 5 (Status_Terkini) & Kolom 6 (Last_Update)
      sheetLok.getRange(i + 1, 5).setValue('Merah');
      sheetLok.getRange(i + 1, 6).setValue(timestamp);
      break;
    }
  }

  // 3. Cari info petugas pengampu untuk notifikasi Telegram
  let kontakTelegram = TELEGRAM_CONFIG.DEFAULT_SUPERVISOR_CHAT_ID;
  let namaPetugas = 'Petugas Piket';
  if (sheetPengampu && idPengampu) {
    const dataP = sheetPengampu.getDataRange().getValues();
    for (let k = 1; k < dataP.length; k++) {
      if (dataP[k][0] == idPengampu) {
        namaPetugas = dataP[k][1];
        if (dataP[k][5]) kontakTelegram = dataP[k][5];
        break;
      }
    }
  }

  // Pesan Telegram
  const pesanTelegram = 
    "🚨 *PENGADUAN KEBERSIHAN BARU!*\\n\\n" +
    "📍 *Ruangan:* " + namaRuangan + " (" + idLokasi + ")\\n" +
    "👤 *Pelapor:* " + namaPelapor + "\\n" +
    "📝 *Keluhan:* " + detailKeluhan + "\\n" +
    "⚠️ *Status Ruangan:* 🔴 MERAH\\n" +
    "👷 *Petugas Bertugas:* " + namaPetugas + "\\n" +
    "⏰ *Waktu:* " + timestamp + "\\n\\n" +
    "Mohon segera lakukan peninjauan dan tindak lanjut di lokasi!";

  sendTelegramNotification(kontakTelegram, pesanTelegram);

  return {
    success: true,
    idPengaduan: idPengaduan,
    message: 'Laporan pengaduan berhasil dikirim! Status ruangan telah diperbarui menjadi Merah.'
  };
}

/**
 * SUBMIT INSPEKSI PETUGAS
 * Menghitung skor checklist (0-100), menentukan status warna (Hijau/Kuning/Merah),
 * mencatat log inspeksi, dan mengupdate Master_Lokasi.
 */
function apiSubmitInspeksi(idLokasi, idPengampu, params, catatanKritis) {
  const ss = getDb();
  const sheetInspeksi = ss.getSheetByName(SHEET_NAMES.INSPEKSI);
  const sheetLok = ss.getSheetByName(SHEET_NAMES.LOKASI);

  if (!sheetInspeksi || !sheetLok) {
    return { success: false, message: 'Database belum siap.' };
  }

  // Parameter Checklist: 8 poin
  const keys = [
    'tisu', 'pengharum', 'lantaiBersih', 'keranFungsi',
    'kunciBaik', 'wastafelBersih', 'klosetHigienis', 'tempatSampahKosong'
  ];

  let trueCount = 0;
  keys.forEach(function(k) {
    if (params[k] === true || params[k] === 'true') trueCount++;
  });

  const skor = Math.round((trueCount / keys.length) * 100);

  // Penentuan Status Warna:
  // >= 85: Hijau | 70 - 84: Kuning | < 70: Merah
  let statusWarna = 'Hijau';
  if (skor < 70) {
    statusWarna = 'Merah';
  } else if (skor < 85) {
    statusWarna = 'Kuning';
  }

  const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

  // Catat ke Log_Inspeksi
  sheetInspeksi.appendRow([
    timestamp,
    idLokasi,
    idPengampu,
    skor,
    statusWarna,
    catatanKritis || '-',
    params.tisu ? 'Ya' : 'Tidak',
    params.pengharum ? 'Ya' : 'Tidak',
    params.lantaiBersih ? 'Ya' : 'Tidak',
    params.keranFungsi ? 'Ya' : 'Tidak',
    params.kunciBaik ? 'Ya' : 'Tidak',
    params.wastafelBersih ? 'Ya' : 'Tidak',
    params.klosetHigienis ? 'Ya' : 'Tidak',
    params.tempatSampahKosong ? 'Ya' : 'Tidak'
  ]);

  // Update Status Ruangan di Master_Lokasi
  const dataLok = sheetLok.getDataRange().getValues();
  let namaRuangan = idLokasi;
  for (let i = 1; i < dataLok.length; i++) {
    if (dataLok[i][0] == idLokasi) {
      namaRuangan = dataLok[i][1];
      sheetLok.getRange(i + 1, 5).setValue(statusWarna);
      sheetLok.getRange(i + 1, 6).setValue(timestamp);
      break;
    }
  }

  // Jika hasil inspeksi menunjukkan Merah, kirim peringatan Telegram ke Supervisor
  if (statusWarna === 'Merah') {
    const alertMsg = 
      "⚠️ *PERINGATAN KONDISI KRITIS (MERAH)*\\n\\n" +
      "📍 *Ruangan:* " + namaRuangan + "\\n" +
      "📊 *Skor Kebersihan:* " + skor + "%\\n" +
      "📌 *Catatan:* " + (catatanKritis || 'Perlu pembersihan menyeluruh') + "\\n" +
      "👷 *Pengampu:* " + idPengampu + "\\n" +
      "⏰ *Waktu:* " + timestamp;
    sendTelegramNotification(TELEGRAM_CONFIG.DEFAULT_SUPERVISOR_CHAT_ID, alertMsg);
  }

  return {
    success: true,
    skor: skor,
    statusWarna: statusWarna,
    message: 'Hasil inspeksi berhasil disimpan! Skor: ' + skor + '% (' + statusWarna + ')'
  };
}

/**
 * TINDAK LANJUT PENGADUAN
 * Mengubah status pengaduan menjadi Selesai & mengevaluasi kembali status ruangan
 */
function apiTindakLanjutiPengaduan(idPengaduan, idLokasi, catatanTindakLanjut) {
  try {
    const ss = getDb();
    const sheetAdu = ss.getSheetByName(SHEET_NAMES.PENGADUAN);
    const sheetLok = ss.getSheetByName(SHEET_NAMES.LOKASI);

    if (!sheetAdu || !sheetLok) return { success: false, message: 'Database error: Sheet pengaduan/lokasi tidak ditemukan.' };

    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const targetAduId = String(idPengaduan).trim().toUpperCase();
    const targetLokId = String(idLokasi).trim().toUpperCase();
    const catatan = catatanTindakLanjut || 'Telah ditindaklanjuti dan dibersihkan.';

    const dataAdu = sheetAdu.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < dataAdu.length; i++) {
      if (String(dataAdu[i][0]).trim().toUpperCase() === targetAduId) {
        sheetAdu.getRange(i + 1, 6).setValue('Selesai');
        sheetAdu.getRange(i + 1, 7).setValue(timestamp);
        sheetAdu.getRange(i + 1, 8).setValue(catatan);
        found = true;
        break;
      }
    }

    if (!found) {
      return { success: false, message: 'ID Pengaduan ' + idPengaduan + ' tidak ditemukan di sheet.' };
    }

    // Cek apakah masih ada pengaduan pending lain untuk ruangan ini
    let adaPendingLain = false;
    const dataAduBaru = sheetAdu.getDataRange().getValues();
    for (let j = 1; j < dataAduBaru.length; j++) {
      const rowLok = String(dataAduBaru[j][2]).trim().toUpperCase();
      const rowStatus = String(dataAduBaru[j][5]).trim();
      const rowId = String(dataAduBaru[j][0]).trim().toUpperCase();
      if (rowLok === targetLokId && rowStatus === 'Pending' && rowId !== targetAduId) {
        adaPendingLain = true;
        break;
      }
    }

    // Jika tidak ada pengaduan pending lagi, kembalikan status ke Hijau
    if (!adaPendingLain) {
      const dataLok = sheetLok.getDataRange().getValues();
      for (let k = 1; k < dataLok.length; k++) {
        if (String(dataLok[k][0]).trim().toUpperCase() === targetLokId) {
          sheetLok.getRange(k + 1, 5).setValue('Hijau');
          sheetLok.getRange(k + 1, 6).setValue(timestamp);
          break;
        }
      }
    }

    return {
      success: true,
      message: 'Pengaduan ' + idPengaduan + ' berhasil diselesaikan! ' + (!adaPendingLain ? 'Status ruangan kembali normal (Hijau).' : 'Masih ada keluhan pending lain di ruangan ini.')
    };
  } catch (err) {
    return { success: false, message: 'Error tindak lanjut: ' + err.toString() };
  }
}

/**
 * Mendapatkan seluruh data untuk Dasbor Supervisor
 */
function apiGetSupervisorDashboard() {
  try {
    const ss = getDb();
    
    // Auto-inisialisasi database jika sheet belum ada
    if (!ss.getSheetByName(SHEET_NAMES.LOKASI) || !ss.getSheetByName(SHEET_NAMES.PENGAMPU)) {
      inisialisasiDatabase();
    }

    const sheetLok = ss.getSheetByName(SHEET_NAMES.LOKASI);
    const sheetPengampu = ss.getSheetByName(SHEET_NAMES.PENGAMPU);
    const sheetInspeksi = ss.getSheetByName(SHEET_NAMES.INSPEKSI);
    const sheetAdu = ss.getSheetByName(SHEET_NAMES.PENGADUAN);

    const lokasi = [];
    const pengampu = [];
    const inspeksi = [];
    const pengaduan = [];

    // Helper konversi nilai sel agar aman diserialisasi JSON di google.script.run
    function safeCell(val) {
      if (val === null || val === undefined) return '';
      if (val instanceof Date) {
        return Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
      }
      return String(val);
    }

    if (sheetLok) {
      const rows = sheetLok.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i][0]) continue;
        lokasi.push({
          ID_Lokasi: safeCell(rows[i][0]),
          Nama_Ruangan: safeCell(rows[i][1]),
          Kategori: safeCell(rows[i][2]),
          ID_Pengampu: safeCell(rows[i][3]),
          Status_Terkini: safeCell(rows[i][4]) || 'Hijau',
          Last_Update: safeCell(rows[i][5])
        });
      }
    }

    if (sheetPengampu) {
      const rows = sheetPengampu.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i][0]) continue;
        pengampu.push({
          ID_Pengampu: safeCell(rows[i][0]),
          Nama_Petugas: safeCell(rows[i][1]),
          Username: safeCell(rows[i][2]),
          Password: safeCell(rows[i][3]),
          Role: safeCell(rows[i][4]),
          Kontak_Telegram: safeCell(rows[i][5])
        });
      }
    }

    if (sheetInspeksi) {
      const rows = sheetInspeksi.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i][0]) continue;
        inspeksi.push({
          Timestamp: safeCell(rows[i][0]),
          ID_Lokasi: safeCell(rows[i][1]),
          ID_Pengampu: safeCell(rows[i][2]),
          Skor_Kebersihan: Number(rows[i][3]) || 0,
          Status_Warna: safeCell(rows[i][4]),
          Catatan_Kritis: safeCell(rows[i][5])
        });
      }
    }

    if (sheetAdu) {
      const rows = sheetAdu.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i][0]) continue;
        pengaduan.push({
          id: safeCell(rows[i][0]),
          Timestamp: safeCell(rows[i][1]),
          ID_Lokasi: safeCell(rows[i][2]),
          Nama_Pelapor: safeCell(rows[i][3]),
          Detail_Keluhan: safeCell(rows[i][4]),
          Status_Tindak_Lanjut: safeCell(rows[i][5]) || 'Pending',
          Waktu_Selesai: safeCell(rows[i][6]) || '',
          Catatan_Penyelesaian: safeCell(rows[i][7]) || ''
        });
      }
    }

    // Hitung Leaderboard Performa Petugas
    const leaderboard = calculateLeaderboard(pengampu, inspeksi);

    // Ambil Web App URL dengan aman tanpa memicu exception
    let appUrl = '';
    try {
      appUrl = ScriptApp.getService().getUrl() || '';
    } catch (eUrl) {
      appUrl = '';
    }

    return {
      success: true,
      lokasi: lokasi,
      pengampu: pengampu,
      inspeksi: inspeksi,
      pengaduan: pengaduan,
      leaderboard: leaderboard,
      webAppUrl: appUrl
    };
  } catch (err) {
    Logger.log('Error apiGetSupervisorDashboard: ' + err.toString());
    return {
      success: false,
      message: 'Gagal memuat data supervisor: ' + err.toString()
    };
  }
}

/**
 * Kalkulasi Leaderboard Retensi Kebersihan Petugas
 */
function calculateLeaderboard(pengampuList, inspeksiList) {
  const stats = {};
  
  if (!pengampuList || !Array.isArray(pengampuList)) return [];

  pengampuList.filter(p => p && p.Role === 'Petugas').forEach(p => {
    stats[p.ID_Pengampu] = {
      ID_Pengampu: p.ID_Pengampu,
      Nama_Petugas: p.Nama_Petugas,
      totalInspeksi: 0,
      totalSkor: 0,
      hijauCount: 0,
      kuningCount: 0,
      merahCount: 0,
      rataRataSkor: 0
    };
  });

  if (inspeksiList && Array.isArray(inspeksiList)) {
    inspeksiList.forEach(insp => {
      const pId = insp.ID_Pengampu;
      if (stats[pId]) {
        stats[pId].totalInspeksi += 1;
        stats[pId].totalSkor += Number(insp.Skor_Kebersihan) || 0;
        if (insp.Status_Warna === 'Hijau') stats[pId].hijauCount += 1;
        if (insp.Status_Warna === 'Kuning') stats[pId].kuningCount += 1;
        if (insp.Status_Warna === 'Merah') stats[pId].merahCount += 1;
      }
    });
  }

  const result = Object.values(stats).map(s => {
    s.rataRataSkor = s.totalInspeksi > 0 ? Math.round(s.totalSkor / s.totalInspeksi) : 0;
    return s;
  });

  // Urutkan berdasarkan rata-rata skor tertinggi
  result.sort((a, b) => b.rataRataSkor - a.rataRataSkor);
  return result;
}

/**
 * CRUD Master_Lokasi
 */
function apiSaveLokasi(data, isEdit) {
  try {
    const ss = getDb();
    let sheet = ss.getSheetByName(SHEET_NAMES.LOKASI);
    if (!sheet) {
      inisialisasiDatabase();
      sheet = ss.getSheetByName(SHEET_NAMES.LOKASI);
    }
    if (!sheet) return { success: false, message: 'Sheet ' + SHEET_NAMES.LOKASI + ' tidak ditemukan.' };

    const values = sheet.getDataRange().getValues();
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
    const targetId = String(data.ID_Lokasi).trim().toUpperCase();

    if (isEdit) {
      let found = false;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim().toUpperCase() === targetId) {
          sheet.getRange(i + 1, 2).setValue(data.Nama_Ruangan);
          sheet.getRange(i + 1, 3).setValue(data.Kategori);
          sheet.getRange(i + 1, 4).setValue(data.ID_Pengampu);
          sheet.getRange(i + 1, 6).setValue(timestamp);
          found = true;
          break;
        }
      }
      if (found) {
        return { success: true, message: 'Data ruangan ' + targetId + ' berhasil diperbarui!' };
      } else {
        return { success: false, message: 'ID Lokasi ' + targetId + ' tidak ditemukan di sheet.' };
      }
    } else {
      // Periksa duplikasi ID Lokasi
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim().toUpperCase() === targetId) {
          return { success: false, message: 'ID Lokasi ' + targetId + ' sudah ada! Gunakan ID lain.' };
        }
      }
      sheet.appendRow([
        data.ID_Lokasi,
        data.Nama_Ruangan,
        data.Kategori,
        data.ID_Pengampu || 'PGP-001',
        'Hijau',
        timestamp
      ]);
      return { success: true, message: 'Ruangan baru "' + data.Nama_Ruangan + '" (' + data.ID_Lokasi + ') berhasil ditambahkan!' };
    }
  } catch (err) {
    return { success: false, message: 'Error server apiSaveLokasi: ' + err.toString() };
  }
}

function apiDeleteLokasi(idLokasi) {
  try {
    const ss = getDb();
    const sheet = ss.getSheetByName(SHEET_NAMES.LOKASI);
    if (!sheet) return { success: false, message: 'Sheet tidak ditemukan' };

    const values = sheet.getDataRange().getValues();
    const targetId = String(idLokasi).trim().toUpperCase();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim().toUpperCase() === targetId) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Ruangan ' + targetId + ' berhasil dihapus!' };
      }
    }
    return { success: false, message: 'ID Lokasi ' + targetId + ' tidak ditemukan' };
  } catch (err) {
    return { success: false, message: 'Error hapus lokasi: ' + err.toString() };
  }
}

/**
 * CRUD Master_Pengampu
 */
function apiSavePengampu(data, isEdit) {
  try {
    const ss = getDb();
    let sheet = ss.getSheetByName(SHEET_NAMES.PENGAMPU);
    if (!sheet) {
      inisialisasiDatabase();
      sheet = ss.getSheetByName(SHEET_NAMES.PENGAMPU);
    }
    if (!sheet) return { success: false, message: 'Sheet ' + SHEET_NAMES.PENGAMPU + ' tidak ditemukan.' };

    const values = sheet.getDataRange().getValues();
    const targetId = String(data.ID_Pengampu).trim().toUpperCase();

    if (isEdit) {
      let found = false;
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim().toUpperCase() === targetId) {
          sheet.getRange(i + 1, 2).setValue(data.Nama_Petugas);
          sheet.getRange(i + 1, 3).setValue(data.Username);
          if (data.Password && String(data.Password).trim() !== '') {
            sheet.getRange(i + 1, 4).setValue(data.Password);
          }
          sheet.getRange(i + 1, 5).setValue(data.Role);
          sheet.getRange(i + 1, 6).setValue(data.Kontak_Telegram || '-');
          found = true;
          break;
        }
      }
      if (found) {
        return { success: true, message: 'Data petugas ' + targetId + ' berhasil diperbarui!' };
      } else {
        return { success: false, message: 'ID Petugas ' + targetId + ' tidak ditemukan di sheet.' };
      }
    } else {
      // Periksa duplikasi ID Pengampu dan Username
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][0]).trim().toUpperCase() === targetId) {
          return { success: false, message: 'ID Petugas ' + targetId + ' sudah ada! Gunakan ID lain.' };
        }
        if (String(values[i][2]).trim().toLowerCase() === String(data.Username).trim().toLowerCase()) {
          return { success: false, message: 'Username "' + data.Username + '" sudah digunakan oleh petugas lain!' };
        }
      }
      sheet.appendRow([
        data.ID_Pengampu,
        data.Nama_Petugas,
        data.Username,
        data.Password || '123456',
        data.Role || 'Petugas',
        data.Kontak_Telegram || '-'
      ]);
      return { success: true, message: 'Petugas baru "' + data.Nama_Petugas + '" (' + data.ID_Pengampu + ') berhasil ditambahkan!' };
    }
  } catch (err) {
    return { success: false, message: 'Error server apiSavePengampu: ' + err.toString() };
  }
}

function apiDeletePengampu(idPengampu) {
  try {
    const ss = getDb();
    const sheet = ss.getSheetByName(SHEET_NAMES.PENGAMPU);
    if (!sheet) return { success: false, message: 'Sheet tidak ditemukan' };

    const values = sheet.getDataRange().getValues();
    const targetId = String(idPengampu).trim().toUpperCase();
    for (let i = 1; i < values.length; i++) {
      if (String(values[i][0]).trim().toUpperCase() === targetId) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Petugas ' + targetId + ' berhasil dihapus!' };
      }
    }
    return { success: false, message: 'ID Pengampu ' + targetId + ' tidak ditemukan' };
  } catch (err) {
    return { success: false, message: 'Error hapus pengampu: ' + err.toString() };
  }
}

/**
 * PENGIRIMAN NOTIFIKASI TELEGRAM
 * Dipicu saat ada Pengaduan Baru atau Status Berubah Menjadi Merah
 */
function sendTelegramNotification(targetChatId, messageText) {
  if (!TELEGRAM_CONFIG.ENABLE_NOTIFICATION) {
    Logger.log('Telegram disabled. Log pesan:\\n' + messageText);
    return false;
  }

  // Ekstrak numerik chat ID jika berupa string username atau ID format
  let cleanChatId = targetChatId;
  const matchId = String(targetChatId).match(/\\d{7,15}/);
  if (matchId) {
    cleanChatId = matchId[0];
  }

  if (!cleanChatId || cleanChatId === 'YOUR_SUPERVISOR_CHAT_ID_HERE') {
    cleanChatId = TELEGRAM_CONFIG.DEFAULT_SUPERVISOR_CHAT_ID;
  }

  const url = 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/sendMessage';
  const payload = {
    chat_id: cleanChatId,
    text: messageText,
    parse_mode: 'Markdown'
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    if (result.ok) {
      Logger.log('Notifikasi Telegram sukses terkirim ke ' + cleanChatId);
      return true;
    } else {
      Logger.log('Telegram API Error: ' + result.description);
      return false;
    }
  } catch (err) {
    Logger.log('Error fetch Telegram: ' + err.toString());
    return false;
  }
}
`
  },

  'Index.html': {
    name: 'Index.html',
    type: 'html',
    description: 'Template shell utama aplikasi dengan navigasi Dasbor Publik (tanpa login), Login, serta Dasbor Petugas & Supervisor',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>SIM-KTR - Monitoring Kebersihan</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#eff6ff',
              500: '#2563eb',
              600: '#1d4ed8',
              700: '#1e40af',
              800: '#1e3a8a'
            }
          }
        }
      }
    }
  </script>
  <style>
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }
    }
  </style>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen flex flex-col font-sans antialiased">

  <!-- NAVBAR UTAMA -->
  <header class="bg-blue-700 text-white shadow-md sticky top-0 z-40 no-print">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center space-x-3 cursor-pointer" onclick="showView('publik')">
          <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl font-bold border border-white/20">
            <i class="fa-solid fa-broom-ball text-white"></i>
          </div>
          <div>
            <h1 class="text-base sm:text-lg font-bold leading-tight tracking-tight">SIM-KTR</h1>
            <p class="text-xs text-blue-200">Sistem Monitoring Kebersihan</p>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="flex items-center space-x-2 sm:space-x-3">
          <button onclick="showView('publik')" id="nav-btn-publik" class="px-3 py-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 transition flex items-center space-x-1.5 text-xs font-semibold">
            <i class="fa-solid fa-globe"></i>
            <span>Dasbor Publik</span>
          </button>

          <!-- Guest Login Button -->
          <div id="nav-guest-area">
            <button onclick="showView('login')" class="px-3.5 py-1.5 rounded-xl bg-white text-blue-800 hover:bg-blue-50 transition flex items-center space-x-1.5 text-xs font-bold shadow-sm">
              <i class="fa-solid fa-right-to-bracket"></i>
              <span>Login Petugas</span>
            </button>
          </div>

          <!-- Logged In User Menu -->
          <div id="nav-user-area" class="hidden flex items-center space-x-3">
            <button onclick="renderDashboardForRole()" class="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold">
              <i class="fa-solid fa-gauge mr-1"></i>
              <span id="nav-user-name">Nama Pengguna</span>
            </button>
            <button onclick="logout()" title="Keluar" class="p-2 rounded-lg bg-blue-800 hover:bg-blue-900 transition text-xs font-medium">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- CONTAINER KONTEN DINAMIS -->
  <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
    <!-- View 0: Dasbor Publik (Terbuka untuk siapa saja tanpa login) -->
    <div id="view-publik">
      <?!= include('Publik'); ?>
    </div>

    <!-- View 1: Login Screen -->
    <div id="view-login" class="hidden">
      <?!= include('Login'); ?>
    </div>

    <!-- View 2: Dasbor Petugas -->
    <div id="view-petugas" class="hidden">
      <?!= include('Petugas'); ?>
    </div>

    <!-- View 3: Dasbor Supervisor -->
    <div id="view-supervisor" class="hidden">
      <?!= include('Supervisor'); ?>
    </div>
  </main>

  <!-- FOOTER -->
  <footer class="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
    <div class="max-w-7xl mx-auto px-4">
      <p>&copy; 2026 SIM-KTR - Monitoring Kebersihan Toilet & Ruangan. Powered by Google Apps Script & Google Sheets.</p>
    </div>
  </footer>

  <!-- TOAST NOTIFICATION CONTAINER -->
  <div id="toast-container" class="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none"></div>

  <!-- SCRIPT LOGIKA UTAMA CLIENT-SIDE -->
  <script>
    let CURRENT_USER = null;

    function showToast(message, type = 'info') {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      const colors = {
        success: 'bg-emerald-600 text-white',
        error: 'bg-rose-600 text-white',
        warning: 'bg-amber-600 text-white',
        info: 'bg-blue-600 text-white'
      };
      toast.className = \`px-4 py-3 rounded-xl shadow-lg \${colors[type] || colors.info} flex items-center space-x-3 text-sm font-medium transition-all transform duration-300 translate-y-2 opacity-0 pointer-events-auto\`;
      toast.innerHTML = \`<span>\${message}</span>\`;
      container.appendChild(toast);
      setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 50);
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    window.addEventListener('DOMContentLoaded', () => {
      const savedUser = sessionStorage.getItem('simktr_user');
      if (savedUser) {
        try {
          CURRENT_USER = JSON.parse(savedUser);
          updateNavUser();
        } catch (e) {
          sessionStorage.removeItem('simktr_user');
        }
      }
      // Tampilan default saat pertama buka adalah Dasbor Publik
      showView('publik');
    });

    function showView(viewName) {
      document.getElementById('view-publik').classList.add('hidden');
      document.getElementById('view-login').classList.add('hidden');
      document.getElementById('view-petugas').classList.add('hidden');
      document.getElementById('view-supervisor').classList.add('hidden');

      const navGuest = document.getElementById('nav-guest-area');
      const navUser = document.getElementById('nav-user-area');

      if (CURRENT_USER) {
        navGuest.classList.add('hidden');
        navUser.classList.remove('hidden');
      } else {
        navGuest.classList.remove('hidden');
        navUser.classList.add('hidden');
      }

      if (viewName === 'publik') {
        document.getElementById('view-publik').classList.remove('hidden');
        if (typeof loadPublicData === 'function') loadPublicData();
      } else if (viewName === 'login') {
        document.getElementById('view-login').classList.remove('hidden');
      } else if (viewName === 'petugas') {
        document.getElementById('view-petugas').classList.remove('hidden');
        if (typeof loadPetugasData === 'function') loadPetugasData();
      } else if (viewName === 'supervisor') {
        document.getElementById('view-supervisor').classList.remove('hidden');
        if (typeof loadSupervisorData === 'function') loadSupervisorData();
      }
    }

    function updateNavUser() {
      if (CURRENT_USER) {
        document.getElementById('nav-user-name').innerText = CURRENT_USER.Nama_Petugas;
      }
    }

    function renderDashboardForRole() {
      if (!CURRENT_USER) {
        showView('login');
        return;
      }
      if (CURRENT_USER.Role === 'Supervisor') {
        showView('supervisor');
      } else {
        showView('petugas');
      }
    }

    function logout() {
      sessionStorage.removeItem('simktr_user');
      CURRENT_USER = null;
      showToast('Berhasil keluar dari sistem', 'info');
      showView('publik');
    }
  </script>
</body>
</html>
`
  },

  'Publik.html': {
    name: 'Publik.html',
    type: 'html',
    description: 'Dasbor publik (tanpa login): menampilkan kondisi ruangan & toilet secara real-time serta daftar keluhan/laporan dari pengguna',
    code: `<div id="public-dashboard-container" class="space-y-6">
  <!-- Hero Section -->
  <div class="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
    <div class="max-w-3xl space-y-2">
      <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-blue-200 text-xs font-semibold">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Akses Terbuka Publik & Real-Time</span>
      </div>
      <h2 class="text-xl sm:text-2xl font-black text-white">Dasbor Monitoring Kebersihan Toilet & Ruangan</h2>
      <p class="text-xs sm:text-sm text-blue-100">
        Informasi transparan kondisi kebersihan toilet dan ruangan. Anda dapat melihat status kebersihan terkini atau melaporkan fasilitas yang perlu penanganan cepat.
      </p>
    </div>
  </div>

  <!-- Statistik Cepat -->
  <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <span class="text-xs text-slate-500 font-semibold">Total Fasilitas</span>
      <p id="pub-total-rooms" class="text-2xl font-bold text-slate-800 mt-1">0</p>
    </div>
    <div class="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm bg-emerald-50/20">
      <span class="text-xs text-emerald-800 font-bold">🟢 Kondisi Bersih</span>
      <p id="pub-green-rooms" class="text-2xl font-bold text-emerald-600 mt-1">0</p>
    </div>
    <div class="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm bg-amber-50/20">
      <span class="text-xs text-amber-800 font-bold">🟡 Perhatian</span>
      <p id="pub-yellow-rooms" class="text-2xl font-bold text-amber-600 mt-1">0</p>
    </div>
    <div class="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm bg-rose-50/20">
      <span class="text-xs text-rose-800 font-bold">🔴 Butuh Tindakan</span>
      <p id="pub-red-rooms" class="text-2xl font-bold text-rose-600 mt-1">0</p>
    </div>
  </div>

  <!-- Switcher Tab: Kondisi vs Laporan -->
  <div class="bg-white p-1 rounded-2xl border border-slate-200 flex space-x-1 shadow-sm text-xs font-bold">
    <button onclick="switchPublicSection('kondisi')" id="pub-tab-kondisi" class="flex-1 py-2.5 rounded-xl bg-blue-600 text-white">
      <i class="fa-solid fa-building mr-1.5"></i> Kondisi Ruangan & Toilet
    </button>
    <button onclick="switchPublicSection('laporan')" id="pub-tab-laporan" class="flex-1 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100">
      <i class="fa-solid fa-bullhorn mr-1.5"></i> Daftar Keluhan & Laporan Pengguna
    </button>
  </div>

  <!-- BAGIAN 1: KONDISI RUANGAN & TOILET -->
  <div id="pub-section-kondisi" class="space-y-4">
    <div class="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="relative w-full sm:w-72">
        <i class="fa-solid fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
        <input type="text" id="pub-search-kondisi" oninput="filterPublicRooms()" placeholder="Cari nama ruangan atau ID..."
          class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none">
      </div>
      <div class="flex items-center space-x-2 w-full sm:w-auto">
        <select id="pub-filter-kategori" onchange="filterPublicRooms()" class="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white">
          <option value="">Semua Kategori</option>
          <option value="Toilet">Toilet</option>
          <option value="Ruangan">Ruangan</option>
        </select>
        <select id="pub-filter-status" onchange="filterPublicRooms()" class="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white">
          <option value="">Semua Status</option>
          <option value="Hijau">🟢 Bersih</option>
          <option value="Kuning">🟡 Perhatian</option>
          <option value="Merah">🔴 Butuh Tindakan</option>
        </select>
      </div>
    </div>

    <!-- Grid Kartu Ruangan -->
    <div id="pub-rooms-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="col-span-full p-8 text-center text-xs text-slate-400">Memuat kondisi fasilitas...</div>
    </div>
  </div>

  <!-- BAGIAN 2: DAFTAR KELUHAN & LAPORAN PENGGUNA -->
  <div id="pub-section-laporan" class="hidden space-y-4">
    <div class="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="relative w-full sm:w-72">
        <i class="fa-solid fa-search absolute left-3 top-2.5 text-slate-400 text-xs"></i>
        <input type="text" id="pub-search-laporan" oninput="filterPublicComplaints()" placeholder="Cari isi keluhan atau pelapor..."
          class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none">
      </div>
      <select id="pub-filter-tindaklanjut" onchange="filterPublicComplaints()" class="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 bg-white">
        <option value="">Semua Status Laporan</option>
        <option value="Pending">⏳ Sedang Ditangani (Pending)</option>
        <option value="Selesai">✅ Sudah Selesai Ditangani</option>
      </select>
    </div>

    <!-- Daftar Laporan Feed -->
    <div id="pub-complaints-list" class="space-y-3">
      <div class="p-8 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">Memuat laporan...</div>
    </div>
  </div>
</div>

<script>
  let PUBLIC_DATA = { lokasiList: [], pengaduanList: [] };

  function loadPublicData() {
    google.script.run
      .withSuccessHandler(res => {
        if (res && res.success) {
          PUBLIC_DATA = res;
          renderPublicDashboard();
        }
      })
      .apiGetPublicDashboard();
  }

  function renderPublicDashboard() {
    const rooms = PUBLIC_DATA.lokasiList || [];
    document.getElementById('pub-total-rooms').innerText = rooms.length;
    document.getElementById('pub-green-rooms').innerText = rooms.filter(r => r.Status_Terkini === 'Hijau').length;
    document.getElementById('pub-yellow-rooms').innerText = rooms.filter(r => r.Status_Terkini === 'Kuning').length;
    document.getElementById('pub-red-rooms').innerText = rooms.filter(r => r.Status_Terkini === 'Merah').length;

    filterPublicRooms();
    filterPublicComplaints();
  }

  function filterPublicRooms() {
    const q = (document.getElementById('pub-search-kondisi').value || '').toLowerCase();
    const kat = document.getElementById('pub-filter-kategori').value;
    const st = document.getElementById('pub-filter-status').value;

    const filtered = (PUBLIC_DATA.lokasiList || []).filter(r => {
      const matchQ = r.Nama_Ruangan.toLowerCase().includes(q) || r.ID_Lokasi.toLowerCase().includes(q);
      const matchKat = !kat || r.Kategori === kat;
      const matchSt = !st || r.Status_Terkini === st;
      return matchQ && matchKat && matchSt;
    });

    const grid = document.getElementById('pub-rooms-grid');
    if (!filtered.length) {
      grid.innerHTML = '<div class="col-span-full p-8 bg-white rounded-2xl border text-center text-xs text-slate-400">Tidak ada ruangan yang cocok.</div>';
      return;
    }

    grid.innerHTML = filtered.map(r => {
      const badgeClass = r.Status_Terkini === 'Hijau' ? 'bg-emerald-100 text-emerald-800' : (r.Status_Terkini === 'Kuning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800');
      const dotClass = r.Status_Terkini === 'Hijau' ? 'bg-emerald-500' : (r.Status_Terkini === 'Kuning' ? 'bg-amber-500' : 'bg-rose-500');

      return \`
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">\${r.Kategori}</span>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1.5 \${badgeClass}">
                <span class="w-1.5 h-1.5 rounded-full \${dotClass}"></span>
                <span>\${r.Status_Terkini}</span>
              </span>
            </div>
            <h4 class="text-sm font-bold text-slate-800 mt-2">\${r.Nama_Ruangan}</h4>
            <span class="text-xs text-slate-400 font-mono">Kode: \${r.ID_Lokasi}</span>
          </div>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span class="text-[11px] text-slate-400">Update: \${r.Last_Update ? r.Last_Update.split(' ')[1] || r.Last_Update : '-'}</span>
            <a href="?lokasi=\${encodeURIComponent(r.ID_Lokasi)}" target="_blank" class="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-[11px] transition">
              Laporkan Kondisi &rarr;
            </a>
          </div>
        </div>
      \`;
    }).join('');
  }

  function filterPublicComplaints() {
    const q = (document.getElementById('pub-search-laporan').value || '').toLowerCase();
    const st = document.getElementById('pub-filter-tindaklanjut').value;

    const filtered = (PUBLIC_DATA.pengaduanList || []).filter(c => {
      const matchQ = c.Detail_Keluhan.toLowerCase().includes(q) || c.Nama_Pelapor.toLowerCase().includes(q) || c.ID_Lokasi.toLowerCase().includes(q);
      const matchSt = !st || c.Status_Tindak_Lanjut === st;
      return matchQ && matchSt;
    });

    const list = document.getElementById('pub-complaints-list');
    if (!filtered.length) {
      list.innerHTML = '<div class="p-8 bg-white rounded-2xl border text-center text-xs text-slate-400">Belum ada laporan keluhan yang cocok.</div>';
      return;
    }

    list.innerHTML = filtered.map(c => {
      const isPending = c.Status_Tindak_Lanjut === 'Pending';
      return \`
        <div class="bg-white p-4 rounded-2xl border \${isPending ? 'border-rose-200' : 'border-slate-200'} shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-slate-800">[\${c.ID_Lokasi}]</span>
              <span class="text-[11px] text-slate-400">\${c.Timestamp}</span>
            </div>
            <p class="text-slate-700 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">"\${c.Detail_Keluhan}"</p>
            <span class="text-[11px] text-slate-500">Pelapor: <strong>\${c.Nama_Pelapor}</strong></span>
          </div>
          <div>
            <span class="px-3 py-1 rounded-full text-[11px] font-bold \${isPending ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}">
              \${isPending ? '⏳ Sedang Ditangani' : '✅ Selesai'}
            </span>
          </div>
        </div>
      \`;
    }).join('');
  }

  function switchPublicSection(sec) {
    if (sec === 'kondisi') {
      document.getElementById('pub-section-kondisi').classList.remove('hidden');
      document.getElementById('pub-section-laporan').classList.add('hidden');
      document.getElementById('pub-tab-kondisi').className = 'flex-1 py-2.5 rounded-xl bg-blue-600 text-white';
      document.getElementById('pub-tab-laporan').className = 'flex-1 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100';
    } else {
      document.getElementById('pub-section-kondisi').classList.add('hidden');
      document.getElementById('pub-section-laporan').classList.remove('hidden');
      document.getElementById('pub-tab-kondisi').className = 'flex-1 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100';
      document.getElementById('pub-tab-laporan').className = 'flex-1 py-2.5 rounded-xl bg-blue-600 text-white';
    }
  }
</script>
`
  },

  'Pengaduan.html': {
    name: 'Pengaduan.html',
    type: 'html',
    description: 'Halaman publik form pengaduan hasil scan QR Code oleh pengunjung. Otomatis menampilkan nama ruangan, form responsif, ubah status ke Merah & notif Telegram.',
    code: `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Pengaduan Kebersihan - SIM-KTR</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- FontAwesome -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="bg-gradient-to-b from-blue-50 to-slate-100 min-h-screen font-sans text-slate-800 antialiased flex flex-col justify-between p-4 sm:p-6">

  <div class="max-w-md w-full mx-auto bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden my-auto">
    <!-- Header Kartu -->
    <div class="bg-blue-600 px-6 py-6 text-white relative">
      <div class="flex items-center space-x-3 mb-2">
        <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl">
          <? if (kategori === 'Toilet') { ?>
            <i class="fa-solid fa-restroom"></i>
          <? } else { ?>
            <i class="fa-solid fa-door-open"></i>
          <? } ?>
        </div>
        <div>
          <span class="text-xs uppercase tracking-wider font-semibold text-blue-200">
            <?= kategori ?>
          </span>
          <h1 class="text-lg font-bold leading-tight"><?= namaRuangan ?></h1>
        </div>
      </div>
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-blue-500/40 text-xs">
        <span class="text-blue-100">Kode Lokasi: <strong><?= idLokasi ?></strong></span>
        <span class="px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1.5 
          <? if (statusTerkini === 'Hijau') { ?> bg-emerald-500/30 text-emerald-100 <? } else if (statusTerkini === 'Kuning') { ?> bg-amber-500/30 text-amber-100 <? } else { ?> bg-rose-500/30 text-rose-100 <? } ?>">
          <span class="w-2 h-2 rounded-full <? if (statusTerkini === 'Hijau') { ?> bg-emerald-400 <? } else if (statusTerkini === 'Kuning') { ?> bg-amber-400 <? } else { ?> bg-rose-400 <? } ?>"></span>
          <span>Status: <?= statusTerkini ?></span>
        </span>
      </div>
    </div>

    <!-- Form Body -->
    <div id="form-container" class="p-6">
      <div class="mb-5">
        <h2 class="text-base font-bold text-slate-800">Form Laporan Pengunjung</h2>
        <p class="text-xs text-slate-500 mt-0.5">Bantu kami menjaga kebersihan dengan melaporkan fasilitas yang perlu penanganan.</p>
      </div>

      <!-- Quick Issue Tags -->
      <div class="mb-4">
        <label class="block text-xs font-semibold text-slate-700 mb-1.5">Pilihan Cepat Masalah:</label>
        <div class="flex flex-wrap gap-1.5">
          <button type="button" onclick="addTag('Tisu habis')" class="quick-tag px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 transition">🧻 Tisu habis</button>
          <button type="button" onclick="addTag('Bau tidak sedap')" class="quick-tag px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 transition">💨 Bau tak sedap</button>
          <button type="button" onclick="addTag('Sabun kosong')" class="quick-tag px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 transition">🧼 Sabun kosong</button>
          <button type="button" onclick="addTag('Lantai becek licin')" class="quick-tag px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 transition">💧 Lantai becek</button>
          <button type="button" onclick="addTag('Keran/Kloset rusak')" class="quick-tag px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 transition">🔧 Keran rusak</button>
          <button type="button" onclick="addTag('Tempat sampah penuh')" class="quick-tag px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-700 transition">🗑️ Sampah penuh</button>
        </div>
      </div>

      <form id="pengaduan-form" onsubmit="handlePengaduanSubmit(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Pengunjung / Pelapor <span class="text-rose-500">*</span></label>
          <div class="relative">
            <i class="fa-regular fa-user absolute left-3.5 top-3 text-slate-400 text-sm"></i>
            <input type="text" id="namaPelapor" required placeholder="Contoh: Rina / Tamu Lantai 1"
              class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Detail Keluhan / Masalah <span class="text-rose-500">*</span></label>
          <textarea id="detailKeluhan" required rows="3" placeholder="Jelaskan kondisi yang memerlukan pembersihan atau perbaikan..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"></textarea>
        </div>

        <!-- Tombol Kirim -->
        <button type="submit" id="btn-submit"
          class="w-full py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50">
          <i class="fa-solid fa-paper-plane"></i>
          <span>Kirim Laporan Pengaduan</span>
        </button>
      </form>
    </div>

    <!-- State Sukses -->
    <div id="success-container" class="hidden p-8 text-center">
      <div class="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <h3 class="text-lg font-bold text-slate-800">Laporan Diterima!</h3>
      <p class="text-xs text-slate-600 mt-2 leading-relaxed">
        Terima kasih atas kepedulian Anda. Status ruangan otomatis diubah menjadi <strong>🔴 Merah</strong> dan notifikasi mendesak telah dikirimkan ke petugas pengampu.
      </p>
      <div class="mt-6 pt-4 border-t border-slate-100">
        <button onclick="resetForm()" class="text-xs font-semibold text-blue-600 hover:underline">
          <i class="fa-solid fa-arrow-rotate-left mr-1"></i> Kirim Laporan Lain
        </button>
      </div>
    </div>
  </div>

  <footer class="text-center text-xs text-slate-400 mt-6">
    SIM-KTR &copy; 2026 &bull; Scan QR Code Respons Cepat Kebersihan
  </footer>

  <script>
    const ROOM_ID = '<?= idLokasi ?>';

    function addTag(tagText) {
      const textarea = document.getElementById('detailKeluhan');
      if (textarea.value.trim() === '') {
        textarea.value = tagText + ': ';
      } else {
        textarea.value += ', ' + tagText;
      }
      textarea.focus();
    }

    function handlePengaduanSubmit(e) {
      e.preventDefault();
      const nama = document.getElementById('namaPelapor').value.trim();
      const keluhan = document.getElementById('detailKeluhan').value.trim();
      const btn = document.getElementById('btn-submit');

      if (!nama || !keluhan) {
        alert('Mohon isi nama dan detail keluhan.');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Mengirim Laporan...';

      // Panggil fungsi server Google Apps Script
      google.script.run
        .withSuccessHandler(function(response) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i><span>Kirim Laporan Pengaduan</span>';
          if (response && response.success) {
            document.getElementById('form-container').classList.add('hidden');
            document.getElementById('success-container').classList.remove('hidden');
          } else {
            alert('Gagal: ' + (response.message || 'Terjadi kesalahan'));
          }
        })
        .withFailureHandler(function(err) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i><span>Kirim Laporan Pengaduan</span>';
          alert('Error koneksi: ' + err.message);
        })
        .apiSubmitPengaduan(ROOM_ID, nama, keluhan);
    }

    function resetForm() {
      document.getElementById('pengaduan-form').reset();
      document.getElementById('form-container').classList.remove('hidden');
      document.getElementById('success-container').classList.add('hidden');
    }
  </script>
</body>
</html>
`
  },

  'Login.html': {
    name: 'Login.html',
    type: 'html',
    description: 'Halaman Login dengan autentikasi akun Petugas vs Supervisor berbasis data Sheet Master_Pengampu.',
    code: `<div class="max-w-md mx-auto my-8">
  <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
    <!-- Header Card -->
    <div class="bg-gradient-to-br from-blue-700 to-indigo-800 p-8 text-white text-center">
      <div class="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">
        <i class="fa-solid fa-shield-halved text-white"></i>
      </div>
      <h2 class="text-xl font-bold">Masuk ke SIM-KTR</h2>
      <p class="text-xs text-blue-200 mt-1">Sistem Informasi Monitoring Kebersihan Toilet & Ruangan</p>
    </div>

    <!-- Form Body -->
    <div class="p-6 sm:p-8">
      <form id="login-form" onsubmit="handleLoginSubmit(event)" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Username Petugas / Supervisor</label>
          <div class="relative">
            <i class="fa-solid fa-user absolute left-3.5 top-3 text-slate-400 text-sm"></i>
            <input type="text" id="loginUsername" required placeholder="Masukkan username"
              class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
          <div class="relative">
            <i class="fa-solid fa-lock absolute left-3.5 top-3 text-slate-400 text-sm"></i>
            <input type="password" id="loginPassword" required placeholder="Masukkan kata sandi"
              class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition">
          </div>
        </div>

        <button type="submit" id="btn-login"
          class="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50 mt-2">
          <i class="fa-solid fa-right-to-bracket"></i>
          <span>Masuk ke Sistem</span>
        </button>
      </form>

      <!-- Demo Accounts Quick Fill -->
      <div class="mt-6 pt-5 border-t border-slate-100">
        <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">Akun Pengujian Demo (Klik untuk Isi):</p>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <button type="button" onclick="fillDemo('budi', '123')" class="p-2 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 text-left transition">
            <span class="block font-semibold text-slate-800">🧹 Budi (Petugas)</span>
            <span class="text-[10px] text-slate-500">User: budi | Pass: 123</span>
          </button>
          <button type="button" onclick="fillDemo('admin', 'admin123')" class="p-2 rounded-lg border border-slate-200 hover:border-blue-400 bg-slate-50 text-left transition">
            <span class="block font-semibold text-slate-800">👔 Agus (Supervisor)</span>
            <span class="text-[10px] text-slate-500">User: admin | Pass: admin123</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
  function fillDemo(u, p) {
    document.getElementById('loginUsername').value = u;
    document.getElementById('loginPassword').value = p;
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value.trim();
    const btn = document.getElementById('btn-login');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Memvalidasi...';

    google.script.run
      .withSuccessHandler(function(response) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Masuk ke Sistem</span>';

        if (response && response.success) {
          CURRENT_USER = response.user;
          sessionStorage.setItem('simktr_user', JSON.stringify(response.user));
          showToast('Selamat datang, ' + response.user.Nama_Petugas, 'success');
          renderDashboardForRole();
        } else {
          showToast(response.message || 'Login gagal', 'error');
        }
      })
      .withFailureHandler(function(err) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Masuk ke Sistem</span>';
        showToast('Koneksi server gagal: ' + err.message, 'error');
      })
      .apiLogin(u, p);
  }
</script>
`
  },

  'Petugas.html': {
    name: 'Petugas.html',
    type: 'html',
    description: 'Dasbor Petugas Pengampu: daftar ruangan terikat, indikator warna real-time, form ceklis inspeksi (8 parameter), dan tombol tindak lanjut pengaduan.',
    code: `<div id="petugas-container" class="space-y-6">
  <!-- Header Sambutan Petugas -->
  <div class="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">Dasbor Petugas Pengampu</span>
      <h2 id="petugas-greeting" class="text-xl font-bold text-slate-800 mt-1">Daftar Ruangan Tanggung Jawab</h2>
      <p class="text-xs text-slate-500 mt-0.5">Pantau status kebersihan berkala dan lakukan inspeksi harian.</p>
    </div>
    <div class="flex items-center space-x-2">
      <button onclick="loadPetugasData()" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition flex items-center space-x-1.5">
        <i class="fa-solid fa-rotate"></i>
        <span>Segarkan Data</span>
      </button>
    </div>
  </div>

  <!-- BANNER ALERT PENGADUAN PENDING (Jika Ada) -->
  <div id="petugas-alert-container"></div>

  <!-- GRID DAFTAR RUANGAN PENGAMPU -->
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-sm font-bold text-slate-700">Ruangan Anda (<span id="petugas-room-count">0</span>)</h3>
      <div class="flex items-center space-x-2 text-xs">
        <span class="flex items-center space-x-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span><span>Hijau: Bersih</span></span>
        <span class="flex items-center space-x-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span>Kuning: Perhatian</span></span>
        <span class="flex items-center space-x-1"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span><span>Merah: Kritis</span></span>
      </div>
    </div>

    <div id="petugas-room-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Loading Skeleton -->
      <div class="p-5 bg-white rounded-2xl border border-slate-200 animate-pulse text-center text-slate-400 text-xs">
        Memuat ruangan...
      </div>
    </div>
  </div>
</div>

<!-- MODAL FORM INSPEKSI CEKLIS -->
<div id="modal-inspeksi" class="fixed inset-0 z-50 hidden bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
  <div class="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-8">
    <div class="bg-blue-600 px-6 py-4 text-white flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <i class="fa-solid fa-clipboard-check text-lg"></i>
        <h3 class="font-bold text-base">Formulir Ceklis Inspeksi</h3>
      </div>
      <button onclick="closeModalInspeksi()" class="text-blue-200 hover:text-white text-lg">&times;</button>
    </div>

    <div class="p-6 space-y-4">
      <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <p class="text-xs text-slate-500">Ruangan yang diinspeksi:</p>
        <p id="modal-room-name" class="font-bold text-slate-800 text-sm">Nama Ruangan</p>
        <p id="modal-room-id" class="text-[11px] text-blue-600 font-mono">ID: LOK-000</p>
      </div>

      <!-- Checklist Items -->
      <div class="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        <p class="text-xs font-semibold text-slate-700">Parameter Kebersihan & Kelayakan (Centang jika Ya/Baik):</p>
        
        <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer text-xs">
          <span class="font-medium text-slate-700">1. Ketersediaan Tisu (Toilet/Wastafel)</span>
          <input type="checkbox" id="chk-tisu" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500">
        </label>
        
        <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer text-xs">
          <span class="font-medium text-slate-700">2. Pengharum Ruangan Aktif / Wangi</span>
          <input type="checkbox" id="chk-pengharum" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500">
        </label>

        <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer text-xs">
          <span class="font-medium text-slate-700">3. Lantai Kering, Bersih & Bebas Debu/Noda</span>
          <input type="checkbox" id="chk-lantai" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked>
        </label>

        <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer text-xs">
          <span class="font-medium text-slate-700">4. Keran & Saluran Air Berfungsi Normal</span>
          <input type="checkbox" id="chk-keran" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked>
        </label>

        <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer text-xs">
          <span class="font-medium text-slate-700">5. Kunci Pintu & Engsel Dalam Kondisi Baik</span>
          <input type="checkbox" id="chk-kunci" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked>
        </label>

        <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer text-xs">
          <span class="font-medium text-slate-700">6. Wastafel & Cermin Bersih Mengkilap</span>
          <input type="checkbox" id="chk-wastafel" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked>
        </label>

        <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer text-xs">
          <span class="font-medium text-slate-700">7. Kloset Higienis, Bersih & Tidak Tersumbat</span>
          <input type="checkbox" id="chk-kloset" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked>
        </label>

        <label class="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer text-xs">
          <span class="font-medium text-slate-700">8. Tempat Sampah Dikosongkan & Ada Kantong</span>
          <input type="checkbox" id="chk-sampah" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked>
        </label>
      </div>

      <!-- Catatan Kritis -->
      <div>
        <label class="block text-xs font-semibold text-slate-700 mb-1">Catatan Kritis / Temuan Kerusakan</label>
        <textarea id="inspeksi-catatan" rows="2" placeholder="Tuliskan catatan jika ada item rusak atau kendala pasokan..."
          class="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
        <button onclick="closeModalInspeksi()" type="button" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600">
          Batal
        </button>
        <button onclick="submitInspeksiNow()" type="button" id="btn-save-inspeksi" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-md shadow-blue-600/30">
          Simpan Hasil Inspeksi
        </button>
      </div>
    </div>
  </div>
</div>

<script>
  let PETUGAS_ROOMS = [];
  let SELECTED_INSPECTION_ROOM = null;

  function loadPetugasData() {
    if (!CURRENT_USER) return;
    document.getElementById('petugas-greeting').innerText = 'Ruangan Tanggung Jawab - ' + CURRENT_USER.Nama_Petugas;

    google.script.run
      .withSuccessHandler(function(response) {
        if (response && response.success) {
          PETUGAS_ROOMS = response.lokasiList || [];
          renderPetugasRooms();
          renderPetugasComplaints(response.pendingPengaduan || []);
        } else {
          showToast(response.message || 'Gagal mengambil data', 'error');
        }
      })
      .withFailureHandler(function(err) {
        showToast('Error koneksi: ' + err.message, 'error');
      })
      .apiGetPetugasDashboard(CURRENT_USER.ID_Pengampu);
  }

  function renderPetugasRooms() {
    const container = document.getElementById('petugas-room-grid');
    document.getElementById('petugas-room-count').innerText = PETUGAS_ROOMS.length;

    if (PETUGAS_ROOMS.length === 0) {
      container.innerHTML = '<div class="col-span-full p-8 bg-white rounded-2xl text-center text-slate-400 text-sm">Tidak ada ruangan yang terdaftar di bawah ID Anda.</div>';
      return;
    }

    container.innerHTML = PETUGAS_ROOMS.map(room => {
      const colorBg = room.Status_Terkini === 'Hijau' ? 'bg-emerald-500' : (room.Status_Terkini === 'Kuning' ? 'bg-amber-500' : 'bg-rose-500');
      const badgeBg = room.Status_Terkini === 'Hijau' ? 'bg-emerald-100 text-emerald-800' : (room.Status_Terkini === 'Kuning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800');
      const icon = room.Kategori === 'Toilet' ? 'fa-restroom' : 'fa-door-open';

      return \`
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-2.5">
                <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm">
                  <i class="fa-solid \${icon}"></i>
                </div>
                <div>
                  <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">\${room.Kategori}</span>
                  <h4 class="text-sm font-bold text-slate-800 leading-tight">\${room.Nama_Ruangan}</h4>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1.5 \${badgeBg}">
                <span class="w-2 h-2 rounded-full \${colorBg}"></span>
                <span>\${room.Status_Terkini}</span>
              </span>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span class="font-mono text-[11px] text-slate-400">\${room.ID_Lokasi}</span>
              <span>Update: \${room.Last_Update ? room.Last_Update.split(' ')[1] || room.Last_Update : '-'}</span>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
            <button onclick="openModalInspeksi('\${room.ID_Lokasi}', '\${room.Nama_Ruangan}')" 
              class="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-sm shadow-blue-500/20">
              <i class="fa-solid fa-clipboard-check"></i>
              <span>Mulai Inspeksi</span>
            </button>
          </div>
        </div>
      \`;
    }).join('');
  }

  function renderPetugasComplaints(complaints) {
    const alertBox = document.getElementById('petugas-alert-container');
    if (!complaints || complaints.length === 0) {
      alertBox.innerHTML = '';
      return;
    }

    alertBox.innerHTML = \`
      <div class="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl shadow-sm mb-4">
        <div class="flex items-center space-x-2 text-rose-800 font-bold text-sm mb-2">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <span>Pengaduan Publik Memerlukan Tindak Lanjut Segera (\${complaints.length})</span>
        </div>
        <div class="space-y-2">
          \${complaints.map(c => \`
            <div class="bg-white p-3 rounded-lg border border-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div class="text-xs">
                <span class="font-bold text-slate-800">[\${c.ID_Lokasi}]</span>
                <span class="text-slate-600"> "\${c.Detail_Keluhan}"</span>
                <span class="text-slate-400 block text-[10px]">Oleh: \${c.Nama_Pelapor} • \${c.Timestamp}</span>
              </div>
              <button onclick="tindakLanjuti('\${c.id}', '\${c.ID_Lokasi}')" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap shadow-sm">
                <i class="fa-solid fa-check mr-1"></i> Tandai Selesai
              </button>
            </div>
          \`).join('')}
        </div>
      </div>
    \`;
  }

  function openModalInspeksi(idLokasi, namaRuangan) {
    SELECTED_INSPECTION_ROOM = idLokasi;
    document.getElementById('modal-room-id').innerText = 'ID: ' + idLokasi;
    document.getElementById('modal-room-name').innerText = namaRuangan;
    document.getElementById('modal-inspeksi').classList.remove('hidden');
  }

  function closeModalInspeksi() {
    document.getElementById('modal-inspeksi').classList.add('hidden');
    SELECTED_INSPECTION_ROOM = null;
  }

  function submitInspeksiNow() {
    if (!SELECTED_INSPECTION_ROOM || !CURRENT_USER) return;
    const btn = document.getElementById('btn-save-inspeksi');
    btn.disabled = true;
    btn.innerText = 'Menyimpan...';

    const params = {
      tisu: document.getElementById('chk-tisu').checked,
      pengharum: document.getElementById('chk-pengharum').checked,
      lantaiBersih: document.getElementById('chk-lantai').checked,
      keranFungsi: document.getElementById('chk-keran').checked,
      kunciBaik: document.getElementById('chk-kunci').checked,
      wastafelBersih: document.getElementById('chk-wastafel').checked,
      klosetHigienis: document.getElementById('chk-kloset').checked,
      tempatSampahKosong: document.getElementById('chk-sampah').checked
    };
    const catatan = document.getElementById('inspeksi-catatan').value;

    google.script.run
      .withSuccessHandler(function(res) {
        btn.disabled = false;
        btn.innerText = 'Simpan Hasil Inspeksi';
        if (res && res.success) {
          showToast(res.message, 'success');
          closeModalInspeksi();
          loadPetugasData();
        } else {
          showToast(res.message || 'Gagal menyimpan', 'error');
        }
      })
      .withFailureHandler(function(err) {
        btn.disabled = false;
        btn.innerText = 'Simpan Hasil Inspeksi';
        showToast('Error: ' + err.message, 'error');
      })
      .apiSubmitInspeksi(SELECTED_INSPECTION_ROOM, CURRENT_USER.ID_Pengampu, params, catatan);
  }

  function tindakLanjuti(idPengaduan, idLokasi) {
    if (!confirm('Tandai keluhan ini telah selesai dibersihkan / diperbaiki?')) return;

    google.script.run
      .withSuccessHandler(function(res) {
        if (res && res.success) {
          showToast(res.message, 'success');
          loadPetugasData();
        } else {
          showToast(res.message || 'Gagal memproses', 'error');
        }
      })
      .withFailureHandler(function(err) {
        showToast('Error: ' + err.message, 'error');
      })
      .apiTindakLanjutiPengaduan(idPengaduan, idLokasi);
  }
</script>
`
  },

  'Supervisor.html': {
    name: 'Supervisor.html',
    type: 'html',
    description: 'Dasbor Supervisor: statistik real-time, CRUD Master_Lokasi, CRUD Master_Pengampu, Generator & Cetak QR Code (api.qrserver.com), dan Leaderboard Performa Petugas.',
    code: `<div id="supervisor-container" class="space-y-6">
  <!-- Ringkasan Statistik -->
  <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-500">Total Ruangan</span>
        <i class="fa-solid fa-building text-blue-500"></i>
      </div>
      <p id="spv-total-rooms" class="text-2xl font-bold text-slate-800 mt-2">0</p>
    </div>
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-500">Kondisi Hijau</span>
        <i class="fa-solid fa-circle-check text-emerald-500"></i>
      </div>
      <p id="spv-green-rooms" class="text-2xl font-bold text-emerald-600 mt-2">0</p>
    </div>
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-500">Kuning (Perhatian)</span>
        <i class="fa-solid fa-triangle-exclamation text-amber-500"></i>
      </div>
      <p id="spv-yellow-rooms" class="text-2xl font-bold text-amber-600 mt-2">0</p>
    </div>
    <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-slate-500">Merah (Darurat)</span>
        <i class="fa-solid fa-fire text-rose-500"></i>
      </div>
      <p id="spv-red-rooms" class="text-2xl font-bold text-rose-600 mt-2">0</p>
    </div>
    <div onclick="switchTabSpv('pengaduan')" class="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm cursor-pointer hover:border-rose-400 transition">
      <div class="flex items-center justify-between">
        <span class="text-xs font-semibold text-rose-600">Aduan Pending</span>
        <i class="fa-solid fa-triangle-exclamation text-rose-500"></i>
      </div>
      <p id="spv-pending-aduan" class="text-2xl font-bold text-rose-600 mt-2">0</p>
    </div>
  </div>

  <!-- TABS NAVIGASI SUPERVISOR -->
  <div class="border-b border-slate-200 flex space-x-6 text-sm font-semibold text-slate-500 overflow-x-auto">
    <button onclick="switchTabSpv('status')" id="tab-btn-status" class="py-3 border-b-2 border-blue-600 text-blue-600 whitespace-nowrap">
      <i class="fa-solid fa-gauge mr-1.5"></i> Status Real-time
    </button>
    <button onclick="switchTabSpv('pengaduan')" id="tab-btn-pengaduan" class="py-3 border-b-2 border-transparent hover:text-slate-700 whitespace-nowrap flex items-center">
      <i class="fa-solid fa-triangle-exclamation mr-1.5 text-rose-500"></i> Log Pengaduan <span id="badge-tab-pengaduan" class="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold hidden">0</span>
    </button>
    <button onclick="switchTabSpv('qr')" id="tab-btn-qr" class="py-3 border-b-2 border-transparent hover:text-slate-700 whitespace-nowrap">
      <i class="fa-solid fa-qrcode mr-1.5"></i> Cetak QR Code
    </button>
    <button onclick="switchTabSpv('leaderboard')" id="tab-btn-leaderboard" class="py-3 border-b-2 border-transparent hover:text-slate-700 whitespace-nowrap">
      <i class="fa-solid fa-trophy mr-1.5"></i> Leaderboard Petugas
    </button>
    <button onclick="switchTabSpv('lokasi')" id="tab-btn-lokasi" class="py-3 border-b-2 border-transparent hover:text-slate-700 whitespace-nowrap">
      <i class="fa-solid fa-location-dot mr-1.5"></i> Kelola Ruangan
    </button>
    <button onclick="switchTabSpv('pengampu')" id="tab-btn-pengampu" class="py-3 border-b-2 border-transparent hover:text-slate-700 whitespace-nowrap">
      <i class="fa-solid fa-users mr-1.5"></i> Kelola Petugas
    </button>
  </div>

  <!-- TAB 1: STATUS REAL-TIME RUANGAN -->
  <div id="spv-tab-status" class="space-y-4">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="relative w-full sm:w-72">
        <i class="fa-solid fa-search absolute left-3 top-3 text-slate-400 text-xs"></i>
        <input type="text" id="search-rooms" oninput="filterRooms()" placeholder="Cari nama ruangan / ID..."
          class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white">
      </div>
      <div class="flex items-center space-x-2 w-full sm:w-auto">
        <select id="filter-kategori" onchange="filterRooms()" class="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white">
          <option value="">Semua Kategori</option>
          <option value="Toilet">Toilet</option>
          <option value="Ruangan">Ruangan</option>
        </select>
        <select id="filter-status" onchange="filterRooms()" class="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white">
          <option value="">Semua Status</option>
          <option value="Hijau">🟢 Hijau</option>
          <option value="Kuning">🟡 Kuning</option>
          <option value="Merah">🔴 Merah</option>
        </select>
      </div>
    </div>

    <!-- Tabel / Card Ruangan -->
    <div id="spv-room-table-container" class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table class="w-full text-left text-xs text-slate-600">
        <thead class="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
          <tr>
            <th class="p-3.5">ID Lokasi</th>
            <th class="p-3.5">Nama Ruangan</th>
            <th class="p-3.5">Kategori</th>
            <th class="p-3.5">Petugas Pengampu</th>
            <th class="p-3.5 text-center">Status</th>
            <th class="p-3.5">Update Terakhir</th>
          </tr>
        </thead>
        <tbody id="spv-room-table-body" class="divide-y divide-slate-100">
          <tr><td colspan="6" class="p-4 text-center text-slate-400">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- TAB LOG PENGADUAN & TINDAK LANJUT -->
  <div id="spv-tab-pengaduan" class="hidden space-y-4">
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="relative w-full sm:w-80">
        <i class="fa-solid fa-search absolute left-3 top-3 text-slate-400 text-xs"></i>
        <input type="text" id="search-pengaduan" oninput="filterPengaduanSpv()" placeholder="Cari pelapor, keluhan, ruangan..."
          class="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white">
      </div>
      <div class="flex items-center space-x-2 w-full sm:w-auto">
        <select id="filter-status-aduan" onchange="filterPengaduanSpv()" class="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold">
          <option value="">Semua Status Aduan</option>
          <option value="Pending">🔴 Menunggu Penanganan (Pending)</option>
          <option value="Selesai">🟢 Selesai Ditangani</option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th class="p-3">ID & Waktu</th>
            <th class="p-3">Ruangan</th>
            <th class="p-3">Pelapor & Keluhan</th>
            <th class="p-3 text-center">Status</th>
            <th class="p-3">Catatan Penanganan</th>
            <th class="p-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody id="spv-pengaduan-table-body" class="divide-y divide-slate-100">
          <tr><td colspan="6" class="p-4 text-center text-slate-400">Memuat pengaduan...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- TAB 2: CETAK QR CODE -->
  <div id="spv-tab-qr" class="hidden space-y-4">
    <div class="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center justify-between">
      <div>
        <h4 class="font-bold text-sm text-blue-900">Pusat Cetak QR Code Ruangan</h4>
        <p class="text-xs text-blue-700 mt-0.5">QR Code langsung terhubung ke Form Pengaduan Publik tanpa perlu login.</p>
      </div>
      <button onclick="window.print()" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5 no-print">
        <i class="fa-solid fa-print"></i>
        <span>Cetak Semua Halaman</span>
      </button>
    </div>

    <!-- Grid Kartu QR Code Siap Cetak -->
    <div id="spv-qr-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <!-- Generated via JS -->
    </div>
  </div>

  <!-- TAB 3: LEADERBOARD PETUGAS -->
  <div id="spv-tab-leaderboard" class="hidden space-y-4">
    <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <h3 class="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
        <i class="fa-solid fa-trophy text-amber-500"></i>
        <span>Peringkat Retensi Kebersihan Petugas</span>
      </h3>
      <div id="spv-leaderboard-list" class="space-y-3">
        <!-- Render via JS -->
      </div>
    </div>
  </div>

  <!-- TAB 4: KELOLA RUANGAN (CRUD LOKASI) -->
  <div id="spv-tab-lokasi" class="hidden space-y-4">
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-sm font-bold text-slate-800">Master Data Ruangan & Toilet</h3>
        <p class="text-xs text-slate-500">Tambah, ubah nama ruangan, atau alihkan petugas pengampu.</p>
      </div>
      <button onclick="openModalAddLokasi()" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm">
        <i class="fa-solid fa-plus"></i>
        <span>Tambah Ruangan Baru</span>
      </button>
    </div>
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th class="p-3">ID Lokasi</th>
            <th class="p-3">Nama Ruangan</th>
            <th class="p-3">Kategori</th>
            <th class="p-3">Pengampu</th>
            <th class="p-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody id="spv-crud-lokasi-tbody" class="divide-y divide-slate-100">
          <tr><td colspan="5" class="p-4 text-center text-slate-400">Memuat ruangan...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- TAB 5: KELOLA PETUGAS (CRUD PENGAMPU) -->
  <div id="spv-tab-pengampu" class="hidden space-y-4">
    <div class="flex justify-between items-center">
      <div>
        <h3 class="text-sm font-bold text-slate-800">Master Data Petugas & Supervisor</h3>
        <p class="text-xs text-slate-500">Kelola akun pengguna, peran, dan kontak Telegram.</p>
      </div>
      <button onclick="openModalAddPengampu()" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm">
        <i class="fa-solid fa-user-plus"></i>
        <span>Tambah Petugas Baru</span>
      </button>
    </div>
    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
          <tr>
            <th class="p-3">ID Pengampu</th>
            <th class="p-3">Nama Petugas</th>
            <th class="p-3">Username</th>
            <th class="p-3">Role</th>
            <th class="p-3">Kontak Telegram</th>
            <th class="p-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody id="spv-crud-pengampu-tbody" class="divide-y divide-slate-100">
          <tr><td colspan="6" class="p-4 text-center text-slate-400">Memuat petugas...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- MODAL FORM LOKASI (TAMBAH / EDIT) -->
<div id="modal-spv-lokasi" style="display: none;" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm items-center justify-center p-4">
  <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
    <div class="flex items-center justify-between pb-3 border-b border-slate-100">
      <h3 id="modal-lokasi-title" class="font-bold text-slate-800 text-base">Tambah Ruangan Baru</h3>
      <button type="button" onclick="closeModalLokasi()" class="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none">&times;</button>
    </div>
    <form onsubmit="submitFormLokasi(event)" class="space-y-3.5 text-xs">
      <input type="hidden" id="form-lokasi-is-edit" value="false">
      <div>
        <label class="block font-semibold text-slate-700 mb-1">ID Lokasi</label>
        <input type="text" id="form-lokasi-id" required class="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono bg-slate-50">
      </div>
      <div>
        <label class="block font-semibold text-slate-700 mb-1">Nama Ruangan *</label>
        <input type="text" id="form-lokasi-nama" required placeholder="Contoh: Toilet Pria Sayap Barat Lantai 2" class="w-full px-3 py-2 rounded-xl border border-slate-200">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Kategori</label>
          <select id="form-lokasi-kategori" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
            <option value="Toilet">Toilet</option>
            <option value="Ruangan">Ruangan</option>
          </select>
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Petugas Pengampu</label>
          <select id="form-lokasi-pengampu" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
          </select>
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex justify-end space-x-2">
        <button type="button" onclick="closeModalLokasi()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold">Batal</button>
        <button type="submit" id="btn-save-lokasi" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm">Simpan Data</button>
      </div>
    </form>
  </div>
</div>

<!-- MODAL FORM PENGAMPU (TAMBAH / EDIT) -->
<div id="modal-spv-pengampu" style="display: none;" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm items-center justify-center p-4">
  <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
    <div class="flex items-center justify-between pb-3 border-b border-slate-100">
      <h3 id="modal-pengampu-title" class="font-bold text-slate-800 text-base">Tambah Petugas Baru</h3>
      <button type="button" onclick="closeModalPengampu()" class="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none">&times;</button>
    </div>
    <form onsubmit="submitFormPengampu(event)" class="space-y-3.5 text-xs">
      <input type="hidden" id="form-pengampu-is-edit" value="false">
      <div>
        <label class="block font-semibold text-slate-700 mb-1">ID Pengampu</label>
        <input type="text" id="form-pengampu-id" required class="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono bg-slate-50">
      </div>
      <div>
        <label class="block font-semibold text-slate-700 mb-1">Nama Petugas *</label>
        <input type="text" id="form-pengampu-nama" required placeholder="Nama Lengkap" class="w-full px-3 py-2 rounded-xl border border-slate-200">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Username *</label>
          <input type="text" id="form-pengampu-username" required class="w-full px-3 py-2 rounded-xl border border-slate-200">
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Password *</label>
          <input type="text" id="form-pengampu-password" required placeholder="Kata sandi" class="w-full px-3 py-2 rounded-xl border border-slate-200">
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Role</label>
          <select id="form-pengampu-role" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white">
            <option value="Petugas">Petugas</option>
            <option value="Supervisor">Supervisor</option>
          </select>
        </div>
        <div>
          <label class="block font-semibold text-slate-700 mb-1">Kontak Telegram</label>
          <input type="text" id="form-pengampu-telegram" placeholder="@username" class="w-full px-3 py-2 rounded-xl border border-slate-200">
        </div>
      </div>
      <div class="pt-3 border-t border-slate-100 flex justify-end space-x-2">
        <button type="button" onclick="closeModalPengampu()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold">Batal</button>
        <button type="submit" id="btn-save-pengampu" class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm">Simpan Petugas</button>
      </div>
    </form>
  </div>
</div>

<!-- MODAL FORM TINDAK LANJUT PENGADUAN -->
<div id="modal-spv-tindaklanjut" style="display: none;" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm items-center justify-center p-4">
  <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4">
    <div class="flex items-center justify-between pb-3 border-b border-slate-100">
      <h3 class="font-bold text-slate-800 text-base">Tindak Lanjut & Selesaikan Aduan</h3>
      <button type="button" onclick="closeModalTindakLanjut()" class="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none">&times;</button>
    </div>
    <form onsubmit="submitFormTindakLanjut(event)" class="space-y-3.5 text-xs">
      <input type="hidden" id="form-tindaklanjut-id" value="">
      <input type="hidden" id="form-tindaklanjut-lokasi" value="">

      <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
        <p><span class="text-slate-500">ID Aduan:</span> <strong id="tindaklanjut-view-id" class="font-mono text-slate-800">-</strong></p>
        <p><span class="text-slate-500">Ruangan:</span> <strong id="tindaklanjut-view-ruangan" class="text-slate-800">-</strong></p>
        <p><span class="text-slate-500">Pelapor:</span> <strong id="tindaklanjut-view-pelapor" class="text-slate-800">-</strong></p>
        <div class="pt-1 border-t border-slate-200 text-rose-800 italic" id="tindaklanjut-view-keluhan">"-"</div>
      </div>

      <div>
        <label class="block font-semibold text-slate-700 mb-1">Catatan Tindakan Pembersihan / Solusi</label>
        <textarea id="form-tindaklanjut-catatan" rows="3" required placeholder="Contoh: Toilet telah dibersihkan menyeluruh, lantai dipel kering, sabun dan tisu diisi ulang." class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"></textarea>
      </div>

      <div class="pt-3 border-t border-slate-100 flex justify-end space-x-2">
        <button type="button" onclick="closeModalTindakLanjut()" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold">Batal</button>
        <button type="submit" id="btn-save-tindaklanjut" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm">Selesaikan Aduan</button>
      </div>
    </form>
  </div>
</div>

<script>
  let SPV_DATA = null;

  function loadSupervisorData() {
    google.script.run
      .withSuccessHandler(function(res) {
        if (res && res.success) {
          SPV_DATA = res;
          renderSupervisorDashboard();
        } else {
          var errDetail = (res && res.message) ? res.message : 'Pastikan database sudah diinisialisasi via inisialisasiDatabase().';
          showToast('Gagal memuat data supervisor: ' + errDetail, 'error');
        }
      })
      .withFailureHandler(function(err) {
        showToast('Error server: ' + err.message, 'error');
      })
      .apiGetSupervisorDashboard();
  }

  function renderSupervisorDashboard() {
    if (!SPV_DATA) return;

    const lokasiList = SPV_DATA.lokasi || [];
    const aduanList = SPV_DATA.pengaduan || [];
    const total = lokasiList.length;
    const green = lokasiList.filter(l => l.Status_Terkini === 'Hijau').length;
    const yellow = lokasiList.filter(l => l.Status_Terkini === 'Kuning').length;
    const red = lokasiList.filter(l => l.Status_Terkini === 'Merah').length;
    const pendingCount = aduanList.filter(a => a.Status_Tindak_Lanjut === 'Pending').length;

    document.getElementById('spv-total-rooms').innerText = total;
    document.getElementById('spv-green-rooms').innerText = green;
    document.getElementById('spv-yellow-rooms').innerText = yellow;
    document.getElementById('spv-red-rooms').innerText = red;

    const pendingElem = document.getElementById('spv-pending-aduan');
    if (pendingElem) pendingElem.innerText = pendingCount;

    const badgeTab = document.getElementById('badge-tab-pengaduan');
    if (badgeTab) {
      if (pendingCount > 0) {
        badgeTab.innerText = pendingCount;
        badgeTab.classList.remove('hidden');
      } else {
        badgeTab.classList.add('hidden');
      }
    }

    filterRooms();
    filterPengaduanSpv();
    renderQrGrid();
    renderLeaderboard();
    renderCrudLokasi();
    renderCrudPengampu();
  }

  function filterRooms() {
    if (!SPV_DATA) return;
    const query = (document.getElementById('search-rooms').value || '').toLowerCase();
    const kat = document.getElementById('filter-kategori').value;
    const st = document.getElementById('filter-status').value;

    const filtered = (SPV_DATA.lokasi || []).filter(r => {
      const matchQuery = (r.Nama_Ruangan || '').toLowerCase().includes(query) || (r.ID_Lokasi || '').toLowerCase().includes(query);
      const matchKat = !kat || r.Kategori === kat;
      const matchSt = !st || r.Status_Terkini === st;
      return matchQuery && matchKat && matchSt;
    });

    const tbody = document.getElementById('spv-room-table-body');
    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">Tidak ada ruangan yang cocok.</td></tr>';
      return;
    }

    const pengampuList = SPV_DATA.pengampu || [];
    tbody.innerHTML = filtered.map(r => {
      const badgeBg = r.Status_Terkini === 'Hijau' ? 'bg-emerald-100 text-emerald-800' : (r.Status_Terkini === 'Kuning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800');
      const dotBg = r.Status_Terkini === 'Hijau' ? 'bg-emerald-500' : (r.Status_Terkini === 'Kuning' ? 'bg-amber-500' : 'bg-rose-500');
      const staff = pengampuList.find(p => p.ID_Pengampu === r.ID_Pengampu);

      return \`
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3.5 font-mono font-bold text-slate-700">\${r.ID_Lokasi}</td>
          <td class="p-3.5 font-semibold text-slate-800">\${r.Nama_Ruangan}</td>
          <td class="p-3.5"><span class="px-2 py-0.5 rounded bg-slate-100 text-[11px] font-medium">\${r.Kategori}</span></td>
          <td class="p-3.5 text-slate-600">\${staff ? staff.Nama_Petugas : r.ID_Pengampu}</td>
          <td class="p-3.5 text-center">
            <span class="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold \${badgeBg}">
              <span class="w-2 h-2 rounded-full \${dotBg}"></span>
              <span>\${r.Status_Terkini}</span>
            </span>
          </td>
          <td class="p-3.5 text-slate-400 text-[11px]">\${r.Last_Update || '-'}</td>
        </tr>
      \`;
    }).join('');
  }

  function renderQrGrid() {
    if (!SPV_DATA) return;
    const grid = document.getElementById('spv-qr-grid');
    const baseUrl = SPV_DATA.webAppUrl || window.location.href.split('?')[0];

    grid.innerHTML = (SPV_DATA.lokasi || []).map(r => {
      const targetUrl = baseUrl + '?lokasi=' + encodeURIComponent(r.ID_Lokasi);
      const qrApiUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(targetUrl);

      return \`
        <div class="bg-white border-2 border-slate-200 border-dashed rounded-2xl p-4 text-center flex flex-col items-center justify-between shadow-sm">
          <div class="w-full border-b border-slate-100 pb-2 mb-2">
            <span class="text-[10px] uppercase font-bold text-blue-600 tracking-wider">SIM-KTR KEBERSIHAN</span>
            <h5 class="text-xs font-bold text-slate-800 leading-tight mt-0.5">\${r.Nama_Ruangan}</h5>
            <span class="text-[10px] font-mono text-slate-400 font-semibold">\${r.ID_Lokasi}</span>
          </div>
          
          <div class="p-2 bg-white rounded-xl shadow-sm border border-slate-100 my-2">
            <img src="\${qrApiUrl}" alt="QR Code" class="w-36 h-36 mx-auto">
          </div>

          <p class="text-[10px] text-slate-500 mt-1">Scan untuk Lapor Kebersihan</p>
          <a href="\${qrApiUrl}" download="QR_\${r.ID_Lokasi}.png" target="_blank" class="mt-2 text-[11px] font-semibold text-blue-600 hover:underline no-print">
            <i class="fa-solid fa-download mr-1"></i> Unduh Gambar
          </a>
        </div>
      \`;
    }).join('');
  }

  function renderLeaderboard() {
    if (!SPV_DATA || !SPV_DATA.leaderboard) return;
    const container = document.getElementById('spv-leaderboard-list');

    if (SPV_DATA.leaderboard.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400">Belum ada riwayat inspeksi tercatat.</p>';
      return;
    }

    container.innerHTML = SPV_DATA.leaderboard.map((lb, idx) => {
      const rankBadge = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : '#' + (idx + 1)));
      return \`
        <div class="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition">
          <div class="flex items-center space-x-3">
            <span class="text-lg font-bold w-7 text-center">\${rankBadge}</span>
            <div>
              <h5 class="text-xs font-bold text-slate-800">\${lb.Nama_Petugas}</h5>
              <p class="text-[11px] text-slate-500">ID: \${lb.ID_Pengampu} • Total \${lb.totalInspeksi} Kali Inspeksi</p>
            </div>
          </div>
          <div class="text-right">
            <span class="text-base font-extrabold text-blue-700">\${lb.rataRataSkor}%</span>
            <span class="block text-[10px] text-slate-400">Rata-rata Skor</span>
          </div>
        </div>
      \`;
    }).join('');
  }

  // --- CRUD MASTER LOKASI ---
  function renderCrudLokasi() {
    if (!SPV_DATA) return;
    const tbody = document.getElementById('spv-crud-lokasi-tbody');
    const rooms = SPV_DATA.lokasi || [];
    const pengampuList = SPV_DATA.pengampu || [];

    if (rooms.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-400">Belum ada data ruangan.</td></tr>';
      return;
    }

    tbody.innerHTML = rooms.map(r => {
      const staff = pengampuList.find(p => p.ID_Pengampu === r.ID_Pengampu);
      return \`
        <tr class="hover:bg-slate-50 transition">
          <td class="p-3 font-mono font-bold text-blue-700">\${r.ID_Lokasi}</td>
          <td class="p-3 font-semibold text-slate-800">\${r.Nama_Ruangan}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold">\${r.Kategori}</span></td>
          <td class="p-3 text-slate-600">\${staff ? staff.Nama_Petugas : r.ID_Pengampu}</td>
          <td class="p-3 text-right space-x-1">
            <button onclick="openModalEditLokasi('\${r.ID_Lokasi}')" class="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteLokasiAction('\${r.ID_Lokasi}', '\${r.Nama_Ruangan}')" class="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        </tr>
      \`;
    }).join('');
  }

  function openModalAddLokasi() {
    const rooms = (SPV_DATA && SPV_DATA.lokasi) ? SPV_DATA.lokasi : [];
    let nextNum = rooms.length + 1;
    let newId = 'LOK-' + String(nextNum).padStart(3, '0');
    while (rooms.some(r => String(r.ID_Lokasi).trim().toUpperCase() === newId)) {
      nextNum++;
      newId = 'LOK-' + String(nextNum).padStart(3, '0');
    }

    document.getElementById('modal-lokasi-title').innerText = 'Tambah Ruangan Baru';
    document.getElementById('form-lokasi-is-edit').value = 'false';
    const idInput = document.getElementById('form-lokasi-id');
    idInput.value = newId;
    idInput.disabled = false;
    document.getElementById('form-lokasi-nama').value = '';
    document.getElementById('form-lokasi-kategori').value = 'Toilet';

    populatePengampuDropdown('form-lokasi-pengampu');
    const modal = document.getElementById('modal-spv-lokasi');
    modal.style.display = 'flex';
  }

  function openModalEditLokasi(idLokasi) {
    const rooms = (SPV_DATA && SPV_DATA.lokasi) ? SPV_DATA.lokasi : [];
    const targetId = String(idLokasi).trim().toUpperCase();
    const room = rooms.find(r => String(r.ID_Lokasi).trim().toUpperCase() === targetId);
    if (!room) {
      showToast('Data ruangan tidak ditemukan', 'warning');
      return;
    }

    document.getElementById('modal-lokasi-title').innerText = 'Edit Data Ruangan';
    document.getElementById('form-lokasi-is-edit').value = 'true';
    const idInput = document.getElementById('form-lokasi-id');
    idInput.value = room.ID_Lokasi;
    idInput.disabled = true;
    document.getElementById('form-lokasi-nama').value = room.Nama_Ruangan;
    document.getElementById('form-lokasi-kategori').value = room.Kategori;

    populatePengampuDropdown('form-lokasi-pengampu', room.ID_Pengampu);
    const modal = document.getElementById('modal-spv-lokasi');
    modal.style.display = 'flex';
  }

  function closeModalLokasi() {
    const modal = document.getElementById('modal-spv-lokasi');
    modal.style.display = 'none';
  }

  function populatePengampuDropdown(elementId, selectedId) {
    const select = document.getElementById(elementId);
    if (!select) return;
    const staff = (SPV_DATA && SPV_DATA.pengampu) ? SPV_DATA.pengampu : [];
    if (staff.length === 0) {
      select.innerHTML = '<option value="PGP-001">Petugas Default (PGP-001)</option>';
      return;
    }
    select.innerHTML = staff.map(s => \`
      <option value="\${s.ID_Pengampu}" \${s.ID_Pengampu === selectedId ? 'selected' : ''}>
        \${s.Nama_Petugas} (\${s.ID_Pengampu})
      </option>
    \`).join('');
  }

  function submitFormLokasi(e) {
    if (e && e.preventDefault) e.preventDefault();
    const isEdit = document.getElementById('form-lokasi-is-edit').value === 'true';
    const id = document.getElementById('form-lokasi-id').value.trim();
    const nama = document.getElementById('form-lokasi-nama').value.trim();
    const kat = document.getElementById('form-lokasi-kategori').value;
    const pengampu = document.getElementById('form-lokasi-pengampu').value;

    if (!id) {
      showToast('ID Lokasi wajib diisi!', 'warning');
      return;
    }
    if (!nama) {
      showToast('Nama ruangan wajib diisi!', 'warning');
      return;
    }

    const data = {
      ID_Lokasi: id,
      Nama_Ruangan: nama,
      Kategori: kat,
      ID_Pengampu: pengampu || 'PGP-001'
    };

    const btn = document.getElementById('btn-save-lokasi');
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Menyimpan...';
    }

    google.script.run
      .withSuccessHandler(function(res) {
        if (btn) {
          btn.disabled = false;
          btn.innerText = 'Simpan Data';
        }
        if (res && res.success) {
          showToast(res.message, 'success');
          closeModalLokasi();
          loadSupervisorData();
        } else {
          showToast((res && res.message) || 'Gagal menyimpan ruangan', 'error');
        }
      })
      .withFailureHandler(function(err) {
        if (btn) {
          btn.disabled = false;
          btn.innerText = 'Simpan Data';
        }
        showToast('Error: ' + err.message, 'error');
      })
      .apiSaveLokasi(data, isEdit);
  }

  function deleteLokasiAction(idLokasi, namaRuangan) {
    if (!confirm('Yakin ingin menghapus ruangan "' + namaRuangan + '" (' + idLokasi + ')?')) return;

    google.script.run
      .withSuccessHandler(function(res) {
        if (res && res.success) {
          showToast(res.message, 'success');
          loadSupervisorData();
        } else {
          showToast((res && res.message) || 'Gagal menghapus', 'error');
        }
      })
      .withFailureHandler(function(err) {
        showToast('Error server: ' + err.message, 'error');
      })
      .apiDeleteLokasi(idLokasi);
  }

  // --- CRUD MASTER PENGAMPU ---
  function renderCrudPengampu() {
    if (!SPV_DATA) return;
    const tbody = document.getElementById('spv-crud-pengampu-tbody');
    const staff = SPV_DATA.pengampu || [];

    if (staff.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">Belum ada data petugas.</td></tr>';
      return;
    }

    tbody.innerHTML = staff.map(s => \`
      <tr class="hover:bg-slate-50 transition">
        <td class="p-3 font-mono font-bold text-slate-800">\${s.ID_Pengampu}</td>
        <td class="p-3 font-semibold text-slate-800">\${s.Nama_Petugas}</td>
        <td class="p-3 text-slate-600">\${s.Username}</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold \${s.Role === 'Supervisor' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-100 text-blue-800'}">\${s.Role}</span></td>
        <td class="p-3 font-mono text-slate-500">\${s.Kontak_Telegram || '-'}</td>
        <td class="p-3 text-right space-x-1">
          <button onclick="openModalEditPengampu('\${s.ID_Pengampu}')" class="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button onclick="deletePengampuAction('\${s.ID_Pengampu}', '\${s.Nama_Petugas}')" class="px-2 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-semibold">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    \`).join('');
  }

  function openModalAddPengampu() {
    const staff = (SPV_DATA && SPV_DATA.pengampu) ? SPV_DATA.pengampu : [];
    let nextNum = staff.length + 1;
    let newId = 'PGP-' + String(nextNum).padStart(3, '0');
    while (staff.some(s => String(s.ID_Pengampu).trim().toUpperCase() === newId)) {
      nextNum++;
      newId = 'PGP-' + String(nextNum).padStart(3, '0');
    }

    document.getElementById('modal-pengampu-title').innerText = 'Tambah Petugas Baru';
    document.getElementById('form-pengampu-is-edit').value = 'false';
    const idInput = document.getElementById('form-pengampu-id');
    idInput.value = newId;
    idInput.disabled = false;
    document.getElementById('form-pengampu-nama').value = '';
    document.getElementById('form-pengampu-username').value = '';
    document.getElementById('form-pengampu-password').value = '123';
    document.getElementById('form-pengampu-role').value = 'Petugas';
    document.getElementById('form-pengampu-telegram').value = '@petugas';

    const modal = document.getElementById('modal-spv-pengampu');
    modal.style.display = 'flex';
  }

  function openModalEditPengampu(idPengampu) {
    const staff = (SPV_DATA && SPV_DATA.pengampu) ? SPV_DATA.pengampu : [];
    const targetId = String(idPengampu).trim().toUpperCase();
    const s = staff.find(p => String(p.ID_Pengampu).trim().toUpperCase() === targetId);
    if (!s) {
      showToast('Data petugas tidak ditemukan', 'warning');
      return;
    }

    document.getElementById('modal-pengampu-title').innerText = 'Edit Data Petugas';
    document.getElementById('form-pengampu-is-edit').value = 'true';
    const idInput = document.getElementById('form-pengampu-id');
    idInput.value = s.ID_Pengampu;
    idInput.disabled = true;
    document.getElementById('form-pengampu-nama').value = s.Nama_Petugas;
    document.getElementById('form-pengampu-username').value = s.Username;
    document.getElementById('form-pengampu-password').value = s.Password || '';
    document.getElementById('form-pengampu-role').value = s.Role;
    document.getElementById('form-pengampu-telegram').value = s.Kontak_Telegram || '';

    const modal = document.getElementById('modal-spv-pengampu');
    modal.style.display = 'flex';
  }

  function closeModalPengampu() {
    const modal = document.getElementById('modal-spv-pengampu');
    modal.style.display = 'none';
  }

  function submitFormPengampu(e) {
    if (e && e.preventDefault) e.preventDefault();
    const isEdit = document.getElementById('form-pengampu-is-edit').value === 'true';
    const id = document.getElementById('form-pengampu-id').value.trim();
    const nama = document.getElementById('form-pengampu-nama').value.trim();
    const username = document.getElementById('form-pengampu-username').value.trim();
    const password = document.getElementById('form-pengampu-password').value.trim();
    const role = document.getElementById('form-pengampu-role').value;
    const telegram = document.getElementById('form-pengampu-telegram').value.trim();

    if (!id) {
      showToast('ID Petugas wajib diisi!', 'warning');
      return;
    }
    if (!nama || !username) {
      showToast('Nama petugas dan username wajib diisi!', 'warning');
      return;
    }

    const data = {
      ID_Pengampu: id,
      Nama_Petugas: nama,
      Username: username,
      Password: password || '123456',
      Role: role,
      Kontak_Telegram: telegram || '-'
    };

    const btn = document.getElementById('btn-save-pengampu');
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Menyimpan...';
    }

    google.script.run
      .withSuccessHandler(function(res) {
        if (btn) {
          btn.disabled = false;
          btn.innerText = 'Simpan Petugas';
        }
        if (res && res.success) {
          showToast(res.message, 'success');
          closeModalPengampu();
          loadSupervisorData();
        } else {
          showToast((res && res.message) || 'Gagal menyimpan petugas', 'error');
        }
      })
      .withFailureHandler(function(err) {
        if (btn) {
          btn.disabled = false;
          btn.innerText = 'Simpan Petugas';
        }
        showToast('Error: ' + err.message, 'error');
      })
      .apiSavePengampu(data, isEdit);
  }

  function deletePengampuAction(idPengampu, namaPetugas) {
    if (!confirm('Yakin ingin menghapus petugas "' + namaPetugas + '" (' + idPengampu + ')?')) return;

    google.script.run
      .withSuccessHandler(function(res) {
        if (res && res.success) {
          showToast(res.message, 'success');
          loadSupervisorData();
        } else {
          showToast((res && res.message) || 'Gagal menghapus', 'error');
        }
      })
      .withFailureHandler(function(err) {
        showToast('Error server: ' + err.message, 'error');
      })
      .apiDeletePengampu(idPengampu);
  }

  function filterPengaduanSpv() {
    if (!SPV_DATA) return;
    const searchInput = document.getElementById('search-pengaduan');
    const statusSelect = document.getElementById('filter-status-aduan');
    const query = (searchInput ? searchInput.value : '').toLowerCase();
    const st = statusSelect ? statusSelect.value : '';

    const aduanList = SPV_DATA.pengaduan || [];
    const rooms = SPV_DATA.lokasi || [];

    const filtered = aduanList.filter(a => {
      const room = rooms.find(r => r.ID_Lokasi === a.ID_Lokasi);
      const rName = (room ? room.Nama_Ruangan : '').toLowerCase();
      const matchQuery =
        (a.Nama_Pelapor || '').toLowerCase().includes(query) ||
        (a.Detail_Keluhan || '').toLowerCase().includes(query) ||
        (a.ID_Lokasi || '').toLowerCase().includes(query) ||
        rName.includes(query) ||
        (a.Catatan_Penyelesaian || '').toLowerCase().includes(query);

      const matchStatus = !st || a.Status_Tindak_Lanjut === st;
      return matchQuery && matchStatus;
    });

    const tbody = document.getElementById('spv-pengaduan-table-body');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">Tidak ada pengaduan yang cocok.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(a => {
      const room = rooms.find(r => r.ID_Lokasi === a.ID_Lokasi);
      const isPending = a.Status_Tindak_Lanjut === 'Pending';
      const statusBadge = isPending
        ? '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800"><span class="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1 animate-pulse"></span>Pending</span>'
        : '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800"><i class="fa-solid fa-check mr-1 text-emerald-600"></i>Selesai</span>';

      const actionBtn = isPending
        ? \`<button onclick="openModalTindakLanjut('\${a.id}')" class="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1 ml-auto"><i class="fa-solid fa-check"></i><span>Tindak Lanjut</span></button>\`
        : '<span class="text-emerald-600 font-semibold text-xs"><i class="fa-solid fa-circle-check mr-1"></i>Selesai</span>';

      return \`
        <tr class="hover:bg-slate-50 transition \${isPending ? 'bg-rose-50/20' : ''}">
          <td class="p-3 align-top font-mono">
            <span class="font-bold text-slate-800 block">\${a.id}</span>
            <span class="text-[10px] text-slate-400 font-sans">\${a.Timestamp}</span>
          </td>
          <td class="p-3 align-top">
            <strong class="text-slate-800 block">\${room ? room.Nama_Ruangan : a.ID_Lokasi}</strong>
            <span class="font-mono text-[10px] text-blue-600">\${a.ID_Lokasi}</span>
          </td>
          <td class="p-3 align-top max-w-xs">
            <span class="font-semibold text-slate-700 block">👤 \${a.Nama_Pelapor}</span>
            <div class="mt-1 text-xs text-slate-800 bg-white p-1.5 rounded-lg border border-slate-200 italic">"\${a.Detail_Keluhan}"</div>
          </td>
          <td class="p-3 align-top text-center">\${statusBadge}</td>
          <td class="p-3 align-top text-xs text-slate-600">
            \${isPending ? '<span class="text-rose-500 italic text-[11px]">Menunggu respon petugas</span>' : '<div><p class="font-medium text-emerald-900">' + (a.Catatan_Penyelesaian || 'Telah diselesaikan') + '</p><span class="text-[10px] text-slate-400 font-mono">' + (a.Waktu_Selesai || '') + '</span></div>'}
          </td>
          <td class="p-3 align-top text-right whitespace-nowrap">\${actionBtn}</td>
        </tr>
      \`;
    }).join('');
  }

  function openModalTindakLanjut(idPengaduan) {
    const aduanList = (SPV_DATA && SPV_DATA.pengaduan) ? SPV_DATA.pengaduan : [];
    const rooms = (SPV_DATA && SPV_DATA.lokasi) ? SPV_DATA.lokasi : [];
    const targetId = String(idPengaduan).trim().toUpperCase();
    const aduan = aduanList.find(a => String(a.id).trim().toUpperCase() === targetId);
    if (!aduan) {
      showToast('Data aduan tidak ditemukan', 'warning');
      return;
    }

    const room = rooms.find(r => r.ID_Lokasi === aduan.ID_Lokasi);

    document.getElementById('form-tindaklanjut-id').value = aduan.id;
    document.getElementById('form-tindaklanjut-lokasi').value = aduan.ID_Lokasi;
    document.getElementById('tindaklanjut-view-id').innerText = aduan.id;
    document.getElementById('tindaklanjut-view-ruangan').innerText = (room ? room.Nama_Ruangan : aduan.ID_Lokasi) + ' (' + aduan.ID_Lokasi + ')';
    document.getElementById('tindaklanjut-view-pelapor').innerText = aduan.Nama_Pelapor;
    document.getElementById('tindaklanjut-view-keluhan').innerText = '"' + aduan.Detail_Keluhan + '"';
    document.getElementById('form-tindaklanjut-catatan').value = 'Telah dibersihkan dan dipel rapi oleh petugas.';

    const modal = document.getElementById('modal-spv-tindaklanjut');
    modal.style.display = 'flex';
  }

  function closeModalTindakLanjut() {
    const modal = document.getElementById('modal-spv-tindaklanjut');
    modal.style.display = 'none';
  }

  function submitFormTindakLanjut(e) {
    if (e && e.preventDefault) e.preventDefault();
    const idAduan = document.getElementById('form-tindaklanjut-id').value;
    const idLokasi = document.getElementById('form-tindaklanjut-lokasi').value;
    const catatan = document.getElementById('form-tindaklanjut-catatan').value.trim();

    if (!catatan) {
      showToast('Catatan tindakan wajib diisi!', 'warning');
      return;
    }

    const btn = document.getElementById('btn-save-tindaklanjut');
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Menyimpan...';
    }

    google.script.run
      .withSuccessHandler(function(res) {
        if (btn) {
          btn.disabled = false;
          btn.innerText = 'Selesaikan Aduan';
        }
        if (res && res.success) {
          showToast(res.message, 'success');
          closeModalTindakLanjut();
          loadSupervisorData();
        } else {
          showToast((res && res.message) || 'Gagal menyimpan tindak lanjut', 'error');
        }
      })
      .withFailureHandler(function(err) {
        if (btn) {
          btn.disabled = false;
          btn.innerText = 'Selesaikan Aduan';
        }
        showToast('Error server: ' + err.message, 'error');
      })
      .apiTindakLanjutiPengaduan(idAduan, idLokasi, catatan);
  }

  function switchTabSpv(tab) {
    ['status', 'pengaduan', 'qr', 'leaderboard', 'lokasi', 'pengampu'].forEach(t => {
      const el = document.getElementById('spv-tab-' + t);
      const btn = document.getElementById('tab-btn-' + t);
      if (el) el.classList.add('hidden');
      if (btn) {
        btn.classList.remove('border-blue-600', 'text-blue-600');
        btn.classList.add('border-transparent');
      }
    });

    const activeEl = document.getElementById('spv-tab-' + tab);
    const activeBtn = document.getElementById('tab-btn-' + tab);
    if (activeEl) activeEl.classList.remove('hidden');
    if (activeBtn) {
      activeBtn.classList.remove('border-transparent');
      activeBtn.classList.add('border-blue-600', 'text-blue-600');
    }
  }
</script>
`
  },

  'PanduanDeploy.md': {
    name: 'PANDUAN_DEPLOY.md',
    type: 'server',
    description: 'Panduan lengkap cara deploy Web App agar parameter ?lokasi= berjalan lancar (Deploy as Anyone).',
    code: `# PANDUAN DEPLOYMENT GOOGLE APPS SCRIPT WEB APP

## 1. Persiapan Google Spreadsheet
1. Buka [Google Sheets](https://sheets.new) dan buat spreadsheet baru.
2. Beri nama: **Database SIM-KTR Kebersihan**.
3. Buka menu **Ekstensi (Extensions) > Apps Script**.

## 2. Membuat File di Google Apps Script
Buat file-file berikut di Script Editor dengan nama dan ekstensi yang sama:

1. **Code.gs** (Pilih tipe *Script*, copy seluruh isi dari \`Code.gs\`)
2. **Index.html** (Pilih tanda + lalu *HTML*, beri nama \`Index\`)
3. **Pengaduan.html** (Pilih tanda + lalu *HTML*, beri nama \`Pengaduan\`)
4. **Login.html** (Pilih tanda + lalu *HTML*, beri nama \`Login\`)
5. **Petugas.html** (Pilih tanda + lalu *HTML*, beri nama \`Petugas\`)
6. **Supervisor.html** (Pilih tanda + lalu *HTML*, beri nama \`Supervisor\`)

## 3. Inisialisasi Database Otomatis
1. Pada file **Code.gs**, pilih fungsi **inisialisasiDatabase** di toolbar fungsi atas.
2. Klik tombol **Jalankan (Run)**.
3. Berikan izin otorisasi Google Spreadsheet jika diminta.
4. Sheet Anda kini otomatis memiliki 4 sheet:
   - \`Master_Lokasi\`
   - \`Master_Pengampu\`
   - \`Log_Inspeksi\`
   - \`Log_Pengaduan\`

## 4. Konfigurasi Bot Telegram (Opsional tapi Direkomendasikan)
1. Buka BotFather di Telegram untuk membuat bot dan dapatkan \`BOT_TOKEN\`.
2. Dapatkan Chat ID Anda via bot \`@userinfobot\` di Telegram.
3. Masukkan Token dan Chat ID pada objek \`TELEGRAM_CONFIG\` di baris atas \`Code.gs\`.

## 5. Langkah Deploy Web App (PENTING!)
Agar parameter URL \`?lokasi=ID_LOKASI\` bisa diakses publik oleh pengunjung tanpa login Google:

1. Klik tombol biru **Terapkan (Deploy)** di kanan atas > **Penerapan Baru (New deployment)**.
2. Klik ikon gerigi ⚙️ di samping "Select type" > pilih **Aplikasi Web (Web App)**.
3. Isi konfigurasi secara tepat:
   - **Deskripsi:** SIM-KTR v1.0 Production
   - **Jalankan sebagai (Execute as):** **Saya (Email Anda)** -> *WAJIB "Me"* agar script dapat membaca & menulis database Spreadsheet tanpa meminta pengunjung login Google.
   - **Yang memiliki akses (Who has access):** **Siapa saja (Anyone)** -> *WAJIB "Anyone"* agar pemindaian QR Code publik berfungsi langsung!
4. Klik **Terapkan (Deploy)**.
5. Salin **URL Aplikasi Web** yang dihasilkan (format: \`https://script.google.com/macros/s/.../exec\`).

## 6. Uji Coba Scan QR Code
Coba buka URL dengan parameter lokasi di browser ponsel Anda:
\`\`\`text
https://script.google.com/macros/s/.../exec?lokasi=LOK-001
\`\`\`
Halaman pengaduan publik akan langsung terbuka dan nama ruangan "Toilet Pria Lantai 1 (Lobby)" akan muncul secara otomatis!
`
  }
};
