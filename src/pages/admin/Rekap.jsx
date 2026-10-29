import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { thisMonthISO } from "../../format.jsx";

const KOLOM = [
  ["hadir", "Hadir"],
  ["terlambat", "Terlambat"],
  ["izin", "Izin"],
  ["sakit", "Sakit"],
  ["cuti", "Cuti"],
  ["dinas_luar", "Dinas Luar"],
  ["tidak_absen_pulang", "Tdk Absen Pulang"]
];

function downloadCsv(bulan, rows) {
  const header = ["NIP", "Nama", "Jabatan", "Unit", ...KOLOM.map(([, label]) => label)];
  const lines = rows.map((r) => [r.nip, r.nama, r.jabatan, r.unit, ...KOLOM.map(([key]) => r[key])]);
  const csv = [header, ...lines]
    .map((line) => line.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: `rekap-absensi-${bulan}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}

export default function Rekap() {
  const [bulan, setBulan] = useState(thisMonthISO());
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api(`/absensi/rekap?bulan=${bulan}`).then((res) => setRows(res.data)).catch((err) => setError(err.message));
  }, [bulan]);

  return (
    <div className="card">
      <div className="toolbar">
        <h2>Rekap Bulanan</h2>
        <div className="toolbar-actions">
          <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} />
          <button className="btn btn-secondary" onClick={() => downloadCsv(bulan, rows)} disabled={!rows.length}>
            Unduh CSV
          </button>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <table>
        <thead>
          <tr>
            <th>NIP</th>
            <th>Nama</th>
            <th>Unit</th>
            {KOLOM.map(([key, label]) => <th key={key} className="num">{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.user_id}>
              <td>{r.nip}</td>
              <td>{r.nama}</td>
              <td>{r.unit || "-"}</td>
              {KOLOM.map(([key]) => <td key={key} className="num">{r[key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
