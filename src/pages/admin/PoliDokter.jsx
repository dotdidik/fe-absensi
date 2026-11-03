import { useEffect, useState } from "react";
import { api } from "../../api.js";
import { BarisSkeleton, KartuSkeleton, useMemuat } from "../../components/Skeleton.jsx";
import { FotoTenagaMedis, JENIS_TENAGA_MEDIS, NAMA_HARI, kecilkanFoto } from "../../antrean.jsx";

const POLI_BARU = { kode: "", nama: "", aktif: true };
const TENAGA_MEDIS_BARU = { nama: "", jenis: "dokter", poli_id: "", hari_piket: [1, 2, 3, 4, 5, 6], aktif: true };

export default function PoliDokter() {
  const [poli, setPoli] = useState([]);
  const [tenagaMedis, setTenagaMedis] = useState([]);
  const [formPoli, setFormPoli] = useState(null);
  const [formTm, setFormTm] = useState(null);
  const [message, setMessage] = useState(null);
  const [memuat, muat] = useMemuat();

  const load = () => muat(Promise.all([api("/poli").then(setPoli), api("/tenaga-medis").then(setTenagaMedis)]));

  useEffect(() => {
    load().catch((err) => setMessage({ type: "error", text: err.message }));
  }, []);

  const jalankan = async (fn, sukses) => {
    try {
      await fn();
      setMessage(sukses ? { type: "success", text: sukses } : null);
      await load();
      return true;
    } catch (err) {
      setMessage({ type: "error", text: err.message });
      return false;
    }
  };

  // ---------- Poli ----------

  const simpanPoli = async (e) => {
    e.preventDefault();
    const ok = await jalankan(
      () => api(formPoli.id ? `/poli/${formPoli.id}` : "/poli", { method: formPoli.id ? "PUT" : "POST", body: formPoli }),
      `${formPoli.nama} tersimpan`
    );
    if (ok) setFormPoli(null);
  };

  const hapusPoli = (p) =>
    confirm(`Hapus ${p.nama} beserta dokter/bidan di dalamnya?`) &&
    jalankan(() => api(`/poli/${p.id}`, { method: "DELETE" }), `${p.nama} dihapus`);

  // ---------- Tenaga medis ----------

  const pilihFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setFormTm({ ...formTm, foto: await kecilkanFoto(file) });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const toggleHari = (hari) =>
    setFormTm({
      ...formTm,
      hari_piket: formTm.hari_piket.includes(hari)
        ? formTm.hari_piket.filter((h) => h !== hari)
        : [...formTm.hari_piket, hari]
    });

  const simpanTm = async (e) => {
    e.preventDefault();
    const ok = await jalankan(
      () =>
        api(formTm.id ? `/tenaga-medis/${formTm.id}` : "/tenaga-medis", {
          method: formTm.id ? "PUT" : "POST",
          body: { ...formTm, poli_id: Number(formTm.poli_id) }
        }),
      `${formTm.nama} tersimpan`
    );
    if (ok) setFormTm(null);
  };

  const hapusTm = (t) =>
    confirm(`Hapus ${t.nama}?`) && jalankan(() => api(`/tenaga-medis/${t.id}`, { method: "DELETE" }), `${t.nama} dihapus`);

  // Pratinjau foto di form: foto baru (data URL), foto lama di server, atau placeholder.
  const pratinjau = formTm?.foto
    ? <img className="foto-tm" style={{ width: 96, height: 96 }} src={formTm.foto} alt="Pratinjau" />
    : <FotoTenagaMedis tenagaMedis={formTm?.foto === null ? null : formTm} size={96} />;

  return (
    <>
      {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}

      {formPoli && (
        <form className="card narrow" onSubmit={simpanPoli}>
          <h3>{formPoli.id ? "Edit Poli" : "Tambah Poli"}</h3>
          <label>
            Kode antrean <span className="muted small">(1–3 huruf, mis. A → nomor A-001)</span>
            <input value={formPoli.kode} maxLength={3} onChange={(e) => setFormPoli({ ...formPoli, kode: e.target.value.toUpperCase() })} required />
          </label>
          <label>Nama poli<input value={formPoli.nama} onChange={(e) => setFormPoli({ ...formPoli, nama: e.target.value })} required /></label>
          {formPoli.id && (
            <label className="checkbox">
              <input type="checkbox" checked={formPoli.aktif} onChange={(e) => setFormPoli({ ...formPoli, aktif: e.target.checked })} /> Aktif (tampil di aplikasi & layar)
            </label>
          )}
          <div className="form-actions">
            <button className="btn btn-primary">Simpan</button>
            <button type="button" className="btn btn-secondary" onClick={() => setFormPoli(null)}>Batal</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="toolbar">
          <h2>Poli</h2>
          <button className="btn btn-primary" onClick={() => setFormPoli(POLI_BARU)}>+ Tambah Poli</button>
        </div>
        <table className="table-stack" aria-busy={memuat}>
          <thead>
            <tr><th>Kode</th><th>Nama</th><th>Dokter/Bidan</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {memuat && <BarisSkeleton kolom={5} baris={3} />}
            {!memuat && poli.map((p) => (
              <tr key={p.id} className={p.aktif ? "" : "inactive"}>
                <td className="stack-title"><span className="poli-kode small-kode">{p.kode}</span></td>
                <td data-label="Nama">{p.nama}</td>
                <td data-label="Dokter/Bidan">{p.jumlah_tenaga_medis}</td>
                <td data-label="Status">{p.aktif ? "Aktif" : "Nonaktif"}</td>
                <td className="actions">
                  <button className="btn-link" onClick={() => setFormPoli(p)}>Edit</button>
                  <button className="btn-link danger" onClick={() => hapusPoli(p)}>Hapus</button>
                </td>
              </tr>
            ))}
            {!memuat && !poli.length && <tr><td colSpan={5} className="center muted">Belum ada poli</td></tr>}
          </tbody>
        </table>
      </div>

      {formTm && (
        <form className="card" onSubmit={simpanTm}>
          <h3>{formTm.id ? "Edit Dokter / Bidan" : "Tambah Dokter / Bidan"}</h3>
          <div className="tm-form">
            <div className="tm-foto-input">
              {pratinjau}
              <label className="btn btn-secondary btn-file">
                {formTm.foto || formTm.ada_foto ? "Ganti foto" : "Unggah foto"}
                <input type="file" accept="image/*" onChange={pilihFoto} />
              </label>
              {(formTm.foto || (formTm.ada_foto && formTm.foto !== null)) && (
                <button type="button" className="btn-link danger" onClick={() => setFormTm({ ...formTm, foto: null, ada_foto: false })}>
                  Hapus foto
                </button>
              )}
            </div>
            <div className="form-grid">
              <label>Nama lengkap & gelar<input value={formTm.nama} onChange={(e) => setFormTm({ ...formTm, nama: e.target.value })} required /></label>
              <label>
                Jenis
                <select value={formTm.jenis} onChange={(e) => setFormTm({ ...formTm, jenis: e.target.value })}>
                  {Object.entries(JENIS_TENAGA_MEDIS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
              </label>
              <label>
                Poli
                <select value={formTm.poli_id} onChange={(e) => setFormTm({ ...formTm, poli_id: e.target.value })} required>
                  <option value="">Pilih poli</option>
                  {poli.map((p) => <option key={p.id} value={p.id}>{p.nama}</option>)}
                </select>
              </label>
              <div className="field">
                <span>Hari piket</span>
                <div className="hari-pilih">
                  {NAMA_HARI.map((nama, i) => (
                    <button
                      type="button"
                      key={nama}
                      className={formTm.hari_piket.includes(i + 1) ? "active" : ""}
                      aria-pressed={formTm.hari_piket.includes(i + 1)}
                      onClick={() => toggleHari(i + 1)}
                    >
                      {nama}
                    </button>
                  ))}
                </div>
              </div>
              {formTm.id && (
                <label className="checkbox">
                  <input type="checkbox" checked={formTm.aktif} onChange={(e) => setFormTm({ ...formTm, aktif: e.target.checked })} /> Aktif
                </label>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary">Simpan</button>
            <button type="button" className="btn btn-secondary" onClick={() => setFormTm(null)}>Batal</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="toolbar">
          <h2>Dokter & Bidan Piket</h2>
          <button className="btn btn-primary" disabled={!poli.length} onClick={() => setFormTm(TENAGA_MEDIS_BARU)}>
            + Tambah Dokter / Bidan
          </button>
        </div>
        <div className="tm-grid" aria-busy={memuat}>
          {memuat && <KartuSkeleton jumlah={3} avatar baris={2} />}
          {!memuat && tenagaMedis.map((t) => (
            <div key={t.id} className={`tm-card ${t.aktif ? "" : "inactive"}`}>
              <FotoTenagaMedis tenagaMedis={t} size={64} />
              <div className="tm-info">
                <strong>{t.nama}</strong>
                <span className="muted small">{JENIS_TENAGA_MEDIS[t.jenis]} · {t.poli}{t.aktif ? "" : " · Nonaktif"}</span>
                <div className="hari-chip">
                  {NAMA_HARI.map((nama, i) => (
                    <span key={nama} className={t.hari_piket.includes(i + 1) ? "on" : ""}>{nama}</span>
                  ))}
                </div>
                <div>
                  {/* foto sengaja tidak disalin: undefined = foto lama dipertahankan saat disimpan */}
                  <button className="btn-link" onClick={() => setFormTm({ ...t, poli_id: String(t.poli_id) })}>Edit</button>
                  <button className="btn-link danger" onClick={() => hapusTm(t)}>Hapus</button>
                </div>
              </div>
            </div>
          ))}
          {!memuat && !tenagaMedis.length && <p className="muted">Belum ada dokter/bidan. {!poli.length && "Tambahkan poli terlebih dahulu."}</p>}
        </div>
      </div>
    </>
  );
}
