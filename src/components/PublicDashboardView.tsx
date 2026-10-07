import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  MessageSquareWarning,
  Send,
  DoorOpen,
  ArrowRight,
  Filter,
  CheckCircle,
  HelpCircle,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export const PublicDashboardView: React.FC = () => {
  const {
    lokasiList,
    pengampuList,
    pengaduanList,
    setSelectedRoomForQr,
    setActiveTab
  } = useApp();

  const [activeSection, setActiveSection] = useState<'semua' | 'kondisi' | 'laporan'>('semua');
  const [selectedRoomModal, setSelectedRoomModal] = useState<string | null>(null);

  // Filter States - Kondisi Ruangan
  const [searchKondisi, setSearchKondisi] = useState('');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [filterStatusKondisi, setFilterStatusKondisi] = useState<string>('all');

  // Filter States - Laporan Keluhan
  const [searchLaporan, setSearchLaporan] = useState('');
  const [filterStatusLaporan, setFilterStatusLaporan] = useState<string>('all');
  const [filterRuanganLaporan, setFilterRuanganLaporan] = useState<string>('all');

  // Statistics
  const totalRuangan = lokasiList.length;
  const countToilet = lokasiList.filter(l => l.Kategori === 'Toilet').length;
  const countRuangan = lokasiList.filter(l => l.Kategori === 'Ruangan').length;

  const countHijau = lokasiList.filter(l => l.Status_Terkini === 'Hijau').length;
  const countKuning = lokasiList.filter(l => l.Status_Terkini === 'Kuning').length;
  const countMerah = lokasiList.filter(l => l.Status_Terkini === 'Merah').length;

  const totalKeluhan = pengaduanList.length;
  const pendingKeluhan = pengaduanList.filter(l => l.Status_Tindak_Lanjut === 'Pending').length;
  const selesaiKeluhan = pengaduanList.filter(l => l.Status_Tindak_Lanjut === 'Selesai').length;

  // Filtered Ruangan & Toilet
  const filteredRuangan = lokasiList.filter(room => {
    const matchesSearch =
      room.Nama_Ruangan.toLowerCase().includes(searchKondisi.toLowerCase()) ||
      room.ID_Lokasi.toLowerCase().includes(searchKondisi.toLowerCase()) ||
      (room.Gedung && room.Gedung.toLowerCase().includes(searchKondisi.toLowerCase()));
    const matchesKategori = filterKategori === 'all' || room.Kategori === filterKategori;
    const matchesStatus = filterStatusKondisi === 'all' || room.Status_Terkini === filterStatusKondisi;
    return matchesSearch && matchesKategori && matchesStatus;
  });

  // Filtered Laporan Keluhan
  const filteredLaporan = pengaduanList.filter(item => {
    const targetRoom = lokasiList.find(r => r.ID_Lokasi === item.ID_Lokasi);
    const roomName = targetRoom ? targetRoom.Nama_Ruangan.toLowerCase() : '';
    const staff = pengampuList.find(p => p.ID_Pengampu === targetRoom?.ID_Pengampu);
    const staffName = staff ? staff.Nama_Petugas.toLowerCase() : '';

    const matchesSearch =
      item.Detail_Keluhan.toLowerCase().includes(searchLaporan.toLowerCase()) ||
      item.Nama_Pelapor.toLowerCase().includes(searchLaporan.toLowerCase()) ||
      item.ID_Lokasi.toLowerCase().includes(searchLaporan.toLowerCase()) ||
      (item.Catatan_Penyelesaian && item.Catatan_Penyelesaian.toLowerCase().includes(searchLaporan.toLowerCase())) ||
      roomName.includes(searchLaporan.toLowerCase()) ||
      staffName.includes(searchLaporan.toLowerCase());

    const matchesStatus = filterStatusLaporan === 'all' || item.Status_Tindak_Lanjut === filterStatusLaporan;
    const matchesRuangan = filterRuanganLaporan === 'all' || item.ID_Lokasi === filterRuanganLaporan;

    return matchesSearch && matchesStatus && matchesRuangan;
  });

  const handleLaporkanRuangan = (idLokasi: string) => {
    setSelectedRoomForQr(idLokasi);
    setActiveTab('sim-qr');
  };

  const handleInspectRoomComplaints = (idLokasi: string) => {
    setFilterRuanganLaporan(idLokasi);
    setActiveSection('laporan');
  };

  return (
    <div className="space-y-6">
      {/* STATISTIK RINGKAS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Fasilitas Dipantau</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-800">{totalRuangan}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              {countToilet} Toilet &bull; {countRuangan} Ruangan
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-emerald-200 shadow-sm bg-gradient-to-b from-white to-emerald-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold">
            <span>Kondisi Bersih</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600">{countHijau}</span>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
              {totalRuangan > 0 ? Math.round((countHijau / totalRuangan) * 100) : 0}% Kondisi Prima (🟢 Hijau)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200 shadow-sm bg-gradient-to-b from-white to-amber-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold">
            <span>Perhatian</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{countKuning}</span>
            <span className="text-[11px] text-amber-700 font-semibold block mt-0.5">
              🟡 Kuning (Perlu Cek Ulang)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-rose-200 shadow-sm bg-gradient-to-b from-white to-rose-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-rose-800 font-bold">
            <span>Butuh Penanganan</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-rose-600">{countMerah}</span>
            <span className="text-[11px] text-rose-700 font-semibold block mt-0.5">
              🔴 Merah (Ada Keluhan)
            </span>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-3xl border border-purple-200 shadow-sm bg-gradient-to-b from-white to-purple-50/40 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-purple-800 font-bold">
            <span>Laporan</span>
            <MessageSquareWarning className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-purple-700">{totalKeluhan}</span>
            <span className="text-[11px] text-purple-700 font-semibold block mt-0.5">
              {pendingKeluhan} Menunggu &bull; {selesaiKeluhan} Selesai
            </span>
          </div>
        </div>
      </div>

      {/* SECTION SWITCHER TABS */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 flex flex-wrap items-center gap-1.5 shadow-sm">
        <button
          onClick={() => setActiveSection('semua')}
          className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeSection === 'semua'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ringkasan Terpadu</span>
        </button>

        <button
          onClick={() => setActiveSection('kondisi')}
          className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeSection === 'kondisi'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Kondisi Ruangan & Toilet ({lokasiList.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('laporan')}
          className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
            activeSection === 'laporan'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquareWarning className="w-4 h-4" />
          <span>Log Pengaduan & Penanganan ({pengaduanList.length})</span>
          {pendingKeluhan > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
              {pendingKeluhan} Pending
            </span>
          )}
        </button>
      </div>

      {/* 0. SECTION: RINGKASAN TERPADU (OVERVIEW DENGAN FEED ADUAN & PENANGANAN TERBARU) */}
      {activeSection === 'semua' && (
        <div className="space-y-6">
          {/* Feed Penanganan Terkini */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                    Transparansi Layanan
                  </span>
                  <span className="text-xs text-slate-400">&bull; Live Update</span>
                </div>
                <h3 className="text-base font-bold text-slate-800 mt-1">
                  Log Pengaduan Terkini & Bukti Penanganannya
                </h3>
                <p className="text-xs text-slate-500">
                  Berikut daftar keluhan kebersihan yang dilaporkan publik beserta catatan tindakan penanganan dari tim kebersihan.
                </p>
              </div>

              <button
                onClick={() => setActiveSection('laporan')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
              >
                <span>Lihat Seluruh Log Aduan ({pengaduanList.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List 3-4 Aduan Terakhir beserta Penanganannya */}
            {pengaduanList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Belum ada log pengaduan yang masuk.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pengaduanList.slice(0, 4).map(item => {
                  const room = lokasiList.find(r => r.ID_Lokasi === item.ID_Lokasi);
                  const staff = pengampuList.find(p => p.ID_Pengampu === room?.ID_Pengampu);
                  const isPending = item.Status_Tindak_Lanjut === 'Pending';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                        isPending
                          ? 'border-rose-200 bg-rose-50/20'
                          : 'border-emerald-100 bg-emerald-50/20'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Header Aduan */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] text-slate-400 block font-bold">
                              {item.id} &bull; {item.Timestamp}
                            </span>
                            <h4 className="text-xs font-bold text-slate-800 leading-snug mt-0.5">
                              {room ? room.Nama_Ruangan : item.ID_Lokasi}
                            </h4>
                          </div>

                          {isPending ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
                              ⏳ Sedang Ditangani
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                              ✅ Selesai Ditangani
                            </span>
                          )}
                        </div>

                        {/* Isi Keluhan */}
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 italic">
                          "{item.Detail_Keluhan}"
                          <span className="block not-italic text-[10px] text-slate-400 mt-1">
                            Oleh: <strong>{item.Nama_Pelapor}</strong>
                          </span>
                        </div>

                        {/* Kotak Penanganan */}
                        {isPending ? (
                          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                            <span className="font-bold flex items-center space-x-1 text-rose-900">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Tindak Lanjut:</span>
                            </span>
                            <p className="text-[11px] text-rose-700 mt-0.5">
                              Notifikasi telah diteruskan ke petugas <strong>{staff?.Nama_Petugas || 'Piket Kebersihan'}</strong>. Proses pembersihan sedang berjalan.
                            </p>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                            <span className="font-bold flex items-center space-x-1 text-emerald-800">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Penanganan yang Telah Dilakukan:</span>
                            </span>
                            <p className="text-xs font-semibold text-emerald-900">
                              {item.Catatan_Penyelesaian || 'Pembersihan intensif telah diselesaikan dan fasilitas siap digunakan.'}
                            </p>
                            {item.Waktu_Selesai && (
                              <span className="text-[10px] text-emerald-700 block font-mono">
                                Diselesaikan pada: {item.Waktu_Selesai} &bull; Petugas: {staff?.Nama_Petugas || 'Petugas Kebersihan'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          Status Ruangan:{' '}
                          <strong className={isPending ? 'text-rose-600' : 'text-emerald-600'}>
                            {room?.Status_Terkini || '-'}
                          </strong>
                        </span>
                        <button
                          onClick={() => handleInspectRoomComplaints(item.ID_Lokasi)}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Lihat Detail Ruangan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cuplikan Kondisi Ruangan Terkini */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  Status Fasilitas Toilet & Ruangan
                </h3>
                <p className="text-xs text-slate-500">
                  Pantau langsung ruangan dengan indikator kebersihan Hijau, Kuning, atau Merah.
                </p>
              </div>
              <button
                onClick={() => setActiveSection('kondisi')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
              >
                <span>Lihat Seluruh Ruangan ({lokasiList.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {lokasiList.slice(0, 6).map(room => {
                const isGreen = room.Status_Terkini === 'Hijau';
                const isYellow = room.Status_Terkini === 'Kuning';
                const isRed = room.Status_Terkini === 'Merah';
                const pendingForRoom = pengaduanList.filter(
                  p => p.ID_Lokasi === room.ID_Lokasi && p.Status_Tindak_Lanjut === 'Pending'
                );

                return (
                  <div
                    key={room.ID_Lokasi}
                    onClick={() => handleInspectRoomComplaints(room.ID_Lokasi)}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-white transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {room.Kategori}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{room.Nama_Ruangan}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {room.ID_Lokasi} &bull; {room.Gedung}
                      </span>
                      {pendingForRoom.length > 0 && (
                        <span className="text-[10px] text-rose-600 font-bold block">
                          ⚠️ {pendingForRoom.length} aduan pending
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                        isGreen
                          ? 'bg-emerald-100 text-emerald-800'
                          : isYellow
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {room.Status_Terkini}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 1. SECTION: KONDISI RUANGAN & TOILET */}
      {activeSection === 'kondisi' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchKondisi}
                onChange={e => setSearchKondisi(e.target.value)}
                placeholder="Cari toilet, ruangan, atau gedung..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={filterKategori}
                onChange={e => setFilterKategori(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
              >
                <option value="all">Semua Kategori</option>
                <option value="Toilet">Hanya Toilet</option>
                <option value="Ruangan">Hanya Ruangan</option>
              </select>

              <select
                value={filterStatusKondisi}
                onChange={e => setFilterStatusKondisi(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700"
              >
                <option value="all">Semua Kondisi</option>
                <option value="Hijau">🟢 Bersih (Hijau)</option>
                <option value="Kuning">🟡 Perhatian (Kuning)</option>
                <option value="Merah">🔴 Butuh Penanganan (Merah)</option>
              </select>
            </div>
          </div>

          {/* Grid Kartu Ruangan */}
          {filteredRuangan.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 text-xs">
              Tidak ada data toilet atau ruangan yang sesuai dengan pencarian Anda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRuangan.map(room => {
                const isGreen = room.Status_Terkini === 'Hijau';
                const isYellow = room.Status_Terkini === 'Kuning';
                const isRed = room.Status_Terkini === 'Merah';

                // Check pending complaints for this room
                const pendingForRoom = pengaduanList.filter(
                  p => p.ID_Lokasi === room.ID_Lokasi && p.Status_Tindak_Lanjut === 'Pending'
                );

                return (
                  <div
                    key={room.ID_Lokasi}
                    className={`bg-white rounded-3xl border p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 ${
                      isRed
                        ? 'border-rose-300 ring-2 ring-rose-100'
                        : isYellow
                        ? 'border-amber-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                            {room.Kategori}
                          </span>
                          <span className="text-xs text-slate-400 font-mono font-medium">
                            {room.ID_Lokasi}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center space-x-1.5 ${
                            isGreen
                              ? 'bg-emerald-100 text-emerald-800'
                              : isYellow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isGreen
                                ? 'bg-emerald-500'
                                : isYellow
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          ></span>
                          <span>{room.Status_Terkini}</span>
                        </span>
                      </div>

                      {/* Room Name */}
                      <h3 className="text-base font-bold text-slate-800 mt-2.5 leading-snug">
                        {room.Nama_Ruangan}
                      </h3>

                      {room.Gedung && (
                        <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{room.Gedung} &bull; {room.Lantai}</span>
                        </p>
                      )}

                      {/* Complaint alert tag */}
                      {pendingForRoom.length > 0 ? (
                        <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1.5">
                          <div className="font-bold flex items-center justify-between text-rose-700">
                            <span className="flex items-center space-x-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>{pendingForRoom.length} Aduan Perlu Penanganan</span>
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-200 text-rose-800 text-[10px] font-black">
                              🔴 Menunggu
                            </span>
                          </div>
                          <p className="text-[11px] text-rose-700 line-clamp-2 italic bg-white/70 p-2 rounded-xl border border-rose-100">
                            "{pendingForRoom[0].Detail_Keluhan}"
                          </p>
                          <button
                            onClick={() => handleInspectRoomComplaints(room.ID_Lokasi)}
                            className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline flex items-center space-x-1"
                          >
                            <span>Lihat Detail Aduan & Status Penanganan &rarr;</span>
                          </button>
                        </div>
                      ) : (
                        (() => {
                          const resolvedForRoom = pengaduanList.filter(
                            p => p.ID_Lokasi === room.ID_Lokasi && p.Status_Tindak_Lanjut === 'Selesai'
                          );
                          if (resolvedForRoom.length > 0) {
                            const latest = resolvedForRoom[0];
                            return (
                              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1">
                                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
                                  <span className="flex items-center space-x-1">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span>Penanganan Terakhir:</span>
                                  </span>
                                  <span className="text-[10px] text-emerald-600 font-normal">
                                    {latest.Waktu_Selesai || 'Selesai'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-emerald-800 line-clamp-1 italic">
                                  "{latest.Catatan_Penyelesaian || 'Telah dibersihkan dan dipel rapi.'}"
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()
                      )}
                    </div>

                    {/* Footer & Quick Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        Update: {room.Last_Update ? room.Last_Update.split(' ')[1] || room.Last_Update : '-'}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleInspectRoomComplaints(room.ID_Lokasi)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center space-x-1 transition"
                          title="Lihat log pengaduan ruangan ini"
                        >
                          <MessageSquareWarning className="w-3.5 h-3.5 text-slate-500" />
                          <span>Log Aduan</span>
                        </button>

                        <button
                          onClick={() => handleLaporkanRuangan(room.ID_Lokasi)}
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs flex items-center space-x-1 transition"
                          title="Kirim keluhan untuk ruangan ini"
                        >
                          <span>Lapor</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. SECTION: DAFTAR KELUHAN & LAPORAN PENGGUNA */}
      {activeSection === 'laporan' && (
        <div className="space-y-4">
          {/* Header Banner Penjelasan */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 p-6 rounded-3xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-md">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Layanan Publik & Akuntabilitas
              </span>
              <h3 className="text-xl font-bold mt-1">Log Pengaduan & Catatan Penanganan Fasilitas</h3>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Seluruh keluhan kebersihan yang dilaporkan publik melalui scan QR Code tercatat di sini secara transparan, lengkap dengan waktu laporan, status pengerjaan, dan catatan tindakan penanganan yang telah dilakukan oleh petugas.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-white/10 px-3.5 py-2 rounded-2xl border border-white/15 text-center">
                <span className="text-base font-black text-rose-300 block">{pendingKeluhan}</span>
                <span className="text-[10px] text-slate-300">Menunggu</span>
              </div>
              <div className="bg-white/10 px-3.5 py-2 rounded-2xl border border-white/15 text-center">
                <span className="text-base font-black text-emerald-400 block">{selesaiKeluhan}</span>
                <span className="text-[10px] text-slate-300">Selesai</span>
              </div>
            </div>
          </div>

          {/* Controls Bar: Search, Status, Ruangan */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchLaporan}
                onChange={e => setSearchLaporan(e.target.value)}
                placeholder="Cari keluhan, nama pelapor, tindakan penanganan, ruangan..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatusLaporan}
                onChange={e => setFilterStatusLaporan(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold text-slate-700"
              >
                <option value="all">Semua Status ({pengaduanList.length})</option>
                <option value="Pending">🔴 Menunggu Penanganan ({pendingKeluhan})</option>
                <option value="Selesai">🟢 Selesai Ditangani ({selesaiKeluhan})</option>
              </select>

              <select
                value={filterRuanganLaporan}
                onChange={e => setFilterRuanganLaporan(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 max-w-[200px]"
              >
                <option value="all">Semua Ruangan</option>
                {lokasiList.map(r => (
                  <option key={r.ID_Lokasi} value={r.ID_Lokasi}>
                    {r.Nama_Ruangan} ({r.ID_Lokasi})
                  </option>
                ))}
              </select>

              {(searchLaporan || filterStatusLaporan !== 'all' || filterRuanganLaporan !== 'all') && (
                <button
                  onClick={() => {
                    setSearchLaporan('');
                    setFilterStatusLaporan('all');
                    setFilterRuanganLaporan('all');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Laporan Feed List */}
          {filteredLaporan.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400 text-xs space-y-2">
              <MessageSquareWarning className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">Tidak ada log pengaduan yang sesuai kriteria.</p>
              <p className="text-[11px] text-slate-400">
                Silakan ubah kata kunci pencarian atau reset filter.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLaporan.map(item => {
                const room = lokasiList.find(r => r.ID_Lokasi === item.ID_Lokasi);
                const staff = pengampuList.find(p => p.ID_Pengampu === room?.ID_Pengampu);
                const isPending = item.Status_Tindak_Lanjut === 'Pending';

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-3xl p-5 sm:p-6 border shadow-sm transition space-y-4 ${
                      isPending
                        ? 'border-rose-300 bg-gradient-to-br from-white via-white to-rose-50/30 ring-1 ring-rose-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Header Baris 1: ID, Ruangan, Status, Waktu */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                          {item.id}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900">
                          {room ? room.Nama_Ruangan : item.ID_Lokasi}
                        </h4>
                        <span className="font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">
                          {item.ID_Lokasi}
                        </span>
                        {room?.Kategori && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            {room.Kategori}
                          </span>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div className="shrink-0 flex items-center space-x-2">
                        {isPending ? (
                          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                            <span>⏳ Sedang Ditindaklanjuti (Pending)</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>✅ Selesai Ditangani</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Isi Keluhan & Info Pengirim */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center space-x-1">
                          <span>Dilaporkan oleh:</span>
                          <strong className="text-slate-700">👤 {item.Nama_Pelapor}</strong>
                        </span>
                        <span className="flex items-center space-x-1 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.Timestamp}</span>
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 italic leading-relaxed">
                        "{item.Detail_Keluhan}"
                      </div>
                    </div>

                    {/* KOTAK PENANGANAN / TINDAK LANJUT RESMI */}
                    {isPending ? (
                      <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 space-y-2">
                        <div className="flex items-center space-x-2 font-bold text-rose-800">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Status Penanganan: Menunggu Tindakan Pembersihan</span>
                        </div>
                        <p className="text-xs text-rose-800/90 leading-relaxed">
                          Laporan telah masuk ke sistem dan diteruskan via bot Telegram ke petugas pengampu: <strong>{staff?.Nama_Petugas || 'Tim Kebersihan'}</strong>. Status fasilitas otomatis menjadi <strong className="text-rose-700">🔴 Merah</strong> hingga petugas menyelesaikan pembersihan.
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5 font-bold text-emerald-900 text-xs sm:text-sm">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Tindakan & Solusi Penanganan yang Telah Dilakukan:</span>
                          </div>
                          {item.Waktu_Selesai && (
                            <span className="text-[11px] font-mono text-emerald-800 bg-white/60 px-2 py-0.5 rounded-lg border border-emerald-200">
                              Diselesaikan: {item.Waktu_Selesai}
                            </span>
                          )}
                        </div>

                        <div className="p-3 rounded-xl bg-white/80 border border-emerald-100 text-xs sm:text-sm font-semibold text-emerald-900 shadow-2xs">
                          {item.Catatan_Penyelesaian || 'Pembersihan menyeluruh telah selesai dilakukan oleh petugas piket, fasilitas telah dipel kering, dan perlengkapan diisi ulang.'}
                        </div>

                        <div className="flex flex-wrap items-center justify-between text-[11px] text-emerald-800 pt-1">
                          <span>
                            Petugas Penanggung Jawab:{' '}
                            <strong className="text-emerald-950 font-bold">{staff?.Nama_Petugas || 'Petugas Kebersihan'}</strong>
                          </span>
                          <span className="text-emerald-700 font-medium">
                            Status Fasilitas: 🟢 <strong>Normal (Bersih & Siap Digunakan)</strong>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* QUICK FOOTER INFO */}
      <div className="bg-blue-50 border border-blue-200 rounded-3xl p-5 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="font-bold text-xs sm:text-sm text-blue-900">
            Ingin Melaporkan Kebersihan Ruangan Tertentu?
          </h4>
          <p className="text-[11px] text-blue-700">
            Pindai QR Code yang tertempel di depan pintu toilet/ruangan atau klik tombol formulir pengaduan publik.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('sim-qr')}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 whitespace-nowrap transition"
        >
          Buka Form Pengaduan Publik
        </button>
      </div>
    </div>
  );
};
