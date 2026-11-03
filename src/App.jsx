import { useCallback, useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Sidebar, { judulHalaman } from "./components/Sidebar.jsx";
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

function Layout() {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const tutupMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => setMenuOpen(false), [pathname]);

  if (loading) return <p className="center">Memuat...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar user={user} open={menuOpen} onClose={tutupMenu} onLogout={logout} />
      <div className="app-main">
        {/* Hanya tampil di layar kecil; di desktop sidebar selalu terlihat. */}
        <header className="mobile-bar">
          <button
            className="menu-toggle"
            aria-label="Buka menu"
            aria-controls="sidebar"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>
          <span className="mobile-bar-judul">{judulHalaman(pathname)}</span>
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
