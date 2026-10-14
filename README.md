# Lumo

Small AI tools built on the [Pollinations](https://pollinations.ai) API, with a local website to try them.

| Tool | Folder | Script |
|---|---|---|
| Text to Image | `text-to-image/` | `generate.py` |
| Text to Audio | `text-to-audio/` | `text_to_audio.py` |
| Speech to Text | `speech-to-text/` | `audio_to_text.py` |

## Setup

```
pip install -r requirements.txt
cp .env.example .env     # then put your real POLLINATIONS_API_KEY in .env
```

## Run the website

```
python server.py
```

Then open http://localhost:8000 (or double-click `start-site.bat` on Windows).
The server keeps your API key on the backend, so it is never sent to the browser.

## Use the scripts

```
python text-to-image/generate.py "a cozy cabin in a snowy forest at dusk"
python text-to-audio/text_to_audio.py "Hello, this is a test" --voice nova
python speech-to-text/audio_to_text.py recording.mp3 --language en
```

Output goes to each tool's `output/` folder.
