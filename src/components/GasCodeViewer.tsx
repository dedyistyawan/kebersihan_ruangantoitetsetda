import React, { useState } from 'react';
import { GAS_FILES } from '../data/gasSource';
import {
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
  BookOpen,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Server,
  Terminal,
  Layers
} from 'lucide-react';

export const GasCodeViewer: React.FC = () => {
  const [selectedFileName, setSelectedFileName] = useState<string>('Code.gs');
  const [copied, setCopied] = useState(false);
  const [activeGuideStep, setActiveGuideStep] = useState<number>(1);

  const selectedFile = GAS_FILES[selectedFileName] || GAS_FILES['Code.gs'];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider border border-blue-500/30">
              Source Code Google Apps Script (GAS)
            </span>
            <span className="text-xs text-slate-400">Siap Copy & Paste</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1">
            Arsitektur Kode & Panduan Penerapan (Deployment)
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Semua file berikut telah dirancang modular untuk diunggah langsung ke Editor Google Apps Script yang terhubung dengan Google Sheets Anda.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center space-x-2 shadow-lg transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Kode File Ini'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center space-x-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Unduh File</span>
          </button>
        </div>
      </div>

      {/* Main Grid: File Tabs & Code Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: File Explorer Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Daftar File Project ({Object.keys(GAS_FILES).length})
          </span>

          <div className="space-y-1.5">
            {Object.keys(GAS_FILES).map(key => {
              const file = GAS_FILES[key];
              const isSelected = selectedFileName === key;
              const isServer = file.type === 'server';

              return (
                <button
                  key={key}
                  onClick={() => setSelectedFileName(key)}
                  className={`w-full text-left p-3 rounded-2xl text-xs font-semibold flex items-center justify-between transition border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <FileCode
                      className={`w-4 h-4 shrink-0 ${
                        isSelected
                          ? 'text-white'
                          : isServer
                          ? 'text-amber-500'
                          : 'text-blue-500'
                      }`}
                    />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold shrink-0 ${
                      isSelected
                        ? 'bg-blue-700 text-blue-100'
                        : isServer
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isServer ? 'GAS' : 'HTML'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Cheat Sheet Card */}
          <div className="bg-slate-900 text-slate-200 p-4 rounded-3xl border border-slate-800 text-xs space-y-2.5 mt-4">
            <div className="flex items-center space-x-2 text-sky-400 font-bold">
              <Server className="w-4 h-4" />
              <span>Struktur Routing GAS:</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-start space-x-1.5">
                <span className="text-emerald-400">&bull;</span>
                <span>
                  <code>?lokasi=ID</code> &rarr; Menampilkan <strong>Pengaduan.html</strong> (Publik tanpa login).
                </span>
              </li>
              <li className="flex items-start space-x-1.5">
                <span className="text-blue-400">&bull;</span>
                <span>
                  Tanpa parameter &rarr; Menampilkan <strong>Index.html</strong> (Login & Dasbor).
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Code Viewer Area */}
        <div className="lg:col-span-9 space-y-3">
          {/* File description header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-800 font-mono text-sm">
                {selectedFile.name}
              </span>
              <p className="text-slate-500 text-[11px] mt-0.5">{selectedFile.description}</p>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center space-x-1 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Copy'}</span>
            </button>
          </div>

          {/* Code Container */}
          <div className="relative rounded-3xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">{selectedFile.name}</span>
              <span>UTF-8 &bull; {selectedFile.code.split('\n').length} lines</span>
            </div>

            <pre className="p-5 font-mono text-xs text-slate-200 overflow-x-auto max-h-[580px] leading-relaxed select-all">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* PANDUAN LANGKAH DEPLOYMENT WEB APP DENGAN GAMBAR / INFOGRAFIS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Tutorial Langkah Demi Langkah
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mt-1">
            Cara Menerapkan (Deploy) Web App agar Parameter ?lokasi= Berfungsi Dinamis
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Ikuti 5 langkah mudah berikut pada Google Spreadsheet dan Google Apps Script Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
              1
            </div>
            <h4 className="font-bold text-xs text-slate-800">Buka Spreadsheet & Apps Script</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Buka Google Sheets baru di <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">sheets.new</a>. Lalu klik menu <strong>Ekstensi (Extensions) &gt; Apps Script</strong>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
              2
            </div>
            <h4 className="font-bold text-xs text-slate-800">Buat 6 File Sesuai Nama</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Buat <code>Code.gs</code> (Script), serta 5 file HTML (klik tanda + lalu pilih HTML): <code>Index</code>, <code>Pengaduan</code>, <code>Login</code>, <code>Petugas</code>, dan <code>Supervisor</code>. Paste masing-masing kode.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">
              3
            </div>
            <h4 className="font-bold text-xs text-slate-800">Jalankan Inisialisasi Database</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Di toolbar atas Code.gs, pilih fungsi <code>inisialisasiDatabase</code> lalu klik <strong>Jalankan (Run)</strong>. Ke-4 sheet (Master_Lokasi, Master_Pengampu, Log_Inspeksi, Log_Pengaduan) akan otomatis dibuat dan diisi header serta contoh data!
            </p>
          </div>
        </div>

        {/* Highlight Box Deploy as Anyone */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 space-y-3">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <span>KUNCI UTAMA DEPLOYMENT (Supaya Scan QR Pengunjung Lancar Tanpa Login Google):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-950">
            <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200 space-y-1">
              <span className="font-bold block text-blue-700">1. Jalankan sebagai (Execute as):</span>
              <p className="text-slate-700">
                Pilih <strong>"Saya" (Me / email Anda)</strong>. Ini wajib agar pengunjung umum bisa membaca dan mengirim laporan tanpa perlu memiliki akun Google atau akses edit ke Spreadsheet Anda.
              </p>
            </div>

            <div className="bg-white/80 p-3.5 rounded-2xl border border-amber-200 space-y-1">
              <span className="font-bold block text-rose-700">2. Siapa yang memiliki akses (Who has access):</span>
              <p className="text-slate-700">
                Pilih <strong>"Siapa saja" (Anyone)</strong>. Dengan opsi ini, URL Web App parameter <code>?lokasi=ID_LOKASI</code> dapat dibuka secara instan saat kamera smartphone memindai stiker QR Code di pintu toilet/ruangan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
