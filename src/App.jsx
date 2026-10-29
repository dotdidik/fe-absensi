import { useEffect, useState } from "react";
import { Navigate, NavLink, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Login from "./pages/Login.jsx";
import Absen from "./pages/Absen.jsx";
import Riwayat from "./pages/Riwayat.jsx";
import GantiPassword from "./pages/GantiPassword.jsx";
import Harian from "./pages/admin/Harian.jsx";
import Rekap from "./pages/admin/Rekap.jsx";
import Pegawai from "./pages/admin/Pegawai.jsx";

function Layout() {
  const { user, loading, logout } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  if (loading) return <p className="center">Memuat...</p>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <header className={`topbar ${menuOpen ? "open" : ""}`}>
        <div className="brand">🏥 Absensi Puskesmas</div>
        <button
          className="menu-toggle"
          aria-label="Buka menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
        <nav>
          <NavLink to="/" end>Absen</NavLink>
          <NavLink to="/riwayat">Riwayat</NavLink>
          {user.role === "admin" && (
            <>
              <NavLink to="/admin/harian">Rekap Harian</NavLink>
              <NavLink to="/admin/rekap">Rekap Bulanan</NavLink>
              <NavLink to="/admin/pegawai">Pegawai</NavLink>
            </>
          )}
        </nav>
        <div className="user">
          <NavLink to="/password" title="Ganti password">{user.nama}</NavLink>
          <button className="btn-link" onClick={logout}>Keluar</button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
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
      <Route element={<Layout />}>
        <Route index element={<Absen />} />
        <Route path="riwayat" element={<Riwayat />} />
        <Route path="password" element={<GantiPassword />} />
        <Route path="admin" element={<AdminOnly />}>
          <Route path="harian" element={<Harian />} />
          <Route path="rekap" element={<Rekap />} />
          <Route path="pegawai" element={<Pegawai />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
