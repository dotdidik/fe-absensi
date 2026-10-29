import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { STATUS_LABEL, StatusBadge, formatJam, formatTanggal, todayISO } from "../../format.jsx";
import { formatKoordinat, mapsUrl } from "../../geo.js";

const STATUS_KETERANGAN = ["izin", "sakit", "cuti", "dinas_luar"];

function Lokasi({ lat, lng, jarak, akurasi }) {
  if (lat == null) return "-";
  return (
    <a href={mapsUrl(lat, lng)} target="_blank" rel="noreferrer" title={formatKoordinat(lat, lng)}>
      {jarak} m{akurasi != null && <span className="muted small"> ±{akurasi}</span>}
    </a>
  );
}
const EMPTY_FORM = { user_id: "", status: "izin", keterangan: "" };

export default function Harian() {
  const [tanggal, setTanggal] = useState(todayISO());
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [message, setMessage] = useState(null);

  const load = () => api(`/absensi/harian?tanggal=${tanggal}`).then(setRows);

  useEffect(() => {
    load().catch((err) => setMessage({ type: "error", text: err.message }));
  }, [tanggal]);

  const simpanKeterangan = async (e) => {
    e.preventDefault();
    try {
      await api("/absensi/keterangan", { method: "POST", body: { ...form, tanggal } });
      setMessage({ type: "success", text: "Keterangan tersimpan" });
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const hapus = async (row) => {
    if (!confirm(`Hapus data absensi ${row.nama} pada tanggal ini?`)) return;
    try {
      await api(`/absensi/${row.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const ringkasan = rows.reduce((acc, r) => {
    const key = r.status || "kosong";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <div className="card">
        <div className="toolbar">
          <h2>Rekap Harian · {formatTanggal(tanggal)}</h2>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </div>

        <div className="summary">
          {[...Object.keys(STATUS_LABEL), "kosong"].map((key) => (
            <div key={key} className={`summary-item badge-${key}`}>
              <strong>{ringkasan[key] || 0}</strong>
              <span>{STATUS_LABEL[key] || "Belum absen"}</span>
            </div>
          ))}
        </div>

        {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

        <table>
          <thead>
            <tr>
              <th>NIP</th>
              <th>Nama</th>
              <th>Unit</th>
              <th>Masuk</th>
              <th>Lokasi Masuk</th>
              <th>Pulang</th>
              <th>Lokasi Pulang</th>
              <th>Status</th>
              <th>Keterangan</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.user_id}>
                <td>{r.nip}</td>
                <td>{r.nama}</td>
                <td>{r.unit || "-"}</td>
                <td>{formatJam(r.jam_masuk)}</td>
                <td><Lokasi lat={r.lat_masuk} lng={r.lng_masuk} jarak={r.jarak_masuk} akurasi={r.akurasi_masuk} /></td>
                <td>{formatJam(r.jam_pulang)}</td>
                <td><Lokasi lat={r.lat_pulang} lng={r.lng_pulang} jarak={r.jarak_pulang} akurasi={r.akurasi_pulang} /></td>
                <td><StatusBadge status={r.status} /></td>
                <td>{r.keterangan || "-"}</td>
                <td>{r.id && <button className="btn-link danger" onClick={() => hapus(r)}>Hapus</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form className="card" onSubmit={simpanKeterangan}>
        <h3>Catat Izin / Sakit / Cuti / Dinas Luar</h3>
        <p className="muted small">Akan menimpa data absensi pegawai pada {formatTanggal(tanggal)}.</p>
        <div className="form-row">
          <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
            <option value="">— Pilih pegawai —</option>
            {rows.map((r) => (
              <option key={r.user_id} value={r.user_id}>{r.nama}</option>
            ))}
          </select>
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            {STATUS_KETERANGAN.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <input
            placeholder="Keterangan (opsional)"
            value={form.keterangan}
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
          />
          <button className="btn btn-primary">Simpan</button>
        </div>
      </form>
    </>
  );
}
