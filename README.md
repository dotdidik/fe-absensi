# Frontend Absensi Puskesmas

React 18 + Vite. Halaman absen dengan validasi GPS dan peta (Leaflet), riwayat, serta halaman admin
(rekap harian, rekap bulanan, kelola pegawai). Backend: repo `queuing-system`.

## Menjalankan di lokal

```bash
cp .env.example .env        # VITE_APP_TIMEZONE harus sama dengan APP_TIMEZONE backend
npm install
npm run dev                 # https://localhost:5173 (juga https://<IP-laptop>:5173 di WiFi yang sama)
```

Backend lokal harus berjalan di `http://localhost:4000`; Vite meneruskan `/api` ke sana.
Dev server memakai HTTPS self-signed karena browser hanya mengizinkan GPS lewat HTTPS.

## Deploy ke Netlify

1. Ganti `GANTI-URL-BACKEND` di `netlify.toml` dengan URL situs backend.
2. Netlify: *Add new site → Import an existing project* → pilih repo ini. Build command dan publish
   directory dibaca dari `netlify.toml` (`npm run build` → `dist`).
3. Environment variable: `VITE_APP_TIMEZONE` (mis. `Asia/Makassar`), lalu deploy.

Di produksi, `/api/*` di-proxy oleh Netlify ke backend, jadi frontend dan API berada di satu domain.
