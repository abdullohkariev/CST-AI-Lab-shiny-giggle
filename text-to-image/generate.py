"""Text-to-image generator using the Pollinations API.

Usage:
    python generate.py "a cozy cabin in a snowy forest at dusk"
    python generate.py "a red fox" --model turbo --width 768 --height 512 --seed 42
    python generate.py            # prompts you interactively
"""
import argparse
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests

BASE_URL = "https://gen.pollinations.ai/image/"
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


def generate(prompt: str, key: str, model: str, width: int, height: int, seed: int | None) -> bytes:
    params = {"model": model, "width": width, "height": height, "nologo": "true"}
    if seed is not None:
        params["seed"] = seed
    resp = requests.get(
        BASE_URL + quote(prompt, safe=""),
        params=params,
        headers={"Authorization": f"Bearer {key}"},
        timeout=180,
    )
    if not resp.ok:
        sys.exit(f"API error {resp.status_code}: {resp.text[:300]}")
    return resp.content


def main() -> None:
    ap = argparse.ArgumentParser(description="Pollinations text-to-image")
    ap.add_argument("prompt", nargs="?", help="image description")
    ap.add_argument("--model", default="flux", help="flux, turbo, gptimage... (default: flux)")
    ap.add_argument("--width", type=int, default=1024)
    ap.add_argument("--height", type=int, default=1024)
    ap.add_argument("--seed", type=int, default=None)
    ap.add_argument("--out", default=str(HERE / "output"), help="output folder")
    args = ap.parse_args()

    prompt = args.prompt or input("Prompt: ").strip()
    if not prompt:
        sys.exit("Empty prompt.")

    print("Generating...")
    data = generate(prompt, load_key(), args.model, args.width, args.height, args.seed)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    slug = re.sub(r"[^a-z0-9]+", "-", prompt.lower()).strip("-")[:40] or "image"
    path = out_dir / f"{int(time.time())}-{slug}.png"
    path.write_bytes(data)
    print(f"Saved {path}")


if __name__ == "__main__":
    main()
