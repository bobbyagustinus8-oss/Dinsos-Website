/**
 * DINAS SOSIAL — FRONTEND APP
 * Seluruh konten dinamis diambil dari REST API backend (tanpa login).
 * Ganti API_BASE di bawah ini jika backend dideploy ke alamat lain.
 */
// Otomatis menyesuaikan: kalau frontend & backend digabung jadi satu layanan
// (mis. saat di-deploy ke Railway), API_BASE cukup pakai alamat yang sama
// dengan alamat website ini sendiri (window.location.origin).
// Saat dites lokal dengan frontend & backend terpisah (2 terminal berbeda),
// otomatis tetap mengarah ke http://localhost:3000.
const API_BASE = window.location.port === "3000" || window.location.hostname !== "localhost"
  ? `${window.location.origin}/api`
  : "http://localhost:3000/api";

// ---------------------------------------------------------
// Util
// ---------------------------------------------------------
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $all(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function formatTanggal(iso) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) throw new Error(json?.message || `Gagal memuat ${path}`);
  return json;
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json) throw new Error(json?.message || "Permintaan gagal.");
  return json;
}

let toastTimer;
function showToast(msg, isError = false) {
  const toast = $("#toast");
  toast.textContent = msg;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3500);
}

// ---------------------------------------------------------
// Cek status API (indikator kecil di header)
// ---------------------------------------------------------
async function checkApiStatus() {
  const wrap = $("#apiStatus");
  const text = $("#apiStatusText");
  try {
    await apiGet("/statistik");
    wrap.classList.add("is-online");
    wrap.classList.remove("is-offline");
    text.textContent = "API Terhubung";
    $("#footerApiBase").textContent = `API: ${API_BASE}`;
  } catch {
    wrap.classList.add("is-offline");
    wrap.classList.remove("is-online");
    text.textContent = "API tidak terjangkau — jalankan backend di " + API_BASE;
    $("#footerApiBase").textContent = `API: ${API_BASE} (offline)`;
  }
}

// ---------------------------------------------------------
// REVEAL-ON-SCROLL (halus) + BACK TO TOP
// ---------------------------------------------------------
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function observeReveals(root = document) {
  $all(".reveal, .reveal-stagger", root).forEach((el) => {
    if (!el.classList.contains("is-visible")) revealObserver.observe(el);
  });
}

const backToTop = $("#backToTop");
window.addEventListener("scroll", debounceRaf(() => {
  backToTop.classList.toggle("is-visible", window.scrollY > 480);
}));
backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

function debounceRaf(fn) {
  let ticking = false;
  return (...args) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { fn(...args); ticking = false; });
  };
}

// ---------------------------------------------------------
// HERO — jaring sosial hidup (canvas, seperti motion graphic/video)
// ---------------------------------------------------------
function initHeroNetwork() {
  const canvas = $("#heroNetwork");
  if (!canvas) return;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const ctx = canvas.getContext("2d");
  let width, height, nodes, raf;
  const LINK_DIST = 150;
  const NODE_COUNT_BASE = 42;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = canvas.width = rect.width * devicePixelRatio;
    height = canvas.height = rect.height * devicePixelRatio;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    const count = Math.max(18, Math.round((rect.width * rect.height) / 22000));
    nodes = Array.from({ length: Math.min(count, NODE_COUNT_BASE) }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.5 * devicePixelRatio,
      r: (1.8 + Math.random() * 1.8) * devicePixelRatio,
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
    }
    const linkDist = LINK_DIST * devicePixelRatio;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < linkDist) {
          ctx.strokeStyle = `rgba(255, 226, 160, ${0.55 * (1 - dist / linkDist)})`;
          ctx.lineWidth = 1.4 * devicePixelRatio;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      ctx.beginPath();
      ctx.fillStyle = "rgba(255, 238, 200, 0.5)";
      ctx.arc(n.x, n.y, n.r * 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "#FFE7A8";
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(step);
  }

  resize();
  step();
  window.addEventListener("resize", debounceRaf(() => {
    cancelAnimationFrame(raf);
    resize();
    step();
  }));
}

