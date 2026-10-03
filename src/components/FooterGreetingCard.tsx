import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Heart,
  Sparkles,
  Send,
  MessageCircleHeart,
  Smile,
  ShieldCheck,
  Server,
  Database,
  Coffee,
  Check
} from 'lucide-react';

export const FooterGreetingCard: React.FC = () => {
  const { greetingMessages, submitGreeting, serverStatus } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [nama, setNama] = useState('');
  const [instansi, setInstansi] = useState('');
  const [pesan, setPesan] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🌸');
  const [successToast, setSuccessToast] = useState(false);

  const emojiList = ['🌸', '✨', '💐', '☕', '❤️', '👍', '🌟', '🌿'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pesan.trim()) return;

    submitGreeting(
      nama.trim() || 'Pengunjung Ramah',
      pesan.trim(),
      instansi.trim() || 'Civitas',
      selectedEmoji
    );

    setNama('');
    setInstansi('');
    setPesan('');
    setModalOpen(false);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3500);
  };

  return (
    <footer className="mt-12 bg-gradient-to-b from-slate-100 to-slate-200 border-t border-slate-300/70 pt-8 pb-6 text-slate-700">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 space-y-6">
        {/* TOAST SUCCESS */}
        {successToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-500 text-xs font-semibold flex items-center space-x-2 animate-in slide-in-from-bottom-4">
            <Check className="w-4 h-4 text-emerald-200" />
            <span>Kartu ucapan terima kasih Anda berhasil disematkan!</span>
          </div>
        )}

        {/* DESAIN KARTU UCAPAN UTAMA (GREETING CARD) */}
        <div className="relative bg-gradient-to-r from-amber-50 via-rose-50/70 to-blue-50 border-2 border-dashed border-rose-300/80 rounded-3xl p-6 sm:p-8 shadow-sm overflow-hidden">
          {/* Decorative Stamps & Elements */}
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-rose-200/40 rounded-full blur-xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Ucapan & Apresiasi
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-snug">
                "Terima Kasih Telah Bersama Menjaga Kebersihan & Kenyamanan Bersama "
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Terima kasih telah membuang sampah pada tempatnya, menjaga lantai tetap kering, dan mengapresiasi  petugas kebersihan kami.
              </p>

              {/* Quotes Carousel / Recent Greetings Pill */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {greetingMessages.slice(0, 2).map(msg => (
                  <div
                    key={msg.id}
                    className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-white/90 border border-slate-200/80 text-xs shadow-2xs"
                  >
                    <span className="text-base">{msg.emoji}</span>
                    <span className="font-semibold text-slate-800">{msg.nama}:</span>
                    <span className="text-slate-600 italic line-clamp-1 max-w-[280px]">
                      "{msg.pesan}"
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action to add greeting */}
            <div className="shrink-0 flex flex-col items-center sm:items-end w-full sm:w-auto">
              <button
                onClick={() => setModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold shadow-md shadow-rose-500/25 flex items-center justify-center space-x-2 transition transform hover:scale-[1.02]"
              >
                <MessageCircleHeart className="w-4 h-4" />
                <span>Kirim Ucapan / Salam Apresiasi</span>
              </button>
            </div>
          </div>
        </div>

        {/* BOTTOM METADATA & DEPLOYMENT INFO */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 pt-2">
          <div className="flex items-center space-x-2">
          <span>&bull;</span>
          <span>2026_Subbag Rumah Tangga dan Perlengkapan</span>
          </div>
        </div>
      </div>
          

      {/* MODAL KIRIM KARTU UCAPAN */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{selectedEmoji}</span>
                <h3 className="font-bold text-base text-slate-800">Tulis Kartu Ucapan & Salam</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Ikon Kartu:
                </label>
                <div className="flex items-center space-x-2">
                  {emojiList.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setSelectedEmoji(em)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-base border transition ${
                        selectedEmoji === em
                          ? 'border-rose-500 bg-rose-50 scale-110 shadow-2xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Anda / Pengunjung:
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={e => setNama(e.target.value)}
                  placeholder="Contoh: Dedy / Mahasiswa / Tamu Undangan"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Instansi / Unit (Opsional):
                </label>
                <input
                  type="text"
                  value={instansi}
                  onChange={e => setInstansi(e.target.value)}
                  placeholder="Contoh: Ruang rapat sembada"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pesan / Ucapan *
                </label>
                <textarea
                  required
                  rows={3}
                  value={pesan}
                  onChange={e => setPesan(e.target.value)}
                  placeholder="Tuliskan kata-kata apresiasi atau ucapan terima kasih kepada petugas kebersihan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500"
                ></textarea>
              </div>

              {/* Quick Template Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Terima kasih atas kerja kerasnya!',
                  'Toilet bersih & harum hari ini ',
                  'Semangat selalu bapak/ibu petugas! ',
                  'Fasilitas ruang rapat bersih dan nyaman '
                ].map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPesan(tpl)}
                    className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px]"
                  >
                    {tpl}
                  </button>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirimkan Ucapan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </footer>
  );
};
