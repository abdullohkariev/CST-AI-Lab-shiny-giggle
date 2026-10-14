const $ = (id) => document.getElementById(id);
const IMAGES = [
  ["1791345557-a-cozy-cabin-in-a-snowy-forest-at-dusk.png", "A cozy cabin in a snowy forest at dusk"],
  ["1791345655-a-dragon-flying-over-a-city-at-sunset.png", "A dragon flying over a city at sunset"],
  ["1791346236-a-dragon-flying-over-a-city-at-sunset.png", "A dragon flying over a city at sunset (another seed)"],
  ["1791345712-car-bmw-x7-in-green-color.png", "Car BMW X7 in green color"],
  ["1791453838-bmw-car.png", "BMW car"],
  ["1791346271-canadian-school-of-tashkent.png", "Canadian School of Tashkent"],
];
const AUDIO = [
  ["1791454915-canadian-school-of-tashkent-is-the-best-.mp3", "Canadian School of Tashkent is the best…"],
  ["1791454415-hello-how-are-you-today.mp3", "Hello, how are you today?"],
  ["1791454420-hello-there.mp3", "Hello there"],
  ["1791454223-testing-text-to-audio.mp3", "Testing text to audio"],
];

$("gal").innerHTML = IMAGES.map(([f, c]) =>
  `<figure><img src="assets/images/${f}" alt="${c}" loading="lazy"><figcaption>${c}</figcaption></figure>`).join("");
$("samples").innerHTML = AUDIO.map(([f, c]) =>
  `<div class="sample"><span>“${c}”</span><audio controls preload="none" src="assets/audio/${f}"></audio></div>`).join("");

const lb = $("lb");
$("gal").addEventListener("click", (e) => {
  const img = e.target.closest("figure img");
  if (img) { lb.querySelector("img").src = img.src; lb.classList.add("on"); }
});
lb.addEventListener("click", () => lb.classList.remove("on"));

document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
  document.querySelectorAll(".tab,.panel").forEach((x) => x.classList.remove("on"));
  t.classList.add("on");
  $("p-" + t.dataset.t).classList.add("on");
}));
document.querySelectorAll(".chips").forEach((c) => c.addEventListener("click", (e) => {
  if (e.target.classList.contains("chip")) $(c.dataset.for).value = e.target.textContent;
}));

let live = false;
fetch("/api/health").then((r) => (r.ok ? r.json() : null)).then((j) => { live = !!(j && j.ok); })
  .catch(() => {}).finally(() => { $("offline").hidden = live; });

async function run(btn, out, label, work) {
  if (!live) { $("offline").hidden = false; $("offline").scrollIntoView({ block: "center" }); return; }
  btn.disabled = true;
  out.innerHTML = `<div><div class="spin"></div>${label}</div>`;
  try { out.replaceChildren(await work()); }
  catch (e) { out.innerHTML = `<span class="err">${e.message}</span>`; }
  btn.disabled = false;
}
async function fetchBlob(url) {
  const r = await fetch(url);
  if (!r.ok) {
    let m = "Something went wrong.";
    try { m = (await r.json()).error || m; } catch (_) {}
    throw new Error(m);
  }
  return r.blob();
}

$("ib").onclick = () => run($("ib"), $("io"), "Painting… this can take 10–30 seconds", async () => {
  const q = new URLSearchParams({ prompt: $("ip").value });
  const img = new Image();
  img.alt = $("ip").value;
  img.src = URL.createObjectURL(await fetchBlob("/api/image?" + q));
  return img;
});
$("tb").onclick = () => run($("tb"), $("to"), "Generating voice…", async () => {
  const q = new URLSearchParams({ text: $("tp").value, voice: $("tv").value });
  const a = document.createElement("audio");
  a.controls = true;
  a.src = URL.createObjectURL(await fetchBlob("/api/speak?" + q));
  a.play().catch(() => {});
  return a;
});
$("sb").onclick = () => {
  const f = $("sf").files[0];
  if (!f) { $("so").textContent = "Choose an audio file first."; return; }
  run($("sb"), $("so"), "Listening…", async () => {
    const r = await fetch("/api/transcribe", { method: "POST", body: f });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Something went wrong.");
    const p = document.createElement("p");
    p.textContent = j.text || "(no speech found)";
    return p;
  });
};
