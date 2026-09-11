# Download Foto Drive by GS

Aplikasi web statis untuk membaca XLSX, XLS, atau CSV di browser, mengambil foto dari URL/tautan Google Drive, lalu memberi nama file sesuai baris data. Tidak ada backend, database, analytics, atau upload data konsumen.

## Menjalankan

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

Salin `src/config.local.example.js` menjadi `src/config.local.js` dan isi `GOOGLE_CLIENT_ID` jika ingin menguji file Drive privat. Client ID boleh frontend; Client Secret tidak boleh dimasukkan. Saat ini `src/config.js` kosong sehingga fitur login menampilkan instruksi konfigurasi.

## Google OAuth

Di Google Cloud Console buat project, aktifkan Google Drive API, atur OAuth Consent Screen (External bila diperlukan), tambahkan akun sebagai Test User dalam mode Testing, lalu buat OAuth Client ID jenis Web Application. Tambahkan Authorized JavaScript Origin untuk `http://localhost:5173` dan `https://gilangr13.github.io`, serta URL aplikasi `https://gilangr13.github.io/Download-foto-drive/` bila diminta. Jangan membuat atau memasukkan Client Secret. Scope aplikasi hanya `drive.readonly`; token hanya berada di memori dan perlu dihubungkan ulang setelah kedaluwarsa.

## Penggunaan dan batasan

Pilih file, sheet, kolom nama/link/ID, format nama, lalu folder hasil. Chrome/Edge memakai File System Access API; browser lain mengunduh ZIP. Nama sama otomatis mendapat `(2)`, `(3)`. Link kosong, folder, akses ditolak, file non-gambar, dan kegagalan download masuk daftar masalah. File Google Docs/Sheets/Slides tidak dianggap foto. CORS pada URL gambar publik dapat membatasi download. Integrasi Google Drive asli belum dapat dinyatakan teruji tanpa Client ID dan file uji yang memang diizinkan.

## Deploy

Push branch `main`; workflow `.github/workflows/deploy.yml` menjalankan lint, test, build, dan deploy Pages. Di Settings → Pages pilih **GitHub Actions** sebagai source. Target URL: `https://gilangr13.github.io/Download-foto-drive/`.

Data Excel dan foto diproses langsung di browser ini dan tidak dikirim ke server.
