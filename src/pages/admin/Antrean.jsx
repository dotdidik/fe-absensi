import { useCallback, useState } from "react";
import { api } from "../../api.js";
import { STATUS_ANTREAN, StatusAntrean, usePolling } from "../../antrean.jsx";
import { formatTanggal, todayISO } from "../../format.jsx";

const BISA_DIPANGGIL = ["menunggu", "tidak_hadir"];

export default function Antrean() {
  const [tanggal, setTanggal] = useState(todayISO());
  const [poliAktif, setPoliAktif] = useState("semua");
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState(null);
  const [message, setMessage] = useState(null);
  const [sibuk, setSibuk] = useState(false);

  const load = useCallback(
    () =>
      api(`/admin/antrean?tanggal=${tanggal}`)
        .then(setData)
        .catch((err) => setMessage({ type: "error", text: err.message })),
    [tanggal]
  );

  usePolling(load);

  const gantiTanggal = (value) => {
    setData(null);
    setTanggal(value);
  };

  const aksi = async (fn, sukses) => {
    setSibuk(true);
    try {
      const hasil = await fn();
      setMessage(sukses ? { type: "success", text: sukses(hasil) } : null);
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSibuk(false);
    }
  };

  const panggilBerikutnya = (poli) =>
    aksi(
      () => api("/admin/antrean/panggil-berikutnya", { method: "POST", body: { poli_id: poli.id } }),
      (hasil) => (hasil.dipanggil ? null : `Antrean ${poli.nama} sudah habis`)
    );

  const panggil = (id) => aksi(() => api(`/admin/antrean/${id}/panggil`, { method: "POST" }));

  const simpanEdit = (e) => {
    e.preventDefault();
    aksi(
      () => api(`/admin/antrean/${edit.id}`, { method: "PUT", body: edit }),
      () => {
        setEdit(null);
        return `Antrean ${edit.kode_antrean} tersimpan`;
      }
    );
  };

  const hariIni = data && tanggal === data.hariIni;
  const antrean = (data?.antrean || []).filter((a) => poliAktif === "semua" || a.poli_id === poliAktif);

  return (
    <>
      <div className="toolbar">
        <h2>Antrean Pasien</h2>
        <div className="toolbar-actions">
          <input type="date" value={tanggal} onChange={(e) => gantiTanggal(e.target.value)} aria-label="Tanggal" />
          <a className="btn btn-secondary" href="/layar" target="_blank" rel="noreferrer">Buka Layar Antrean ↗</a>
        </div>
      </div>
      <p className="muted">
        {formatTanggal(tanggal)}
        {data && !hariIni && " · pemanggilan hanya bisa dilakukan untuk antrean hari ini"}
      </p>

      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
      {!data && <p>Memuat...</p>}

      {data && (
        <div className="poli-grid">
          {data.poli.map((p) => (
            <div key={p.id} className="card poli-card">
              <div className="poli-card-head">
                <span className="poli-kode">{p.kode}</span>
                <div>
                  <strong>{p.nama}</strong>
                  <div className="muted small">{p.piket.map((t) => t.nama).join(", ") || "Tidak ada piket"}</div>
                </div>
              </div>
              <div className="poli-dipanggil">
                <span className="muted small">Sedang dipanggil</span>
                <span className="poli-nomor">{p.dipanggil?.kode_antrean || "—"}</span>
              </div>
              <div className="poli-stat small">
                <span>Menunggu <strong>{p.menunggu}</strong></span>
                <span>Selesai <strong>{p.selesai}</strong></span>
                {p.berikutnya.length > 0 && <span>Berikutnya <strong>{p.berikutnya[0]}</strong></span>}
              </div>
              <div className="poli-aksi">
                <button
                  className="btn btn-primary"
                  disabled={!hariIni || sibuk || (!p.menunggu && !p.dipanggil)}
                  onClick={() => panggilBerikutnya(p)}
                >
                  {p.menunggu ? "Panggil Berikutnya ▶" : "Selesaikan"}
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={!hariIni || sibuk || !p.dipanggil}
                  title="Umumkan ulang nomor yang sedang dipanggil"
                  onClick={() => panggil(p.dipanggil.id)}
                >
                  🔊 Ulang
                </button>
              </div>
            </div>
          ))}
          {!data.poli.length && <p className="muted">Belum ada poli aktif. Tambahkan di menu Poli &amp; Dokter.</p>}
        </div>
      )}

      {edit && (
        <form className="card" onSubmit={simpanEdit}>
          <h3>Edit Antrean {edit.kode_antrean} · {edit.pasien}</h3>
          <div className="form-grid">
            <label>
              Status
              <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                {Object.entries(STATUS_ANTREAN)
                  .filter(([s]) => s !== "dipanggil" || edit.status === "dipanggil")
                  .map(([s, label]) => <option key={s} value={s}>{label}</option>)}
              </select>
            </label>
            <label>
              Perkiraan jam datang
              <input type="time" value={edit.jam_perkiraan} onChange={(e) => setEdit({ ...edit, jam_perkiraan: e.target.value })} required />
            </label>
            <label>
              Catatan
              <input value={edit.catatan || ""} onChange={(e) => setEdit({ ...edit, catatan: e.target.value })} />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" disabled={sibuk}>Simpan</button>
            <button type="button" className="btn btn-secondary" onClick={() => setEdit(null)}>Batal</button>
          </div>
        </form>
      )}

      {data && (
        <div className="card">
          <div className="tabs">
            <button className={poliAktif === "semua" ? "active" : ""} onClick={() => setPoliAktif("semua")}>
              Semua ({data.antrean.length})
            </button>
            {data.poli.map((p) => (
              <button key={p.id} className={poliAktif === p.id ? "active" : ""} onClick={() => setPoliAktif(p.id)}>
                {p.nama} ({data.antrean.filter((a) => a.poli_id === p.id).length})
              </button>
            ))}
          </div>
          <table className="table-stack">
            <thead>
              <tr>
                <th>No.</th>
                <th>Jam</th>
                <th>Pasien</th>
                <th>Poli</th>
                <th>Keluhan</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {antrean.map((a) => (
                <tr key={a.id} className={a.status === "dipanggil" ? "row-dipanggil" : ""}>
                  <td className="stack-title"><strong>{a.kode_antrean}</strong></td>
                  <td data-label="Jam">{a.jam_perkiraan}</td>
                  <td data-label="Pasien">
                    <div>
                      {a.pasien}
                      <div className="muted small">{a.no_hp}</div>
                    </div>
                  </td>
                  <td data-label="Poli">{a.poli}</td>
                  <td data-label="Keluhan" className="wrap">{a.keluhan || "-"}</td>
                  <td data-label="Status">
                    <StatusAntrean status={a.status} />
                    {a.catatan && <div className="muted small">{a.catatan}</div>}
                  </td>
                  <td className="actions">
                    {hariIni && BISA_DIPANGGIL.includes(a.status) && (
                      <button className="btn-link" disabled={sibuk} onClick={() => panggil(a.id)}>Panggil</button>
                    )}
                    <button className="btn-link" onClick={() => setEdit({ ...a })}>Edit</button>
                  </td>
                </tr>
              ))}
              {!antrean.length && (
                <tr>
                  <td colSpan={7} className="center muted">Belum ada antrean</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
