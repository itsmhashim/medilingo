from fastapi import UploadFile, File, HTTPException, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import traceback
from dotenv import load_dotenv
import requests
from fastapi import Request
from fastapi.responses import FileResponse
from tempfile import NamedTemporaryFile


#  Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
ELEVEN_API_KEY = os.getenv("ELEVENLABS_API_KEY")

app = FastAPI()

#  Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  TRANSCRIBE ENDPOINT
@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    print("📥 Received file:", file.filename)
    res = None

    try:
        audio_data = await file.read()
        print(f"📦 Audio size: {len(audio_data)} bytes")

        headers = {
            "Authorization": f"Token {DEEPGRAM_API_KEY}",
            "Content-Type": file.content_type
        }

        print("📤 Sending to Deepgram...")
        res = requests.post(
            "https://api.deepgram.com/v1/listen?model=nova-3&language=multi&punctuate=true&filler_words=true",
            headers=headers,
            data=audio_data,
            timeout=30
        )
        res.raise_for_status()
        data = res.json()
        print("🧠 Deepgram response:", data)

        transcript = data["results"]["channels"][0]["alternatives"][0]["transcript"]
        print("✅ Transcription:", transcript)

        return {"text": transcript}

    except Exception as e:
        print("🔥 Deepgram error:", str(e))
        if res is not None:
            try:
                print("📥 Deepgram raw response:", res.text)
            except Exception as inner_err:
                print("⚠️ Failed to read res.text:", str(inner_err))
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

#  TRANSLATE ENDPOINT
class TranslationRequest(BaseModel):
    text: str
    from_lang: str
    to_lang: str

@app.post("/translate")
async def translate(req: TranslationRequest):
    print("📥 /translate endpoint hit")
    prompt = (
        f"You are a medical translator. Translate the following text from {req.from_lang} to {req.to_lang}. "
        f"Only return the translated sentence:\n\n\"{req.text}\""
    )

    res = None

    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "google/gemma-3-27b-it:free",
                "messages": [
                    {"role": "system", "content": "You are a professional medical translator."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3
            },
            timeout=30
        )
        res.raise_for_status()
        data = res.json()

        #  Check for error
        if "choices" not in data:
            print("❌ Translation failed, OpenRouter said:", data)
            return {"translated": "[Translation failed]",
                    "error": data.get("error", {}).get("message", "Unknown error")}

        translated = data["choices"][0]["message"]["content"].strip()
        print("🌍 Translated:", translated)
        return {"translated": translated}


    except Exception as e:
        print("🔥 Translation error:", str(e))
        traceback.print_exc()
        if res is not None:
            try:
                print("📥 OpenRouter raw response:", res.text)
            except Exception as inner_err:
                print("⚠️ Failed to read res.text:", str(inner_err))
        return {"translated": "[Translation failed]", "error": str(e)}




VOICE_IDS = {
    "en": "Rachel",
    "es": "Antoni",
    "ch": "Li",
    "fr": "Celine",
    "hi": "Prem",   # if available
    # "ur": None  # not available
}

@app.post("/speak")
async def speak(request: Request):
    data = await request.json()
    text = data.get("text")
    lang = data.get("lang", "en")

    # Just use default voice for now
    voices = {
        "en": "sXXU5CoXEMsIqocfPUh2",  # Mark
        "es": "UDJf7VRO3sTy4sABpNWO", #paco
        "ch": "bhJUNIXWQQ94l8eI2VUf", # Amy
        "fr": "xO2Q4ARMEd4BI2sGDH9c",
        "de": "kaGxVtjLwllv1bi2GFag"
        # add more as needed
    }

    voice_id = voices.get(lang[:2], "sXXU5CoXEMsIqocfPUh2")  # default to English if unsupported

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    headers = {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v1",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }

    res = requests.post(url, headers=headers, json=payload)

    if res.status_code != 200:
        print("❌ ElevenLabs error:", res.text)
        raise HTTPException(status_code=500, detail="TTS request failed")

    with NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
        temp_audio.write(res.content)
        temp_audio.flush()
        return FileResponse(temp_audio.name, media_type="audio/mpeg", filename="tts.mp3")