// ---------------------------------------------------------
// COUNT-UP untuk angka statistik beranda
// ---------------------------------------------------------
function animateCountUp(el, target, duration = 1100) {
  const num = Number(target);
  if (!Number.isFinite(num)) { el.textContent = target ?? "—"; return; }
  const start = performance.now();
  function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(num * eased).toLocaleString("id-ID");
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = num.toLocaleString("id-ID");
  }
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------
// ROUTER
// ---------------------------------------------------------
const routes = ["beranda", "profil", "berita", "program", "penerima", "layanan", "pengaduan", "kontak"];
const loadedOnce = new Set();

function navigate() {
  const hash = (location.hash || "#beranda").replace("#", "");
  const route = routes.includes(hash) ? hash : "beranda";

  $all(".route").forEach((el) => el.classList.remove("is-active"));
  $(`#route-${route}`)?.classList.add("is-active");

  $all(".primary-nav a").forEach((a) => a.classList.toggle("is-active", a.dataset.route === route));

  document.title = `${$(`#route-${route}`)?.dataset.title || "Beranda"} — Dinas Sosial Kota Harapan`;

  $("#primaryNav").classList.remove("is-open");
  $("#navToggle").setAttribute("aria-expanded", "false");

  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  if (!loadedOnce.has(route)) {
    loadedOnce.add(route);
    loaders[route]?.();
  }

  observeReveals();
}

window.addEventListener("hashchange", navigate);

// Mobile nav toggle
$("#navToggle").addEventListener("click", () => {
  const nav = $("#primaryNav");
  const open = nav.classList.toggle("is-open");
  $("#navToggle").setAttribute("aria-expanded", String(open));
});

// ---------------------------------------------------------
// BERANDA
// ---------------------------------------------------------
async function loadBeranda() {
  // Statistik
  try {
    const { data } = await apiGet("/statistik");
    $all("[data-stat]").forEach((card) => {
      const key = card.dataset.stat;
      card.classList.remove("skeleton");
      animateCountUp($(".stat-card__value", card), data[key]);
    });
  } catch {
    $all("[data-stat]").forEach((card) => {
      card.classList.remove("skeleton");
      $(".stat-card__value", card).textContent = "N/A";
    });
  }

  // Berita terbaru (3)
  try {
    const { data } = await apiGet("/berita");
    const list = data.slice(0, 3);
    $("#berandaBeritaList").innerHTML = list.map(renderBeritaCard).join("");
  } catch {
    $("#berandaBeritaList").innerHTML = errorBlock("Gagal memuat berita terbaru.");
  }
}

function renderBeritaCard(b) {
  return `
    <article class="news-card">
      <div class="news-card__media">${escapeHtml(b.gambar || "Dinas Sosial")}</div>
      <div class="news-card__body">
        <span class="news-card__tag">${escapeHtml(b.kategori)}</span>
        <span class="news-card__date">${formatTanggal(b.tanggal)}</span>
        <h3>${escapeHtml(b.judul)}</h3>
        <p>${escapeHtml(b.ringkasan)}</p>
        <a href="#berita" class="news-card__more" data-open-berita="${b.id}">Baca selengkapnya →</a>
      </div>
    </article>`;
}

function errorBlock(msg) {
  return `<div class="form-result is-error" style="grid-column:1/-1">${escapeHtml(msg)} Pastikan server backend API sedang berjalan.</div>`;
}

