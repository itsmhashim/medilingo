# MediLingo 🩺🌍

**Real-Time Healthcare Translation App using Generative AI**

MediLingo is a mobile-first web app that enables real-time, multilingual conversation between patients and healthcare providers. Built within 48 hours as part of a pre-interview assignment for Nao Medical.

---

## 🚀 Live Demo

🔗 **Vercel**: [https://medilingo-psi.vercel.app](https://medilingo-psi.vercel.app)

---

## 📌 Features

- 🎙️ `Voice-to-text` transcription powered by **Deepgram**
- 🌐 AI-powered translation using **OpenRouter** with`Gemma 3 27B` model
- 🔊 Natural-sounding speech playback with **ElevenLabs** (and browser fallback)
- 🧠 Medical-aware accuracy: filler word handling, punctuation, slow start tolerance
- 📱 Responsive mobile-first UI (`TailwindCSS`)
- 💬 Multi-language support: `English`, `Spanish`, `French`, `German`, `Chinese`

---

## 🧱 Tech Stack

| Layer          | Tech Used |
|----------------|-----------|
| Frontend       | HTML, Tailwind CSS, JavaScript |
| Backend        | FastAPI, Python, Uvicorn |
| AI APIs        | Deepgram (ASR), OpenRouter (LLM), ElevenLabs (TTS) |
| Deployment     | Vercel (frontend), Render (backend) |

---

## 📦 Folder Structure

```bash

medilingo/
├── backend/           # FastAPI backend
│   ├── app.py
│   ├── requirements.txt
│   └── ...
├── frontend/          # HTML/CSS/JS frontend
│   ├── index.html
│   ├── script.js
│   └── ...
├── .gitignore
└── README.md
```

---

## 🛠️ Environment Variables

Create a `.env` file in `backend/` with the following:

```env
DEEPGRAM_API_KEY=your_deepgram_key
OPENROUTER_API_KEY=your_openrouter_key
ELEVEN_API_KEY=your_elevenlabs_key
```

---

## 🧪 Local Development

### 🔹 1. Start the Backend (FastAPI)

```bash
  cd backend
pip install -r requirements.txt
uvicorn app:app --reload
```

### 🔹 2. Start the Frontend (Live Server or Python)

```bash
  cd frontend
  # Serve with Python
  python -m http.server 5500
  # OR use VSCode Live Server
```

Open browser to: `http://localhost:5500`

---

## 🧠 How Generative AI Was Used

| Task              | Tool Used                                 |
|-------------------|-------------------------------------------|
| Transcription     | `Deepgram` ASR (AI-powered)                 |
| Translation       | `Gemma 3 27B` via OpenRouter                |
| Text-to-Speech    | `ElevenLabs` (AI voice synthesis)           |
| Prompt Engineering | For context-aware translation             |
| Code Assistance   | `GitHub Copilot` + `ChatGPT` (documented use) |

---

## ✅ Submission Deliverables

- ✅ Functional real-time voice translation web app
- ✅ Clean mobile-first UI
- ✅ Generative AI integration for translation and transcription
- ✅ Error handling (timeouts, TTS fallback)
- ✅ Full code + documentation on GitHub


---

## 🧑‍💻 Developed by

Muhammad Hashim   
GitHub: [github.com/itsmhashim](https://github.com/yourusername)

---

## 📄 License

This project is licensed under the `MIT License`. See the [LICENSE](./LICENSE) file for details.

