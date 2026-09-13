# KALLA CHIRI

## Basic Details

### Team Name: SOCIUS

### Team Members

- Team Lead: Sneha Prakasan - Mar Athanasius College of Engineering, Kothamangalam
- Member 2: Rohith B - Mar Athanasius College of Engineering, Kothamangalam

### Project Description

KALLA CHIRI is a browser-based computer vision project that determines whether a person's smile is a "Kalla Chiri" (fake smile) or a "Nalla Chiri" (natural smile).

Using facial landmarks, the system measures mouth and eye movements for a few seconds and generates a completely unnecessary but entertaining forensic verdict.

### The Problem (that doesn't exist)

People smile all the time, but nobody has ever properly investigated whether that smile is genuine.

The completely imaginary problem is:

**"How do we know if someone's smile is actually real?"**

Important meetings, awkward photos, forced social interactions and suspicious-looking smiles have created a crisis that absolutely nobody asked us to solve.

### The Solution (that nobody asked for)

KALLA CHIRI uses the device camera and MediaPipe Face Landmarker to track facial movements.

The system:

1. Detects the user's face.
2. Tracks selected facial landmarks.
3. Measures mouth expansion and eye movement.
4. Runs a 3-second facial scan.
5. Calculates a humorous Kalla Chiri score.
6. Classifies the expression as `NEUTRAL`, `NALLA_CHIRI`, or `KALLA_CHIRI`.
7. Optionally uses Gemini AI to generate a Malayalam/Manglish-style forensic report.

Because apparently, smiling needed forensic investigation.

## Technical Details

### Technologies/Components Used

#### For Software:

- Languages used: TypeScript, JavaScript,HTML,CSS
- Frameworks used: React 19, Vite 6
- Libraries used:
  - MediaPipe Tasks Vision
  - Google Gemini API
  - Lucide React
  - Tailwind CSS
  - Canvas Confetti
- Tools used:
  - Git
  - GitHub
  - Vercel
  - VS Code
  - Browser Camera API

#### For Hardware:

No additional hardware is required.

The project uses the camera available on a laptop, desktop, or mobile device.

### Implementation

#### For Software:

The application follows a client-side computer vision pipeline:

```text
Camera
   |
   v
HTML Video
   |
   v
MediaPipe Face Landmarker
   |
   v
Facial Landmark Detection
   |
   v
Mouth + Eye Movement Analysis
   |
   v
3-Second Scan
   |
   v
Heuristic Score
   |
   +-------------------+
   |                   |
   v                   v
NEUTRAL          Smile Detected
                       |
                       v
              NALLA_CHIRI / KALLA_CHIRI
                       |
                       v
                 Gemini AI Report
```

The system measures selected facial landmarks to estimate:

- Mouth expansion
- Left-eye squint
- Right-eye squint
- Smile symmetry
- Overall heuristic score

The facial analysis is performed locally in the browser.

# Installation

Clone the repository and install the required dependencies:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <PROJECT_FOLDER>
npm install
```

Create a `.env` file in the project root:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
```

# Run

Start the development server:

```bash
npm run dev
```

Open the local URL shown in the terminal.

For a production build:

```bash
npm run build
```

The production files will be generated in the `dist` folder.

### Project Documentation

# Screenshots (Add at least 3)

![Screenshot1]
<img width="1891" height="912" alt="Screenshot 2026-09-13 171008" src="https://github.com/user-attachments/assets/bd590370-33c1-444d-b685-8582993c0ede" />

*Home screen showing the KALLA CHIRI interface and scanner.*

![Screenshot2]
<img width="1892" height="908" alt="Screenshot 2026-09-13 173252" src="https://github.com/user-attachments/assets/40eff16c-e284-4554-a603-8fe755df7de4" />

*Face scanning screen showing the 3-second facial analysis process.*

![Screenshot3]
<img width="742" height="907" alt="Screenshot 2026-09-13 173334" src="https://github.com/user-attachments/assets/2c0f6949-70bc-4b0e-b0a2-d50644cf8242" />


*Final forensic result showing the KALLA CHIRI/NALLA CHIRI verdict and score.*

> Replace the image paths above with your actual screenshot filenames.


*Workflow showing the complete process from camera input to facial landmark analysis, scoring, and final verdict.*

> Replace the image path with your actual workflow/architecture diagram.

### Project Demo

# Video

**Demo Video:** https://drive.google.com/file/d/1joYf6E-5a0DUvPxgkDYeUVyKM68k7PKu/view?usp=sharing
*The demo demonstrates camera initialization, facial landmark detection, the 3-second smile scan, heuristic scoring, and the final forensic verdict.*

# Additional Demos

- **Live Demo:** (https://useless-project-temp-three-plum.vercel.app/)
- **GitHub Repository:** (https://github.com/rohithb2007/useless_project_temp)


## Team Contributions

- **Sneha Prakasan:** Project concept and idea development, frontend development, UI/UX design, integration of the scanning interface, project documentation, README preparation, and overall project coordination.

- **Rohith B:** MediaPipe Face Landmarker integration, facial landmark tracking, mouth and eye movement calculations, Kalla Chiri heuristic logic, Gemini AI integration, testing, and technical implementation.

Together, the team developed the concept, implemented the computer vision pipeline, designed the user experience, and prepared the project for demonstration.
