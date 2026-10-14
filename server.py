"""Local server for the portfolio site.

Serves ./site and proxies the live demos to Pollinations, so the API key in
.env stays on the server and is never sent to the browser.

    python server.py            # then open http://localhost:8000
"""
import json
import sys
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import requests

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE / "text-to-image"))
from generate import generate, load_key  # noqa: E402

SITE = HERE / "site"
SPEECH_URL = "https://gen.pollinations.ai/audio/"
STT_URL = "https://gen.pollinations.ai/v1/audio/transcriptions"
MIN_GAP = 3.0  # seconds between demo requests per client
_last: dict[str, float] = {}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(SITE), **kw)

    def _send(self, code, body: bytes, ctype: str):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json(self, code, obj):
        self._send(code, json.dumps(obj).encode(), "application/json")

    def _throttled(self) -> bool:
        ip, now = self.client_address[0], time.time()
        if now - _last.get(ip, 0) < MIN_GAP:
            self._json(429, {"error": "Slow down a little and try again."})
            return True
        _last[ip] = now
        return False

    def do_GET(self):
        url = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(url.query).items()}
        if url.path == "/api/health":
            return self._json(200, {"ok": True})
        if url.path == "/api/image":
            prompt = q.get("prompt", "").strip()[:300]
            if not prompt:
                return self._json(400, {"error": "Empty prompt."})
            if self._throttled():
                return
            model = q.get("model", "flux")
            if model not in ("flux", "turbo"):
                model = "flux"
            try:
                data = generate(prompt, load_key(), model, 768, 768, None)
            except SystemExit as e:
                return self._json(502, {"error": str(e)})
            return self._send(200, data, "image/png")
        if url.path == "/api/speak":
            text = q.get("text", "").strip()[:300]
            if not text:
                return self._json(400, {"error": "Empty text."})
            if self._throttled():
                return
            r = requests.get(SPEECH_URL + requests.utils.quote(text, safe=""),
                             params={"voice": q.get("voice", "alloy")},
                             headers={"Authorization": f"Bearer {load_key()}"}, timeout=180)
            if not r.ok:
                return self._json(502, {"error": f"API error {r.status_code}"})
            return self._send(200, r.content, "audio/mpeg")
        super().do_GET()

    def do_POST(self):
        if urlparse(self.path).path != "/api/transcribe":
            return self._json(404, {"error": "Not found"})
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0 or length > 10 * 1024 * 1024:
            return self._json(400, {"error": "Audio must be under 10 MB."})
        if self._throttled():
            return
        body = self.rfile.read(length)
        r = requests.post(STT_URL, headers={"Authorization": f"Bearer {load_key()}"},
                          files={"file": ("audio.mp3", body)},
                          data={"model": "openai/whisper-large-v3"}, timeout=300)
        if not r.ok:
            return self._json(502, {"error": f"API error {r.status_code}"})
        self._json(200, {"text": r.json().get("text", "")})


if __name__ == "__main__":
    print("Open http://localhost:8000")
    ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
