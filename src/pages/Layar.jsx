import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { FotoTenagaMedis, usePolling } from "../antrean.jsx";
import { TZ, formatTanggal } from "../format.jsx";

const NAMA_PUSKESMAS = import.meta.env.VITE_NAMA_PUSKESMAS || "Puskesmas";
const LAMA_SOROTAN = 10000;

// "A-007" -> "A 7", supaya dibaca "A tujuh", bukan "A nol nol tujuh".
const kodeDiucapkan = (kode) => kode.replace(/^([A-Z]+)-0*(\d+)$/, "$1 $2");

let audioCtx;

function bel() {
  audioCtx ||= new AudioContext();
  const mulai = audioCtx.currentTime;
  [784, 523].forEach((frekuensi, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = frekuensi;
    gain.gain.setValueAtTime(0.4, mulai + i * 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, mulai + i * 0.45 + 0.9);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(mulai + i * 0.45);
    osc.stop(mulai + i * 0.45 + 0.9);
  });
  return new Promise((r) => setTimeout(r, 1300));
}

function ucapkan(teks) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    const u = new SpeechSynthesisUtterance(teks);
    u.lang = "id-ID";
    u.rate = 0.9;
    const suara = speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-").startsWith("id"));
    if (suara) u.voice = suara;
    u.onend = resolve;
    u.onerror = resolve;
    speechSynthesis.speak(u);
  });
}

function Jam() {
  const [sekarang, setSekarang] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setSekarang(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="layar-jam">{sekarang.toLocaleTimeString("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit" })}</span>;
}

export default function Layar() {
  const [data, setData] = useState(null);
  const [offline, setOffline] = useState(false);
  const [suaraAktif, setSuaraAktif] = useState(false);
  const [sorotan, setSorotan] = useState({}); // poliId -> true selama beberapa detik setelah dipanggil

  const terakhirDilihat = useRef(null); // poliId -> dipanggil_at
  const antreanSuara = useRef([]);
  const sedangBicara = useRef(false);
  const suaraAktifRef = useRef(false);

  const putarPengumuman = useCallback(async () => {
    if (sedangBicara.current) return;
    sedangBicara.current = true;
    while (antreanSuara.current.length) {
      const { kode, poli } = antreanSuara.current.shift();
      if (!suaraAktifRef.current) continue;
      await bel();
      await ucapkan(`Nomor antrean, ${kodeDiucapkan(kode)}. Silakan menuju, ${poli}.`);
    }
    sedangBicara.current = false;
  }, []);

  const load = useCallback(async () => {
    try {
      const hasil = await api("/antrean/layar");
      setOffline(false);

      const sebelumnya = terakhirDilihat.current;
      const baru = {};
      for (const p of hasil.poli) {
        baru[p.id] = p.dipanggil?.dipanggil_at || null;
        // Saat pertama dibuka, panggilan yang sudah ada tidak diumumkan ulang.
        if (sebelumnya && p.dipanggil && sebelumnya[p.id] !== p.dipanggil.dipanggil_at) {
          antreanSuara.current.push({ kode: p.dipanggil.kode_antrean, poli: p.nama });
          setSorotan((s) => ({ ...s, [p.id]: true }));
          setTimeout(() => setSorotan((s) => ({ ...s, [p.id]: false })), LAMA_SOROTAN);
        }
      }
      terakhirDilihat.current = baru;
      setData(hasil);
      putarPengumuman();
    } catch {
      setOffline(true);
    }
  }, [putarPengumuman]);

  usePolling(load);

  const aktifkan = () => {
    suaraAktifRef.current = true;
    setSuaraAktif(true);
    audioCtx ||= new AudioContext();
    audioCtx.resume();
    speechSynthesis?.getVoices();
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const terbaru = data?.poli
    .filter((p) => p.dipanggil)
    .sort((a, b) => b.dipanggil.dipanggil_at.localeCompare(a.dipanggil.dipanggil_at))[0];

  return (
    <div className="layar">
      <header className="layar-header">
        <div>
          <div className="layar-nama">🏥 {NAMA_PUSKESMAS}</div>
          <div className="layar-sub">Antrean Pasien</div>
        </div>
        <div className="layar-waktu">
          <Jam />
          <span>{data ? formatTanggal(data.tanggal) : ""}</span>
        </div>
      </header>

      {terbaru && (
        <section className={`layar-hero ${sorotan[terbaru.id] ? "kedip" : ""}`} aria-live="polite">
          <span className="layar-hero-label">Panggilan terakhir</span>
          <span className="layar-hero-nomor">{terbaru.dipanggil.kode_antrean}</span>
          <span className="layar-hero-poli">➜ {terbaru.nama}</span>
        </section>
      )}

      <main className="layar-grid">
        {data?.poli.map((p) => (
          <article key={p.id} className={`layar-poli ${sorotan[p.id] ? "kedip" : ""}`}>
            <div className="layar-poli-head">
              <span className="layar-poli-kode">{p.kode}</span>
              <span className="layar-poli-nama">{p.nama}</span>
            </div>
            <div className="layar-poli-dokter">
              {p.piket.length ? (
                p.piket.map((t) => (
                  <span key={t.id} className="layar-dokter">
                    <FotoTenagaMedis tenagaMedis={t} size={44} />
                    {t.nama}
                  </span>
                ))
              ) : (
                <span className="layar-dokter muted-light">Tidak ada jadwal hari ini</span>
              )}
            </div>
            <div className="layar-poli-label">Nomor antrean</div>
            <div className="layar-poli-nomor">{p.dipanggil?.kode_antrean || "—"}</div>
            <div className="layar-poli-footer">
              <span>Berikutnya: <strong>{p.berikutnya.join("  ·  ") || "—"}</strong></span>
              <span>Menunggu: <strong>{p.menunggu}</strong></span>
            </div>
          </article>
        ))}
        {data && !data.poli.length && <p className="layar-kosong">Belum ada poli yang aktif.</p>}
        {!data && !offline && <p className="layar-kosong">Memuat antrean...</p>}
      </main>

      <footer className="layar-footer">
        {offline && <span className="layar-offline">⚠ Koneksi terputus, mencoba lagi...</span>}
        <div className="layar-marquee">
          <span>
            Ambil nomor antrean lewat aplikasi Antrean Puskesmas di HP Anda · Datang sesuai perkiraan jam yang dipilih ·
            Perhatikan nomor yang dipanggil di layar ini · Terima kasih telah menunggu dengan tertib
          </span>
        </div>
      </footer>

      {!suaraAktif && (
        <button className="layar-aktifkan" onClick={aktifkan}>
          <span>🔊</span>
          Klik untuk memulai layar penuh &amp; mengaktifkan suara panggilan
        </button>
      )}
    </div>
  );
}
