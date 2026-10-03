import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TableProperties,
  Database,
  FileSpreadsheet,
  Download,
  RotateCcw,
  CheckCircle2,
  Copy,
  Server,
  Star,
  MessageSquare,
  ClipboardList,
  RefreshCw,
  Upload
} from 'lucide-react';

export const DatabaseViewer: React.FC = () => {
  const {
    lokasiList,
    pengampuList,
    inspeksiList,
    pengaduanList,
    checklistItems,
    saranList,
    ratingList,
    serverStatus,
    databaseDetails,
    initHostingerDatabase,
    syncFromDatabase,
    syncToDatabase,
    resetDatabaseToDefault
  } = useApp();

  const [isInitializing, setIsInitializing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [initMsg, setInitMsg] = useState<string | null>(null);

  type TableName =
    | 'checklist_master'
    | 'lokasi'
    | 'pengampu'
    | 'log_pengaduan'
    | 'saran_pelayanan'
    | 'rating_review'
    | 'log_inspeksi'
    | 'mysql_script';

  const [activeTable, setActiveTable] = useState<TableName>('checklist_master');
  const [copiedCode, setCopiedCode] = useState(false);

  const tables: { id: TableName; label: string; count?: number; color: string }[] = [
    { id: 'checklist_master', label: 'checklist_master', count: checklistItems.length, color: 'text-indigo-600' },
    { id: 'log_pengaduan', label: 'log_pengaduan', count: pengaduanList.length, color: 'text-rose-600' },
    { id: 'saran_pelayanan', label: 'saran_pelayanan', count: saranList.length, color: 'text-blue-600' },
    { id: 'rating_review', label: 'rating_review', count: ratingList.length, color: 'text-amber-600' },
    { id: 'lokasi', label: 'lokasi', count: lokasiList.length, color: 'text-emerald-600' },
    { id: 'pengampu', label: 'pengampu', count: pengampuList.length, color: 'text-purple-600' },
    { id: 'log_inspeksi', label: 'log_inspeksi', count: inspeksiList.length, color: 'text-slate-600' },
    { id: 'mysql_script', label: 'database_hostinger.sql (Import)', color: 'text-teal-600' }
  ];

  const handleCopySql = () => {
    fetch('/database_hostinger.sql')
      .then(res => res.text())
      .then(text => {
        navigator.clipboard.writeText(text);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      })
      .catch(() => {
        navigator.clipboard.writeText('-- Silakan salin skrip SQL dari file database_hostinger.sql');
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2500);
      });
  };

  const handleExportJson = () => {
    const fullDb = {
      lokasi: lokasiList,
      pengampu: pengampuList,
      checklist_master: checklistItems,
      log_pengaduan: pengaduanList,
      saran_pelayanan: saranList,
      rating_review: ratingList,
      log_inspeksi: inspeksiList
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullDb, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'Database_SIM_KTR_Export.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Database className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-bold text-slate-800">
              Database Viewer: MySQL Hostinger Schema
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Engine: <strong>{serverStatus.engine}</strong> &bull; Kompatibel Node.js {serverStatus.nodeVersion} (18.x - 24.x) &bull; Tabel master dan log terhubung secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async () => {
              setIsSyncing(true);
              setInitMsg(null);
              const res = await syncFromDatabase();
              setInitMsg(res.message || 'Data aplikasi berhasil disinkronkan langsung dari MySQL Hostinger!');
              setIsSyncing(false);
            }}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
            title="Tarik seluruh data dari tabel MySQL Hostinger ke aplikasi"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : '🔄 Tarik Data dari MySQL'}</span>
          </button>
          <button
            onClick={async () => {
              setIsSyncing(true);
              setInitMsg(null);
              const res = await syncToDatabase();
              setInitMsg(res.message);
              setIsSyncing(false);
            }}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
            title="Simpan data aplikasi saat ini ke tabel MySQL Hostinger"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>📤 Push Data ke MySQL</span>
          </button>
          <button
            onClick={async () => {
              setIsInitializing(true);
              setInitMsg(null);
              const res = await initHostingerDatabase();
              setInitMsg(res.message);
              setIsInitializing(false);
            }}
            disabled={isInitializing}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
            title="Inisialisasi atau buat ulang seluruh tabel di MySQL Hostinger secara otomatis"
          >
            <span>{isInitializing ? 'Membuat Tabel...' : '⚡ Inisialisasi Ulang'}</span>
          </button>
          <a
            href="/database_hostinger.sql"
            download="database_hostinger.sql"
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh SQL</span>
          </a>
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>
          <button
            onClick={() => {
              if (confirm('Kembalikan data ke awal (default)?')) resetDatabaseToDefault();
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center space-x-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {initMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium">
          {initMsg}
        </div>
      )}

      {/* Database Tables Tabs Bar */}
      <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center space-x-1.5 overflow-x-auto">
        {tables.map(t => {
          const isActive = activeTable === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTable(t.id)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm ${
                isActive
                  ? 'bg-white text-slate-800 shadow-md border-b-2 border-blue-600'
                  : 'bg-slate-100/70 text-slate-600 hover:bg-white/80'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${t.color}`} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-[10px] text-slate-700 font-semibold">
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table Data View */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700">
            Tabel MySQL: <strong>{activeTable}</strong>
          </span>
          {activeTable === 'mysql_script' ? (
            <button
              onClick={handleCopySql}
              className="px-3 py-1 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center space-x-1 shadow-sm"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Skrip SQL'}</span>
            </button>
          ) : (
            <span className="text-[11px]">Format: MySQL 8.0+ / MariaDB Hostinger Grid</span>
          )}
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          {/* TABEL 1: CHECKLIST MASTER */}
          {activeTable === 'checklist_master' && (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100/90 text-slate-600 font-bold sticky top-0 border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">id</th>
                  <th className="p-3">nama</th>
                  <th className="p-3">kategori</th>
                  <th className="p-3">deskripsi</th>
                  <th className="p-3 text-center">bobot</th>
                  <th className="p-3 text-center">aktif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {checklistItems.map(c => (
                  <tr key={c.id} className="hover:bg-blue-50/40">
                    <td className="p-3 font-bold text-blue-700">{c.id}</td>
                    <td className="p-3 font-sans font-semibold text-slate-900">{c.nama}</td>
                    <td className="p-3">{c.kategori}</td>
                    <td className="p-3 font-sans text-slate-500">{c.deskripsi}</td>
                    <td className="p-3 text-center font-bold">{c.bobot}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.aktif ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {c.aktif ? '1 (Aktif)' : '0 (Nonaktif)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TABEL 2: LOG PENGADUAN */}
          {activeTable === 'log_pengaduan' && (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100/90 text-slate-600 font-bold sticky top-0 border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">id</th>
                  <th className="p-3">timestamp</th>
                  <th className="p-3">id_lokasi</th>
                  <th className="p-3">nama_pelapor</th>
                  <th className="p-3">detail_keluhan</th>
                  <th className="p-3 text-center">status_tindak_lanjut</th>
                  <th className="p-3">catatan_penyelesaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pengaduanList.map(a => (
                  <tr key={a.id} className="hover:bg-blue-50/40">
                    <td className="p-3 font-bold text-rose-600">{a.id}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{a.Timestamp}</td>
                    <td className="p-3 font-bold text-blue-700">{a.ID_Lokasi}</td>
                    <td className="p-3 font-sans font-medium text-slate-900">{a.Nama_Pelapor}</td>
                    <td className="p-3 font-sans text-slate-700 max-w-xs">{a.Detail_Keluhan}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${a.Status_Tindak_Lanjut === 'Selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {a.Status_Tindak_Lanjut}
                      </span>
                    </td>
                    <td className="p-3 font-sans text-emerald-900">{a.Catatan_Penyelesaian || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TABEL 3: SARAN PELAYANAN */}
          {activeTable === 'saran_pelayanan' && (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100/90 text-slate-600 font-bold sticky top-0 border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">id</th>
                  <th className="p-3">timestamp</th>
                  <th className="p-3">id_lokasi</th>
                  <th className="p-3">nama_pemberi_saran</th>
                  <th className="p-3">kategori_saran</th>
                  <th className="p-3">judul_saran</th>
                  <th className="p-3">detail_saran</th>
                  <th className="p-3">prioritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {saranList.map(s => (
                  <tr key={s.id} className="hover:bg-blue-50/40">
                    <td className="p-3 font-bold text-blue-700">{s.id}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{s.Timestamp}</td>
                    <td className="p-3">{s.ID_Lokasi}</td>
                    <td className="p-3 font-sans">{s.Nama_Pemberi_Saran}</td>
                    <td className="p-3">{s.Kategori_Saran}</td>
                    <td className="p-3 font-sans font-semibold text-slate-800">{s.Judul_Saran}</td>
                    <td className="p-3 font-sans text-slate-600 max-w-xs">{s.Detail_Saran}</td>
                    <td className="p-3 font-bold">{s.Prioritas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TABEL 4: RATING REVIEW */}
          {activeTable === 'rating_review' && (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100/90 text-slate-600 font-bold sticky top-0 border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">id</th>
                  <th className="p-3">timestamp</th>
                  <th className="p-3">id_lokasi</th>
                  <th className="p-3">nama_reviewer</th>
                  <th className="p-3 text-center">bintang</th>
                  <th className="p-3">komentar_review</th>
                  <th className="p-3 text-center">rekomendasikan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {ratingList.map(r => (
                  <tr key={r.id} className="hover:bg-blue-50/40">
                    <td className="p-3 font-bold text-amber-700">{r.id}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{r.Timestamp}</td>
                    <td className="p-3">{r.ID_Lokasi}</td>
                    <td className="p-3 font-sans font-medium">{r.Nama_Reviewer}</td>
                    <td className="p-3 text-center font-bold text-amber-500">
                      {'⭐'.repeat(r.Bintang)} ({r.Bintang}/5)
                    </td>
                    <td className="p-3 font-sans text-slate-600 max-w-xs">{r.Komentar_Review}</td>
                    <td className="p-3 text-center">{r.Rekomendasikan ? 'Ya (1)' : 'Tidak (0)'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TABEL 5: LOKASI */}
          {activeTable === 'lokasi' && (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100/90 text-slate-600 font-bold sticky top-0 border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">id_lokasi</th>
                  <th className="p-3">nama_ruangan</th>
                  <th className="p-3">kategori</th>
                  <th className="p-3">id_pengampu</th>
                  <th className="p-3 text-center">status_terkini</th>
                  <th className="p-3">last_update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lokasiList.map(r => (
                  <tr key={r.ID_Lokasi} className="hover:bg-blue-50/40">
                    <td className="p-3 font-bold text-blue-700">{r.ID_Lokasi}</td>
                    <td className="p-3 font-sans font-medium text-slate-900">{r.Nama_Ruangan}</td>
                    <td className="p-3">{r.Kategori}</td>
                    <td className="p-3 text-slate-600">{r.ID_Pengampu}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${r.Status_Terkini === 'Hijau' ? 'bg-emerald-100 text-emerald-800' : r.Status_Terkini === 'Kuning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                        {r.Status_Terkini}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">{r.Last_Update}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TABEL 6: PENGAMPU */}
          {activeTable === 'pengampu' && (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100/90 text-slate-600 font-bold sticky top-0 border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">id_pengampu</th>
                  <th className="p-3">nama_petugas</th>
                  <th className="p-3">username</th>
                  <th className="p-3">role</th>
                  <th className="p-3">kontak_telegram</th>
                  <th className="p-3">telepon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pengampuList.map(p => (
                  <tr key={p.ID_Pengampu} className="hover:bg-blue-50/40">
                    <td className="p-3 font-bold text-blue-700">{p.ID_Pengampu}</td>
                    <td className="p-3 font-sans font-medium text-slate-900">{p.Nama_Petugas}</td>
                    <td className="p-3">{p.Username}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold">{p.Role}</span>
                    </td>
                    <td className="p-3 text-slate-500">{p.Kontak_Telegram}</td>
                    <td className="p-3 text-slate-500">{p.Telepon || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* TABEL 7: LOG INSPEKSI */}
          {activeTable === 'log_inspeksi' && (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100/90 text-slate-600 font-bold sticky top-0 border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-3">timestamp</th>
                  <th className="p-3">id_lokasi</th>
                  <th className="p-3">id_pengampu</th>
                  <th className="p-3">skor</th>
                  <th className="p-3">status_warna</th>
                  <th className="p-3">catatan_kritis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {inspeksiList.map((insp, i) => (
                  <tr key={i} className="hover:bg-blue-50/40">
                    <td className="p-3 text-slate-500 whitespace-nowrap">{insp.Timestamp}</td>
                    <td className="p-3 font-bold text-blue-700">{insp.ID_Lokasi}</td>
                    <td className="p-3">{insp.ID_Pengampu}</td>
                    <td className="p-3 font-bold">{insp.Skor_Kebersihan}%</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${insp.Status_Warna === 'Hijau' ? 'bg-emerald-100 text-emerald-800' : insp.Status_Warna === 'Kuning' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                        {insp.Status_Warna}
                      </span>
                    </td>
                    <td className="p-3 font-sans max-w-xs">{insp.Catatan_Kritis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* SKRIP SQL HOSTINGER VIEW */}
          {activeTable === 'mysql_script' && (
            <div className="p-5 bg-slate-900 text-slate-200 font-mono text-xs leading-relaxed">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <span className="text-emerald-400 font-bold">
                  File: database_hostinger.sql (Siap Import ke phpMyAdmin Hostinger)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Engine InnoDB, utf8mb4_unicode_ci
                </span>
              </div>
              <pre className="whitespace-pre-wrap overflow-x-auto text-[11px] text-slate-300">
{`-- ============================================================================
-- SKRIP DATABASE MYSQL HOSTINGER: SIM-KTR (Sistem Informasi Monitoring Kebersihan)
-- Kompatibel: MySQL 8.0+, MariaDB 10.4+, Hostinger hPanel & cPanel
-- ============================================================================

CREATE TABLE IF NOT EXISTS checklist_master (
  id VARCHAR(20) NOT NULL PRIMARY KEY,
  nama VARCHAR(200) NOT NULL,
  kategori ENUM('Semua', 'Toilet', 'Ruangan') NOT NULL DEFAULT 'Semua',
  deskripsi TEXT DEFAULT NULL,
  bobot INT NOT NULL DEFAULT 1,
  aktif TINYINT(1) NOT NULL DEFAULT 1,
  urutan INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS log_pengaduan (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  timestamp VARCHAR(50) NOT NULL,
  id_lokasi VARCHAR(20) NOT NULL,
  nama_pelapor VARCHAR(100) NOT NULL,
  kontak_pelapor VARCHAR(50) DEFAULT NULL,
  detail_keluhan TEXT NOT NULL,
  status_tindak_lanjut ENUM('Pending', 'Proses', 'Selesai') NOT NULL DEFAULT 'Pending',
  kategori_keluhan VARCHAR(100) DEFAULT NULL,
  catatan_penyelesaian TEXT DEFAULT NULL,
  petugas_penangan VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS saran_pelayanan (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  timestamp VARCHAR(50) NOT NULL,
  id_lokasi VARCHAR(20) NOT NULL,
  nama_pemberi_saran VARCHAR(100) NOT NULL,
  kontak VARCHAR(100) DEFAULT NULL,
  kategori_saran VARCHAR(100) NOT NULL,
  judul_saran VARCHAR(200) NOT NULL,
  detail_saran TEXT NOT NULL,
  prioritas ENUM('Biasa', 'Penting', 'Mendesak') NOT NULL DEFAULT 'Biasa',
  status_tinjauan ENUM('Diterima', 'Diproses', 'Diimplementasikan') NOT NULL DEFAULT 'Diterima'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rating_review (
  id VARCHAR(50) NOT NULL PRIMARY KEY,
  timestamp VARCHAR(50) NOT NULL,
  id_lokasi VARCHAR(20) NOT NULL,
  nama_reviewer VARCHAR(100) NOT NULL,
  bintang TINYINT NOT NULL DEFAULT 5,
  rating_kebersihan_lantai TINYINT DEFAULT 5,
  rating_ketersediaan_air_sabun TINYINT DEFAULT 5,
  rating_aroma_keharuman TINYINT DEFAULT 5,
  rating_kesigapan_petugas TINYINT DEFAULT 5,
  komentar_review TEXT DEFAULT NULL,
  rekomendasikan TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
