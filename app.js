const $ = (id) => document.getElementById(id);

/* Everything here is free and needs no account or key:
   - images: AI Horde, a community network of volunteer computers (anonymous key)
   - speech: Kokoro text-to-speech model, runs inside the visitor's browser
   - transcription: Whisper model, runs inside the visitor's browser */
const HORDE = "https://aihorde.net/api/v2/generate/";
const HORDE_HEADERS = { "Content-Type": "application/json", apikey: "0000000000", "Client-Agent": "lumo-school-project:1.0:abdullohkariev" };
const KOKORO_LIB = "https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js";
const KOKORO_MODEL = "onnx-community/Kokoro-82M-v1.0-ONNX";
const WHISPER_LIB = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
const WHISPER_MODEL = "Xenova/whisper-tiny";

/* ---------- routing ---------- */
const VIEWS = ["home", "image", "speech", "transcribe"];
function route() {
  let v = location.hash.slice(1);
  if (!VIEWS.includes(v)) v = "home";
  VIEWS.forEach((n) => $("v-" + n).classList.toggle("on", n === v));
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("on", a.dataset.nav === v));
  window.scrollTo(0, 0);
}
addEventListener("hashchange", route);
route();

/* ---------- helpers ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const busy = (btn, on, label) => { btn.disabled = on; if (label) btn.textContent = label; };
const loading = (out, msg, bar) => {
  out.innerHTML = `<div><div class="spin"></div><p class="hint"></p>${bar ? '<div class="bar"><i></i></div>' : ""}</div>`;
  out.querySelector("p").textContent = msg;
};
const setMsg = (out, msg) => { const p = out.querySelector("p"); if (p) p.textContent = msg; };
const setBar = (out, pct) => { const i = out.querySelector(".bar i"); if (i) i.style.width = Math.round(pct) + "%"; };
const fail = (out, msg) => { out.innerHTML = `<p class="err"></p>`; out.firstChild.textContent = msg; };
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30).replace(/^-|-$/g, "") || "lumo";
document.querySelectorAll(".chips").forEach((c) => c.addEventListener("click", (e) => {
  if (e.target.classList.contains("chip")) { $(c.dataset.for).value = e.target.textContent; $(c.dataset.for).focus(); }
}));

/* ---------- text to image (AI Horde) ---------- */
let size = { w: 512, h: 512 };
$("isize").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  document.querySelectorAll("#isize button").forEach((x) => x.classList.toggle("on", x === b));
  size = { w: +b.dataset.w, h: +b.dataset.h };
});
const thumbs = [];
async function hordeJson(url, opts) {
  let r;
  try { r = await fetch(url, opts); } catch (_) { throw new Error("Network problem. Check your connection and try again."); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 429) throw new Error("Too many requests right now. Wait a minute and try again.");
    throw new Error(j.message && !/key|kudos/i.test(j.message) ? j.message : "The image service could not take this request. Try a different prompt.");
  }
  return j;
}
async function makeImage(prompt, out) {
  const job = await hordeJson(HORDE + "async", { method: "POST", headers: HORDE_HEADERS, body: JSON.stringify({
    prompt, nsfw: false, censor_nsfw: true, r2: true, shared: false,
    params: { width: size.w, height: size.h, steps: 25, n: 1 } }) });
  const started = Date.now();
  while (Date.now() - started < 5 * 60 * 1000) {
    await sleep(3000);
    const s = await hordeJson(HORDE + "check/" + job.id);
    if (s.faulted) throw new Error("The image service had a problem. Please try again.");
    if (s.done) {
      const res = await hordeJson(HORDE + "status/" + job.id);
      const g = res.generations && res.generations[0];
      if (!g || g.censored) throw new Error("That prompt could not be drawn. Try different words.");
      const r = await fetch(g.img);
      if (!r.ok) throw new Error("The image could not be downloaded. Please try again.");
      return r.blob();
    }
    setMsg(out, s.queue_position > 0 ? `In the queue, position ${s.queue_position}. Slow is normal here, please wait.` : "A volunteer computer is drawing your image…");
  }
  fetch(HORDE + "status/" + job.id, { method: "DELETE", headers: HORDE_HEADERS }).catch(() => {});
  throw new Error("The queue is very busy right now. Please try again in a few minutes.");
}
$("ib").onclick = async () => {
  const prompt = $("ip").value.trim();
  if (!prompt) { fail($("io"), "Type a prompt first."); return; }
  busy($("ib"), true, "Generating…"); $("ia").hidden = true;
  loading($("io"), "Sending your prompt…");
  try {
    const blob = await makeImage(prompt, $("io"));
    const url = URL.createObjectURL(blob);
    const show = (u, p) => { const img = new Image(); img.alt = p; img.src = u; $("io").replaceChildren(img); $("idl").href = u; $("idl").download = "lumo-" + slug(p) + ".webp"; $("ia").hidden = false; };
    show(url, prompt);
    thumbs.unshift({ url, prompt }); thumbs.length = Math.min(thumbs.length, 8);
    $("ithumbs").replaceChildren(...thumbs.map((t) => { const i = new Image(); i.src = t.url; i.alt = t.prompt; i.title = t.prompt; i.onclick = () => show(t.url, t.prompt); return i; }));
    $("irecent").hidden = false;
  } catch (e) { fail($("io"), e.message); }
  busy($("ib"), false, "Generate image");
};

