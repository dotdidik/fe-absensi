import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { STATUS_ANTREAN, StatusAntrean } from "../../antrean.jsx";
import { todayISO } from "../../format.jsx";

const FILTER_AWAL = () => ({ dari: `${todayISO().slice(0, 8)}01`, sampai: todayISO(), poli_id: "", status: "", q: "" });

const formatTgl = (value) =>
  new Date(`${value}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

export default function Kunjungan() {
  const [poli, setPoli] = useState([]);
  const [filter, setFilter] = useState(FILTER_AWAL);
  const [cari, setCari] = useState(FILTER_AWAL);
  const [halaman, setHalaman] = useState(1);
  const [hasil, setHasil] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/poli").then(setPoli).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ ...cari, halaman });
    setError("");
    api(`/admin/antrean/riwayat?${params}`).then(setHasil).catch((err) => setError(err.message));
  }, [cari, halaman]);

  const ubah = (key) => (e) => setFilter({ ...filter, [key]: e.target.value });

  const terapkan = (e) => {
    e.preventDefault();
    setHalaman(1);
    setCari(filter);
  };

  const jumlahHalaman = hasil ? Math.max(1, Math.ceil(hasil.total / hasil.perHalaman)) : 1;

  return (
    <div className="card">
      <h2>Riwayat Kunjungan</h2>
      <form className="filter-bar" onSubmit={terapkan}>
        <label>Dari<input type="date" value={filter.dari} onChange={ubah("dari")} /></label>
        <label>Sampai<input type="date" value={filter.sampai} onChange={ubah("sampai")} /></label>
        <label>
          Poli
          <select value={filter.poli_id} onChange={ubah("poli_id")}>
            <option value="">Semua poli</option>
            {poli.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={filter.status} onChange={ubah("status")}>
            <option value="">Semua status</option>
            {Object.entries(STATUS_ANTREAN).map(([s, label]) => <option key={s} value={s}>{label}</option>)}
          </select>
        </label>
        <label className="grow">
          Cari pasien
          <input placeholder="Nama, no HP, atau NIK" value={filter.q} onChange={ubah("q")} />
        </label>
        <button className="btn btn-primary">Tampilkan</button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}
      {hasil && <p className="muted small">{hasil.total} kunjungan ditemukan</p>}

      <table className="table-stack">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>No.</th>
            <th>Poli</th>
            <th>Pasien</th>
            <th>NIK / BPJS</th>
            <th>Jam</th>
            <th>Status</th>
            <th>Keluhan</th>
          </tr>
        </thead>
        <tbody>
          {hasil?.data.map((a) => (
            <tr key={a.id}>
              <td className="stack-title">{formatTgl(a.tanggal)}</td>
              <td data-label="No.">{a.kode_antrean}</td>
              <td data-label="Poli">{a.poli}</td>
              <td data-label="Pasien">
                <div>
                  {a.pasien}
                  <div className="muted small">{a.no_hp}</div>
                </div>
              </td>
              <td data-label="NIK / BPJS" className="small">
                {[a.nik, a.no_bpjs].filter(Boolean).join(" / ") || "-"}
              </td>
              <td data-label="Jam">{a.jam_perkiraan}</td>
              <td data-label="Status">
                <StatusAntrean status={a.status} />
                {a.catatan && <div className="muted small">{a.catatan}</div>}
              </td>
              <td data-label="Keluhan" className="wrap">{a.keluhan || "-"}</td>
            </tr>
          ))}
          {hasil && !hasil.data.length && (
            <tr>
              <td colSpan={8} className="center muted">Tidak ada kunjungan dengan filter ini</td>
            </tr>
          )}
        </tbody>
      </table>

      {hasil && hasil.total > hasil.perHalaman && (
        <div className="pagination">
          <button className="btn btn-secondary" disabled={halaman <= 1} onClick={() => setHalaman(halaman - 1)}>‹ Sebelumnya</button>
          <span>Halaman {halaman} dari {jumlahHalaman}</span>
          <button className="btn btn-secondary" disabled={halaman >= jumlahHalaman} onClick={() => setHalaman(halaman + 1)}>Berikutnya ›</button>
        </div>
      )}
    </div>
  );
}
