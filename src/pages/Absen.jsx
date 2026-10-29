import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { STATUS_LABEL, StatusBadge, TZ, TZ_LABEL, formatJam, formatTanggal } from "../format.jsx";
import { cariAlamat, formatKoordinat, jarakMeter, lokasiDidukung, mapsUrl, pesanErrorLokasi } from "../geo.js";
import PetaLokasi from "../components/PetaLokasi.jsx";

// Alamat hanya dicari ulang bila pengguna berpindah cukup jauh, agar tidak membanjiri Nominatim.
const JARAK_UPDATE_ALAMAT = 30;

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function usePosisi() {
  const [posisi, setPosisi] = useState(null);
  const [error, setError] = useState(lokasiDidukung);

  useEffect(() => {
    if (lokasiDidukung()) return;
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setPosisi({ lat: coords.latitude, lng: coords.longitude, akurasi: coords.accuracy });
        setError(null);
      },
      (err) => setError(pesanErrorLokasi(err)),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return { posisi, error };
}

function useAlamat(posisi) {
  const [alamat, setAlamat] = useState(null);
  const terakhir = useRef(null);

  useEffect(() => {
    if (!posisi) return;
    if (terakhir.current && jarakMeter(terakhir.current, posisi) < JARAK_UPDATE_ALAMAT) return;
    terakhir.current = posisi;
    // "" = sudah dicoba tapi gagal; null = masih mencari.
    cariAlamat(posisi).then((hasil) => setAlamat(hasil || "")).catch(() => setAlamat(""));
  }, [posisi]);

  return alamat;
}

function StatusLokasi({ posisi, error, jarak, dalamArea, radius, alamat }) {
  if (error) return <div className="alert alert-error">📍 {error}</div>;
  if (!posisi) return <div className="lokasi muted">📍 Mencari lokasi Anda...</div>;

  return (
    <div className={`lokasi ${dalamArea ? "lokasi-ok" : "lokasi-luar"}`}>
      <strong>{dalamArea ? "✅ Anda berada di area puskesmas" : "⛔ Anda di luar area puskesmas"}</strong>
      <span>
        Jarak {jarak} m (maks. {radius} m) · akurasi ±{Math.round(posisi.akurasi)} m
      </span>
      <span className="alamat">{alamat === null ? "Mencari alamat..." : alamat || "Alamat tidak tersedia"}</span>
      <a href={mapsUrl(posisi.lat, posisi.lng)} target="_blank" rel="noreferrer">
        {formatKoordinat(posisi.lat, posisi.lng)}
      </a>
    </div>
  );
}

function LokasiCard({ posisi, error, kantor }) {
  const alamat = useAlamat(posisi);
  const jarak = posisi ? Math.round(jarakMeter(posisi, kantor)) : null;
  const dalamArea = jarak !== null && jarak <= kantor.radius;

  return (
    <>
      <StatusLokasi
        posisi={posisi}
        error={error}
        jarak={jarak}
        dalamArea={dalamArea}
        radius={kantor.radius}
        alamat={alamat}
      />
      <PetaLokasi kantor={kantor} posisi={posisi} dalamArea={dalamArea} />
    </>
  );
}

export default function Absen() {
  const { user } = useAuth();
  const now = useClock();
  const { posisi, error: lokasiError } = usePosisi();
  const [info, setInfo] = useState(null);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => api("/absensi/hari-ini").then(setInfo);

  useEffect(() => {
    load().catch((err) => setMessage({ type: "error", text: err.message }));
  }, []);

  const submit = async (jenis) => {
    setSubmitting(true);
    setMessage(null);
    try {
      const data = await api(`/absensi/${jenis}`, { method: "POST", body: posisi });
      const jam = formatJam(jenis === "masuk" ? data.jam_masuk : data.jam_pulang);
      setMessage({
        type: "success",
        text: jenis === "masuk"
          ? `Absen masuk tercatat pukul ${jam} (${STATUS_LABEL[data.status]})`
          : `Absen pulang tercatat pukul ${jam}. Terima kasih!`
      });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!info) return message ? <div className="alert alert-error">{message.text}</div> : <p>Memuat...</p>;

  const absensi = info.absensi;
  const sudahMasuk = Boolean(absensi);
  const bisaPulang = absensi?.jam_masuk && !absensi.jam_pulang;
  const tanpaLokasi = !posisi || submitting;

  return (
    <div className="absen">
      <div className="card absen-card">
        <p className="muted">Selamat datang,</p>
        <h2>{user.nama}</h2>
        <p className="muted">{[user.jabatan, user.unit].filter(Boolean).join(" · ")}</p>

        <div className="clock">
          {now.toLocaleTimeString("id-ID", { timeZone: TZ })}
        </div>
        <p>{formatTanggal(info.tanggal)}</p>
        <p className="muted small">Batas jam masuk: {info.batasMasuk} {TZ_LABEL}</p>

        <LokasiCard posisi={posisi} error={lokasiError} kantor={info.kantor} />

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <div className="absen-actions">
          <button className="btn btn-primary btn-lg" disabled={sudahMasuk || tanpaLokasi} onClick={() => submit("masuk")}>
            Absen Masuk
          </button>
          <button className="btn btn-secondary btn-lg" disabled={!bisaPulang || tanpaLokasi} onClick={() => submit("pulang")}>
            Absen Pulang
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Status Hari Ini</h3>
        <dl className="status-list">
          <dt>Status</dt>
          <dd><StatusBadge status={absensi?.status} /></dd>
          <dt>Jam masuk</dt>
          <dd>{formatJam(absensi?.jam_masuk)}</dd>
          <dt>Jam pulang</dt>
          <dd>{formatJam(absensi?.jam_pulang)}</dd>
          {absensi?.keterangan && (
            <>
              <dt>Keterangan</dt>
              <dd>{absensi.keterangan}</dd>
            </>
          )}
        </dl>
        <a className="small" href={mapsUrl(info.kantor.lat, info.kantor.lng)} target="_blank" rel="noreferrer">
          Lihat lokasi puskesmas di peta
        </a>
      </div>
    </div>
  );
}