/* ---------- text to speech (Kokoro, in the browser) ---------- */
let tts = null;
$("tp").addEventListener("input", () => { $("tcount").textContent = $("tp").value.length; });
$("tb").onclick = async () => {
  const text = $("tp").value.trim();
  if (!text) { fail($("to"), "Type some text first."); return; }
  busy($("tb"), true, "Working…"); $("ta").hidden = true;
  try {
    if (!tts) {
      loading($("to"), "Loading the voice model (about 90 MB, first time only)…", true);
      const { KokoroTTS } = await import(KOKORO_LIB);
      const files = {};
      tts = await KokoroTTS.from_pretrained(KOKORO_MODEL, { dtype: "q8", device: "wasm",
        progress_callback: (p) => { if (p.status === "progress" && p.file) { files[p.file] = p.progress; const v = Object.values(files); setBar($("to"), v.reduce((a, b) => a + b, 0) / v.length); } } });
    }
    loading($("to"), "Creating your audio…");
    const audio = await tts.generate(text, { voice: $("tv").value });
    const url = URL.createObjectURL(audio.toBlob());
    const a = document.createElement("audio"); a.controls = true; a.src = url;
    $("to").replaceChildren(a); a.play().catch(() => {});
    $("tdl").href = url; $("ta").hidden = false;
  } catch (e) {
    tts = null;
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(text));
      $("to").innerHTML = `<p class="hint">The AI voice could not load on this device, so your browser's built-in voice is reading it aloud. This version cannot be downloaded.</p>`;
    } else fail($("to"), "Something went wrong: " + e.message);
  }
  busy($("tb"), false, "Create audio");
};

/* ---------- speech to text (Whisper, in the browser) ---------- */
let recBlob = null, recorder = null, asr = null;
async function toMono16k(blob) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
  ctx.close();
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(buf.duration * 16000)), 16000);
  const src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start();
  return (await off.startRendering()).getChannelData(0);
}
$("sf").addEventListener("change", () => { recBlob = null; $("sp").hidden = true; });
$("rec").onclick = async () => {
  if (recorder) { recorder.stop(); return; }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = []; recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      recBlob = new Blob(chunks, { type: recorder.mimeType }); recorder = null;
      $("rec").textContent = "Record again"; $("rec").classList.remove("rec-on");
      $("sp").src = URL.createObjectURL(recBlob); $("sp").hidden = false; $("sf").value = "";
    };
    recorder.start(); $("rec").textContent = "Stop recording"; $("rec").classList.add("rec-on");
  } catch (_) { fail($("so"), "Microphone access was blocked. Allow it in your browser, or upload a file instead."); }
};
$("sb").onclick = async () => {
  const blob = recBlob || $("sf").files[0];
  if (!blob) { fail($("so"), "Choose an audio file or record your voice first."); return; }
  busy($("sb"), true, "Working…"); $("sa").hidden = true;
  try {
    if (!asr) {
      loading($("so"), "Loading the speech model…", true);
      const { pipeline, env } = await import(WHISPER_LIB);
      env.allowLocalModels = false;
      asr = await pipeline("automatic-speech-recognition", WHISPER_MODEL, {
        progress_callback: (p) => { if (p.status === "progress") setBar($("so"), p.progress); },
      });
    }
    loading($("so"), "Listening…");
    const audio = await toMono16k(blob);
    const lang = $("sl").value;
    const res = await asr(audio, { chunk_length_s: 30, stride_length_s: 5, ...(lang ? { language: lang, task: "transcribe" } : {}) });
    const text = (res.text || "").trim();
    const p = document.createElement("div"); p.className = "text"; p.textContent = text || "No speech was found in this audio.";
    $("so").replaceChildren(p);
    if (text) {
      $("sdl").href = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
      $("scopy").onclick = () => navigator.clipboard.writeText(text).then(() => { $("scopy").textContent = "Copied"; setTimeout(() => ($("scopy").textContent = "Copy text"), 1500); });
      $("sa").hidden = false;
    }
  } catch (e) {
    fail($("so"), /decode/i.test(e.message) ? "This file could not be read. Try an mp3, wav or m4a file." : "Something went wrong: " + e.message);
  }
  busy($("sb"), false, "Transcribe");
};
