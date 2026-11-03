import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Ikon from "./components/Ikon.jsx";
import Sidebar, { halamanAktif } from "./components/Sidebar.jsx";
import { formatTanggal, todayISO } from "./format.jsx";
import Login from "./pages/Login.jsx";
import Absen from "./pages/Absen.jsx";
import Riwayat from "./pages/Riwayat.jsx";
import GantiPassword from "./pages/GantiPassword.jsx";
import Harian from "./pages/admin/Harian.jsx";
import Rekap from "./pages/admin/Rekap.jsx";
import Pegawai from "./pages/admin/Pegawai.jsx";
import Antrean from "./pages/admin/Antrean.jsx";
import PoliDokter from "./pages/admin/PoliDokter.jsx";
import Kunjungan from "./pages/admin/Kunjungan.jsx";
import Layar from "./pages/Layar.jsx";

const KUNCI_SIDEBAR_KECIL = "sidebar_kecil";
const MEDIA_DRAWER = "(max-width: 900px)";

function bacaSidebarKecil() {
  try {
    return localStorage.getItem(KUNCI_SIDEBAR_KECIL) === "1";
  } catch {
    return false;
  }
}

function Layout() {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [kecil, setKecil] = useState(bacaSidebarKecil);

  const tutupMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(KUNCI_SIDEBAR_KECIL, kecil ? "1" : "0");
    } catch {
      // Penyimpanan diblokir (mode privat): pilihan hanya berlaku sampai halaman ditutup.
    }
  }, [kecil]);

  if (loading) return <p className="center">Memuat...</p>;
  if (!user) return <Navigate to="/login" replace />;

  // Satu tombol: di desktop mengecilkan/membesarkan sidebar, di HP/tablet membuka drawer.
  const toggleSidebar = () =>
    window.matchMedia(MEDIA_DRAWER).matches ? setMenuOpen(true) : setKecil((k) => !k);

  const { grup, label } = halamanAktif(pathname);

  return (
    <div className={`app-shell ${kecil ? "sidebar-kecil" : ""}`}>
      <Sidebar user={user} open={menuOpen} kecil={kecil} onClose={tutupMenu} onLogout={logout} />
      <div className="app-main">
        <header className="app-header">
          <button
            className="icon-btn"
            aria-controls="sidebar"
            aria-label={kecil ? "Besarkan menu" : "Kecilkan menu"}
            title={kecil ? "Besarkan menu" : "Kecilkan menu"}
            onClick={toggleSidebar}
          >
            <Ikon nama="panel" className="hanya-desktop" />
            <Ikon nama="menu" className="hanya-hp" />
          </button>
          <div className="app-header-judul">
            {label && <span>{grup}</span>}
            <strong>{label || grup}</strong>
          </div>
          <span className="chip-tanggal">
            <Ikon nama="kalender" />
            {formatTanggal(todayISO())}
          </span>
        </header>
        <main className="container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminOnly() {
  const { user } = useAuth();
  return user.role === "admin" ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      {/* Layar ruang tunggu: publik, tanpa login */}
      <Route path="/layar" element={<Layar />} />
      <Route element={<Layout />}>
        <Route index element={<Absen />} />
        <Route path="riwayat" element={<Riwayat />} />
        <Route path="password" element={<GantiPassword />} />
        <Route path="admin" element={<AdminOnly />}>
          <Route path="harian" element={<Harian />} />
          <Route path="rekap" element={<Rekap />} />
          <Route path="pegawai" element={<Pegawai />} />
          <Route path="antrean" element={<Antrean />} />
          <Route path="poli" element={<PoliDokter />} />
          <Route path="kunjungan" element={<Kunjungan />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
