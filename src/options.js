let cities = [];

function setStatus(id, text, isError) {
  const n = document.getElementById(id);
  n.textContent = text;
  n.className = "small " + (isError ? "error" : "ok");
}

function renderCities(filter) {
  const sel = document.getElementById("citySelect");
  const q = (filter || "").trim().toLowerCase();
  sel.replaceChildren();
  const list = q
    ? cities.filter((c) => c.regency_name.toLowerCase().includes(q) || c.province_name.toLowerCase().includes(q))
    : cities;
  for (const c of list.slice(0, 200)) {
    const o = document.createElement("option");
    o.value = c.regency_id;
    o.textContent = `${c.regency_name}, ${c.province_name}`;
    sel.append(o);
  }
}

async function loadCities(apiKey) {
  const store = await storageGet(["cityList"]);
  if (store.cityList && store.cityList.length) {
    cities = store.cityList;
  } else {
    cities = await apiGet("/api/v1/sholat/list-kota", apiKey);
    await storageSet({ cityList: cities });
  }
  document.getElementById("citySection").hidden = false;
  renderCities(document.getElementById("citySearch").value);
  const { kota } = await storageGet(["kota"]);
  if (kota) {
    setStatus("cityStatus", `Terpilih: ${kota.name}`);
    document.getElementById("citySelect").value = kota.id;
  }
}

async function saveKey() {
  const apiKey = document.getElementById("apiKey").value.trim();
  if (!apiKey) return setStatus("keyStatus", "Key masih kosong.", true);
  setStatus("keyStatus", "Mengecek key...");
  try {
    cities = await apiGet("/api/v1/sholat/list-kota", apiKey);
    await storageSet({ apiKey, cityList: cities, cacheHolidays: null, cachePrayer: null });
    setStatus("keyStatus", "Key tersimpan dan valid.");
    await loadCities(apiKey);
  } catch (e) {
    setStatus("keyStatus", e.status === 401 ? "Key tidak valid atau sudah dicabut." : `Gagal: ${e.message}`, true);
  }
}

async function pickCity() {
  const sel = document.getElementById("citySelect");
  const c = cities.find((x) => x.regency_id === sel.value);
  if (!c) return;
  await storageSet({ kota: { id: c.regency_id, name: c.regency_name }, cachePrayer: null });
  setStatus("cityStatus", `Terpilih: ${c.regency_name}`);
}

async function init() {
  document.getElementById("saveKey").addEventListener("click", saveKey);
  document.getElementById("apiKey").addEventListener("keydown", (e) => { if (e.key === "Enter") saveKey(); });
  document.getElementById("citySearch").addEventListener("input", (e) => renderCities(e.target.value));
  document.getElementById("citySelect").addEventListener("change", pickCity);
  const { apiKey } = await storageGet(["apiKey"]);
  if (apiKey) {
    document.getElementById("apiKey").value = apiKey;
    setStatus("keyStatus", "Key tersimpan.");
    loadCities(apiKey).catch((e) => setStatus("cityStatus", `Gagal memuat daftar kota: ${e.message}`, true));
  }
}

init();
