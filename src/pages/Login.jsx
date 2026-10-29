import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        <h1>🏥 Absensi Puskesmas</h1>
        <p className="muted">Masuk dengan NIP dan password Anda</p>
        {error && <div className="alert alert-error">{error}</div>}
        <label>
          NIP
          <input value={nip} onChange={(e) => setNip(e.target.value)} autoFocus required />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="btn btn-primary" disabled={submitting}>
          {submitting ? "Memproses..." : "Masuk"}
        </button>
      </form>
    </div>
  );
}
