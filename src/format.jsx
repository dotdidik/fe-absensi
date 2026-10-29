// Harus sama dengan APP_TIMEZONE di backend.
export const TZ = import.meta.env.VITE_APP_TIMEZONE || "Asia/Jakarta";

const LABEL_ZONA = { "Asia/Jakarta": "WIB", "Asia/Pontianak": "WIB", "Asia/Makassar": "WITA", "Asia/Jayapura": "WIT" };
export const TZ_LABEL = LABEL_ZONA[TZ] || TZ;

export const STATUS_LABEL = {
  hadir: "Hadir",
  terlambat: "Terlambat",
  izin: "Izin",
  sakit: "Sakit",
  cuti: "Cuti",
  dinas_luar: "Dinas Luar"
};

export const formatJam = (value) =>
  value ? new Date(value).toLocaleTimeString("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }) : "-";

// "YYYY-MM-DD" -> "Rabu, 29 Oktober 2026"
export const formatTanggal = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

export const todayISO = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
export const thisMonthISO = () => todayISO().slice(0, 7);

export function StatusBadge({ status }) {
  if (!status) return <span className="badge badge-kosong">Belum absen</span>;
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}
