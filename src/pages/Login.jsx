import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import Ikon from "../components/Ikon.jsx";
import { NAMA_PUSKESMAS } from "../components/Sidebar.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lihatPassword, setLihatPassword] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(nip.trim(), password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form className="card login-card" onSubmit={handleSubmit}>
        <div className="login-logo"><Ikon nama="rumahSakit" /></div>
        <h1>{NAMA_PUSKESMAS}</h1>
        <p className="muted">Masuk dengan NIP dan password Anda</p>
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          NIP
          <input value={nip} onChange={(e) => setNip(e.target.value)} autoFocus required />
        </label>
        <label>
          Password
          <div className="input-password">
            <input
              type={lihatPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="icon-btn"
              aria-label={lihatPassword ? "Sembunyikan password" : "Tampilkan password"}
              onClick={() => setLihatPassword(!lihatPassword)}
            >
              <Ikon nama={lihatPassword ? "mataTutup" : "mata"} />
            </button>
          </div>
        </label>
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "Memproses..." : "Masuk"}
        </button>
        <p className="login-bantuan">Lupa password? Hubungi admin Tata Usaha.</p>
      </form>
    </div>
  );
}
