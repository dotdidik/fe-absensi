import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Ikon from "./Ikon.jsx";

export const NAMA_PUSKESMAS = import.meta.env.VITE_NAMA_PUSKESMAS || "Puskesmas";

// `href` = halaman di luar layout admin (dibuka di tab baru), `end` = aktif hanya bila path persis sama.
const MENU = [
  {
    judul: "Absensi Saya",
    ikon: "absensi",
    items: [
      { to: "/", label: "Absen Hari Ini", ikon: "masuk", end: true },
      { to: "/riwayat", label: "Riwayat Absensi", ikon: "kalender" }
    ]
  },
  {
    judul: "Kepegawaian",
    ikon: "pegawai",
    admin: true,
    items: [
      { to: "/admin/harian", label: "Rekap Harian", ikon: "rekapHarian" },
      { to: "/admin/rekap", label: "Rekap Bulanan", ikon: "grafik" },
      { to: "/admin/pegawai", label: "Data Pegawai", ikon: "pegawai" }
    ]
  },
  {
    judul: "Antrean Pasien",
    ikon: "antrean",
    admin: true,
    items: [
      { to: "/admin/antrean", label: "Antrean Hari Ini", ikon: "antrean" },
      { to: "/admin/kunjungan", label: "Riwayat Kunjungan", ikon: "riwayat" },
      { to: "/admin/poli", label: "Poli & Dokter", ikon: "stetoskop" },
      { href: "/layar", label: "Layar Antrean", ikon: "monitor" }
    ]
  },
  {
    judul: "Akun",
    ikon: "akun",
    items: [{ to: "/password", label: "Ganti Password", ikon: "kunci" }]
  }
];

const cocok = (item, pathname) => Boolean(item.to) && (item.end ? pathname === item.to : pathname.startsWith(item.to));

/** Grup dan label menu yang sedang aktif, untuk judul di header. */
export function halamanAktif(pathname) {
  for (const grup of MENU) {
    const item = grup.items.find((i) => cocok(i, pathname));
    if (item) return { grup: grup.judul, label: item.label };
  }
  return { grup: NAMA_PUSKESMAS, label: "" };
}

function ItemMenu({ item }) {
  const isi = (
    <>
      <Ikon nama={item.ikon} />
      <span className="nav-label">{item.label}</span>
      {item.href && <span className="nav-eksternal" aria-label="(tab baru)">↗</span>}
    </>
  );
  // data-tip dipakai sebagai tooltip saat sidebar dikecilkan.
  return item.href ? (
    <a className="nav-item" href={item.href} target="_blank" rel="noreferrer" data-tip={item.label}>{isi}</a>
  ) : (
    <NavLink className="nav-item" to={item.to} end={item.end} data-tip={item.label}>{isi}</NavLink>
  );
}

function GrupMenu({ grup, pathname, kecil }) {
  const aktif = grup.items.some((item) => cocok(item, pathname));
  const [buka, setBuka] = useState(true);

  // Grup yang berisi halaman aktif selalu dibuka, mis. saat pindah halaman lewat link di konten.
  useEffect(() => {
    if (aktif) setBuka(true);
  }, [aktif]);

  return (
    <div className={`nav-grup ${aktif ? "aktif" : ""}`}>
      <button className="nav-grup-judul" aria-expanded={buka} onClick={() => setBuka(!buka)}>
        <span>{grup.judul}</span>
        <Ikon nama="chevron" className="nav-chevron" />
      </button>
      {/* Saat dikecilkan, semua ikon selalu tampil karena judul grup disembunyikan. */}
      {(buka || kecil) && (
        <ul>
          {grup.items.map((item) => (
            <li key={item.label}><ItemMenu item={item} /></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Sidebar({ user, open, kecil, onClose, onLogout }) {
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
          <span className="sidebar-logo"><Ikon nama="rumahSakit" /></span>
          <div className="sidebar-brand-teks">
            <strong>{NAMA_PUSKESMAS}</strong>
            <span>Absensi &amp; Antrean</span>
          </div>
          <button className="icon-btn sidebar-close" aria-label="Tutup menu" onClick={onClose}>
            <Ikon nama="tutup" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {grupTampil.map((g) => <GrupMenu key={g.judul} grup={g} pathname={pathname} kecil={kecil} />)}
        </nav>

        <div className="sidebar-user">
          <span className="sidebar-avatar" title={user.nama}>{inisial.toUpperCase()}</span>
          <div className="sidebar-user-info">
            <strong title={user.nama}>{user.nama}</strong>
            <span>{user.role === "admin" ? "Administrator" : "Pegawai"}</span>
          </div>
          <button className="icon-btn sidebar-logout" onClick={onLogout} aria-label="Keluar" data-tip="Keluar">
            <Ikon nama="keluar" />
          </button>
        </div>
      </aside>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
    </>
  );
}
