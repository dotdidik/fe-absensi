import { useCallback, useRef, useState } from "react";

// Variasi lebar supaya placeholder terlihat seperti teks sungguhan, bukan balok seragam.
const LEBAR = [70, 45, 85, 55, 65, 40, 75];

/**
 * `[memuat, muat]`: bungkus request dengan `muat(promise)` agar `memuat` true selama request berjalan.
 * Dihitung per request, jadi tetap benar bila filter diganti cepat dan beberapa request tumpang tindih.
 */
export function useMemuat(awal = true) {
  const [memuat, setMemuat] = useState(awal);
  const berjalan = useRef(0);

  const muat = useCallback(async (promise) => {
    berjalan.current += 1;
    setMemuat(true);
    try {
      return await promise;
    } finally {
      berjalan.current -= 1;
      if (berjalan.current === 0) setMemuat(false);
    }
  }, []);

  return [memuat, muat];
}

/** Baris placeholder untuk <tbody> selama data tabel dimuat. */
export function BarisSkeleton({ kolom, baris = 5 }) {
  return Array.from({ length: baris }, (_, i) => (
    <tr key={i} className="baris-skeleton" aria-hidden="true">
      {Array.from({ length: kolom }, (_, j) => (
        <td key={j}>
          <span className="skeleton" style={{ width: `${LEBAR[(i + j) % LEBAR.length]}%` }} />
        </td>
      ))}
    </tr>
  ));
}

/** Kartu placeholder, mis. untuk kartu poli atau kartu dokter. */
export function KartuSkeleton({ jumlah = 3, avatar = false, baris = 3 }) {
  return Array.from({ length: jumlah }, (_, i) => (
    <div key={i} className="kartu-skeleton" aria-hidden="true">
      <div className="kartu-skeleton-head">
        <span className={`skeleton ${avatar ? "skeleton-bulat" : "skeleton-kotak"}`} />
        <div>
          <span className="skeleton" style={{ width: "70%" }} />
          <span className="skeleton skeleton-tipis" style={{ width: "45%" }} />
        </div>
      </div>
      {Array.from({ length: baris }, (_, j) => (
        <span key={j} className="skeleton" style={{ width: `${LEBAR[(i + j + 2) % LEBAR.length]}%` }} />
      ))}
    </div>
  ));
}
