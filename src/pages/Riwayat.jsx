import { useEffect, useState } from "react";
import { api } from "../api.js";
import { BarisSkeleton, useMemuat } from "../components/Skeleton.jsx";
import { StatusBadge, formatJam, formatTanggal, thisMonthISO } from "../format.jsx";

export default function Riwayat() {
  const [bulan, setBulan] = useState(thisMonthISO());
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [memuat, muat] = useMemuat();

  useEffect(() => {
    setError("");
    muat(api(`/absensi/riwayat?bulan=${bulan}`)).then(setRows).catch((err) => setError(err.message));
  }, [bulan, muat]);

  return (
    <div className="card">
      <div className="toolbar">
        <h2>Riwayat Absensi Saya</h2>
        <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} />
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <table className="table-stack" aria-busy={memuat}>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Masuk</th>
            <th>Pulang</th>
            <th>Status</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {memuat && <BarisSkeleton kolom={5} />}
          {!memuat && rows.map((r) => (
            <tr key={r.id}>
              <td className="stack-title">{formatTanggal(r.tanggal)}</td>
              <td data-label="Masuk">{formatJam(r.jam_masuk)}</td>
              <td data-label="Pulang">{formatJam(r.jam_pulang)}</td>
              <td data-label="Status"><StatusBadge status={r.status} /></td>
              <td data-label="Keterangan">{r.keterangan || "-"}</td>
            </tr>
          ))}
          {!memuat && !rows.length && (
            <tr>
              <td colSpan={5} className="center muted">Belum ada data pada bulan ini</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
