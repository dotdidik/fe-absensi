import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  // Browser hanya mengizinkan GPS lewat HTTPS (kecuali localhost), jadi dev server memakai sertifikat self-signed.
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    proxy: { "/api": "http://localhost:4000" }
  }
});
