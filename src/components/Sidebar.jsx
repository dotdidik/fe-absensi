import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

export const NAMA_PUSKESMAS = import.meta.env.VITE_NAMA_PUSKESMAS || "Puskesmas";

const IKON = {
  absensi: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  pegawai: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M21 20c0-2.6-1.6-4.8-4-5.6" />
    </>
  ),
  antrean: (
    <>
      <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" />
      <path d="M14 7v2m0 2v2m0 2v2" />
    </>
  ),
  akun: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
    </>
  )
};

// `href` = halaman di luar layout admin (dibuka di tab baru), `end` = aktif hanya bila path persis sama.
const MENU = [
  {
    judul: "Absensi Saya",
    ikon: "absensi",
    items: [
      { to: "/", label: "Absen Hari Ini", end: true },
      { to: "/riwayat", label: "Riwayat Absensi" }
    ]
  },
  {
    judul: "Kepegawaian",
    ikon: "pegawai",
    admin: true,
    items: [
      { to: "/admin/harian", label: "Rekap Harian" },
      { to: "/admin/rekap", label: "Rekap Bulanan" },
      { to: "/admin/pegawai", label: "Data Pegawai" }
    ]
  },
  {
    judul: "Antrean Pasien",
    ikon: "antrean",
    admin: true,
    items: [
      { to: "/admin/antrean", label: "Antrean Hari Ini" },
      { to: "/admin/kunjungan", label: "Riwayat Kunjungan" },
      { to: "/admin/poli", label: "Poli & Dokter" },
      { href: "/layar", label: "Layar Antrean ↗" }
    ]
  },
  {
    judul: "Akun",
    ikon: "akun",
    items: [{ to: "/password", label: "Ganti Password" }]
  }
];

const cocok = (item, pathname) => Boolean(item.to) && (item.end ? pathname === item.to : pathname.startsWith(item.to));

/** Judul halaman untuk bar atas di HP, diambil dari label menu yang sedang aktif. */
export const judulHalaman = (pathname) =>
  MENU.flatMap((g) => g.items).find((item) => cocok(item, pathname))?.label || NAMA_PUSKESMAS;

const Ikon = ({ children, className = "nav-ikon" }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">{children}</svg>
);

function GrupMenu({ grup, pathname }) {
  const aktif = grup.items.some((item) => cocok(item, pathname));
  const [buka, setBuka] = useState(true);

  // Grup yang berisi halaman aktif selalu dibuka, mis. saat pindah halaman lewat link di konten.
  useEffect(() => {
    if (aktif) setBuka(true);
  }, [aktif]);

  return (
    <div className={`nav-grup ${aktif ? "aktif" : ""}`}>
      <button className="nav-grup-judul" aria-expanded={buka} onClick={() => setBuka(!buka)}>
        <Ikon>{IKON[grup.ikon]}</Ikon>
        <span>{grup.judul}</span>
        <Ikon className="nav-ikon nav-chevron"><path d="M6 9l6 6 6-6" /></Ikon>
      </button>
      {buka && (
        <ul>
          {grup.items.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <a href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
              ) : (
                <NavLink to={item.to} end={item.end}>{item.label}</NavLink>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Sidebar({ user, open, onClose, onLogout }) {
  const { pathname } = useLocation();
  const grupTampil = MENU.filter((g) => !g.admin || user.role === "admin");
  const inisial = user.nama.split(/\s+/).filter((k) => !k.endsWith(".")).slice(0, 2).map((k) => k[0]).join("");

  useEffect(() => {
    if (!open) return;
    const tutup = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", tutup);
    return () => window.removeEventListener("keydown", tutup);
  }, [open, onClose]);

  return (
    <>
      <aside id="sidebar" className={`sidebar ${open ? "open" : ""}`} aria-label="Menu utama">
        <div className="sidebar-brand">
          <span aria-hidden="true">🏥</span>
          <div>
            <strong>{NAMA_PUSKESMAS}</strong>
            <span>Absensi &amp; Antrean</span>
          </div>
          <button className="sidebar-close" aria-label="Tutup menu" onClick={onClose}>✕</button>
        </div>

        <nav className="sidebar-nav">
          {grupTampil.map((g) => <GrupMenu key={g.judul} grup={g} pathname={pathname} />)}
        </nav>

        <div className="sidebar-user">
          <span className="sidebar-avatar" aria-hidden="true">{inisial.toUpperCase()}</span>
          <div className="sidebar-user-info">
            <strong title={user.nama}>{user.nama}</strong>
            <span>{user.role === "admin" ? "Administrator" : "Pegawai"}</span>
          </div>
          <button className="sidebar-logout" onClick={onLogout}>Keluar</button>
        </div>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
    </>
  );
}
