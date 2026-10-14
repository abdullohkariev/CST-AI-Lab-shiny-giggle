"""Speech-to-text transcription using the Pollinations API.

Usage:
    python audio_to_text.py recording.mp3
    python audio_to_text.py recording.mp3 --model openai/gpt-transcribe --language en
Models: openai/whisper-large-v3 (default), openai/gpt-transcribe, assemblyai/universal-3.5-pro
"""
import argparse
import sys
from pathlib import Path

import requests

sys.path.insert(0, str(Path(__file__).parent.parent / "text-to-audio"))
from text_to_audio import load_key  # noqa: E402

URL = "https://gen.pollinations.ai/v1/audio/transcriptions"


def main() -> None:
    ap = argparse.ArgumentParser(description="Pollinations speech-to-text")
    ap.add_argument("file", help="audio file (mp3, wav, m4a...)")
    ap.add_argument("--model", default="openai/whisper-large-v3")
    ap.add_argument("--language", default=None, help="optional language code, e.g. en")
    args = ap.parse_args()

    path = Path(args.file)
    if not path.exists():
        sys.exit(f"File not found: {path}")

    data = {"model": args.model}
    if args.language:
        data["language"] = args.language
    with path.open("rb") as f:
        resp = requests.post(
            URL,
            headers={"Authorization": f"Bearer {load_key()}"},
            files={"file": (path.name, f)},
            data=data,
            timeout=300,
        )
    if not resp.ok:
        sys.exit(f"API error {resp.status_code}: {resp.text[:300]}")
    text = resp.json()["text"]
    print(text)
    path.with_suffix(".txt").write_text(text, encoding="utf-8")


if __name__ == "__main__":
    main()
