"""Text-to-audio (speech) generator using the Pollinations API.

Usage:
    python text_to_audio.py "Hello, this is a test"
    python text_to_audio.py "Salom dunyo" --voice nova --out speech
    python text_to_audio.py            # prompts you interactively
"""
import argparse
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests

BASE_URL = "https://gen.pollinations.ai/audio/"
HERE = Path(__file__).parent


def load_key() -> str:
    key = os.environ.get("POLLINATIONS_API_KEY", "").strip()
    for env_file in (HERE / ".env", HERE.parent / ".env"):
        if not key and env_file.exists():
            for line in env_file.read_text(encoding="utf-8").splitlines():
                name, _, value = line.partition("=")
                if name.strip() == "POLLINATIONS_API_KEY":
                    key = value.strip().strip("'\"")
    if not key:
        sys.exit("No API key found. Put POLLINATIONS_API_KEY=... in a .env file.")
    return key


def speak(text: str, key: str, voice: str) -> bytes:
    resp = requests.get(
        BASE_URL + quote(text, safe=""),
        params={"voice": voice},
        headers={"Authorization": f"Bearer {key}"},
        timeout=180,
    )
    if not resp.ok:
        sys.exit(f"API error {resp.status_code}: {resp.text[:300]}")
    return resp.content


def main() -> None:
    ap = argparse.ArgumentParser(description="Pollinations text-to-audio")
    ap.add_argument("text", nargs="?", help="text to speak")
    ap.add_argument("--voice", default="alloy", help="alloy, nova, echo, fable, onyx, shimmer... (default: alloy)")
    ap.add_argument("--out", default=str(HERE / "output"), help="output folder")
    args = ap.parse_args()

    text = args.text or input("Text: ").strip()
    if not text:
        sys.exit("Empty text.")

    print("Generating...")
    data = speak(text, load_key(), args.voice)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:40] or "audio"
    path = out_dir / f"{int(time.time())}-{slug}.mp3"
    path.write_bytes(data)
    print(f"Saved {path}")


if __name__ == "__main__":
    main()
