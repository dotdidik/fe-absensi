import { useState } from "react";
import { api } from "../api.js";

export default function GantiPassword() {
  const [form, setForm] = useState({ passwordLama: "", passwordBaru: "", konfirmasi: "" });
  const [message, setMessage] = useState(null);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.passwordBaru !== form.konfirmasi) {
      return setMessage({ type: "error", text: "Konfirmasi password tidak sama" });
    }
    try {
      const res = await api("/auth/password", { method: "PUT", body: form });
      setMessage({ type: "success", text: res.message });
      setForm({ passwordLama: "", passwordBaru: "", konfirmasi: "" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  return (
    <form className="card narrow" onSubmit={handleSubmit}>
      <h2>Ganti Password</h2>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      <label>
        Password lama
        <input type="password" value={form.passwordLama} onChange={update("passwordLama")} required />
      </label>
      <label>
        Password baru
        <input type="password" value={form.passwordBaru} onChange={update("passwordBaru")} minLength={6} required />
      </label>
      <label>
        Ulangi password baru
        <input type="password" value={form.konfirmasi} onChange={update("konfirmasi")} required />
      </label>
      <button className="btn btn-primary">Simpan</button>
    </form>
  );
}
