/**
 * PUSH NOTIFICATION — pakai Firebase Cloud Messaging (FCM).
 *
 * Supaya fitur ini aktif, Anda perlu:
 * 1. Buat project di https://console.firebase.google.com (gratis)
 * 2. Project Settings -> Service Accounts -> Generate new private key (download JSON)
 * 3. Di Railway: buka tab Variables, tambahkan variable bernama
 *    FIREBASE_SERVICE_ACCOUNT, isinya = seluruh isi file JSON tadi (di-paste apa adanya)
 * 4. Redeploy. Kalau variable ini belum di-set, fitur push notif otomatis
 *    nonaktif (tidak error, cuma di-skip) supaya server tetap jalan normal.
 */

const fs = require("fs");
const path = require("path");

let firebaseApp = null;
let admin = null;

function initFirebase() {
  if (firebaseApp) return firebaseApp;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null; // belum dikonfigurasi, fitur push dilewati

  try {
    admin = require("firebase-admin");
    const serviceAccount = JSON.parse(raw);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    return firebaseApp;
  } catch (err) {
    console.warn("⚠️  Gagal inisialisasi Firebase push notif:", err.message);
    return null;
  }
}

const DEVICE_TOKENS_FILE = path.join(__dirname, "data", "device-tokens.json");

function bacaTokenDevice() {
  try {
    return JSON.parse(fs.readFileSync(DEVICE_TOKENS_FILE, "utf-8"));
  } catch {
    return [];
  }
}
function simpanTokenDevice(list) {
  fs.writeFileSync(DEVICE_TOKENS_FILE, JSON.stringify(list, null, 2), "utf-8");
}

// Daftarkan / update token FCM milik satu perangkat, dikaitkan dengan nomor tiket
// (tanpa perlu login — pelapor publik tetap bisa dapat notifikasi status).
function daftarkanToken(tiket, fcmToken) {
  const list = bacaTokenDevice();
  const existingIdx = list.findIndex((d) => d.tiket === tiket && d.fcmToken === fcmToken);
  if (existingIdx === -1) {
    list.push({ tiket, fcmToken, didaftarkanPada: new Date().toISOString() });
    simpanTokenDevice(list);
  }
}

// Kirim notifikasi ke semua device yang terdaftar untuk satu nomor tiket.
async function kirimNotifStatusPengaduan(tiket, statusBaru) {
  const app = initFirebase();
  if (!app || !admin) {
    console.log(`ℹ️  (Push notif dilewati - belum dikonfigurasi) Tiket ${tiket} -> ${statusBaru}`);
    return { terkirim: false, alasan: "Firebase belum dikonfigurasi" };
  }

  const list = bacaTokenDevice().filter((d) => d.tiket === tiket);
  if (list.length === 0) return { terkirim: false, alasan: "Tidak ada device terdaftar untuk tiket ini" };

  const tokens = list.map((d) => d.fcmToken);
  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "Update Status Pengaduan",
        body: `Tiket ${tiket} sekarang berstatus: ${statusBaru}`,
      },
      data: { tiket, status: statusBaru },
    });
    return { terkirim: true, sukses: response.successCount, gagal: response.failureCount };
  } catch (err) {
    console.warn("⚠️  Gagal mengirim push notif:", err.message);
    return { terkirim: false, alasan: err.message };
  }
}

module.exports = { daftarkanToken, kirimNotifStatusPengaduan };
