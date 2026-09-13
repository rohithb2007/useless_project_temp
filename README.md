# KALLA CHIRI — Chiri Forensics Department 🎯

> **"Technically serious. Completely useless."**

![Kalla Chiri Banner](https://img.shields.io/badge/Chiri_Forensics-Online-10b981?style=for-the-badge&logo=target)
![Static Badge](https://img.shields.io/badge/TinkerHub-Useless_Projects_3.0-06b6d4?style=for-the-badge)

A mobile-first web app that humorously investigates whether a person's smile is a **"Kalla Chiri"** (a fake, forced corporate smile) or a **"Real Chiri"** (an authentic smile).

---

## 💡 Concept & Philosophy

In corporate meetings, family functions, and college photos, millions of fake smiles ("Kalla Chiri") are generated daily. The **Chiri Forensics Department** solves a completely nonexistent problem by deploying computer vision telemetry and generative AI to audit suspect smiles in real time.

**Key Rule**: This is an entertainment and experimental project. Facial landmark measurements quantify observable movement, but the system **does NOT claim to scientifically determine whether someone is genuinely happy, lying, or emotionally authentic.**

---

## 🏗️ Architecture & LLM Positioning

```
Phone Camera 
    ↓
HTML <video> Stream
    ↓
MediaPipe Face Landmarker (Client-side WASM)
    ↓
Euclidean Facial Landmark Measurements
    ↓
3-Second Temporal Scan Engine (Ref-buffered)
    ↓
Kalla Chiri Mathematical Heuristic Score (0-100)
    ↓
Structured Numerical JSON Payload
    ↓
Gemini AI (Chiri Forensics Reasoning Engine)
    ↓
Dramatic Malayalam / Manglish Forensic Report Card
```

### 🧠 Why This Architecture?
- **We DO NOT send camera frames or raw video to Gemini.** Computer vision does the measurable work locally.
- **MediaPipe** extracts 478 3D facial landmarks in the browser at ~60 FPS.
- **Our deterministic algorithm** converts facial deltas into structured numerical telemetry (mouth expansion %, eye squint aperture %, smile symmetry).
- **Gemini AI** receives *only* that structured numerical telemetry and acts purely as the dramatic forensic reasoning and report-generation layer.

---

## ⚡ Tech Stack

- **Framework**: React 19 + Vite 6 + TypeScript
- **Styling**: Tailwind CSS v4 + Custom Cyberpunk CSS
- **Vision Model**: `@mediapipe/tasks-vision` (Face Landmarker WASM)
- **AI Engine**: `@google/genai` (Google Gen AI SDK with Structured Output JSON Mode)
- **UI Components & Effects**: Lucide React + Canvas Confetti
- **Infrastructure**: Zero Backend, Zero Database, 100% Client-side Browser Execution

---

## 🔬 Mathematical Telemetry & Heuristic Scoring

### 1. Key Landmarks Extracted
- **Left Eye**: Upper (159) to Lower (145) aperture.
- **Right Eye**: Upper (386) to Lower (374) aperture.
- **Mouth Width**: Left Corner (61) to Right Corner (291).

### 2. Formulas
$$\text{Distance}(A, B) = \sqrt{(B.x - A.x)^2 + (B.y - A.y)^2}$$

$$\text{MouthExpansion}\% = \left( \frac{\text{PeakMouthWidth} - \text{BaselineMouthWidth}}{\text{BaselineMouthWidth}} \right) \times 100$$

$$\text{EyeSquint}\% = \left( \frac{\text{BaselineEyeAperture} - \text{PeakEyeAperture}}{\text{BaselineEyeAperture}} \right) \times 100$$

### 3. Classification
- **`NEUTRAL_FACE`**: Mouth expansion $< 6.0\%$
- **`REAL_CHIRI`**: High mouth expansion accompanied by proportional eye squint (Duchenne marker). Heuristic Score $0-30$.
- **`UNCERTAIN`**: Conflicting landmark deltas. Heuristic Score $31-59$.
- **`KALLA_CHIRI`**: High mouth expansion with low or zero eye squint (dead eyes / corporate smile). Heuristic Score $60-100$.

---

## 🔒 Privacy & Security

- **Local Execution**: All camera streams are processed locally in your browser using MediaPipe WASM.
- **No Video Uploads**: Camera frames are never recorded, saved, or transmitted to any server.
- **Data Minimization**: Only 5 numbers (e.g. `mouth_expansion_percent: 34.4`) are sent to Gemini.
- *Note for Production*: In a hackathon MVP, the client-side API key is stored in `.env`. For a production deployment, Gemini API calls should be proxied through a lightweight backend API route.

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v18+ recommended)
- Web Browser with Camera Access (Chrome / Safari / Firefox)

### 1. Clone & Install
```bash
cd useless_project_temp
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` and insert your Gemini API Key:
```env
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```
*(If left empty, the app will automatically use the built-in local Malayalam forensic fallback engine!)*

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` on your mobile phone or desktop browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🎭 Live Demo Script (30-Second Walkthrough)

1. **Step 1**: Open the app and view the cyberpunk **Chiri Forensics Dept.** landing screen.
2. **Step 2**: Click **"INITIALIZE SCANNER"**. Grant camera permission.
3. **Step 3**: Align suspect's face inside the green reticle box. Note the live telemetry stats.
4. **Step 4**: Click **"RECORD 3 SECONDS"** and ask the suspect to smile.
5. **Step 5**: Watch the dramatic terminal log analysis (`MEASURING OCULAR APERTURE...`).
6. **Step 6**: Read the final **🚨 KALLA CHIRI DETECTED 🚨** report card & Gemini Malayalam roast!

---

Made with ❤️ at **TinkerHub Useless Projects 3.0**
