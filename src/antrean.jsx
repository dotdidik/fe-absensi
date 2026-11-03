import { useEffect } from "react";

export const INTERVAL_POLLING = 3000;

export const STATUS_ANTREAN = {
  menunggu: "Menunggu",
  dipanggil: "Dipanggil",
  selesai: "Selesai",
  tidak_hadir: "Tidak hadir",
  batal: "Batal"
};

export const JENIS_TENAGA_MEDIS = {
  dokter: "Dokter",
  dokter_gigi: "Dokter Gigi",
  bidan: "Bidan",
  perawat: "Perawat"
};

export const NAMA_HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]; // indeks 0 = hari 1 (Senin)

export function StatusAntrean({ status }) {
  return <span className={`badge badge-${status}`}>{STATUS_ANTREAN[status] || status}</span>;
}

/**
 * Menjalankan `load` sekarang dan setiap `interval` ms selama tab terlihat; mulai ulang bila `load` berubah
 * (bungkus dengan useCallback). Request berikutnya baru dijadwalkan setelah yang sebelumnya selesai,
 * jadi tidak menumpuk saat koneksi lambat.
 */
export function usePolling(load, interval = INTERVAL_POLLING) {
  useEffect(() => {
    let aktif = true;
    let timer;
    const jalan = async () => {
      if (!document.hidden) await load().catch(() => {});
      if (aktif) timer = setTimeout(jalan, interval);
    };
    jalan();
    return () => {
      aktif = false;
      clearTimeout(timer);
    };
  }, [load, interval]);
}

/** Foto tenaga medis, atau ilustrasi placeholder bila belum diunggah. */
export function FotoTenagaMedis({ tenagaMedis, size = 48, className = "" }) {
  const style = { width: size, height: size };
  if (tenagaMedis?.ada_foto) {
    return (
      <img
        className={`foto-tm ${className}`}
        style={style}
        src={`/api/tenaga-medis/${tenagaMedis.id}/foto?v=${tenagaMedis.versi}`}
        alt={tenagaMedis.nama}
      />
    );
  }
  return (
    <svg className={`foto-tm foto-placeholder ${className}`} style={style} viewBox="0 0 64 64" role="img" aria-label="Foto belum ada">
      <rect width="64" height="64" fill="#dcefe9" />
      <circle cx="32" cy="24" r="11" fill="#7bbfac" />
      <path d="M10 64c2-14 11-21 22-21s20 7 22 21z" fill="#7bbfac" />
      <path d="M26 44v7a6 6 0 0 0 12 0v-7" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="38" cy="44" r="2.5" fill="#ffffff" />
    </svg>
  );
}

/** Kecilkan foto di browser (maks. `sisi` px, JPEG) sebelum diunggah agar ringan dimuat di HP dan layar. */
export function kecilkanFoto(file, sisi = 320) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const skala = Math.min(1, sisi / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * skala);
      canvas.height = Math.round(img.height * skala);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => reject(new Error("File bukan gambar yang valid"));
    img.src = URL.createObjectURL(file);
  });
}
