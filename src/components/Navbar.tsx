import React, { useState } from 'react';
import { useApp, AppViewTab } from '../context/AppContext';
import {
  QrCode,
  Sparkles,
  ShieldCheck,
  Server,
  Bell,
  LogOut,
  RotateCcw,
  UserCheck,
  Send,
  X,
  Globe,
  Database,
  Layers,
  ChevronDown,
  MessageSquareWarning,
  ClipboardList,
  Star,
  Building2,
  Users
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    supervisorSubTab,
    setSupervisorSubTab,
    currentUser,
    logoutUser,
    setCurrentUser,
    pengampuList,
    telegramLogs,
    clearAllTelegramLogs,
    resetDatabaseToDefault,
    serverStatus,
    pengaduanList,
    checklistItems,
    ratingList
  } = useApp();

  const [showTelegramModal, setShowTelegramModal] = useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  const pendingCount = pengaduanList.filter(p => p.Status_Tindak_Lanjut === 'Pending').length;
  const isSupervisor = currentUser?.Role === 'Supervisor';

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

  // Navigasi Khusus saat Login sebagai Supervisor
  const supervisorNavItems: NavItem[] = [
    {
      id: 'sup-realtime',
      label: 'Dasbor Supervisor',
      sublabel: 'Status 15 Ruangan & Metrik',
      icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
      isActive: activeTab === 'supervisor' && supervisorSubTab === 'realtime',
      onClick: () => {
        setActiveTab('supervisor');
        setSupervisorSubTab('realtime');
      }
    },
    {
      id: 'sup-pengaduan',
      label: 'Log & Rekap Aduan',
      sublabel: 'Tindak Lanjut Keluhan',
      icon: <MessageSquareWarning className="w-4 h-4 text-rose-400" />,
      badge: pendingCount > 0 ? `${pendingCount} Baru` : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
      isActive: activeTab === 'supervisor' && supervisorSubTab === 'pengaduan',
      onClick: () => {
        setActiveTab('supervisor');
        setSupervisorSubTab('pengaduan');
      }
    },
    {
      id: 'sup-ceklis',
      label: 'Kelola Ceklis',
      sublabel: `${checklistItems.length} Indikator Ceklis`,
      icon: <ClipboardList className="w-4 h-4 text-blue-400" />,
      isActive: activeTab === 'supervisor' && supervisorSubTab === 'ceklis-master',
      onClick: () => {
        setActiveTab('supervisor');
        setSupervisorSubTab('ceklis-master');
      }
    },
    {
      id: 'sup-saran',
      label: 'Saran & Rating',
      sublabel: `${ratingList.length} Ulasan Pengunjung`,
      icon: <Star className="w-4 h-4 text-amber-300" />,
      isActive: activeTab === 'supervisor' && supervisorSubTab === 'saran-review',
      onClick: () => {
        setActiveTab('supervisor');
        setSupervisorSubTab('saran-review');
      }
    },
    {
      id: 'sup-lokasi',
      label: 'Master Ruangan',
      sublabel: 'Toilet & Ruang Rapat',
      icon: <Building2 className="w-4 h-4 text-emerald-400" />,
      isActive: activeTab === 'supervisor' && supervisorSubTab === 'crud-lokasi',
      onClick: () => {
        setActiveTab('supervisor');
        setSupervisorSubTab('crud-lokasi');
      }
    },
    {
      id: 'sup-pengampu',
      label: 'Master Petugas',
      sublabel: 'Akun & Kontak Petugas',
      icon: <Users className="w-4 h-4 text-purple-400" />,
      isActive: activeTab === 'supervisor' && supervisorSubTab === 'crud-pengampu',
      onClick: () => {
        setActiveTab('supervisor');
        setSupervisorSubTab('crud-pengampu');
      }
    },
    {
      id: 'sup-telegram',
      label: 'Bot Telegram',
      sublabel: 'Konfigurasi Notifikasi',
      icon: <Send className="w-4 h-4 text-sky-400" />,
      isActive: activeTab === 'supervisor' && supervisorSubTab === 'telegram-config',
      onClick: () => {
        setActiveTab('supervisor');
        setSupervisorSubTab('telegram-config');
      }
    },
    {
      id: 'database',
      label: 'Database MySQL',
      sublabel: 'Tabel Skema Hostinger',
      icon: <Database className="w-4 h-4 text-teal-400" />,
      isActive: activeTab === 'database',
      onClick: () => setActiveTab('database')
    },
    {
      id: 'hostinger-deploy',
      label: 'Deploy Hostinger',
      sublabel: 'Node.js 18-24 & MySQL',
      icon: <Server className="w-4 h-4 text-indigo-400" />,
      isActive: activeTab === 'hostinger-deploy',
      onClick: () => setActiveTab('hostinger-deploy')
    },
    {
      id: 'dasbor-publik',
      label: 'Mode Publik & QR',
      sublabel: 'Pratinjau Layar Tamu',
      icon: <Globe className="w-4 h-4 text-slate-300" />,
      isActive: activeTab === 'dasbor-publik' || activeTab === 'sim-qr',
      onClick: () => setActiveTab('dasbor-publik')
    }
  ];

  // Navigasi Standar saat Belum Login atau Mode Petugas/Publik
  const standardNavItems: NavItem[] = [
    {
      id: 'dasbor-publik',
      label: 'Dasbor Publik',
      sublabel: 'Transparansi & Status',
      icon: <Globe className="w-4 h-4 text-emerald-400" />,
      isActive: activeTab === 'dasbor-publik',
      onClick: () => setActiveTab('dasbor-publik')
    },
    {
      id: 'sim-qr',
      label: 'Scan QR Pengunjung',
      sublabel: 'Laporan, Saran & Rating',
      icon: <QrCode className="w-4 h-4 text-rose-400" />,
      badge: '3 Menu',
      isActive: activeTab === 'sim-qr',
      onClick: () => setActiveTab('sim-qr')
    },
    {
      id: 'petugas',
      label: 'Dasbor Petugas',
      sublabel: 'Piket & Ceklis Inspeksi',
      icon: <Sparkles className="w-4 h-4 text-blue-400" />,
      isActive: activeTab === 'petugas',
      onClick: () => setActiveTab('petugas')
    },
    {
      id: 'supervisor',
      label: 'Dasbor Supervisor',
      sublabel: 'Ceklis & Rekap Aduan',
      icon: <ShieldCheck className="w-4 h-4 text-amber-400" />,
      badge: pendingCount > 0 ? `${pendingCount} Baru` : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
      isActive: activeTab === 'supervisor',
      onClick: () => setActiveTab('supervisor')
    },
    {
      id: 'database',
      label: 'Database MySQL',
      sublabel: 'Tabel Skema Hostinger',
      icon: <Database className="w-4 h-4 text-teal-400" />,
      isActive: activeTab === 'database',
      onClick: () => setActiveTab('database')
    },
    {
      id: 'hostinger-deploy',
      label: 'Deploy Hostinger',
      sublabel: 'Node.js 18-24 & MySQL',
      icon: <Server className="w-4 h-4 text-indigo-400" />,
      isActive: activeTab === 'hostinger-deploy',
      onClick: () => setActiveTab('hostinger-deploy')
    }
  ];

  const currentNavItems = isSupervisor ? supervisorNavItems : standardNavItems;

  return (
    <>
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-lg">
        {/* =================================================================== */}
        {/* BARIS 1: TOP TIER (BRAND, SYSTEM HEALTH, PROFILE, TELEGRAM NOTIFS)  */}
        {/* =================================================================== */}
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-3 border-b border-slate-800/80">
          <div className="flex items-center justify-between gap-4">
            {/* Sisi Kiri: Brand & Logo */}
            <div
              onClick={() => {
                if (isSupervisor) {
                  setActiveTab('supervisor');
                  setSupervisorSubTab('realtime');
                } else {
                  setActiveTab('dasbor-publik');
                }
              }}
              className="flex items-center space-x-3.5 cursor-pointer group"
            >
              <div>
                <div className="flex items-center space-x-2.5">
                  <span className="font-black text-lg sm:text-xl tracking-tight text-white leading-none">
                    DASHBOARD KEBERSIHAN RUANGAN DAN TOILET
                  </span>
                  {isSupervisor && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black tracking-wider uppercase hidden md:inline-flex items-center space-x-1">
                      <span>👑</span>
                      <span>PORTAL SUPERVISOR</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 hidden sm:block">
                  Sistem Informasi Monitoring Ruangan dan Toilet {isSupervisor ? '— Mode Manajemen & Pengawasan' : ''}
                </p>
              </div>
            </div>

            {/* Sisi Kanan: Telegram & User Profile */}
            <div className="flex items-center space-x-3">
              {/* Telegram Log Drawer Button with Pulse Badge */}
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

              {/* User Switcher / Profile Box */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserSwitcher(!showUserSwitcher)}
                    className="flex items-center space-x-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                      {currentUser.Nama_Petugas.charAt(0)}
                    </div>
                    <div className="hidden sm:block text-xs">
                      <div className="font-bold text-white truncate max-w-[130px]">
                        {currentUser.Nama_Petugas.split(' ')[0]}
                      </div>
                      <span className="text-[10px] text-blue-400 font-semibold block -mt-0.5">
                        {currentUser.Role} &bull; {currentUser.ID_Pengampu}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {/* Switch User Dropdown */}
                  {showUserSwitcher && (
                    <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                      <div className="text-xs font-bold text-slate-400 px-2 py-1 mb-1">
                        Pilih Akun Role Pengujian:
                      </div>
                      <div className="space-y-1">
                        {pengampuList.map(p => (
                          <button
                            key={p.ID_Pengampu}
                            onClick={() => {
                              setCurrentUser(p);
                              setShowUserSwitcher(false);
                              if (p.Role === 'Supervisor') {
                                setActiveTab('supervisor');
                                setSupervisorSubTab('pengaduan');
                              } else {
                                setActiveTab('petugas');
                              }
                            }}
                            className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition ${
                              currentUser.ID_Pengampu === p.ID_Pengampu
                                ? 'bg-blue-600 text-white font-bold'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-semibold">{p.Nama_Petugas}</div>
                              <span className="text-[10px] opacity-80">{p.Role} &bull; {p.ID_Pengampu}</span>
                            </div>
                            {currentUser.ID_Pengampu === p.ID_Pengampu && (
                              <UserCheck className="w-4 h-4 shrink-0 text-white" />
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            logoutUser();
                            setShowUserSwitcher(false);
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 flex items-center space-x-2 font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Keluar (Halaman Login)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setCurrentUser(pengampuList[4] || pengampuList[0]);
                    setActiveTab('supervisor');
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Login Supervisor
                </button>
              )}
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* BARIS 2: TABS NAVIGASI RESPONSIF & HORIZONTAL BEBAS TERPOTONG       */}
        {/* =================================================================== */}
        <div className="bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md">
          <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-2">
            <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full">
              {currentNavItems.map(item => {
                const isActive = item.isActive;
                return (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`group relative shrink-0 flex items-center space-x-2.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all duration-150 text-left border ${
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
                      <span className="absolute -bottom-2 left-3 right-3 h-0.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.9)]" />
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
