const PRAYERS = [
  ["imsyak", "Imsak"], ["shubuh", "Subuh"], ["terbit", "Terbit"], ["dhuha", "Dhuha"],
  ["dzuhur", "Dzuhur"], ["ashr", "Ashar"], ["maghrib", "Maghrib"], ["isya", "Isya"]
];
const TYPE_LABEL = { nasional: "Nasional", keagamaan: "Keagamaan", cuti_bersama: "Cuti bersama" };

function el(tag, attrs = {}, text) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text !== undefined) n.textContent = text;
  return n;
}

function openOptions() {
  if (ext.runtime.openOptionsPage) ext.runtime.openOptionsPage();
  else window.open(ext.runtime.getURL("options.html"));
}

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const now = new Date();
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((new Date(y, m - 1, d) - a) / 86400000);
  if (diff === 0) return "hari ini";
  if (diff === 1) return "besok";
  return `${diff} hari lagi`;
}

function showError(target, err) {
  target.replaceChildren();
  target.classList.add("error");
  const msg = err.status === 401
    ? "API key tidak valid atau sudah dicabut. Periksa di pengaturan."
    : err.status === 402
      ? "Saldo kredit habis. Top up di dashboard.apiindonesia.id."
      : `Gagal memuat data (${err.message}).`;
  target.textContent = msg;
}

function renderPrayer(data) {
  const body = document.getElementById("prayerBody");
  body.replaceChildren();
  body.classList.remove("muted");
  const table = el("table", { class: "times" });
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  let nextMarked = false;
  for (const [key, label] of PRAYERS) {
    const t = data[key];
    if (!t) continue;
    const tr = el("tr");
    if (!nextMarked && t > hhmm && key !== "terbit" && key !== "dhuha" && key !== "imsyak") {
      tr.className = "next";
      nextMarked = true;
    }
    tr.append(el("td", {}, label), el("td", { class: "num" }, t));
    table.append(tr);
  }
  body.append(table);
  if (data.source) body.append(el("p", { class: "small muted" }, `Sumber: ${data.source}, ${data.date}`));
}

function renderHolidays(list) {
  const ul = document.getElementById("holidayList");
  ul.replaceChildren();
  ul.classList.remove("muted");
  if (!list || !list.length) {
    ul.append(el("li", { class: "muted" }, "Belum ada data libur berikutnya."));
    return;
  }
  for (const h of list.slice(0, 8)) {
    const li = el("li");
    const top = el("div", { class: "row" });
    top.append(el("span", { class: "date" }, formatDate(h.date)), el("span", { class: "muted small" }, daysUntil(h.date)));
    li.append(top, el("div", { class: "name" }, h.name));
    li.append(el("span", { class: `tag ${h.type}` }, TYPE_LABEL[h.type] || h.type));
    ul.append(li);
  }
}

async function main() {
  document.getElementById("settings").addEventListener("click", openOptions);
  document.getElementById("openOptions").addEventListener("click", openOptions);

  const { apiKey, kota } = await storageGet(["apiKey", "kota"]);
  if (!apiKey) {
    document.getElementById("setup").hidden = false;
    return;
  }

  const prayer = document.getElementById("prayer");
  const holidays = document.getElementById("holidays");
  holidays.hidden = false;

  if (kota && kota.id) {
    prayer.hidden = false;
    document.getElementById("city").textContent = `(${kota.name})`;
    const path = `/api/v1/sholat?kabupaten_id=${encodeURIComponent(kota.id)}&tanggal=${localDate()}`;
    cachedGet("cachePrayer", path, apiKey)
      .then(renderPrayer)
      .catch((e) => showError(document.getElementById("prayerBody"), e));
  } else {
    prayer.hidden = false;
    const body = document.getElementById("prayerBody");
    body.textContent = "Pilih kabupaten/kota di pengaturan untuk melihat jadwal sholat.";
  }

  cachedGet("cacheHolidays", "/api/v1/libur/upcoming", apiKey)
    .then(renderHolidays)
    .catch((e) => showError(document.getElementById("holidayList"), e));
}

main();