// ---------------------------------------------------------
// PROFIL
// ---------------------------------------------------------
async function loadProfil() {
  const el = $("#profilContent");
  try {
    const { data: p } = await apiGet("/profil");
    el.innerHTML = `
      <div class="profile-grid reveal-stagger">
        <div>
          <div class="profile-block">
            <h2>Visi</h2>
            <p>${escapeHtml(p.visi)}</p>
          </div>
          <div class="profile-block">
            <h2>Misi</h2>
            <ul class="mission-list">
              ${p.misi.map((m, i) => `<li><span class="mission-list__num">${i + 1}</span><span>${escapeHtml(m)}</span></li>`).join("")}
            </ul>
          </div>
          <div class="profile-block">
            <h2>Tugas Pokok</h2>
            <p>${escapeHtml(p.tugasPokok)}</p>
          </div>
          <div class="profile-block">
            <h2>Sejarah Singkat</h2>
            <p>${escapeHtml(p.sejarah)}</p>
          </div>
        </div>
        <div>
          <div class="profile-block">
            <h2>Struktur Organisasi</h2>
            <ul class="org-list">
              ${p.strukturOrganisasi.map((o) => `<li><span>${escapeHtml(o.jabatan)}</span><strong>${escapeHtml(o.nama)}</strong></li>`).join("")}
            </ul>
          </div>
          <div class="profile-block">
            <h2>Dasar Hukum</h2>
            <ul class="legal-list">
              ${p.dasarHukum.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>`;
    observeReveals(el);
  } catch {
    el.innerHTML = errorBlock("Gagal memuat profil Dinas Sosial.");
  }
}

// ---------------------------------------------------------
// BERITA
// ---------------------------------------------------------
let beritaState = { kategori: "", search: "" };

async function loadBerita() {
  $("#beritaSearch").addEventListener("input", debounce((e) => {
    beritaState.search = e.target.value.trim();
    renderBerita();
  }, 300));

  $("#beritaKategoriChips").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    $all(".chip", e.currentTarget).forEach((c) => c.classList.remove("is-active"));
    btn.classList.add("is-active");
    beritaState.kategori = btn.dataset.kategori;
    renderBerita();
  });

  await renderBerita();
}

async function renderBerita() {
  const list = $("#beritaList");
  list.innerHTML = `<div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div>`;
  try {
    const params = new URLSearchParams();
    if (beritaState.kategori) params.set("kategori", beritaState.kategori);
    if (beritaState.search) params.set("search", beritaState.search);
    const { data } = await apiGet(`/berita?${params.toString()}`);
    list.innerHTML = data.length
      ? data.map(renderBeritaCard).join("")
      : `<p class="loading-text">Tidak ada berita yang cocok dengan pencarian Anda.</p>`;
  } catch {
    list.innerHTML = errorBlock("Gagal memuat daftar berita.");
  }
}

// Delegasi klik "baca selengkapnya" (berlaku di beranda & berita)
document.addEventListener("click", async (e) => {
  const trigger = e.target.closest("[data-open-berita]");
  if (!trigger) return;
  e.preventDefault();
  const id = trigger.dataset.openBerita;
  location.hash = "#berita";
  try {
    const { data } = await apiGet(`/berita/${id}`);
    alert(`${data.judul}\n\n${formatTanggal(data.tanggal)} · ${data.kategori}\n\n${data.isi}`);
  } catch {
    showToast("Gagal memuat detail berita.", true);
  }
});

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ---------------------------------------------------------
// PROGRAM BANTUAN SOSIAL
// ---------------------------------------------------------
let programKategori = "";

async function loadProgram() {
  $("#programKategoriChips").addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    $all(".chip", e.currentTarget).forEach((c) => c.classList.remove("is-active"));
    btn.classList.add("is-active");
    programKategori = btn.dataset.kategori;
    renderProgram();
  });
  await renderProgram();
}

