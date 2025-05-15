const BASE_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:8000"
  : "https://medilingo.onrender.com"; // Replace with your real backend URL

const recordBtn = document.getElementById("recordBtn");
const speakBtn = document.getElementById("speakBtn");
const originalTextEl = document.getElementById("originalText");
const translatedTextEl = document.getElementById("translatedText");
const inputLang = document.getElementById("inputLang");
const outputLang = document.getElementById("outputLang");

let mediaRecorder;
let audioChunks = [];

// Preload voices
speechSynthesis.onvoiceschanged = () => {
  speechSynthesis.getVoices();
};

// Start recording with countdown
recordBtn.addEventListener("click", async () => {
  recordBtn.disabled = true;
  originalTextEl.value = "";
  translatedTextEl.value = "";
  audioChunks = [];

  // console.log("🎤 Preparing mic access...");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    startCountdown(stream);
  } catch (err) {
    alert("Microphone access denied or not available.");
    console.error("🎙️ Microphone error:", err);
    recordBtn.disabled = false;
    recordBtn.innerText = "Start Recording 🎙️";
  }
});

function startCountdown(stream) {
  const countdownSteps = ["Get ready...", "Recording starts in 5...", "4...", "3...", "2...", "1..."];
  let i = 0;

  const showCountdown = () => {
    if (i < countdownSteps.length - 1) {
      recordBtn.innerText = countdownSteps[i];
      i++;
      setTimeout(showCountdown, 800);
    } else {
      recordBtn.innerText = countdownSteps[i];
      setTimeout(() => startRecording(stream), 600);
    }
  };

  showCountdown();
}

async function startRecording(stream) {
  // console.log("🟢 MediaRecorder started");

  mediaRecorder = new MediaRecorder(stream);
  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = async () => {
    // console.log("🛑 Recording stopped. Processing audio...");
    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    // console.log("📦 Blob size:", audioBlob.size, "bytes");

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.wav");

      // console.log("📤 Sending audio to backend...");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const res = await fetch(`${BASE_URL}/transcribe`, {
        method: "POST",
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error("Transcription server error");
      }

      const data = await res.json();
      // console.log("📥 Transcription response:", data);

      if (data.text) {
        originalTextEl.value = data.text;
        const translated = await translateText(data.text, inputLang.value, outputLang.value);
        translatedTextEl.value = translated;
      } else {
        originalTextEl.value = "❌ No transcript received.";
        alert("No transcript received. Please try again.");
      }

    } catch (error) {
      console.error("🔥 Transcription error:", error);
      alert("⚠️ Transcription failed or timed out.\nPlease refresh and try again.");
      location.reload();
    }

    recordBtn.disabled = false;
    recordBtn.innerText = "Start Recording 🎙️";
  };

  mediaRecorder.start();
  recordBtn.innerText = "Recording... 🎤";

  setTimeout(() => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  }, 7000);
}

async function translateText(text, fromLang, toLang) {
  try {
    const res = await fetch(`${BASE_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        from_lang: fromLang,
        to_lang: toLang
      })
    });

    const data = await res.json();
    // console.log("🌐 Translation response:", data);
    return data.translated || "[Translation failed]";
  } catch (err) {
    console.error("❌ Translation fetch failed:", err);
    return "[Translation failed]";
  }
}

speakBtn.addEventListener("click", async () => {
  const text = translatedTextEl.value.trim();
  const targetLang = outputLang.value;

  if (!text) {
    console.warn("⚠️ Nothing to speak.");
    return;
  }

  const elevenSupportedLangs = ["en", "es", "fr", "de", "zh"];
  const langCode = targetLang.slice(0, 2);

  if (elevenSupportedLangs.includes(langCode)) {
    try {
      const res = await fetch(`${BASE_URL}/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: targetLang }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.warn("⚠️ ElevenLabs fallback due to:", err);
        return fallbackToBrowserTTS(text, targetLang);
      }

      const blob = await res.blob();
      const audioURL = URL.createObjectURL(blob);
      const audio = new Audio(audioURL);
      audio.play();
      // console.log("🔊 Playing via ElevenLabs:", targetLang);

    } catch (err) {
      console.error("❌ ElevenLabs TTS error:", err);
      fallbackToBrowserTTS(text, targetLang);
    }
  } else {
    // console.log(`⚠️ '${langCode}' not supported by ElevenLabs. Using browser fallback.`);
    fallbackToBrowserTTS(text, targetLang);
  }
});

function fallbackToBrowserTTS(text, lang) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;

  const voices = speechSynthesis.getVoices();
  const matchingVoice = voices.find(v => v.lang.startsWith(lang));

  if (matchingVoice) {
    utterance.voice = matchingVoice;
    // console.log(`🔊 Browser TTS voice: ${matchingVoice.name} (${matchingVoice.lang})`);
  } else {
    console.warn("⚠️ No matching browser voice found. Using default.");
  }

  speechSynthesis.speak(utterance);
}
