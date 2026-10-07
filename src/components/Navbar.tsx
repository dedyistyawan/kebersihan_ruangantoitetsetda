import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  QrCode,
  Globe,
  Bell,
  X,
  Send,
  Building2,
  Activity,
  LogIn,
  LogOut,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    logoutUser,
    telegramLogs,
    clearAllTelegramLogs,
    pengaduanList
  } = useApp();

  const [showTelegramModal, setShowTelegramModal] = useState(false);

  const pendingCount = pengaduanList.filter(p => p.Status_Tindak_Lanjut === 'Pending').length;
  const isSupervisor = currentUser?.Role === 'Supervisor';
  const isPetugas = currentUser?.Role === 'Petugas';

  interface NavItem {
    id: string;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    badge?: number | string;
    badgeColor?: string;
    isActive: boolean;
    onClick: () => void;
  }

  // Menu navigasi: Bersih untuk Publik, dan memunculkan dasbor kerja saat akun Petugas/Supervisor login
  const navItems: NavItem[] = [
    {
      id: 'dasbor-publik',
      label: 'Dasbor Publik',
      sublabel: 'Transparansi & Status Kebersihan',
      icon: <Globe className="w-4 h-4 text-emerald-400" />,
      isActive: activeTab === 'dasbor-publik',
      onClick: () => setActiveTab('dasbor-publik')
    },
    {
      id: 'sim-qr',
      label: 'Scan QR Pengunjung',
      sublabel: 'Form Aduan, Saran & Rating',
      icon: <QrCode className="w-4 h-4 text-rose-400" />,
      badge: pendingCount > 0 ? `${pendingCount} Aduan Aktif` : '3 Menu',
      badgeColor: pendingCount > 0 ? 'bg-amber-500 text-white' : undefined,
      isActive: activeTab === 'sim-qr',
      onClick: () => setActiveTab('sim-qr')
    }
  ];

  // Tambahkan Dasbor Petugas jika Petugas sedang login
  if (isPetugas) {
    navItems.push({
      id: 'petugas',
      label: 'Dasbor Petugas',
      sublabel: 'Tugas Piket & Ceklis Ruangan',
      icon: <Sparkles className="w-4 h-4 text-blue-400" />,
      isActive: activeTab === 'petugas',
      onClick: () => setActiveTab('petugas')
    });
  }

  // Tambahkan Dasbor Supervisor jika Supervisor sedang login
  if (isSupervisor) {
    navItems.push({
      id: 'supervisor',
      label: 'Dasbor Supervisor',
      sublabel: 'Pengawasan, Ceklis & Rekap',
      icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
      badge: pendingCount > 0 ? `${pendingCount} Baru` : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
      isActive: activeTab === 'supervisor',
      onClick: () => setActiveTab('supervisor')
    });
  }

  return (
    <>
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-lg">
        {/* =================================================================== */}
        {/* BARIS 1: BRAND TITLE & STATUS SYSTEM & TOMBOL LOGIN / USER PROFILE  */}
        {/* =================================================================== */}
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-3 border-b border-slate-800/80">
          <div className="flex items-center justify-between gap-4">
            {/* Sisi Kiri: Brand & Logo */}
            <div
              onClick={() => setActiveTab('dasbor-publik')}
              className="flex items-center space-x-3.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="font-black text-lg sm:text-xl tracking-tight text-white leading-none">
                    DASHBOARD KEBERSIHAN RUANGAN DAN TOILET
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 hidden sm:block">
                  Sistem Informasi Monitoring Kebersihan Toilet & Ruangan Real-time
                </p>
              </div>
            </div>

            {/* Sisi Kanan: Status & Telegram & TOMBOL LOGIN / PROFIL */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Status Real-time Indicator */}
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-slate-300 font-medium flex items-center space-x-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400 inline" />
                  <span>Monitoring Aktif</span>
                </span>
              </div>

              {/* Telegram Log Drawer Button */}
              <button
                onClick={() => setShowTelegramModal(true)}
                className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Log Notifikasi Bot Telegram"
              >
                <Bell className="w-4 h-4 text-sky-400" />
                {telegramLogs.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {telegramLogs.length > 9 ? '9+' : telegramLogs.length}
                  </span>
                )}
              </button>

              {/* TOMBOL LOGIN ATAU USER PROFILE */}
              {currentUser ? (
                <div className="flex items-center space-x-2 pl-1 border-l border-slate-700/70">
                  <div
                    onClick={() => {
                      if (currentUser.Role === 'Supervisor') {
                        setActiveTab('supervisor');
                      } else {
                        setActiveTab('petugas');
                      }
                    }}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 cursor-pointer transition text-left"
                    title="Buka Dasbor Petugas/Supervisor Anda"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {currentUser.Nama_Petugas.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-xs">
                      <div className="font-bold text-white truncate max-w-[120px]">
                        {currentUser.Nama_Petugas.split(' ')[0]}
                      </div>
                      <span className="text-[10px] text-blue-400 font-semibold block -mt-0.5">
                        {currentUser.Role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={logoutUser}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-semibold flex items-center space-x-1.5 transition"
                    title="Keluar dari akun"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Keluar</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                    activeTab === 'login'
                      ? 'bg-blue-500 text-white ring-2 ring-blue-400/50'
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-95'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* BARIS 2: TABS NAVIGASI BERSIH & FOKUS                                */}
        {/* =================================================================== */}
        <div className="bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md">
          <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-2">
            <nav className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1 w-full">
              {navItems.map(item => {
                const isActive = item.isActive;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`group relative shrink-0 flex items-center space-x-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-150 text-left border ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border-blue-400/50 ring-1 ring-blue-400/40'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800 hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div
                      className={`shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-white/20 text-white shadow-inner'
                          : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white'
                      }`}
                    >
                      {item.icon}
                    </div>

                    <div className="min-w-0 pr-1">
                      <div className="leading-tight flex items-center space-x-1.5">
                        <span className="truncate whitespace-nowrap">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                              item.badgeColor ||
                              (isActive
                                ? 'bg-white text-blue-700 shadow-2xs'
                                : 'bg-slate-800 text-blue-300 border border-blue-500/30')
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-normal truncate whitespace-nowrap block mt-0.5 ${
                          isActive ? 'text-blue-100 font-medium' : 'text-slate-400 group-hover:text-slate-300'
                        }`}
                      >
                        {item.sublabel}
                      </span>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <span className="absolute -bottom-2.5 left-4 right-4 h-0.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.9)]" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* MODAL LOG NOTIFIKASI TELEGRAM BOT */}
      {showTelegramModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden animate-in zoom-in-95">
            <div className="bg-sky-700 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-sky-200" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Log Notifikasi Bot Telegram</h3>
                  <p className="text-[11px] text-sky-200">Riwayat pengiriman API telegram resmi</p>
                </div>
              </div>
              <button
                onClick={() => setShowTelegramModal(false)}
                className="text-sky-200 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {telegramLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Send className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                  Belum ada notifikasi Telegram yang dikirimkan.
                  <p className="mt-1 text-[11px] text-slate-500">
                    Kirimkan laporan pengaduan di menu <strong>"Scan QR Pengunjung"</strong> untuk memicu bot Telegram secara otomatis!
                  </p>
                </div>
              ) : (
                telegramLogs.map(log => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-sky-400 flex items-center space-x-1">
                        <span>Penerima: {log.targetName}</span>
                        <span className="text-slate-500 font-mono">({log.chatId})</span>
                      </span>
                      <span>{log.timestamp}</span>
                    </div>
                    <pre className="font-sans whitespace-pre-wrap text-slate-200 bg-slate-950/60 p-3 rounded-xl border border-slate-800 leading-relaxed text-[11px]">
                      {log.message}
                    </pre>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs bg-slate-900/90">
              <span className="text-slate-400 text-[11px]">
                Total Notifikasi: <strong>{telegramLogs.length}</strong>
              </span>
              <button
                onClick={clearAllTelegramLogs}
                disabled={telegramLogs.length === 0}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition font-medium"
              >
                Bersihkan Riwayat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
