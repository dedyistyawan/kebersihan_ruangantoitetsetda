import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Server,
  Database,
  Terminal,
  FileCode,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  Send,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw,
  Zap,
  Download,
  Info,
  Link2,
  Key,
  Layers,
  Check,
  Upload
} from 'lucide-react';

export const HostingerDeployView: React.FC = () => {
  const {
    serverStatus,
    databaseDetails,
    lokasiList,
    pengampuList,
    checklistItems,
    inspeksiList,
    pengaduanList,
    saranList,
    ratingList,
    initHostingerDatabase,
    connectAndInitHostingerDatabase,
    syncFromDatabase,
    syncToDatabase,
    refreshDatabaseStatus,
    generateLiveSqlScript
  } = useApp();

  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [liveSqlCopied, setLiveSqlCopied] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [initFeedback, setInitFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Form Sambungkan Database
  const [dbForm, setDbForm] = useState({
    host: serverStatus.dbHost || 'localhost',
    port: '3306',
    user: '',
    password: '',
    database: serverStatus.dbName || ''
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectFeedback, setConnectFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleInitDatabase = async () => {
    setIsInitializing(true);
    setInitFeedback(null);
    try {
      const res = await initHostingerDatabase();
      setInitFeedback({
        success: res.success,
        message: res.message || (res.success ? 'Tabel berhasil dibuat!' : 'Gagal membuat tabel')
      });
    } catch (err: any) {
      setInitFeedback({
        success: false,
        message: err.message || 'Terjadi kesalahan saat memanggil server'
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectFeedback(null);
    try {
      const res = await connectAndInitHostingerDatabase(dbForm);
      setConnectFeedback({
        success: res.success,
        message: res.message
      });
    } catch (err: any) {
      setConnectFeedback({
        success: false,
        message: err.message || 'Gagal menyambungkan ke database'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCopySqlFromPublic = async () => {
    try {
      const res = await fetch('/database_hostinger.sql');
      const text = await res.text();
      navigator.clipboard.writeText(text);
      setSqlCopied(true);
      setTimeout(() => setSqlCopied(false), 2500);
    } catch {
      handleCopy('-- Skrip SQL database_hostinger.sql', 'sql');
    }
  };

  const sampleEnv = `# Hostinger Node.js .env Configuration
PORT=3000
NODE_ENV=production

# MySQL Database Hostinger (phpMyAdmin)
# Pada Hostinger hPanel, host biasanya 'localhost' atau '127.0.0.1'
DB_HOST=${dbForm.host || 'localhost'}
DB_PORT=3306
DB_USER=${dbForm.user || 'u123456789_simktr'}
DB_PASSWORD=${dbForm.password || 'Password_MySQL_Hostinger_Anda'}
DB_NAME=${dbForm.database || 'u123456789_simktr_db'}

# Telegram Bot Notification (Opsional)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIJklmNoPQRsTUVwxyZ
TELEGRAM_CHAT_ID=-1001234567890`;

  const tablesList = [
    { name: 'pengampu', desc: 'Akun Petugas & Supervisor Kebersihan', required: 5 },
    { name: 'lokasi', desc: 'Master 15 Ruangan & Toilet', required: 15 },
    { name: 'checklist_master', desc: 'Item Indikator Inspeksi Harian', required: 8 },
    { name: 'log_inspeksi', desc: 'Riwayat Inspeksi Petugas' },
    { name: 'log_pengaduan', desc: 'Laporan Kerusakan & Keluhan Pengunjung' },
    { name: 'saran_pelayanan', desc: 'Saran & Aspirasi Pengunjung' },
    { name: 'rating_review', desc: 'Review Bintang Kepuasan Fasilitas' },
    { name: 'telegram_logs', desc: 'Log Pemicu Notifikasi Bot Telegram' },
    { name: 'greeting_messages', desc: 'Kartu Ucapan & Apresiasi Footer' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-bold">
              <Server className="w-3.5 h-3.5" />
              <span>Hostinger Cloud / VPS / cPanel / hPanel Node.js</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Panduan Deploy Aplikasi ke Hostinger & Sinkronisasi Database MySQL
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Aplikasi SIM-KTR dirancang menggunakan arsitektur full-stack Express + React yang 100% kompatibel dengan <strong>Node.js versi 18.x hingga 24.x</strong> serta database <strong>MySQL / MariaDB Hostinger</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs space-y-1.5 shrink-0">
            <div className="flex items-center space-x-2 text-emerald-300 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Status Runtime Engine</span>
            </div>
            <div className="text-[11px] text-slate-200 space-y-0.5">
              <p>Node.js: <strong>{serverStatus.nodeVersion}</strong></p>
              <p>Database: <strong>{serverStatus.engine}</strong></p>
              <p>Host/DB: <strong>{serverStatus.dbHost || 'localhost'} / {serverStatus.dbName || 'simktr_db'}</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* PENJELASAN PENTING: KENAPA DATABASE BELUM TERBUAT DI PHPMYADMIN?    */}
      {/* =================================================================== */}
      <div className="p-5 sm:p-6 bg-amber-50/90 border border-amber-200 rounded-3xl text-xs space-y-3 text-amber-950 shadow-sm">
        <div className="flex items-center space-x-2.5 font-bold text-sm text-amber-900">
          <Info className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Mengapa database / tabel belum muncul di phpMyAdmin setelah deploy ulang?</span>
        </div>
        <div className="space-y-2 text-amber-900/90 leading-relaxed">
          <p>
            Di shared hosting Hostinger (hPanel), <strong>aplikasi Node.js TIDAK BISA membuat wadah database baru secara otomatis</strong> dari kode program karena Hostinger membatasi hak akses root database demi keamanan server.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 space-y-1">
              <span className="font-bold text-amber-800 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px]">1</span>
                <span>Buat Wadah Database di hPanel (1x Saja)</span>
              </span>
              <p className="text-[11px] text-slate-600">
                Buka <strong>hPanel &rarr; Databases &rarr; MySQL Databases</strong>. Buat database baru (misal: <code>u123456789_simktr</code>) dan buat user beserta password-nya.
              </p>
            </div>

            <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/60 space-y-1">
              <span className="font-bold text-amber-800 flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px]">2</span>
                <span>Pilih Salah Satu Cara Buat Tabel di Bawah</span>
              </span>
              <p className="text-[11px] text-slate-600">
                <strong>Cara A:</strong> Masukkan user & password pada form di bawah (Otomatis).<br />
                <strong>Cara B:</strong> Copy skrip SQL ke tab <em>SQL</em> phpMyAdmin (Hanya 30 detik).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* METODE A: FORM SAMBUNGKAN DATABASE LANGSUNG DARI WEB UI (WIZARD)    */}
      {/* =================================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Metode A: Sambungkan Database MySQL Hostinger (1-Klik)
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Rekomendasi
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Masukkan kredensial database yang Anda buat di hPanel Hostinger. Sistem akan langsung menghubungkan, menyimpan ke file .env, dan membuat 9 tabel secara instan!
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => refreshDatabaseStatus()}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Segarkan Status</span>
          </button>
        </div>

        <form onSubmit={handleConnectSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Database Host:
              </label>
              <input
                type="text"
                required
                value={dbForm.host}
                onChange={e => setDbForm({ ...dbForm, host: e.target.value })}
                placeholder="localhost atau 127.0.0.1"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Di Hostinger biasanya <code>localhost</code></span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Port MySQL:
              </label>
              <input
                type="text"
                required
                value={dbForm.port}
                onChange={e => setDbForm({ ...dbForm, port: e.target.value })}
                placeholder="3306"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Default port 3306</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nama Database:
              </label>
              <input
                type="text"
                required
                value={dbForm.database}
                onChange={e => setDbForm({ ...dbForm, database: e.target.value })}
                placeholder="u123456789_simktr"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Sesuai nama database di hPanel</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Username Database:
              </label>
              <input
                type="text"
                required
                value={dbForm.user}
                onChange={e => setDbForm({ ...dbForm, user: e.target.value })}
                placeholder="u123456789_admin"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">User yang diberi akses ke database</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Password Database:
              </label>
              <input
                type="password"
                value={dbForm.password}
                onChange={e => setDbForm({ ...dbForm, password: e.target.value })}
                placeholder="Password di hPanel"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Password user database</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-500">
              *Setelah klik hubungkan, konfigurasi akan otomatis disimpan ke <code>.env</code> di server Anda.
            </div>

            <button
              type="submit"
              disabled={isConnecting}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-60 shrink-0"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menghubungkan & Membuat Tabel...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Hubungkan Database & Buat 9 Tabel Sekarang</span>
                </>
              )}
            </button>
          </div>
        </form>

        {connectFeedback && (
          <div
            className={`p-4 sm:p-5 rounded-2xl text-xs flex items-start space-x-3 ${
              connectFeedback.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-sm'
                : 'bg-rose-50 text-rose-900 border border-rose-200 shadow-sm'
            }`}
          >
            {connectFeedback.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 flex-1">
              <span className="font-bold text-sm block leading-snug">{connectFeedback.message}</span>
              {connectFeedback.success ? (
                <p className="text-[11px] text-emerald-700">
                  Buka kembali phpMyAdmin di Hostinger Anda, klik nama database di panel kiri &rarr; sekarang seluruh 9 tabel sudah muncul dan terisi data!
                </p>
              ) : (
                <div className="p-3 bg-white/90 rounded-xl border border-rose-200 text-[11px] text-slate-700 space-y-2">
                  <p className="font-semibold text-rose-800">
                    💡 Rekomendasi Solusi Cepat & 100% Berhasil:
                  </p>
                  <p>
                    Jika Anda menguji aplikasi dari luar (sebelum di-upload ke Hostinger) atau jika Remote MySQL Hostinger Anda belum diaktifkan, gunakan <strong>Metode B (Eksekusi Tab SQL phpMyAdmin)</strong> di bawah. Anda cukup menyalin skrip SQL dan menempelkannya di phpMyAdmin, seluruh 9 tabel akan langsung selesai dibuat dalam 30 detik tanpa perlu khawatir kendala jaringan.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopySqlFromPublic}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center space-x-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{sqlCopied ? 'Tersalin ke Clipboard!' : 'Salin Skrip SQL Sekarang & Buka phpMyAdmin'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sinkronisasi Data Aplikasi vs Database */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
                <RefreshCw className="w-4 h-4 text-indigo-600" />
                <span>Sinkronisasi Data Aplikasi &harr; Database MySQL Hostinger</span>
              </h4>
              <p className="text-[11px] text-indigo-800/80">
                Samakan data antara aplikasi browser dan tabel database Hostinger secara langsung.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  const sql = generateLiveSqlScript();
                  navigator.clipboard.writeText(sql);
                  setLiveSqlCopied(true);
                  setSyncFeedback({
                    success: true,
                    message: '✅ Skrip SQL Data Input Terkini berhasil disalin! Silakan buka phpMyAdmin -> Menu "SQL" -> Tempel & Kirim untuk sinkronisasi instan.'
                  });
                  setTimeout(() => setLiveSqlCopied(false), 3000);
                }}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
                title="Salin skrip SQL berisi seluruh data input aplikasi terkini (Aduan, Saran, Rating, Inspeksi)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{liveSqlCopied ? '✓ Tersalin!' : '⚡ Salin SQL Data Input Terkini'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIsSyncing(true);
                  setSyncFeedback(null);
                  const res = await syncFromDatabase();
                  setSyncFeedback({
                    success: res.success,
                    message: res.message || 'Data aplikasi berhasil disinkronkan langsung dari database MySQL Hostinger!'
                  });
                  setIsSyncing(false);
                }}
                disabled={isSyncing}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Menyinkronkan...' : '🔄 Tarik Data dari Database'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  setIsSyncing(true);
                  setSyncFeedback(null);
                  const res = await syncToDatabase();
                  setSyncFeedback({
                    success: res.success,
                    message: res.message
                  });
                  setIsSyncing(false);
                }}
                disabled={isSyncing}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm transition disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>📤 Push Data ke MySQL</span>
              </button>
            </div>
          </div>

          {/* Perbandingan Jumlah Data Aplikasi vs Database */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100 flex items-center justify-between">
              <span className="text-slate-600">Lokasi / Ruangan:</span>
              <strong className="text-indigo-900">{lokasiList.length} data</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100 flex items-center justify-between">
              <span className="text-slate-600">Akun Petugas:</span>
              <strong className="text-indigo-900">{pengampuList.length} akun</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100 flex items-center justify-between">
              <span className="text-slate-600">Item Ceklis:</span>
              <strong className="text-indigo-900">{checklistItems.length} item</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-indigo-100 flex items-center justify-between">
              <span className="text-slate-600">Log Inspeksi:</span>
              <strong className="text-indigo-900">{inspeksiList.length} log</strong>
            </div>
          </div>

          {syncFeedback && (
            <div
              className={`p-3.5 rounded-2xl text-xs space-y-2 border font-medium ${
                syncFeedback.success
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-amber-50 text-amber-950 border-amber-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {syncFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                )}
                <span>{syncFeedback.message}</span>
              </div>
              {!syncFeedback.success && (
                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-amber-800">
                    💡 <strong>Tips:</strong> Anda dapat langsung menyalin SQL data input aplikasi terkini untuk di-paste ke phpMyAdmin:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const sql = generateLiveSqlScript();
                      navigator.clipboard.writeText(sql);
                      setLiveSqlCopied(true);
                      setTimeout(() => setLiveSqlCopied(false), 3000);
                    }}
                    className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] inline-flex items-center space-x-1 shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{liveSqlCopied ? 'Tersalin!' : 'Salin SQL Sekarang'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Tabel Real-time */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Status 9 Tabel di phpMyAdmin:
            </h3>
            <span className="text-[11px] text-slate-400">
              Database: <strong className="text-slate-700">{databaseDetails.database || 'Belum Terhubung'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {tablesList.map(tbl => {
              const matched = databaseDetails.tables?.find(t => t.table === tbl.name);
              const exists = matched ? matched.rows >= 0 : false;
              const rowCount = matched && matched.rows >= 0 ? matched.rows : 0;

              return (
                <div
                  key={tbl.name}
                  className={`p-3 rounded-2xl border flex items-center justify-between text-xs transition ${
                    databaseDetails.connected && exists
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-bold text-slate-800 block">{tbl.name}</span>
                    <span className="text-[10px] text-slate-400 block line-clamp-1">{tbl.desc}</span>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    {databaseDetails.connected ? (
                      exists ? (
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                          {rowCount} baris
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200">
                          Belum Dibuat
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-600 font-bold text-[10px]">
                        Lokal / Memori
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* METODE B: SALIN SKRIP SQL LANGSUNG KE TAB "SQL" PHPMYADMIN (30 DETIK) */}
      {/* =================================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-800">
                  Metode B: Eksekusi Langsung via Tab "SQL" phpMyAdmin (30 Detik)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                  Paling Pasti
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cara termudah tanpa perlu unggah file: cukup salin skrip SQL di bawah lalu tempelkan ke tab "SQL" di phpMyAdmin.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopySqlFromPublic}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{sqlCopied ? 'Tersalin ke Clipboard!' : 'Salin Seluruh Perintah SQL'}</span>
            </button>
            <a
              href="/database_hostinger.sql"
              download="database_hostinger.sql"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh File .SQL</span>
            </a>
          </div>
        </div>

        {/* 3 Langkah Mudah di phpMyAdmin */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
              1
            </div>
            <strong className="text-slate-800 block">Buka phpMyAdmin Hostinger</strong>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Buka hPanel &rarr; Databases &rarr; Klik <strong>Masuk ke phpMyAdmin</strong> pada database Anda.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
              2
            </div>
            <strong className="text-slate-800 block">Klik Nama Database & Tab "SQL"</strong>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Di panel sebelah kiri phpMyAdmin, <strong>klik nama database Anda</strong>, lalu klik menu tab <strong>"SQL"</strong> di bagian atas.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
              3
            </div>
            <strong className="text-slate-800 block">Tempel (Paste) & Klik "Kirim / Go"</strong>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Tempelkan (Paste) skrip yang disalin, lalu klik tombol <strong>Kirim / Go</strong> di pojok kanan bawah. Selesai!
            </p>
          </div>
        </div>
      </div>

      {/* 4 LANGKAH PANDUAN STANDAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LANGKAH 1 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                1
              </span>
              <h3 className="font-bold text-slate-800 text-sm">Buat Database di Hostinger hPanel</h3>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-bold">
              hPanel
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed space-y-1">
            1. Buka <strong>hPanel Hostinger &rarr; Databases &rarr; MySQL Databases</strong>.<br />
            2. Masukkan nama database (misal: <code>simktr_db</code>), user database, dan password.<br />
            3. Klik <strong>Buat / Create</strong>.<br />
            4. Catat nama database lengkap yang dibuat (biasanya berawalan username akun, misal: <code>u123456789_simktr_db</code>).
          </p>
        </div>

        {/* LANGKAH 2 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                2
              </span>
              <h3 className="font-bold text-slate-800 text-sm">Konfigurasi Node.js di Hostinger</h3>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold">
              Node 18.x - 24.x
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            1. Pada hPanel / cPanel Hostinger, cari menu <strong>Setup Node.js App</strong>.<br />
            2. Klik <strong>Create Application</strong>:<br />
            &bull; <strong>Node.js Version:</strong> Pilih versi 22.x, 20.x, atau 18.x.<br />
            &bull; <strong>Application Root:</strong> Direktori aplikasi (contoh: <code>/public_html</code> atau <code>/simktr</code>).<br />
            &bull; <strong>Application Startup File:</strong> Isi <code>server.ts</code> (atau <code>server.js</code>).<br />
            3. Klik <strong>Save / Create</strong>.
          </p>
        </div>

        {/* LANGKAH 3 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-sm">
                3
              </span>
              <h3 className="font-bold text-slate-800 text-sm">Konfigurasi File Environment (.env)</h3>
            </div>
            <button
              onClick={() => handleCopy(sampleEnv, 'env')}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedKey === 'env' ? 'Tersalin!' : 'Salin Contoh'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-1">
            File <code>.env</code> di folder utama proyek di Hostinger (dibuat via File Manager atau otomatis dari form di atas):
          </p>

          <pre className="bg-slate-900 text-slate-200 p-3 rounded-2xl font-mono text-[10px] overflow-x-auto leading-relaxed">
            {sampleEnv}
          </pre>
        </div>

        {/* LANGKAH 4 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                4
              </span>
              <h3 className="font-bold text-slate-800 text-sm">Install Dependencies & Jalankan</h3>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[10px] font-bold">
              Terminal / SSH
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            1. Buka <strong>Terminal</strong> di hPanel Hostinger atau via SSH.<br />
            2. Masuk ke direktori aplikasi dan jalankan perintah:
          </p>
          <div className="bg-slate-900 text-emerald-400 p-3 rounded-2xl font-mono text-xs space-y-1">
            <p className="text-slate-400"># 1. Install & build aset</p>
            <p>npm install</p>
            <p>npm run build</p>
            <p className="text-slate-400 pt-1"># 2. (Opsional) Buat tabel via terminal</p>
            <p>npm run db:init</p>
            <p className="text-slate-400 pt-1"># 3. Jalankan server</p>
            <p>npm start</p>
          </div>
          <p className="text-[11px] text-slate-500">
            *Catatan: Saat Anda menjalankan <code>npm start</code>, server juga otomatis memeriksa dan membuat ke-9 tabel jika belum ada!
          </p>
        </div>
      </div>
    </div>
  );
};
