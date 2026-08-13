# Website Dinas Sosial (Tanpa Login)

Website resmi Dinas Sosial dengan backend REST API sendiri. Tidak ada sistem login — seluruh halaman termasuk **Pengaduan Masyarakat** dapat diakses publik secara anonim.

## Struktur Proyek

```
dinsos-website/
├── backend/              REST API (Node.js + Express)
│   ├── server.js
│   ├── package.json
│   └── data/              Penyimpanan data berbasis file JSON
│       ├── profil.json
│       ├── berita.json
│       ├── program.json
│       ├── penerima.json
│       ├── layanan.json
│       └── pengaduan.json   (terisi otomatis dari pengaduan yang masuk)
└── frontend/              Website statis (HTML/CSS/JS) yang memanggil API
    ├── index.html
    ├── css/style.css
    └── js/app.js
```

## Cara Menjalankan

### 1. Jalankan Backend (API)

```bash
cd backend
npm install
npm start
```

Server API akan berjalan di `http://localhost:3000`.
Cek dengan membuka `http://localhost:3000/` di browser — akan tampil daftar endpoint yang tersedia.

### 2. Jalankan Frontend

Buka `frontend/index.html` langsung di browser, **atau** jalankan sebagai server statis (disarankan agar semua fitur berjalan optimal):

```bash
cd frontend
npx serve .
# atau
python3 -m http.server 5500
```

Lalu buka `http://localhost:5500`.

> Pastikan backend (langkah 1) sudah berjalan sebelum membuka frontend, karena semua konten (berita, program, data penerima, dll.) diambil secara langsung (live) dari API.

### 3. Mengubah Alamat API

Jika backend dijalankan di domain/port lain (misalnya saat sudah di-deploy ke server), ubah baris berikut di `frontend/js/app.js`:

```js
const API_BASE = "http://localhost:3000/api";
```

## Daftar Endpoint API

| Method | Endpoint              | Keterangan                                   |
|--------|------------------------|-----------------------------------------------|
| GET    | `/api/profil`          | Profil, visi-misi, struktur organisasi        |
| GET    | `/api/berita`          | Daftar berita/kegiatan (filter: kategori, search) |
| GET    | `/api/berita/:id`      | Detail satu berita                            |
| GET    | `/api/program`         | Daftar program bantuan sosial (filter: kategori) |
| GET    | `/api/program/:id`     | Detail satu program                           |
| GET    | `/api/penerima`        | Data penerima bantuan (filter, pencarian, paginasi) |
| GET    | `/api/layanan`         | Informasi layanan & persyaratan               |
| POST   | `/api/pengaduan`       | Kirim pengaduan baru (tanpa login)            |
| GET    | `/api/pengaduan/:tiket`| Cek status pengaduan lewat nomor tiket        |
| GET    | `/api/kontak`          | Informasi kontak kantor Dinas Sosial          |
| GET    | `/api/statistik`       | Statistik ringkas untuk beranda               |

Semua endpoint bersifat publik — **tidak memerlukan token, API key, atau login** apa pun, sesuai kebutuhan.

## Catatan Privasi Data

Data pada `/api/penerima` adalah **data contoh (dummy)** untuk keperluan demonstrasi transparansi publik. NIK sengaja disamarkan sebagian. Jika diterapkan dengan data riil warga, disarankan menambahkan:
- Anonimisasi/masking data pribadi sebelum ditampilkan ke publik.
- Audit log akses data.
- Kepatuhan terhadap UU Pelindungan Data Pribadi (UU PDP).

## Deploy ke Railway (Supaya Bisa Diakses Publik 24 Jam)

Proyek ini sudah disiapkan agar **website + API berjalan sebagai satu layanan** (server Express yang sama menyajikan file website sekaligus API), sehingga cukup satu kali deploy di Railway.

### Langkah-langkah

1. **Buat akun** di [railway.app](https://railway.app) (bisa login pakai akun GitHub).
2. **Push folder proyek ini ke repository GitHub** (buat repo baru, lalu upload seluruh isi folder `dinsos-website/`).
3. Di dashboard Railway, klik **New Project → Deploy from GitHub repo**, pilih repo tadi.
4. Railway akan otomatis mendeteksi `package.json` di root dan menjalankan:
   - `npm install` (instalasi dependency)
   - `npm start` → yang menjalankan `node backend/server.js`
5. Setelah build selesai, Railway akan memberi alamat publik seperti:
   ```
   https://dinsos-website-production.up.railway.app
   ```
6. Buka alamat itu — website dan API-nya sudah bisa diakses siapa saja, tanpa laptop kamu perlu menyala.

### Catatan penting soal data

Data saat ini disimpan sebagai file JSON di `backend/data/`. Di Railway, **penyimpanan file bersifat sementara** — jika layanan di-restart/redeploy, perubahan data (termasuk pengaduan yang masuk) bisa ikut hilang kalau tidak diaktifkan **Volume**.

Untuk data yang perlu awet (terutama `pengaduan.json` dan `penerima.json`), disarankan:
- Aktifkan **Railway Volume** dan arahkan ke folder `backend/data`, **atau**
- Pindahkan penyimpanan ke database sungguhan (lihat bagian di bawah) — ini pilihan yang lebih aman untuk jangka panjang.

### Custom domain

Railway juga mendukung penyambungan domain sendiri (misalnya `dinsos.kotaharapan.go.id`) lewat menu **Settings → Domains** di dashboard proyeknya.

## Mengganti Penyimpanan ke Database Sungguhan

Saat ini data disimpan sebagai file JSON (`backend/data/*.json`) agar proyek mudah dijalankan tanpa instalasi database. Untuk produksi, folder `data/` dapat diganti dengan koneksi ke database sesungguhnya (PostgreSQL/MySQL/MongoDB) tanpa mengubah struktur endpoint di `server.js`.