async function renderProgram() {
  const list = $("#programList");
  list.innerHTML = `<div class="skeleton-card skeleton-card--wide"></div><div class="skeleton-card skeleton-card--wide"></div>`;
  try {
    const params = programKategori ? `?kategori=${encodeURIComponent(programKategori)}` : "";
    const { data } = await apiGet(`/program${params}`);
    list.innerHTML = data.length ? data.map(renderProgramCard).join("") : `<p class="loading-text">Tidak ada program pada kategori ini.</p>`;

    $all(".program-card__head", list).forEach((head) => {
      head.addEventListener("click", () => head.closest(".program-card").classList.toggle("is-open"));
    });
  } catch {
    list.innerHTML = errorBlock("Gagal memuat program bantuan sosial.");
  }
}

function renderProgramCard(p) {
  return `
    <article class="program-card">
      <div class="program-card__head" role="button" tabindex="0" aria-expanded="false">
        <div class="program-card__title">
          <span class="program-card__badge">${escapeHtml(p.singkatan)}</span>
          <h3>${escapeHtml(p.nama)}</h3>
        </div>
        <div style="display:flex; align-items:center; gap:14px;">
          <span class="program-card__kategori">${escapeHtml(p.kategori)}</span>
          <span class="program-card__chevron">▾</span>
        </div>
      </div>
      <div class="program-card__body">
        <p><strong>Sasaran:</strong> ${escapeHtml(p.sasaran)}</p>
        <p><strong>Manfaat:</strong> ${escapeHtml(p.manfaat)}</p>
        <div class="program-card__grid">
          <div>
            <h4>Syarat</h4>
            <ul>${p.syarat.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>
          </div>
          <div>
            <h4>Cara Mendaftar</h4>
            <p style="font-size:0.9rem;">${escapeHtml(p.caraDaftar)}</p>
          </div>
        </div>
      </div>
    </article>`;
}

// ---------------------------------------------------------
// DATA PENERIMA BANTUAN
// ---------------------------------------------------------
let penerimaState = { search: "", kecamatan: "", program: "", page: 1, limit: 8 };

async function loadPenerima() {
  $("#penerimaSearch").addEventListener("input", debounce((e) => {
    penerimaState.search = e.target.value.trim();
    penerimaState.page = 1;
    renderPenerima();
  }, 300));
  $("#penerimaKecamatan").addEventListener("change", (e) => {
    penerimaState.kecamatan = e.target.value;
    penerimaState.page = 1;
    renderPenerima();
  });
  $("#penerimaProgram").addEventListener("change", (e) => {
    penerimaState.program = e.target.value;
    penerimaState.page = 1;
    renderPenerima();
  });

  await populatePenerimaFilters();
  await renderPenerima();
}

