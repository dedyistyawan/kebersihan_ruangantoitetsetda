import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SaranPelayanan } from '../types';
import {
  QrCode,
  AlertTriangle,
  Building,
  CheckCircle2,
  Send,
  Star,
  MessageSquare,
  Sparkles,
  RotateCcw,
  Camera,
  ThumbsUp,
  Clock,
  User,
  HeartHandshake,
  Check,
  ShieldAlert,
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';

export const PublicComplaintView: React.FC = () => {
  const {
    lokasiList,
    selectedRoomForQr,
    setSelectedRoomForQr,
    submitPengaduan,
    submitSaran,
    submitRating,
    pengampuList,
    pengaduanList,
    ratingList,
    setActiveTab,
    setCurrentUser
  } = useApp();

  // Active Menu Tab: 1 = Laporan, 2 = Saran, 3 = Rating
  const [activeMenu, setActiveMenu] = useState<'laporan' | 'saran' | 'rating'>('laporan');

  // Form 1 State: Laporan Pengaduan
  const [namaPelapor, setNamaPelapor] = useState('');
  const [kontakPelapor, setKontakPelapor] = useState('');
  const [detailKeluhan, setDetailKeluhan] = useState('');
  const [kategoriKeluhan, setKategoriKeluhan] = useState('Toilet / Wastafel Kotor');
  const [fotoBukti, setFotoBukti] = useState<string | null>(null);
  const [laporanSuccess, setLaporanSuccess] = useState(false);
  const [isSubmittingLaporan, setIsSubmittingLaporan] = useState(false);

  // Form 2 State: Saran & Masukan
  const [namaSaran, setNamaSaran] = useState('');
  const [kontakSaran, setKontakSaran] = useState('');
  const [kategoriSaran, setKategoriSaran] = useState<SaranPelayanan['Kategori_Saran']>('Fasilitas & Sarana');
  const [judulSaran, setJudulSaran] = useState('');
  const [detailSaran, setDetailSaran] = useState('');
  const [prioritasSaran, setPrioritasSaran] = useState<SaranPelayanan['Prioritas']>('Biasa');
  const [saranSuccess, setSaranSuccess] = useState(false);
  const [isSubmittingSaran, setIsSubmittingSaran] = useState(false);

  // Form 3 State: Rating & Review
  const [namaReviewer, setNamaReviewer] = useState('');
  const [bintangUtama, setBintangUtama] = useState<number>(5);
  const [hoverBintang, setHoverBintang] = useState<number | null>(null);
  const [ratingLantai, setRatingLantai] = useState<number>(5);
  const [ratingAirSabun, setRatingAirSabun] = useState<number>(5);
  const [ratingAroma, setRatingAroma] = useState<number>(5);
  const [ratingPetugas, setRatingPetugas] = useState<number>(5);
  const [komentarReview, setKomentarReview] = useState('');
  const [rekomendasikan, setRekomendasikan] = useState(true);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Target Room
  const currentRoom =
    lokasiList.find(r => r.ID_Lokasi === selectedRoomForQr) || lokasiList[0];

  const assignedStaff = pengampuList.find(
    p => p.ID_Pengampu === currentRoom?.ID_Pengampu
  );

  const roomComplaints = pengaduanList.filter(
    p => p.ID_Lokasi === currentRoom?.ID_Lokasi
  );

  const roomRatings = ratingList.filter(
    r => r.ID_Lokasi === currentRoom?.ID_Lokasi
  );

  // Quick Tags for Complaint
  const quickTags = [
    { label: 'Tisu Habis', text: 'Tisu toilet habis ' },
    { label: 'Bau Tidak Sedap', text: 'Ruangan berbau kurang sedap' },
    { label: 'Sabun Kosong', text: 'Dispenser sabun cuci tangan kosong' },
    { label: 'Lantai Becek & Licin', text: 'Lantai becek basah licin' },
    { label: 'Keran Rusak / Bocor', text: 'Keran wastafel bocor / macet' },
    { label: 'Tempat Sampah Penuh', text: 'Tempat sampah meluap penuh' },
  ];

  const handleAddTag = (text: string) => {
    if (!detailKeluhan.trim()) {
      setDetailKeluhan(text);
    } else {
      setDetailKeluhan(prev => `${prev}, ${text.toLowerCase()}`);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoBukti(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitLaporan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPelapor.trim() || !detailKeluhan.trim() || !currentRoom) return;

    setIsSubmittingLaporan(true);
    await submitPengaduan(
      currentRoom.ID_Lokasi,
      namaPelapor.trim(),
      detailKeluhan.trim(),
      kontakPelapor.trim(),
      kategoriKeluhan,
      fotoBukti || undefined
    );
    setIsSubmittingLaporan(false);
    setLaporanSuccess(true);
  };

  const handleSubmitSaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judulSaran.trim() || !detailSaran.trim() || !currentRoom) return;

    setIsSubmittingSaran(true);
    await submitSaran(
      currentRoom.ID_Lokasi,
      namaSaran.trim() || 'Anonim (Pengunjung)',
      kategoriSaran,
      judulSaran.trim(),
      detailSaran.trim(),
      prioritasSaran,
      kontakSaran.trim()
    );
    setIsSubmittingSaran(false);
    setSaranSuccess(true);
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom) return;

    setIsSubmittingRating(true);
    await submitRating(
      currentRoom.ID_Lokasi,
      namaReviewer.trim() || 'Pengunjung Ramah',
      bintangUtama,
      {
        lantai: ratingLantai,
        air: ratingAirSabun,
        aroma: ratingAroma,
        petugas: ratingPetugas
      },
      komentarReview.trim() || 'Fasilitas sangat memuaskan.',
      rekomendasikan
    );
    setIsSubmittingRating(false);
    setRatingSuccess(true);
  };

  const getStarLabel = (stars: number) => {
    switch (stars) {
      case 1:
        return 'Sangat Buruk / Tidak Layak';
      case 2:
        return 'Kurang Bersih / Perlu Perhatian';
      case 3:
        return 'Cukup Bersih / Standar';
      case 4:
        return 'Bersih, Wangi & Nyaman';
      case 5:
      default:
        return 'Sangat Bersih, Harum & Memuaskan!';
    }
  };

  const targetQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    window.location.origin + '?lokasi=' + currentRoom?.ID_Lokasi
  )}`;

  return (
    <div className="space-y-6">
      {/* Simulation Selector Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 text-slate-700 font-semibold">
          <QrCode className="w-4 h-4 text-blue-600" />
          <span>Simulasi URL Scan Stiker QR Pintu:</span>
          <code className="bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg font-mono text-xs">
            ?lokasi={currentRoom?.ID_Lokasi}
          </code>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <label className="text-slate-500 whitespace-nowrap font-medium">Pilih Ruangan:</label>
          <select
            value={selectedRoomForQr}
            onChange={e => {
              setSelectedRoomForQr(e.target.value);
              setLaporanSuccess(false);
              setSaranSuccess(false);
              setRatingSuccess(false);
            }}
            className="w-full md:w-auto px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
          >
            {lokasiList.map(r => (
              <option key={r.ID_Lokasi} value={r.ID_Lokasi}>
                [{r.ID_Lokasi}] {r.Nama_Ruangan} ({r.Status_Terkini})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* FULLPAGE 2-COLUMN GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =================================================================== */}
        {/* SISI KIRI (7 COLS): FORM 3 MENU PENGUNJUNG TERPADU                 */}
        {/* =================================================================== */}
        <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          {/* Header Ruangan Banner */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-7 text-white relative">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    {currentRoom?.Kategori}
                  </span>
                  <span className="text-xs text-blue-200 font-mono font-semibold">
                    {currentRoom?.ID_Lokasi}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-sm">
                  {currentRoom?.Nama_Ruangan}
                </h2>
                {currentRoom?.Gedung && (
                  <p className="text-xs text-blue-100 flex items-center space-x-1.5 pt-0.5">
                    <Building className="w-3.5 h-3.5 text-blue-200" />
                    <span>{currentRoom.Gedung} &bull; {currentRoom.Lantai}</span>
                  </p>
                )}
              </div>

              {/* Status Badge */}
              <div className="shrink-0 bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 text-center">
                <span className="text-[10px] text-blue-200 block mb-1 font-medium">Status Fasilitas</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center space-x-1.5 shadow-sm ${
                    currentRoom?.Status_Terkini === 'Hijau'
                      ? 'bg-emerald-500 text-white'
                      : currentRoom?.Status_Terkini === 'Kuning'
                      ? 'bg-amber-500 text-white'
                      : 'bg-rose-500 text-white animate-pulse'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span>{currentRoom?.Status_Terkini}</span>
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between text-xs text-blue-100 gap-2">
              <span>
                Petugas Pengampu: <strong>{assignedStaff?.Nama_Petugas || 'Petugas Kebersihan'}</strong>
              </span>
              <span>Update: {currentRoom?.Last_Update || '-'}</span>
            </div>
          </div>

          {/* 3 MENU NAVIGATION TABS */}
          <div className="border-b border-slate-200 bg-slate-50/90 p-2.5 flex items-center gap-2">
            <button
              onClick={() => setActiveMenu('laporan')}
              className={`flex-1 py-3 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                activeMenu === 'laporan'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>1. Laporan Pengaduan</span>
            </button>

            <button
              onClick={() => setActiveMenu('saran')}
              className={`flex-1 py-3 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                activeMenu === 'saran'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>2. Saran Pelayanan</span>
            </button>

            <button
              onClick={() => setActiveMenu('rating')}
              className={`flex-1 py-3 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 ${
                activeMenu === 'rating'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <Star className="w-4 h-4 fill-current" />
              <span>3. Rating & Review</span>
            </button>
          </div>

          {/* MENU 1: LAPORAN PENGADUAN */}
          {activeMenu === 'laporan' && (
            <div className="p-6 sm:p-7">
              {!laporanSuccess ? (
                <form onSubmit={handleSubmitLaporan} className="space-y-4 text-xs">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                      Form 1: Laporan & Pengaduan Fasilitas
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Fasilitas kotor, bau, basah, atau rusak? Laporkan segera. Status ruangan akan otomatis menjadi <strong className="text-rose-600 font-bold">🔴 Merah</strong> dan notifikasi bot Telegram langsung dikirimkan ke petugas piket.
                    </p>
                  </div>

                  {/* Quick Issue Buttons */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">
                      Pilih Masalah Cepat (Klik untuk menambah keluhan):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {quickTags.map((tag, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddTag(tag.text)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 text-slate-700 text-xs transition font-medium"
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nama Anda / Pelapor <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={namaPelapor}
                        onChange={e => setNamaPelapor(e.target.value)}
                        placeholder="Contoh: Rina / Tamu Lantai 1 / Mahasiswa"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        No. WhatsApp / Kontak (Opsional)
                      </label>
                      <input
                        type="text"
                        value={kontakPelapor}
                        onChange={e => setKontakPelapor(e.target.value)}
                        placeholder="0812xxxx (Untuk info tindak lanjut)"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kategori Keluhan
                    </label>
                    <select
                      value={kategoriKeluhan}
                      onChange={e => setKategoriKeluhan(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-medium text-slate-800"
                    >
                      <option value="Toilet / Wastafel Kotor">Toilet / Wastafel Kotor</option>
                      <option value="Lantai Basah & Becek">Lantai Basah, Licin & Becek</option>
                      <option value="Tisu / Sabun Habis">Tisu Toilet / Sabun Cuci Tangan Habis</option>
                      <option value="Bau Tidak Sedap">Bau Ruangan Tidak Sedap</option>
                      <option value="Keran Rusak & Mampet">Keran / Saluran Air Rusak & Mampet</option>
                      <option value="Kunci Bilik / Engsel Rusak">Kunci Pintu Bilik / Engsel Rusak</option>
                      <option value="Tempat Sampah Penuh">Tempat Sampah Penuh</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Detail Keluhan / Kondisi yang Ditemukan <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={detailKeluhan}
                      onChange={e => setDetailKeluhan(e.target.value)}
                      placeholder="Jelaskan kondisi toilet/ruangan yang membutuhkan penanganan..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 bg-slate-50/50"
                    ></textarea>
                  </div>

                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start space-x-2.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      Sistem akan memicu <strong>API Telegram Bot</strong> secara langsung ke grup petugas piket (<strong>{assignedStaff?.Nama_Petugas}</strong>).
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingLaporan}
                    className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                  >
                    {isSubmittingLaporan ? (
                      <span>Mengirimkan Laporan ke Petugas...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim Laporan Pengaduan</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Sukses Laporan */
                <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-800">Laporan Telah Diteruskan!</h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      Status ruangan <strong>{currentRoom?.Nama_Ruangan}</strong> sekarang menjadi{' '}
                      <span className="font-bold text-rose-600">🔴 Merah</span>. Notifikasi Telegram telah dikirimkan ke petugas pengampu.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => {
                        setLaporanSuccess(false);
                        setDetailKeluhan('');
                        setFotoBukti(null);
                      }}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center space-x-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kirim Laporan Lain</span>
                    </button>

                    <button
                      onClick={() => {
                        if (assignedStaff) setCurrentUser(assignedStaff);
                        setActiveTab('petugas');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-md shadow-blue-500/20"
                    >
                      <span>Buka Dasbor Petugas &rarr;</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MENU 2: SARAN PELAYANAN */}
          {activeMenu === 'saran' && (
            <div className="p-6 sm:p-7">
              {!saranSuccess ? (
                <form onSubmit={handleSubmitSaran} className="space-y-4 text-xs">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                      Form 2: Saran & Masukan Peningkatan Pelayanan
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Bantu kami meningkatkan kualitas kebersihan dan kenyamanan fasilitas ini. Masukan Anda akan langsung ditinjau oleh Supervisor.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nama Anda (Boleh Anonim)
                      </label>
                      <input
                        type="text"
                        value={namaSaran}
                        onChange={e => setNamaSaran(e.target.value)}
                        placeholder="Contoh: Pengunjung / Dosen / Mahasiswa"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Email / WhatsApp (Opsional)
                      </label>
                      <input
                        type="text"
                        value={kontakSaran}
                        onChange={e => setKontakSaran(e.target.value)}
                        placeholder="Untuk menerima kabar tindak lanjut ide Anda"
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Kategori Saran / Aspek Pelayanan
                      </label>
                      <select
                        value={kategoriSaran}
                        onChange={e => setKategoriSaran(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-medium text-slate-800"
                      >
                        <option value="Fasilitas & Sarana">Fasilitas & Sarana (Wastafel, Kloset, Hand Dryer)</option>
                        <option value="Ketersediaan Air & Sabun">Ketersediaan Air, Sabun & Tisu</option>
                        <option value="Aroma & Kesegaran">Aroma, Sirkulasi Udara & Kesegaran</option>
                        <option value="Respon & Kinerja Petugas">Respon & Kesigapan Petugas Kebersihan</option>
                        <option value="Aksesibilitas / Difabel">Aksesibilitas Ramah Lansia & Difabel</option>
                        <option value="Kebersihan Umum & Lingkungan">Kebersihan Umum & Tempat Sampah</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Tingkat Prioritas Usulan
                      </label>
                      <select
                        value={prioritasSaran}
                        onChange={e => setPrioritasSaran(e.target.value as any)}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs bg-slate-50 font-medium text-slate-800"
                      >
                        <option value="Biasa">Biasa (Saran Penyempurnaan)</option>
                        <option value="Penting">Penting (Perlu Ditindaklanjuti Segera)</option>
                        <option value="Mendesak">Mendesak (Terkait Kenyamanan Kritis)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Judul Saran Singkat <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={judulSaran}
                      onChange={e => setJudulSaran(e.target.value)}
                      placeholder="Contoh: Pemasangan pengharum otomatis aroma kopi / pengering tangan elektrik"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Uraian Saran / Ide Peningkatan Kualitas <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={detailSaran}
                      onChange={e => setDetailSaran(e.target.value)}
                      placeholder="Tuliskan ide, masukan, atau saran konkrit Anda untuk meningkatkan kepuasan pengunjung di ruangan ini..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingSaran}
                    className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                  >
                    {isSubmittingSaran ? (
                      <span>Menyimpan Saran...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim Saran & Masukan Pelayanan</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Sukses Saran */
                <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <HeartHandshake className="w-9 h-9" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-800">Terima Kasih atas Masukan Anda!</h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      Saran Anda untuk ruangan <strong>{currentRoom?.Nama_Ruangan}</strong> telah tersimpan dan diteruskan ke Supervisor Facility Management untuk dievaluasi.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-center">
                    <button
                      onClick={() => {
                        setSaranSuccess(false);
                        setJudulSaran('');
                        setDetailSaran('');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center space-x-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kirim Masukan Lain</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MENU 3: RATING & REVIEW */}
          {activeMenu === 'rating' && (
            <div className="p-6 sm:p-7">
              {!ratingSuccess ? (
                <form onSubmit={handleSubmitRating} className="space-y-4 text-xs">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">
                      Form 3: Rating Pelayanan & Ulasan Pengunjung
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Berikan penilaian bintang dan ulasan objektif mengenai kebersihan dan kesiapan fasilitas yang Anda gunakan.
                    </p>
                  </div>

                  {/* BINTANG UTAMA INTERAKTIF */}
                  <div className="bg-amber-50/70 p-5 rounded-3xl border border-amber-200/80 text-center space-y-2">
                    <span className="text-xs font-bold text-amber-900 block">
                      Penilaian Kepuasan Keseluruhan:
                    </span>

                    <div className="flex items-center justify-center space-x-3 py-2">
                      {[1, 2, 3, 4, 5].map(starNum => {
                        const isFilled =
                          (hoverBintang !== null ? hoverBintang : bintangUtama) >= starNum;
                        return (
                          <button
                            key={starNum}
                            type="button"
                            onMouseEnter={() => setHoverBintang(starNum)}
                            onMouseLeave={() => setHoverBintang(null)}
                            onClick={() => setBintangUtama(starNum)}
                            className="p-1 text-3xl sm:text-4xl transition transform hover:scale-125 focus:outline-none"
                            title={`${starNum} Bintang`}
                          >
                            <Star
                              className={`w-9 h-9 sm:w-11 sm:h-11 ${
                                isFilled
                                  ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-xs font-extrabold text-amber-800 tracking-wide">
                      {bintangUtama} Bintang: {getStarLabel(bintangUtama)}
                    </div>
                  </div>

                  {/* SUB-ASPEK PENILAIAN */}
                  <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block">
                      Detail Aspek Pelayanan:
                    </span>

                    {[
                      {
                        label: 'Kebersihan Lantai & Dinding',
                        value: ratingLantai,
                        setter: setRatingLantai
                      },
                      {
                        label: 'Ketersediaan Air Bersih & Sabun',
                        value: ratingAirSabun,
                        setter: setRatingAirSabun
                      },
                      {
                        label: 'Keharuman & Kesegaran Aroma',
                        value: ratingAroma,
                        setter: setRatingAroma
                      },
                      {
                        label: 'Kesigapan & Keramahan Petugas',
                        value: ratingPetugas,
                        setter: setRatingPetugas
                      }
                    ].map((aspect, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-200/60 last:border-0"
                      >
                        <span className="text-slate-600 font-medium">{aspect.label}</span>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map(st => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => aspect.setter(st)}
                              className="p-0.5 hover:scale-110 transition"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  aspect.value >= st
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-300'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Reviewer (Opsional)
                    </label>
                    <input
                      type="text"
                      value={namaReviewer}
                      onChange={e => setNamaReviewer(e.target.value)}
                      placeholder="Contoh: drg. Maya / Pengunjung Gedung / Mahasiswa"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Ulasan / Review Pengunjung:
                    </label>
                    <textarea
                      rows={3}
                      value={komentarReview}
                      onChange={e => setKomentarReview(e.target.value)}
                      placeholder="Ceritakan pengalaman Anda mengenai fasilitas toilet & ruangan ini..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 bg-slate-50/50"
                    ></textarea>
                  </div>

                  {/* Rekomendasikan */}
                  <label className="flex items-center space-x-2.5 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="checkbox"
                      checked={rekomendasikan}
                      onChange={e => setRekomendasikan(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Saya merekomendasikan kebersihan fasilitas ini kepada pengguna lain
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmittingRating}
                    className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-500/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                  >
                    {isSubmittingRating ? (
                      <span>Menyimpan Rating...</span>
                    ) : (
                      <>
                        <Star className="w-4 h-4 fill-current" />
                        <span>Kirim Rating & Review Pengunjung</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Sukses Rating */
                <div className="text-center space-y-4 py-8 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <Star className="w-9 h-9 fill-current" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-slate-800">Rating Berhasil Disimpan!</h3>
                    <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                      Terima kasih telah memberikan penilaian <strong>{bintangUtama} Bintang</strong> untuk{' '}
                      <strong>{currentRoom?.Nama_Ruangan}</strong>.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-center">
                    <button
                      onClick={() => {
                        setRatingSuccess(false);
                        setKomentarReview('');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-semibold flex items-center space-x-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Beri Ulasan Lain</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* SISI KANAN (5 COLS): STIKER QR PINTU, PETUGAS & RIWAYAT RUANGAN    */}
        {/* =================================================================== */}
        <div className="lg:col-span-5 space-y-5">
          {/* Stiker QR Pintu Kiosks Box */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm text-center flex flex-col items-center space-y-3">
            <span className="text-[10px] font-black tracking-widest uppercase text-blue-600">
              STIKER QR CODE PINTU TOILET / RUANGAN
            </span>
            <h4 className="text-sm font-bold text-slate-800 leading-tight">
              {currentRoom?.Nama_Ruangan}
            </h4>
            <span className="text-xs font-mono text-slate-400 font-semibold block">
              ID: {currentRoom?.ID_Lokasi}
            </span>

            {/* QR Code image */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 my-1 shadow-inner">
              <img
                src={targetQrUrl}
                alt={`QR Code ${currentRoom?.ID_Lokasi}`}
                className="w-36 h-36 mx-auto rounded-xl"
                loading="lazy"
              />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs">
              Pengunjung dapat memindai QR Code ini menggunakan kamera ponsel untuk langsung membuka 3 menu pelayanan (Laporan, Saran & Rating).
            </p>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Stiker QR Ini</span>
            </button>
          </div>

          {/* Profil Petugas Pengampu Ruangan Ini */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-800 block border-b border-slate-100 pb-2">
              Petugas Pengampu Ruangan Ini
            </span>
            <div className="flex items-center space-x-3 text-xs">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                {assignedStaff?.Nama_Petugas.charAt(0) || 'P'}
              </div>
              <div className="space-y-0.5">
                <h5 className="font-bold text-slate-800 text-sm">
                  {assignedStaff?.Nama_Petugas || 'Petugas Piket'}
                </h5>
                <span className="text-[11px] text-slate-500 block">
                  Telegram: {assignedStaff?.Kontak_Telegram || '@petugas'}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block">
                  Status: Siap Menerima Notifikasi Pengaduan
                </span>
              </div>
            </div>
          </div>

          {/* Riwayat Aduan di Ruangan Ini */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800">
                Riwayat Pengaduan di Ruangan Ini ({roomComplaints.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{currentRoom?.ID_Lokasi}</span>
            </div>

            {roomComplaints.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Belum ada keluhan di ruangan ini. Kondisi bersih & prima.
              </p>
            ) : (
              <div className="space-y-2">
                {roomComplaints.slice(0, 3).map(c => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                      c.Status_Tindak_Lanjut === 'Pending'
                        ? 'border-rose-200 bg-rose-50/30'
                        : 'border-emerald-100 bg-emerald-50/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400">{c.Timestamp}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.Status_Tindak_Lanjut === 'Pending'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.Status_Tindak_Lanjut}
                      </span>
                    </div>
                    <p className="text-slate-700 italic text-[11px]">"{c.Detail_Keluhan}"</p>
                    {c.Catatan_Penyelesaian && (
                      <div className="text-[11px] text-emerald-900 font-semibold pt-1 border-t border-emerald-100">
                        Penanganan: {c.Catatan_Penyelesaian}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ulasan & Rating Pengunjung Ruangan Ini */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800">
                Ulasan Pengunjung ({roomRatings.length})
              </span>
              <span className="text-xs text-amber-500 font-bold flex items-center space-x-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>
                  {roomRatings.length > 0
                    ? (
                        roomRatings.reduce((a, b) => a + b.Bintang, 0) / roomRatings.length
                      ).toFixed(1)
                    : '5.0'}
                </span>
              </span>
            </div>

            {roomRatings.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Belum ada ulasan untuk ruangan ini. Jadilah yang pertama memberi rating!
              </p>
            ) : (
              <div className="space-y-2">
                {roomRatings.slice(0, 3).map(r => (
                  <div
                    key={r.id}
                    className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700">{r.Nama_Reviewer}</span>
                      <div className="flex items-center space-x-0.5 text-amber-400">
                        {[...Array(r.Bintang)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-slate-600 text-[11px]">"{r.Komentar_Review}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
