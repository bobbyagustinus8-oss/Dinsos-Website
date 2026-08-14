/**
 * DINAS SOSIAL - REST API
 * Website publik tanpa sistem login (login-less).
 * Semua data dibaca/ditulis dari file JSON di folder /data
 * sebagai penyimpanan sederhana (bisa diganti database sesungguhnya).
 */

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");

app.use(cors());
app.use(express.json());

// ---------- Sajikan file frontend (website) ----------
// Supaya backend & frontend bisa di-deploy jadi SATU layanan (mis. di Railway),
// tanpa perlu 2 alamat/domain berbeda.
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
app.use(express.static(FRONTEND_DIR));

// ---------- Helper baca/tulis file JSON ----------
function readData(file) {
  const filePath = path.join(DATA_DIR, file);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}
function writeData(file, data) {
  const filePath = path.join(DATA_DIR, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// Rate-limit sederhana untuk endpoint publik yang menulis data (POST pengaduan)
const submissionLog = new Map(); // ip -> timestamp terakhir
function simpleRateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
  const last = submissionLog.get(ip);
  if (last && now - last < 30 * 1000) {
    return res.status(429).json({
      success: false,
      message: "Terlalu banyak permintaan. Silakan coba lagi dalam beberapa saat.",
    });
  }
  submissionLog.set(ip, now);
  next();
}

// ---------- Info API ----------
// Catatan: "/" sekarang otomatis menyajikan index.html (website), bukan JSON ini.
// Info endpoint API tetap bisa dilihat di /api
app.get("/api", (req, res) => {
  res.json({
    nama: "Dinas Sosial API",
    versi: "1.0.0",
    keterangan: "API publik, tidak memerlukan autentikasi/login.",
    endpoints: [
      "GET  /api/profil",
      "GET  /api/berita",
      "GET  /api/berita/:id",
      "GET  /api/program",
      "GET  /api/program/:id",
      "GET  /api/penerima?kecamatan=&program=&search=",
      "GET  /api/layanan",
      "POST /api/pengaduan",
      "GET  /api/pengaduan/:tiket",
      "GET  /api/kontak",
      "GET  /api/statistik",
    ],
  });
});

// ---------- PROFIL DINAS SOSIAL ----------
app.get("/api/profil", (req, res) => {
  try {
    res.json({ success: true, data: readData("profil.json") });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal memuat data profil." });
  }
});

// ---------- BERITA / KEGIATAN ----------
app.get("/api/berita", (req, res) => {
  try {
    let berita = readData("berita.json");
    const { kategori, search } = req.query;

    if (kategori) {
      berita = berita.filter(
        (b) => b.kategori.toLowerCase() === String(kategori).toLowerCase()
      );
    }
    if (search) {
      const q = String(search).toLowerCase();
      berita = berita.filter(
        (b) =>
          b.judul.toLowerCase().includes(q) ||
          b.ringkasan.toLowerCase().includes(q)
      );
    }
    berita = berita.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    res.json({ success: true, total: berita.length, data: berita });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal memuat data berita." });
  }
});

app.get("/api/berita/:id", (req, res) => {
  try {
    const berita = readData("berita.json");
    const item = berita.find((b) => b.id === Number(req.params.id));
    if (!item) {
      return res.status(404).json({ success: false, message: "Berita tidak ditemukan." });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal memuat berita." });
  }
});

// ---------- PROGRAM BANTUAN SOSIAL ----------
app.get("/api/program", (req, res) => {
  try {
    let program = readData("program.json");
    const { kategori } = req.query;
    if (kategori) {
      program = program.filter(
        (p) => p.kategori.toLowerCase() === String(kategori).toLowerCase()
      );
    }
    res.json({ success: true, total: program.length, data: program });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal memuat data program." });
  }
});

app.get("/api/program/:id", (req, res) => {
  try {
    const program = readData("program.json");
    const item = program.find((p) => p.id === Number(req.params.id));
    if (!item) {
      return res.status(404).json({ success: false, message: "Program tidak ditemukan." });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal memuat program." });
  }
});

// ---------- DATA PENERIMA BANTUAN ----------
// Catatan: data yang ditampilkan publik sudah dianonimkan (NIK disamarkan)
// demi menjaga privasi warga sesuai prinsip perlindungan data pribadi.
app.get("/api/penerima", (req, res) => {
  try {
    let penerima = readData("penerima.json");
    const { kecamatan, program, status, search, page = 1, limit = 10 } = req.query;

    if (kecamatan) {
      penerima = penerima.filter(
        (p) => p.kecamatan.toLowerCase() === String(kecamatan).toLowerCase()
      );
    }
    if (program) {
      penerima = penerima.filter(
        (p) => p.program.toLowerCase() === String(program).toLowerCase()
      );
    }
    if (status) {
      penerima = penerima.filter(
        (p) => p.status.toLowerCase() === String(status).toLowerCase()
      );
    }
    if (search) {
      const q = String(search).toLowerCase();
      penerima = penerima.filter((p) => p.nama.toLowerCase().includes(q));
    }

    const totalData = penerima.length;
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const start = (pageNum - 1) * limitNum;
    const paged = penerima.slice(start, start + limitNum);

    res.json({
      success: true,
      total: totalData,
      halaman: pageNum,
      totalHalaman: Math.ceil(totalData / limitNum),
      data: paged,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal memuat data penerima bantuan." });
  }
});

// ---------- INFORMASI LAYANAN ----------
app.get("/api/layanan", (req, res) => {
  try {
    res.json({ success: true, data: readData("layanan.json") });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal memuat data layanan." });
  }
});

// ---------- PENGADUAN MASYARAKAT ----------
// Publik dapat mengirim pengaduan TANPA login. Nomor tiket dikembalikan
// agar pelapor dapat memantau status pengaduannya secara anonim.
function buatNomorTiket() {
  const tahun = new Date().getFullYear();
  const acak = Math.floor(100000 + Math.random() * 900000);
  return `DINSOS-${tahun}-${acak}`;
}

app.post("/api/pengaduan", simpleRateLimit, (req, res) => {
  try {
    const { nama, kontak, kategori, kecamatan, isi } = req.body;

    if (!nama || !kategori || !isi) {
      return res.status(400).json({
        success: false,
        message: "Nama, kategori, dan isi pengaduan wajib diisi.",
      });
    }
    if (String(isi).trim().length < 15) {
      return res.status(400).json({
        success: false,
        message: "Isi pengaduan terlalu singkat, mohon jelaskan lebih detail (minimal 15 karakter).",
      });
    }

    const pengaduan = readData("pengaduan.json");
    const tiket = buatNomorTiket();
    const baru = {
      tiket,
      nama: String(nama).trim(),
      kontak: kontak ? String(kontak).trim() : "-",
      kategori: String(kategori).trim(),
      kecamatan: kecamatan ? String(kecamatan).trim() : "-",
      isi: String(isi).trim(),
      status: "Diterima",
      tanggal: new Date().toISOString(),
    };
    pengaduan.push(baru);
    writeData("pengaduan.json", pengaduan);

    res.status(201).json({
      success: true,
      message: "Pengaduan berhasil dikirim. Simpan nomor tiket untuk memantau status.",
      data: { tiket, status: baru.status },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal mengirim pengaduan." });
  }
});

// Cek status pengaduan berdasarkan nomor tiket (tanpa login)
app.get("/api/pengaduan/:tiket", (req, res) => {
  try {
    const pengaduan = readData("pengaduan.json");
    const item = pengaduan.find(
      (p) => p.tiket.toLowerCase() === req.params.tiket.toLowerCase()
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Nomor tiket tidak ditemukan. Periksa kembali penulisannya.",
      });
    }
    // Sembunyikan data kontak pribadi saat ditampilkan balik ke publik
    const { kontak, ...publik } = item;
    res.json({ success: true, data: publik });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal memeriksa status pengaduan." });
  }
});

// ---------- KONTAK ----------
app.get("/api/kontak", (req, res) => {
  res.json({
    success: true,
    data: {
      alamat: "Jalan Mawar No. 18, Lubuk Pakam, Kabupaten Deli Serdang, Sumatera Utara 20514",
      telepon: "(022) 123-4567",
      hotline: "0800-1-778899 (bebas pulsa)",
      whatsapp: "0812-3456-7890",
      email: "@dinsos.deliserdang.go.id",
      jamLayanan: "Senin - Jumat, 08.00 - 16.00 WIB",
      mediaSosial: {
        instagram: "@dinassosial_deliserdang",
        facebook: "Dinas Sosial DeliSerdang",
        youtube: "Dinsos DeliSerdang TV"
      },
      koordinat: { lat: 3.56019, lng: 98.87622 }
    },
  });
});

// ---------- STATISTIK RINGKAS (untuk beranda) ----------
app.get("/api/statistik", (req, res) => {
  try {
    const penerima = readData("penerima.json");
    const program = readData("program.json");
    const aktif = penerima.filter((p) => p.status === "Aktif").length;
    res.json({
      success: true,
      data: {
        totalProgram: program.length,
        totalPenerimaAktif: aktif,
        totalKecamatanTerlayani: new Set(penerima.map((p) => p.kecamatan)).size,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Gagal memuat statistik." });
  }
});

// ---------- 404 handler untuk endpoint tak dikenal ----------
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint API tidak ditemukan." });
});

app.listen(PORT, () => {
  console.log(`✅ Dinas Sosial API berjalan di http://localhost:${PORT}`);
});
