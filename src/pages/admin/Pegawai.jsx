import { useEffect, useState } from "react";
import { api } from "../../api.js";

const EMPTY_FORM = { nip: "", nama: "", jabatan: "", unit: "", role: "pegawai", aktif: true, password: "" };

export default function Pegawai() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState(null);

  const load = () => api("/pegawai").then(setRows);

  useEffect(() => {
    load().catch((err) => setMessage({ type: "error", text: err.message }));
  }, []);

  const update = (key) => (e) =>
    setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  const simpan = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await api(`/pegawai/${form.id}`, { method: "PUT", body: form });
      } else {
        await api("/pegawai", { method: "POST", body: form });
      }
      setMessage({ type: "success", text: `Data ${form.nama} tersimpan` });
      setForm(null);
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const hapus = async (row) => {
    if (!confirm(`Hapus ${row.nama} beserta seluruh riwayat absensinya?`)) return;
    try {
      await api(`/pegawai/${row.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  return (
    <>
      {form && (
        <form className="card" onSubmit={simpan}>
          <h3>{form.id ? "Edit Pegawai" : "Tambah Pegawai"}</h3>
          <div className="form-grid">
            <label>NIP<input value={form.nip} onChange={update("nip")} required /></label>
            <label>Nama<input value={form.nama} onChange={update("nama")} required /></label>
            <label>Jabatan<input value={form.jabatan || ""} onChange={update("jabatan")} /></label>
            <label>Unit / Poli<input value={form.unit || ""} onChange={update("unit")} /></label>
            <label>
              Role
              <select value={form.role} onChange={update("role")}>
                <option value="pegawai">Pegawai</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Password {form.id && <span className="muted small">(kosongkan jika tidak diganti)</span>}
              <input type="password" value={form.password} onChange={update("password")} required={!form.id} />
            </label>
            {form.id && (
              <label className="checkbox">
                <input type="checkbox" checked={form.aktif} onChange={update("aktif")} /> Aktif
              </label>
            )}
          </div>
          <div className="form-actions">
            <button className="btn btn-primary">Simpan</button>
            <button type="button" className="btn btn-secondary" onClick={() => setForm(null)}>Batal</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="toolbar">
          <h2>Data Pegawai</h2>
          <button className="btn btn-primary" onClick={() => setForm(EMPTY_FORM)}>+ Tambah Pegawai</button>
        </div>
        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
        <table>
          <thead>
            <tr>
              <th>NIP</th>
              <th>Nama</th>
              <th>Jabatan</th>
              <th>Unit</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.aktif ? "" : "inactive"}>
                <td>{r.nip}</td>
                <td>{r.nama}</td>
                <td>{r.jabatan || "-"}</td>
                <td>{r.unit || "-"}</td>
                <td>{r.role === "admin" ? "Admin" : "Pegawai"}</td>
                <td>{r.aktif ? "Aktif" : "Nonaktif"}</td>
                <td className="actions">
                  <button className="btn-link" onClick={() => setForm({ ...r, password: "" })}>Edit</button>
                  <button className="btn-link danger" onClick={() => hapus(r)}>Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