async function populatePenerimaFilters() {
  try {
    const { data } = await apiGet(`/penerima?limit=1000`);
    const kecamatanSet = [...new Set(data.map((d) => d.kecamatan))].sort();
    const programSet = [...new Set(data.map((d) => d.program))].sort();
    $("#penerimaKecamatan").innerHTML = `<option value="">Semua Kecamatan</option>` +
      kecamatanSet.map((k) => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join("");
    $("#penerimaProgram").innerHTML = `<option value="">Semua Program</option>` +
      programSet.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
  } catch { /* biarkan default jika gagal */ }
}

async function renderPenerima() {
  const body = $("#penerimaTableBody");
  body.innerHTML = `<tr><td colspan="6" class="loading-text">Memuat data…</td></tr>`;
  try {
    const params = new URLSearchParams({
      page: penerimaState.page, limit: penerimaState.limit,
    });
    if (penerimaState.search) params.set("search", penerimaState.search);
    if (penerimaState.kecamatan) params.set("kecamatan", penerimaState.kecamatan);
    if (penerimaState.program) params.set("program", penerimaState.program);

    const { data, total, halaman, totalHalaman } = await apiGet(`/penerima?${params.toString()}`);

    body.innerHTML = data.length ? data.map((d) => `
      <tr>
        <td>${escapeHtml(d.nama)}</td>
        <td class="nik">${escapeHtml(d.nik)}</td>
        <td>${escapeHtml(d.kecamatan)}</td>
        <td>${escapeHtml(d.program)}</td>
        <td>${escapeHtml(d.tahun)}</td>
        <td><span class="status-pill status-pill--${d.status.toLowerCase()}">${escapeHtml(d.status)}</span></td>
      </tr>`).join("") : `<tr><td colspan="6" class="loading-text">Tidak ditemukan data yang sesuai.</td></tr>`;

    renderPagination(halaman, totalHalaman, total);
  } catch {
    body.innerHTML = `<tr><td colspan="6">${errorBlock("Gagal memuat data penerima bantuan.")}</td></tr>`;
    $("#penerimaPagination").innerHTML = "";
  }
}

function renderPagination(halaman, totalHalaman, total) {
  const wrap = $("#penerimaPagination");
  if (totalHalaman <= 1) { wrap.innerHTML = `<span class="loading-text">Total ${total} data.</span>`; return; }
  let html = `<button ${halaman === 1 ? "disabled" : ""} data-page="${halaman - 1}">‹ Sebelumnya</button>`;
  for (let i = 1; i <= totalHalaman; i++) {
    html += `<button class="${i === halaman ? "is-active" : ""}" data-page="${i}">${i}</button>`;
  }
  html += `<button ${halaman === totalHalaman ? "disabled" : ""} data-page="${halaman + 1}">Berikutnya ›</button>`;
  wrap.innerHTML = html;
  $all("button[data-page]", wrap).forEach((btn) => {
    btn.addEventListener("click", () => {
      penerimaState.page = Number(btn.dataset.page);
      renderPenerima();
      $("#route-penerima").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

// ---------------------------------------------------------
// INFORMASI LAYANAN
// ---------------------------------------------------------
async function loadLayanan() {
  const el = $("#layananList");
  try {
    const { data } = await apiGet("/layanan");
    el.innerHTML = data.map((l) => `
      <article class="service-card">
        <h3>${escapeHtml(l.nama)}</h3>
        <p>${escapeHtml(l.deskripsi)}</p>
        <div class="service-card__req">
          <strong>Persyaratan</strong>
          ${l.persyaratan.map((p) => `<span>${escapeHtml(p)}</span>`).join("")}
        </div>
        <div class="service-card__meta">
          <div><strong>${escapeHtml(l.waktu)}</strong>Estimasi Waktu</div>
          <div><strong>${escapeHtml(l.biaya)}</strong>Biaya</div>
        </div>
      </article>`).join("");
  } catch {
    el.innerHTML = errorBlock("Gagal memuat informasi layanan.");
  }
}

// ---------------------------------------------------------
// PENGADUAN MASYARAKAT
// ---------------------------------------------------------
function loadPengaduan() {
  $("#pengaduanForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const resultBox = $("#pengaduanResult");
    const submitBtn = $("button[type=submit]", form);

    const payload = {
      nama: form.nama.value.trim(),
      kontak: form.kontak.value.trim(),
      kategori: form.kategori.value,
      kecamatan: form.kecamatan.value.trim(),
      isi: form.isi.value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim…";
    resultBox.innerHTML = "";

    try {
      const { data } = await apiPost("/pengaduan", payload);
      resultBox.innerHTML = `
        <div class="form-result is-success">
          Pengaduan berhasil dikirim. Simpan nomor tiket berikut untuk memantau status:
          <br /><span class="tiket-code">${escapeHtml(data.tiket)}</span>
        </div>`;
      form.reset();
      showToast("Pengaduan berhasil dikirim.");
    } catch (err) {
      resultBox.innerHTML = `<div class="form-result is-error">${escapeHtml(err.message)}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Kirim Pengaduan";
    }
  });

  $("#cekTiketForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const tiket = $("#tiketInput").value.trim();
    const box = $("#tiketResult");
    box.innerHTML = `<p class="loading-text">Memeriksa…</p>`;
    try {
      const { data } = await apiGet(`/pengaduan/${encodeURIComponent(tiket)}`);
      box.innerHTML = `
        <div class="tiket-box">
          <dl>
            <dt>Nomor Tiket</dt><dd>${escapeHtml(data.tiket)}</dd>
            <dt>Status</dt><dd>${escapeHtml(data.status)}</dd>
            <dt>Kategori</dt><dd>${escapeHtml(data.kategori)}</dd>
            <dt>Tanggal Lapor</dt><dd>${formatTanggal(data.tanggal)}</dd>
          </dl>
        </div>`;
    } catch (err) {
      box.innerHTML = `<div class="form-result is-error">${escapeHtml(err.message)}</div>`;
    }
  });
}

// ---------------------------------------------------------
// KONTAK
// ---------------------------------------------------------
async function loadKontak() {
  const el = $("#kontakContent");
  try {
    const { data: k } = await apiGet("/kontak");
    el.innerHTML = `
      <div class="kontak-grid reveal-stagger">
        <div class="kontak-card">
          <h2>Informasi Kontak</h2>
          <div class="kontak-row"><span class="kontak-row__icon">📍</span><div><strong>Alamat</strong>${escapeHtml(k.alamat)}</div></div>
          <div class="kontak-row"><span class="kontak-row__icon">☎️</span><div><strong>Telepon</strong>${escapeHtml(k.telepon)}</div></div>
          <div class="kontak-row"><span class="kontak-row__icon">🆓</span><div><strong>Hotline Bebas Pulsa</strong>${escapeHtml(k.hotline)}</div></div>
          <div class="kontak-row"><span class="kontak-row__icon">💬</span><div><strong>WhatsApp</strong>${escapeHtml(k.whatsapp)}</div></div>
          <div class="kontak-row"><span class="kontak-row__icon">✉️</span><div><strong>Email</strong>${escapeHtml(k.email)}</div></div>
          <div class="kontak-row"><span class="kontak-row__icon">🕘</span><div><strong>Jam Layanan</strong>${escapeHtml(k.jamLayanan)}</div></div>
          <div class="kontak-row"><span class="kontak-row__icon">📱</span><div><strong>Media Sosial</strong>Instagram ${escapeHtml(k.mediaSosial.instagram)} · Facebook ${escapeHtml(k.mediaSosial.facebook)}</div></div>
        </div>
        <div class="map-box">
          <iframe
            class="map-box__frame"
            title="Peta lokasi kantor Dinas Sosial Kota Harapan"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            src="https://www.openstreetmap.org/export/embed.html?bbox=${k.koordinat.lng - 0.01}%2C${k.koordinat.lat - 0.008}%2C${k.koordinat.lng + 0.01}%2C${k.koordinat.lat + 0.008}&amp;layer=mapnik&amp;marker=${k.koordinat.lat}%2C${k.koordinat.lng}">
          </iframe>
          <a
            class="map-box__link"
            href="https://www.openstreetmap.org/?mlat=${k.koordinat.lat}&amp;mlon=${k.koordinat.lng}#map=17/${k.koordinat.lat}/${k.koordinat.lng}"
            target="_blank" rel="noopener noreferrer">
            Buka peta lebih besar ↗
          </a>
        </div>
      </div>`;
    observeReveals(el);
  } catch {
    el.innerHTML = errorBlock("Gagal memuat data kontak.");
  }
}

// ---------------------------------------------------------
// INIT
// ---------------------------------------------------------
const loaders = {
  beranda: loadBeranda,
  profil: loadProfil,
  berita: loadBerita,
  program: loadProgram,
  penerima: loadPenerima,
  layanan: loadLayanan,
  pengaduan: loadPengaduan,
  kontak: loadKontak,
};

$("#year").textContent = new Date().getFullYear();
checkApiStatus();
setInterval(checkApiStatus, 20000);
initHeroNetwork();
navigate();
