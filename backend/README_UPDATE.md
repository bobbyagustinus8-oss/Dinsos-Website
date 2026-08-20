# Update Backend — Login, Panel Admin, Upload Foto, GPS, Push Notif

Backend Dinas Sosial ini sudah ditambah fitur baru untuk mendukung app Android:

## Yang Baru
- **Login staff/admin** (JWT) — `POST /api/auth/login`
- **Panel admin**: kelola berita, program, layanan, data penerima, dan pengaduan masuk (ubah status)
- **Upload foto**: bukti pengaduan (publik) & gambar berita/program (admin)
- **Lokasi GPS**: pengaduan publik sekarang bisa menyertakan koordinat lokasi
- **Push notifikasi** (opsional, via Firebase): kirim notif ke pelapor saat status pengaduan berubah

## Akun Default
| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | admin (bisa hapus data) |
| `staff` | `staff123` | staff (tambah/edit, tidak bisa hapus) |

⚠️ **Ganti password ini setelah deploy!** Caranya: buka `data/users.json`, generate hash baru dengan:
```bash
node -e "console.log(require('bcryptjs').hashSync('password_baru_anda', 10))"
```
lalu ganti nilai `passwordHash` di file itu.

## Cara Deploy ke Railway

Karena project ini punya folder `.git`, kemungkinan besar Anda sudah menyambungkannya ke GitHub dan Railway auto-deploy dari sana. Langkahnya:

1. Salin ulang **kedua** hal ini ke folder project lokal Anda yang sudah tersambung ke GitHub (timpa yang lama):
   - File `package.json` di **root** project (bukan yang di dalam `backend/`)
   - Folder `backend/` lengkap
   
   ⚠️ **Ini penting**: Railway membaca `package.json` di folder **root**, bukan di dalam `backend/`. Kalau cuma folder `backend/` yang ditimpa tapi `package.json` root-nya lupa, Railway akan gagal install package baru (`bcryptjs`, `jsonwebtoken`, `multer`) dan server akan crash dengan error `Cannot find module 'bcryptjs'`.

2. Buka terminal di folder project itu, jalankan:
   ```bash
   git add .
   git commit -m "Tambah login, panel admin, upload foto, GPS, push notif"
   git push
   ```
3. Railway akan otomatis build & deploy ulang setelah menerima push ini.

**PENTING — set environment variable di Railway** (Dashboard → Project Anda → Variables):
- `JWT_SECRET` → isi dengan teks acak yang panjang & rahasia (contoh: hasil dari `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`). Ini WAJIB diganti dari nilai default, jangan pakai yang ada di kode.
- `FIREBASE_SERVICE_ACCOUNT` → opsional, hanya kalau ingin push notifikasi aktif (lihat bagian di bawah).

## Aktifkan Push Notifikasi (Opsional)

Push notif membutuhkan project Firebase (gratis):
1. Buka https://console.firebase.google.com, buat project baru.
2. Di project itu: ⚙️ **Project Settings → Service Accounts → Generate new private key**. Ini akan mendownload file JSON.
3. Buka file JSON itu, copy **seluruh isinya**.
4. Di Railway: Variables → tambah `FIREBASE_SERVICE_ACCOUNT`, paste isi JSON tadi sebagai value.
5. Redeploy.

Tanpa langkah ini, fitur lain tetap berjalan normal — push notif hanya di-skip diam-diam (dicatat di log server).

## Uji Coba Lokal (opsional, sebelum deploy)

```bash
cd backend
npm install
npm start
```
Server jalan di `http://localhost:3000`. Coba login:
```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
```

## Folder `uploads/`

Foto yang diupload (bukti pengaduan, gambar berita) disimpan di folder `backend/uploads/`. 

⚠️ Catatan penting untuk Railway: filesystem Railway **tidak permanen** — setiap kali redeploy, isi folder `uploads/` bisa hilang. Untuk produksi jangka panjang, sebaiknya pindahkan penyimpanan foto ke layanan cloud storage (misal Cloudinary, AWS S3, atau Supabase Storage). Untuk sekarang (skala kecil/uji coba), penyimpanan lokal ini sudah cukup jalan.
