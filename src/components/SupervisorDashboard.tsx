import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lokasi, Pengampu, LogPengaduan, ChecklistItem, SaranPelayanan } from '../types';
import {
  Building2,
  Users,
  QrCode,
  Trophy,
  Plus,
  Trash2,
  Edit,
  Printer,
  Search,
  CheckCircle2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Check,
  Send,
  MessageSquareWarning,
  Clock,
  ClipboardList,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Star,
  MessageSquare,
  Server,
  Database,
  ExternalLink,
  Copy,
  RefreshCw,
  BarChart3,
  PieChart,
  FileSpreadsheet
} from 'lucide-react';

export const SupervisorDashboard: React.FC = () => {
  const {
    lokasiList,
    pengampuList,
    pengaduanList,
    inspeksiList,
    checklistItems,
    saranList,
    ratingList,
    telegramLogs,
    telegramConfig,
    serverStatus,
    saveLokasi,
    deleteLokasi,
    savePengampu,
    deletePengampu,
    resolvePengaduan,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,
    testTelegramBot,
    updateTelegramConfig,
    getRekapStats,
    setSelectedRoomForQr,
    setActiveTab,
    supervisorSubTab: activeTabSub,
    setSupervisorSubTab: setActiveTabSub
  } = useApp();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [searchPengaduan, setSearchPengaduan] = useState('');
  const [filterStatusPengaduan, setFilterStatusPengaduan] = useState<'all' | 'Pending' | 'Selesai'>('all');
  const [filterRuanganPengaduan, setFilterRuanganPengaduan] = useState<string>('all');

  // Modal Tindak Lanjut Pengaduan
  const [selectedPengaduanForResolve, setSelectedPengaduanForResolve] = useState<LogPengaduan | null>(null);
  const [catatanTindakLanjut, setCatatanTindakLanjut] = useState('');
  const [petugasTindakLanjut, setPetugasTindakLanjut] = useState('');

  // Modal State for Ceklis Master (Supervisor Tambah / Edit Ceklis)
  const [modalChecklistOpen, setModalChecklistOpen] = useState(false);
  const [isEditChecklist, setIsEditChecklist] = useState(false);
  const [formChecklist, setFormChecklist] = useState<{
    id?: string;
    nama: string;
    kategori: 'Semua' | 'Toilet' | 'Ruangan';
    deskripsi: string;
    bobot: number;
    aktif: boolean;
  }>({
    nama: '',
    kategori: 'Semua',
    deskripsi: '',
    bobot: 1,
    aktif: true
  });

  // Modal State for CRUD Lokasi
  const [modalLokasiOpen, setModalLokasiOpen] = useState(false);
  const [isEditLokasi, setIsEditLokasi] = useState(false);
  const [formLokasi, setFormLokasi] = useState<Lokasi>({
    ID_Lokasi: '',
    Nama_Ruangan: '',
    Kategori: 'Toilet',
    ID_Pengampu: '',
    Status_Terkini: 'Hijau',
    Last_Update: '',
    Gedung: 'Gedung Utama',
    Lantai: 'Lantai 1'
  });

  // Modal State for CRUD Pengampu
  const [modalPengampuOpen, setModalPengampuOpen] = useState(false);
  const [isEditPengampu, setIsEditPengampu] = useState(false);
  const [formPengampu, setFormPengampu] = useState<Pengampu>({
    ID_Pengampu: '',
    Nama_Petugas: '',
    Username: '',
    Password: '',
    Role: 'Petugas',
    Kontak_Telegram: '',
    Telepon: ''
  });

  // Telegram Test State
  const [testBotToken, setTestBotToken] = useState(telegramConfig.botToken || '');
  const [testChatId, setTestChatId] = useState(telegramConfig.chatId || '-1001234567890');
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [telegramTestFeedback, setTelegramTestFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Copy helper
  const [copiedCode, setCopiedCode] = useState(false);
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Overall Statistics
  const totalRuangan = lokasiList.length;
  const countHijau = lokasiList.filter(l => l.Status_Terkini === 'Hijau').length;
  const countKuning = lokasiList.filter(l => l.Status_Terkini === 'Kuning').length;
  const countMerah = lokasiList.filter(l => l.Status_Terkini === 'Merah').length;
  const pendingAduan = pengaduanList.filter(a => a.Status_Tindak_Lanjut === 'Pending').length;

  const rekap = getRekapStats();

  // Filtered Rooms
  const filteredRooms = lokasiList.filter(r => {
    const matchesSearch =
      r.Nama_Ruangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ID_Lokasi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesKat = filterKategori === 'all' || r.Kategori === filterKategori;
    const matchesStatus = filterStatus === 'all' || r.Status_Terkini === filterStatus;
    return matchesSearch && matchesKat && matchesStatus;
  });

  // Filtered Pengaduan
  const filteredPengaduan = pengaduanList.filter(p => {
    const room = lokasiList.find(r => r.ID_Lokasi === p.ID_Lokasi);
    const roomName = room ? room.Nama_Ruangan.toLowerCase() : '';
    const q = searchPengaduan.toLowerCase();
    const matchesSearch =
      p.Nama_Pelapor.toLowerCase().includes(q) ||
      p.Detail_Keluhan.toLowerCase().includes(q) ||
      p.ID_Lokasi.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      roomName.includes(q);

    const matchesStatus =
      filterStatusPengaduan === 'all' || p.Status_Tindak_Lanjut === filterStatusPengaduan;

    const matchesRuangan =
      filterRuanganPengaduan === 'all' || p.ID_Lokasi === filterRuanganPengaduan;

    return matchesSearch && matchesStatus && matchesRuangan;
  });

  // Selesaikan Pengaduan Handler
  const handleOpenResolveModal = (aduan: LogPengaduan) => {
    setSelectedPengaduanForResolve(aduan);
    const room = lokasiList.find(r => r.ID_Lokasi === aduan.ID_Lokasi);
    const defaultStaff = pengampuList.find(p => p.ID_Pengampu === room?.ID_Pengampu);
    setPetugasTindakLanjut(defaultStaff?.Nama_Petugas || 'Petugas Kebersihan');
    setCatatanTindakLanjut('Telah dibersihkan dan diselesaikan oleh petugas piket.');
  };

  const handleConfirmResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPengaduanForResolve) return;

    resolvePengaduan(
      selectedPengaduanForResolve.id,
      selectedPengaduanForResolve.ID_Lokasi,
      catatanTindakLanjut.trim(),
      petugasTindakLanjut.trim()
    );

    showToast(`Aduan ${selectedPengaduanForResolve.id} berhasil ditandai selesai!`);
    setSelectedPengaduanForResolve(null);
  };

  // Ceklis Master Handlers
  const handleOpenAddChecklist = () => {
    setFormChecklist({
      nama: '',
      kategori: 'Semua',
      deskripsi: '',
      bobot: 1,
      aktif: true
    });
    setIsEditChecklist(false);
    setModalChecklistOpen(true);
  };

  const handleOpenEditChecklist = (item: ChecklistItem) => {
    setFormChecklist({
      id: item.id,
      nama: item.nama,
      kategori: item.kategori,
      deskripsi: item.deskripsi,
      bobot: item.bobot,
      aktif: item.aktif
    });
    setIsEditChecklist(true);
    setModalChecklistOpen(true);
  };

  const handleSubmitChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formChecklist.nama.trim()) {
      showToast('Nama item ceklis wajib diisi!');
      return;
    }

    if (isEditChecklist && formChecklist.id) {
      await updateChecklistItem(formChecklist.id, {
        nama: formChecklist.nama.trim(),
        kategori: formChecklist.kategori,
        deskripsi: formChecklist.deskripsi.trim(),
        bobot: Number(formChecklist.bobot) || 1,
        aktif: formChecklist.aktif
      });
      showToast(`Item ceklis "${formChecklist.nama}" berhasil diperbarui.`);
    } else {
      await addChecklistItem({
        nama: formChecklist.nama.trim(),
        kategori: formChecklist.kategori,
        deskripsi: formChecklist.deskripsi.trim(),
        bobot: Number(formChecklist.bobot) || 1
      });
      showToast(`Item ceklis baru "${formChecklist.nama}" berhasil ditambahkan.`);
    }

    setModalChecklistOpen(false);
  };

  const handleDeleteChecklist = async (id: string, nama: string) => {
    if (confirm(`Yakin ingin menghapus item ceklis "${nama}"?`)) {
      await deleteChecklistItem(id);
      showToast(`Item ceklis "${nama}" berhasil dihapus.`);
    }
  };

  // Telegram Test Handler
  const handleTestTelegram = async () => {
    if (!testBotToken.trim() || !testChatId.trim()) {
      setTelegramTestFeedback({
        success: false,
        message: 'Mohon isi Bot Token Telegram dan Chat ID terlebih dahulu.'
      });
      return;
    }

    setIsTestingTelegram(true);
    setTelegramTestFeedback(null);

    updateTelegramConfig({
      botToken: testBotToken.trim(),
      chatId: testChatId.trim()
    });

    const res = await testTelegramBot(testBotToken.trim(), testChatId.trim());
    setIsTestingTelegram(false);
    setTelegramTestFeedback(res);
  };

  // Export CSV Helper
  const handleExportCSV = () => {
    const headers = 'ID,Waktu,Lokasi,Pelapor,Keluhan,Status,Penyelesaian\n';
    const rows = pengaduanList
      .map(
        p =>
          `"${p.id}","${p.Timestamp}","${p.ID_Lokasi}","${p.Nama_Pelapor}","${p.Detail_Keluhan.replace(/"/g, '""')}","${p.Status_Tindak_Lanjut}","${(p.Catatan_Penyelesaian || '').replace(/"/g, '""')}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_pengaduan_kebersihan_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold flex items-center space-x-2 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Ruangan</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-800 mt-2">{totalRuangan}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Toilet & Ruang Rapat</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-emerald-100 shadow-sm bg-gradient-to-b from-white to-emerald-50/30">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
            <span>Kondisi Hijau</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">{countHijau}</p>
          <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
            {totalRuangan > 0 ? Math.round((countHijau / totalRuangan) * 100) : 0}% Bersih
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-100 shadow-sm bg-gradient-to-b from-white to-amber-50/30">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
            <span>Perhatian (Kuning)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">{countKuning}</p>
          <span className="text-[10px] text-amber-700 font-medium mt-1 block">Perlu isi ulang stok</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-100 shadow-sm bg-gradient-to-b from-white to-rose-50/30">
          <div className="flex items-center justify-between text-xs text-rose-800 font-semibold">
            <span>Kritis (Merah)</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">{countMerah}</p>
          <span className="text-[10px] text-rose-700 font-medium mt-1 block">Ada keluhan aktif</span>
        </div>

        <div
          onClick={() => setActiveTabSub('pengaduan')}
          className="col-span-2 lg:col-span-1 bg-white p-4 rounded-3xl border border-rose-200 hover:border-rose-400 shadow-sm bg-gradient-to-b from-white to-rose-50/40 cursor-pointer transition hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-xs text-rose-800 font-semibold">
            <span className="flex items-center space-x-1.5">
              <MessageSquareWarning className="w-4 h-4 text-rose-600" />
              <span>Aduan Pending</span>
            </span>
            {pendingAduan > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                {pendingAduan} Baru
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                Clear
              </span>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">{pendingAduan}</p>
          <div className="flex items-center justify-between text-[10px] text-rose-700 font-medium mt-1">
            <span>{pengaduanList.length} total laporan</span>
            <span className="group-hover:translate-x-1 transition font-bold text-rose-600">Buka &rarr;</span>
          </div>
        </div>
      </div>

      {/* SUPERVISOR SUB-NAVIGATION TABS */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 flex items-center space-x-1 overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTabSub('pengaduan')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTabSub === 'pengaduan'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquareWarning className="w-3.5 h-3.5" />
          <span>Log & Rekap Pengaduan</span>
          {pendingAduan > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-rose-600 font-black">
              {pendingAduan}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTabSub('ceklis-master')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTabSub === 'ceklis-master'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Kelola Ceklis Inspeksi ({checklistItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTabSub('saran-review')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTabSub === 'saran-review'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          <span>Saran & Rating Review ({ratingList.length})</span>
        </button>

        <button
          onClick={() => setActiveTabSub('telegram-config')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTabSub === 'telegram-config'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>API Bot Telegram</span>
        </button>

        <button
          onClick={() => setActiveTabSub('realtime')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTabSub === 'realtime'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Status Ruangan</span>
        </button>

        <button
          onClick={() => setActiveTabSub('hostinger-guide')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTabSub === 'hostinger-guide'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Deploy Hostinger & MySQL</span>
        </button>

        <button
          onClick={() => setActiveTabSub('crud-lokasi')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTabSub === 'crud-lokasi'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>+ Ruangan</span>
        </button>

        <button
          onClick={() => setActiveTabSub('crud-pengampu')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTabSub === 'crud-pengampu'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>+ Petugas</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 1. TAB LOG PENGADUAN DENGAN REKAPITULASI DISAMPINGNYA (SPLIT LAYOUT) */}
      {/* =================================================================== */}
      {activeTabSub === 'pengaduan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SISI KIRI (MAIN): TABEL LOG PENGADUAN & PENANGANAN (8 COLS) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Header Box */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchPengaduan}
                  onChange={e => setSearchPengaduan(e.target.value)}
                  placeholder="Cari keluhan, pelapor, atau ID..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={filterStatusPengaduan}
                  onChange={e => setFilterStatusPengaduan(e.target.value as any)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
                >
                  <option value="all">Semua Status ({pengaduanList.length})</option>
                  <option value="Pending">Menunggu ({pendingAduan})</option>
                  <option value="Selesai">Selesai ({pengaduanList.length - pendingAduan})</option>
                </select>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition"
                  title="Unduh format CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* List / Table */}
            {filteredPengaduan.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-xs space-y-2">
                <MessageSquareWarning className="w-8 h-8 mx-auto text-slate-300" />
                <p>Tidak ada pengaduan yang cocok dengan pencarian.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">ID & Waktu</th>
                        <th className="p-3.5">Ruangan</th>
                        <th className="p-3.5">Pelapor & Keluhan</th>
                        <th className="p-3.5 text-center">Status</th>
                        <th className="p-3.5">Tindak Lanjut</th>
                        <th className="p-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPengaduan.map(aduan => {
                        const room = lokasiList.find(r => r.ID_Lokasi === aduan.ID_Lokasi);
                        const isPending = aduan.Status_Tindak_Lanjut === 'Pending';

                        return (
                          <tr
                            key={aduan.id}
                            className={`transition ${
                              isPending ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50/70'
                            }`}
                          >
                            <td className="p-3.5 align-top whitespace-nowrap">
                              <span className="font-mono font-bold text-slate-800 text-xs block">
                                {aduan.id}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {aduan.Timestamp}
                              </span>
                            </td>

                            <td className="p-3.5 align-top">
                              <span className="font-bold text-slate-800 text-xs block">
                                {room?.Nama_Ruangan || aduan.ID_Lokasi}
                              </span>
                              <span className="text-[10px] text-blue-600 font-mono">
                                {aduan.ID_Lokasi}
                              </span>
                            </td>

                            <td className="p-3.5 align-top max-w-xs">
                              <span className="font-semibold text-slate-700 block">
                                {aduan.Nama_Pelapor}
                              </span>
                              <p className="text-slate-800 italic mt-1 bg-white p-2 rounded-xl border border-slate-200 text-[11px]">
                                "{aduan.Detail_Keluhan}"
                              </p>
                            </td>

                            <td className="p-3.5 align-top text-center whitespace-nowrap">
                              {isPending ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                                  <span>Pending</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <Check className="w-3 h-3" />
                                  <span>Selesai</span>
                                </span>
                              )}
                            </td>

                            <td className="p-3.5 align-top text-[11px] max-w-xs">
                              {isPending ? (
                                <span className="text-rose-500 italic">Menunggu respon petugas piket</span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-emerald-900 block">
                                    {aduan.Catatan_Penyelesaian || 'Selesai dibersihkan'}
                                  </span>
                                  {aduan.Waktu_Selesai && (
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                      Diselesaikan: {aduan.Waktu_Selesai}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>

                            <td className="p-3.5 align-top text-right whitespace-nowrap">
                              {isPending ? (
                                <button
                                  onClick={() => handleOpenResolveModal(aduan)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 ml-auto shadow-sm"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Tindak Lanjuti</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-emerald-700 font-bold">
                                  ✅ Selesai
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* SISI KANAN: PANEL REKAPITULASI DISAMPING LOG PENGADUAN & PENANGANAN (4 COLS) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 sticky top-20">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-800 text-sm flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>Rekapitulasi & SLA Penanganan</span>
                  </h4>
                  <span className="text-[10px] text-slate-400">Analitik Log Pengaduan Real-Time</span>
                </div>

                <button
                  onClick={() => window.print()}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                  title="Cetak Rekap"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Progress Tingkat Penyelesaian */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Rasio Penyelesaian Aduan:</span>
                  <span className="font-black text-emerald-600 text-sm">
                    {rekap.penyelesaianPersen}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${rekap.penyelesaianPersen}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span>{rekap.selesaiCount} Selesai</span>
                  <span>{rekap.pendingCount} Pending</span>
                  <span>Total: {rekap.totalPengaduan}</span>
                </div>
              </div>

              {/* SLA Response Time */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-800 tracking-wider flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kecepatan Respon Petugas (SLA)</span>
                </span>
                <p className="text-base font-black text-blue-900">{rekap.rataRataDurasi}</p>
                <p className="text-[10px] text-blue-700 leading-tight">
                  Target penanganan keluhan pengunjung terpenuhi dalam ambang standar operasional &lt;30 menit.
                </p>
              </div>

              {/* Top Kategori Keluhan */}
              <div className="space-y-2 pt-1">
                <span className="text-xs font-bold text-slate-800 block">
                  Top Kategori Keluhan Pengunjung:
                </span>
                <div className="space-y-1.5">
                  {rekap.topKategori.slice(0, 4).map((k, i) => (
                    <div key={i} className="text-xs space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-700 font-medium">{k.kategori}</span>
                        <span className="font-bold text-slate-800">{k.count} aduan</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full"
                          style={{ width: `${k.persen}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ruangan Paling Banyak Dilaporkan */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block">
                  Ruangan Paling Sering Dilaporkan:
                </span>
                <div className="space-y-1.5">
                  {rekap.topRuangan.slice(0, 3).map((r, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 block leading-tight">
                          {r.namaRuangan}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{r.idLokasi}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-[10px]">
                        {r.count} Kali
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rekap Rating Pengunjung */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-900">Skor Rating Pengunjung:</span>
                  <div className="flex items-center space-x-1 text-amber-500 font-black text-sm">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{rekap.avgRating} / 5.0</span>
                  </div>
                </div>
                <span className="text-[10px] text-amber-800 block">
                  Dihitung dari total {rekap.totalReview} ulasan pengunjung & {rekap.totalSaran} saran pelayanan.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. TAB SUPERVISOR KELOLA CEKLIS INSPEKSI DINAMIS (TAMBAH / KURANG) */}
      {/* =================================================================== */}
      {activeTabSub === 'ceklis-master' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 rounded-3xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                Fitur Supervisor Kebersihan
              </span>
              <h3 className="text-xl font-bold mt-1">Master Ceklis Inspeksi Kebersihan</h3>
              <p className="text-xs text-blue-100 mt-1 max-w-xl">
                Supervisor dapat <strong>menambah, mengubah, menonaktifkan, atau menghapus</strong> butir-butir parameter ceklis inspeksi. Petugas akan langsung mengevaluasi ruangan berdasarkan daftar ceklis aktif di bawah ini.
              </p>
            </div>

            <button
              onClick={handleOpenAddChecklist}
              className="px-4 py-2.5 rounded-2xl bg-white text-blue-800 font-bold text-xs flex items-center space-x-1.5 shadow-lg hover:bg-blue-50 transition shrink-0"
            >
              <Plus className="w-4 h-4 text-blue-600" />
              <span>+ Tambah Item Ceklis</span>
            </button>
          </div>

          {/* Table Checklist */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">ID Ceklis</th>
                    <th className="p-3.5">Parameter / Nama Pemeriksaan</th>
                    <th className="p-3.5">Kategori Target</th>
                    <th className="p-3.5">Deskripsi Standar Kelayakan</th>
                    <th className="p-3.5 text-center">Bobot</th>
                    <th className="p-3.5 text-center">Status Aktif</th>
                    <th className="p-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {checklistItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-mono font-bold text-blue-700 whitespace-nowrap">
                        {item.id}
                      </td>

                      <td className="p-3.5 font-bold text-slate-800 max-w-xs">
                        {item.nama}
                      </td>

                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-700">
                          {item.kategori}
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-500 max-w-md">
                        {item.deskripsi || '-'}
                      </td>

                      <td className="p-3.5 text-center font-bold text-slate-700">
                        {item.bobot || 1}
                      </td>

                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleChecklistItem(item.id)}
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                            item.aktif
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              item.aktif ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{item.aktif ? 'Aktif Digunakan' : 'Nonaktif'}</span>
                        </button>
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEditChecklist(item)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                            title="Edit Item Ceklis"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteChecklist(item.id, item.nama)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                            title="Hapus Item Ceklis"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. TAB SARAN PELAYANAN & RATING REVIEW PENGUNJUNG */}
      {/* =================================================================== */}
      {activeTabSub === 'saran-review' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Saran Pelayanan Pengunjung */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Saran & Masukan Pelayanan ({saranList.length})</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  Dikirim pengunjung via Form Menu 2
                </span>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {saranList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada saran masuk.</p>
              ) : (
                saranList.map(s => (
                  <div key={s.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-700">{s.Kategori_Saran}</span>
                      <span className="text-slate-400 font-mono">{s.Timestamp}</span>
                    </div>

                    <h5 className="font-bold text-slate-800 text-xs leading-snug">
                      "{s.Judul_Saran}"
                    </h5>

                    <p className="text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200/80">
                      "{s.Detail_Saran}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Pengirim: <strong>{s.Nama_Pemberi_Saran}</strong> {s.Kontak && `(${s.Kontak})`}</span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-semibold">
                        Prioritas: {s.Prioritas}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rating & Review Pengunjung */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-base flex items-center space-x-2">
                  <Star className="w-4 h-4 text-amber-500 fill-current" />
                  <span>Rating & Review Pengunjung ({ratingList.length})</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  Dikirim pengunjung via Form Menu 3
                </span>
              </div>

              <div className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-black text-xs">
                <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                <span>Rata-rata: {rekap.avgRating} / 5.0</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {ratingList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada review masuk.</p>
              ) : (
                ratingList.map(r => (
                  <div key={r.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{r.Nama_Reviewer}</span>
                      <div className="flex items-center space-x-0.5 text-amber-400">
                        {[...Array(r.Bintang)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>

                    <p className="text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200/80">
                      "{r.Komentar_Review}"
                    </p>

                    <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-1 gap-1">
                      <span>Ruangan: <strong>{r.ID_Lokasi}</strong></span>
                      <span>Lantai: {r.Rating_Kebersihan_Lantai}★ &bull; Air: {r.Rating_Ketersediaan_Air_Sabun}★ &bull; Aroma: {r.Rating_Aroma_Keharuman}★</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. TAB KONFIGURASI API BOT TELEGRAM */}
      {/* =================================================================== */}
      {activeTabSub === 'telegram-config' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-sky-700 to-blue-800 p-6 rounded-3xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-200">
                Integrasi Komunikasi Real-Time
              </span>
              <h3 className="text-xl font-bold mt-1">Konfigurasi API Bot Telegram SIM-KTR</h3>
              <p className="text-xs text-sky-100 mt-1 max-w-xl">
                Hubungkan bot Telegram resmi Anda agar notifikasi aduan darurat, skor inspeksi merah, dan saran pengunjung langsung dikirimkan ke grup petugas kebersihan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Konfigurasi & Test */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">
                Pengaturan Kredensial Bot Telegram
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bot Token Telegram (Dari @BotFather):
                  </label>
                  <input
                    type="password"
                    value={testBotToken}
                    onChange={e => setTestBotToken(e.target.value)}
                    placeholder="1234567890:ABCdefGHIJklmNoPQRsTUVwxyZ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Buat bot baru melalui percakapan dengan <strong>@BotFather</strong> di aplikasi Telegram.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Default Chat ID / Channel ID:
                  </label>
                  <input
                    type="text"
                    value={testChatId}
                    onChange={e => setTestChatId(e.target.value)}
                    placeholder="-1001234567890 atau @username_channel"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Gunakan bot <strong>@userinfobot</strong> atau <strong>@getidsbot</strong> untuk mengetahui ID grup/chat Anda.
                  </span>
                </div>

                {/* Feedback Uji Coba */}
                {telegramTestFeedback && (
                  <div
                    className={`p-3 rounded-2xl text-xs flex items-start space-x-2 ${
                      telegramTestFeedback.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-800'
                    }`}
                  >
                    {telegramTestFeedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{telegramTestFeedback.message}</p>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center space-x-3">
                  <button
                    onClick={handleTestTelegram}
                    disabled={isTestingTelegram}
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-500/20 flex items-center space-x-2 transition disabled:opacity-50"
                  >
                    {isTestingTelegram ? (
                      <span>Mengirim Pesan Uji Coba...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Pesan Uji Coba ke Telegram</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      updateTelegramConfig({
                        botToken: testBotToken.trim(),
                        chatId: testChatId.trim()
                      });
                      showToast('Kredensial Telegram berhasil disimpan!');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                  >
                    Simpan Konfigurasi
                  </button>
                </div>
              </div>
            </div>

            {/* Riwayat Notifikasi Telegram */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">
                  Riwayat Notifikasi Terkirim ({telegramLogs.length})
                </span>
                <span className="text-[10px] text-slate-400">Log Aktivitas</span>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 text-xs">
                {telegramLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    Belum ada log notifikasi Telegram. Lakukan uji coba atau kirimkan laporan pengaduan.
                  </p>
                ) : (
                  telegramLogs.slice(0, 5).map(log => (
                    <div key={log.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="font-mono text-sky-700 font-bold">{log.chatId}</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap font-sans text-[11px] line-clamp-3">
                        {log.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. TAB STATUS REAL-TIME */}
      {/* =================================================================== */}
      {activeTabSub === 'realtime' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari ruangan atau ID..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filterKategori}
                onChange={e => setFilterKategori(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
              >
                <option value="all">Semua Kategori</option>
                <option value="Toilet">Toilet Saja</option>
                <option value="Ruangan">Ruangan Saja</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
              >
                <option value="all">Semua Status</option>
                <option value="Hijau">🟢 Hijau (Bersih)</option>
                <option value="Kuning">🟡 Kuning (Perhatian)</option>
                <option value="Merah">🔴 Merah (Kritis)</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">ID Lokasi</th>
                    <th className="p-3.5">Nama Ruangan</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Gedung / Lantai</th>
                    <th className="p-3.5">Petugas Pengampu</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5">Last Update</th>
                    <th className="p-3.5 text-right">Uji Form</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRooms.map(r => (
                    <tr key={r.ID_Lokasi} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-mono font-bold text-blue-700">{r.ID_Lokasi}</td>
                      <td className="p-3.5 font-bold text-slate-800">{r.Nama_Ruangan}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-600">
                          {r.Kategori}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500">{r.Gedung || '-'} &bull; {r.Lantai || '-'}</td>
                      <td className="p-3.5 font-medium text-slate-700">
                        {pengampuList.find(p => p.ID_Pengampu === r.ID_Pengampu)?.Nama_Petugas || r.ID_Pengampu}
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            r.Status_Terkini === 'Hijau'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.Status_Terkini === 'Kuning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              r.Status_Terkini === 'Hijau'
                                ? 'bg-emerald-500'
                                : r.Status_Terkini === 'Kuning'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span>{r.Status_Terkini}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 text-[11px]">{r.Last_Update || '-'}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            setSelectedRoomForQr(r.ID_Lokasi);
                            setActiveTab('sim-qr');
                          }}
                          className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-[11px]"
                        >
                          Scan QR &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 6. TAB PANDUAN DEPLOY HOSTINGER & MYSQL */}
      {/* =================================================================== */}
      {activeTabSub === 'hostinger-guide' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Deployment & Database Guide
            </span>
            <h3 className="text-xl font-bold mt-1">Panduan Deploy Node.js & MySQL di Hostinger</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Aplikasi SIM-KTR dirancang 100% kompatibel dengan <strong>Node.js versi 18.x, 20.x, 22.x, dan 24.x</strong> pada Hostinger Cloud Hosting / VPS / cPanel / hPanel dengan database MySQL Hostinger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Buat Database MySQL di Hostinger</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Buka menu <strong>Databases &rarr; MySQL Databases</strong> di hPanel Hostinger. Buat nama database & user baru, lalu buka <strong>phpMyAdmin</strong> dan import file <code>database_hostinger.sql</code>.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Setup Node.js Application</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Di menu <strong>Advanced &rarr; Node.js</strong> Hostinger, pilih versi Node.js (18.x / 20.x / 22.x / 24.x), atur Application Root, dan tentukan Application Startup file ke <code>server.ts</code>.
              </p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Set Environment Variables (.env)</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Masukkan nilai <code>DB_HOST</code>, <code>DB_USER</code>, <code>DB_PASSWORD</code>, <code>DB_NAME</code>, serta <code>TELEGRAM_BOT_TOKEN</code> pada file <code>.env</code> di root direktori Hostinger Anda.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 7. TAB KELOLA RUANGAN (CRUD LOKASI) */}
      {/* =================================================================== */}
      {activeTabSub === 'crud-lokasi' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-base">Kelola Ruangan & Toilet</h4>
              <p className="text-xs text-slate-400">Daftar ruangan yang dipantau dalam sistem SIM-KTR</p>
            </div>

            <button
              onClick={() => {
                let nextNum = lokasiList.length + 1;
                let newId = `LOK-${nextNum.toString().padStart(3, '0')}`;
                while (lokasiList.some(r => r.ID_Lokasi === newId)) {
                  nextNum++;
                  newId = `LOK-${nextNum.toString().padStart(3, '0')}`;
                }
                setFormLokasi({
                  ID_Lokasi: newId,
                  Nama_Ruangan: '',
                  Kategori: 'Toilet',
                  ID_Pengampu: pengampuList[0]?.ID_Pengampu || 'PGP-001',
                  Status_Terkini: 'Hijau',
                  Last_Update: '',
                  Gedung: 'Gedung Utama',
                  Lantai: 'Lantai 1'
                });
                setIsEditLokasi(false);
                setModalLokasiOpen(true);
              }}
              className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Ruangan Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {lokasiList.map(r => (
              <div key={r.ID_Lokasi} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-blue-700 font-bold">{r.ID_Lokasi}</span>
                    <span className="text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">{r.Kategori}</span>
                  </div>
                  <h5 className="font-bold text-slate-800 text-xs mt-1">{r.Nama_Ruangan}</h5>
                  <span className="text-[11px] text-slate-500">{r.Gedung} &bull; {r.Lantai}</span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">
                    Pengampu: {pengampuList.find(p => p.ID_Pengampu === r.ID_Pengampu)?.Nama_Petugas || r.ID_Pengampu}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus ruangan ${r.Nama_Ruangan}?`)) {
                        deleteLokasi(r.ID_Lokasi);
                        showToast(`Ruangan ${r.Nama_Ruangan} berhasil dihapus.`);
                      }
                    }}
                    className="p-1 text-rose-600 hover:text-rose-800"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 8. TAB KELOLA PETUGAS & SUPERVISOR (CRUD PENGAMPU) */}
      {/* =================================================================== */}
      {activeTabSub === 'crud-pengampu' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-bold text-slate-800 text-base">Kelola Tim Petugas & Supervisor</h4>
              <p className="text-xs text-slate-400">Akun pengampu ruangan dan penerima notifikasi Telegram</p>
            </div>

            <button
              onClick={() => {
                let nextNum = pengampuList.length + 1;
                let newId = `PGP-${nextNum.toString().padStart(3, '0')}`;
                while (pengampuList.some(p => p.ID_Pengampu === newId)) {
                  nextNum++;
                  newId = `PGP-${nextNum.toString().padStart(3, '0')}`;
                }
                setFormPengampu({
                  ID_Pengampu: newId,
                  Nama_Petugas: '',
                  Username: '',
                  Password: '123',
                  Role: 'Petugas',
                  Kontak_Telegram: '@petugas',
                  Telepon: '08123456789'
                });
                setIsEditPengampu(false);
                setModalPengampuOpen(true);
              }}
              className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Petugas Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {pengampuList.map(p => (
              <div key={p.ID_Pengampu} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-indigo-700 font-bold">{p.ID_Pengampu}</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">
                      {p.Role}
                    </span>
                  </div>
                  <h5 className="font-bold text-slate-800 text-xs mt-1">{p.Nama_Petugas}</h5>
                  <span className="text-[11px] text-slate-500 block">Telegram: {p.Kontak_Telegram}</span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">User: {p.Username}</span>
                  {p.Role !== 'Supervisor' && (
                    <button
                      onClick={() => {
                        if (confirm(`Hapus petugas ${p.Nama_Petugas}?`)) {
                          deletePengampu(p.ID_Pengampu);
                          showToast(`Petugas ${p.Nama_Petugas} dihapus.`);
                        }
                      }}
                      className="p-1 text-rose-600 hover:text-rose-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL TAMBAH / EDIT CEKLIS INSPEKSI (SUPERVISOR) */}
      {/* =================================================================== */}
      {modalChecklistOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-800">
                {isEditChecklist ? 'Edit Parameter Ceklis' : 'Tambah Parameter Ceklis Baru'}
              </h3>
              <button
                onClick={() => setModalChecklistOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitChecklist} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Parameter Pemeriksaan *
                </label>
                <input
                  type="text"
                  required
                  value={formChecklist.nama}
                  onChange={e => setFormChecklist({ ...formChecklist, nama: e.target.value })}
                  placeholder="Contoh: Ketersediaan Hand Sanitizer / Sabun Cuci Tangan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Target
                  </label>
                  <select
                    value={formChecklist.kategori}
                    onChange={e => setFormChecklist({ ...formChecklist, kategori: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-slate-50 font-medium"
                  >
                    <option value="Semua">Semua (Toilet & Ruangan)</option>
                    <option value="Toilet">Toilet Saja</option>
                    <option value="Ruangan">Ruangan Saja</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Bobot Penilaian
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formChecklist.bobot}
                    onChange={e => setFormChecklist({ ...formChecklist, bobot: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi Standar Kelayakan
                </label>
                <textarea
                  rows={2}
                  value={formChecklist.deskripsi}
                  onChange={e => setFormChecklist({ ...formChecklist, deskripsi: e.target.value })}
                  placeholder="Contoh: Dispenser terisi penuh, higienis, dan tidak bocor..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalChecklistOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Ceklis</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL TINDAK LANJUT PENGADUAN (RESOLVE) */}
      {/* =================================================================== */}
      {selectedPengaduanForResolve && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  Form Penanganan
                </span>
                <h3 className="font-bold text-slate-800 text-base mt-1">
                  Tindak Lanjut Pengaduan {selectedPengaduanForResolve.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPengaduanForResolve(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Ruangan:</span>
                <strong className="text-slate-800">
                  {lokasiList.find(r => r.ID_Lokasi === selectedPengaduanForResolve.ID_Lokasi)?.Nama_Ruangan || selectedPengaduanForResolve.ID_Lokasi}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelapor:</span>
                <strong>{selectedPengaduanForResolve.Nama_Pelapor}</strong>
              </div>
              <p className="text-rose-900 italic bg-rose-50 p-2 rounded-xl mt-1.5">
                "{selectedPengaduanForResolve.Detail_Keluhan}"
              </p>
            </div>

            <form onSubmit={handleConfirmResolve} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Petugas yang Menangani:
                </label>
                <input
                  type="text"
                  required
                  value={petugasTindakLanjut}
                  onChange={e => setPetugasTindakLanjut(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tindakan Pembersihan / Solusi *
                </label>
                <textarea
                  required
                  rows={3}
                  value={catatanTindakLanjut}
                  onChange={e => setCatatanTindakLanjut(e.target.value)}
                  placeholder="Jelaskan tindakan pembersihan yang telah diselesaikan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedPengaduanForResolve(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Selesaikan & Pulihkan Ruangan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH RUANGAN */}
      {modalLokasiOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-800">Tambah Ruangan Baru</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">ID Lokasi</label>
                <input
                  type="text"
                  value={formLokasi.ID_Lokasi}
                  onChange={e => setFormLokasi({ ...formLokasi, ID_Lokasi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Ruangan *</label>
                <input
                  type="text"
                  required
                  value={formLokasi.Nama_Ruangan}
                  onChange={e => setFormLokasi({ ...formLokasi, Nama_Ruangan: e.target.value })}
                  placeholder="Contoh: Toilet Lantai 3 Gedung Rektorat"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formLokasi.Kategori}
                    onChange={e => setFormLokasi({ ...formLokasi, Kategori: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="Toilet">Toilet</option>
                    <option value="Ruangan">Ruangan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pengampu</label>
                  <select
                    value={formLokasi.ID_Pengampu}
                    onChange={e => setFormLokasi({ ...formLokasi, ID_Pengampu: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    {pengampuList.map(p => (
                      <option key={p.ID_Pengampu} value={p.ID_Pengampu}>
                        {p.Nama_Petugas}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalLokasiOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formLokasi.Nama_Ruangan) return;
                    saveLokasi(formLokasi, false);
                    setModalLokasiOpen(false);
                    showToast(`Ruangan ${formLokasi.Nama_Ruangan} berhasil ditambahkan!`);
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PETUGAS */}
      {modalPengampuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-800">Tambah Petugas Baru</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Petugas *</label>
                <input
                  type="text"
                  required
                  value={formPengampu.Nama_Petugas}
                  onChange={e => setFormPengampu({ ...formPengampu, Nama_Petugas: e.target.value })}
                  placeholder="Contoh: Slamet Riyadi"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formPengampu.Username}
                    onChange={e => setFormPengampu({ ...formPengampu, Username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={formPengampu.Role}
                    onChange={e => setFormPengampu({ ...formPengampu, Role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  >
                    <option value="Petugas">Petugas</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kontak Telegram</label>
                <input
                  type="text"
                  value={formPengampu.Kontak_Telegram}
                  onChange={e => setFormPengampu({ ...formPengampu, Kontak_Telegram: e.target.value })}
                  placeholder="@username_telegram"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalPengampuOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!formPengampu.Nama_Petugas || !formPengampu.Username) return;
                    savePengampu(formPengampu, false);
                    setModalPengampuOpen(false);
                    showToast(`Petugas ${formPengampu.Nama_Petugas} berhasil ditambahkan!`);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
