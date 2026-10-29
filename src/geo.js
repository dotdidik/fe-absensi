const RADIUS_BUMI_METER = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;

// Sama dengan perhitungan di backend; di sini hanya untuk pratinjau, validasi tetap di server.
export function jarakMeter(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIUS_BUMI_METER * Math.asin(Math.sqrt(h));
}

// Reverse geocoding OpenStreetMap (Nominatim). Batas pemakaian gratis: maks. 1 request/detik.
export async function cariAlamat({ lat, lng }, signal) {
  const params = new URLSearchParams({ format: "jsonv2", lat, lon: lng, zoom: 18, "accept-language": "id" });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal });
  if (!res.ok) throw new Error("Gagal mengambil alamat");
  const data = await res.json();
  return data.display_name || null;
}

export const mapsUrl =(lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;

export const formatKoordinat = (lat, lng) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

const PESAN_ERROR = {
  1: "Izin lokasi ditolak. Izinkan akses lokasi untuk situs ini di pengaturan browser.",
  2: "Lokasi tidak tersedia. Pastikan GPS perangkat aktif.",
  3: "Waktu habis saat membaca lokasi. Coba lagi di area terbuka."
};

export const pesanErrorLokasi = (err) => PESAN_ERROR[err.code] || err.message;

export const lokasiDidukung = () => {
  if (!window.isSecureContext) return "Lokasi hanya bisa dibaca lewat HTTPS. Buka aplikasi dengan alamat https://";
  if (!("geolocation" in navigator)) return "Browser ini tidak mendukung GPS.";
  return null;
};
