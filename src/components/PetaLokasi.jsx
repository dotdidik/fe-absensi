import { useEffect } from "react";
import L from "leaflet";
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// CircleMarker dipakai (bukan Marker) karena ikon default Leaflet tidak ikut ter-bundle oleh Vite.
const WARNA = { kantor: "#0f8b6c", dalam: "#2563eb", luar: "#c0392b" };

// Hanya fit sekali saat posisi pertama didapat, agar peta tidak melompat ketika pengguna menggeser.
function FitArea({ kantor, adaPosisi, posisi }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLng(kantor.lat, kantor.lng).toBounds(kantor.radius * 2.5);
    if (posisi) bounds.extend([posisi.lat, posisi.lng]);
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 18 });
  }, [map, kantor, adaPosisi]);
  return null;
}

export default function PetaLokasi({ kantor, posisi, dalamArea }) {
  const warnaPosisi = dalamArea ? WARNA.dalam : WARNA.luar;

  return (
    // Di HP, geser satu jari dipakai untuk scroll halaman; peta tetap bisa di-zoom dengan dua jari.
    <MapContainer
      className="peta"
      center={[kantor.lat, kantor.lng]}
      zoom={17}
      scrollWheelZoom={false}
      dragging={!L.Browser.mobile}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitArea kantor={kantor} adaPosisi={Boolean(posisi)} posisi={posisi} />

      <Circle
        center={[kantor.lat, kantor.lng]}
        radius={kantor.radius}
        pathOptions={{ color: WARNA.kantor, fillColor: WARNA.kantor, fillOpacity: 0.12, weight: 2 }}
      />
      <CircleMarker
        center={[kantor.lat, kantor.lng]}
        radius={7}
        pathOptions={{ color: "#fff", fillColor: WARNA.kantor, fillOpacity: 1, weight: 2 }}
      >
        <Tooltip direction="top" offset={[0, -6]}>Puskesmas · radius {kantor.radius} m</Tooltip>
      </CircleMarker>

      {posisi && (
        <>
          {/* Lingkaran akurasi GPS */}
          <Circle
            center={[posisi.lat, posisi.lng]}
            radius={posisi.akurasi}
            pathOptions={{ color: warnaPosisi, fillColor: warnaPosisi, fillOpacity: 0.1, weight: 1, dashArray: "4" }}
          />
          <CircleMarker
            center={[posisi.lat, posisi.lng]}
            radius={8}
            pathOptions={{ color: "#fff", fillColor: warnaPosisi, fillOpacity: 1, weight: 3 }}
          >
            <Tooltip direction="top" offset={[0, -8]} permanent>Anda</Tooltip>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  );
}
