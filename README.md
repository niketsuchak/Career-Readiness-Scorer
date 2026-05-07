# 🤖 AI-Powered Skill Assessment & Personalised Learning Plan Agent

> Takes a Job Description and a candidate's resume, conversationally assesses real proficiency on each required skill, identifies gaps, and generates a personalised learning plan with curated resources and time estimates — powered by Groq AI (llama-3.3-70b-versatile).

---

## Problem Statement

A resume tells you what someone *claims* to know — not how well they actually know it. Students and fresh graduates lack objective, personalised feedback on their real skill proficiency, gaps, and a concrete path to close them.

## Solution

An AI agent that:
1. Parses your resume (PDF or text) + job description
2. **Conversationally interviews you** on each required skill via a chat interface
3. Scores your **real proficiency** based on your answers (not just resume claims)
4. Identifies skill gaps and **adjacent skills** you can realistically acquire
5. Generates a **personalised learning plan** with curated resources and time estimates
6. Produces **mock interview questions** focused on your weak areas

---

## Features

- **AI Conversational Assessment** — Groq llama-3.3-70b asks skill-specific questions and evaluates answers
- **Resume PDF Upload** — AI-powered parsing extracts all profile fields automatically
- **Proficiency Scoring** — Expert / Proficient / Familiar / Beginner per skill
- **Skill Gap Analysis** — Current vs required level with priority ranking
- **Adjacent Skills** — Skills you can realistically learn given your background
- **Personalised Learning Plan** — Week-by-week plan with curated resource links and time estimates
- **Mock Interview Questions** — Role-specific questions on weak skills with answer hints
- **Resume Analyzer** — Separate tool for quick resume scoring (rule-based + AI)
- **Analysis History** — All assessments and analyses saved locally
- **Responsive UI** — Works on mobile and desktop

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Backend | FastAPI, Python 3.12 |
| AI Engine | Groq API — llama-3.3-70b-versatile |
| PDF Parsing | pypdf |
| Storage | Local JSON file |
| HTTP Client | Axios |

---

## Architecture

```
Browser (React + Vite :5173)
        │
        │  HTTP (Axios)
        ▼
FastAPI Backend (:8000)
        │
        ├── assessment_agent.py   ← Groq AI: interview, evaluate, learning plan
        ├── scoring_engine.py     ← Groq AI: resume analysis + scoring
        ├── resume_parser.py      ← Groq AI: PDF → structured profile fields
        ├── models.py             ← Pydantic validation
        └── database.py          ← JSON persistence
```

See [docs/architecture.md](docs/architecture.md) for the full Mermaid diagram.

---

## Project Structure

```
career-readiness-scorer/
├── backend/
│   ├── main.py                # FastAPI app + all endpoints
│   ├── assessment_agent.py    # AI assessment: questions, evaluation, learning plan
│   ├── scoring_engine.py      # AI resume scoring
│   ├── resume_parser.py       # AI PDF resume parser
│   ├── models.py              # Pydantic models
│   ├── database.py            # JSON storage
│   ├── .env                   # GROQ_API_KEY (not committed)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ScoreCard.jsx
│   │   │   ├── OverallScore.jsx
│   │   │   └── InfoList.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── AssessmentSetup.jsx   # Upload resume + JD
│   │   │   ├── AssessmentChat.jsx    # Conversational interview UI
│   │   │   ├── AssessmentResults.jsx # Full report + learning plan
│   │   │   ├── Analyzer.jsx          # Resume analyzer
│   │   │   ├── Results.jsx
│   │   │   └── History.jsx
│   │   └── services/
│   │       ├── api.js
│   │       └── sampleData.js
│   ├── package.json
│   ├── tailwind.config.js
│   └── index.html
└── docs/
    ├── architecture.md
    ├── scoring-logic.md
    └── sample-input-output.md
```

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:
```
GROQ_API_KEY=your_groq_api_key_here
```

```bash
uvicorn main:app --reload --port 8000
```

Backend: http://localhost:8000  
API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check + Groq status |
| POST | `/parse-resume` | Parse PDF resume → structured fields |
| POST | `/analyze` | AI resume analysis + scoring |
| GET | `/history` | Get all past analyses |
| DELETE | `/history` | Clear all history |
| POST | `/assessment/start` | Start conversational assessment session |
| POST | `/assessment/answer` | Submit answer, get score + next question |
| POST | `/assessment/complete` | Generate full learning plan |
| POST | `/assessment/interview-questions` | Generate mock interview questions |

---

## Demo Flow

### AI Assessment (Primary Feature)
1. Open http://localhost:5173
2. Click **"🤖 AI Assessment"** in the navbar
3. Upload your resume PDF (auto-parsed by Groq AI) or paste text
4. Paste the job description
5. Click **"Start AI Assessment"**
6. Answer 5–6 conversational questions from the AI agent
7. Click **"Generate My Learning Plan"**
8. View full report: proficiency scores, skill gaps, adjacent skills, learning plan with resources, mock interview questions

### Resume Analyzer (Secondary Feature)
1. Click **"Resume Analyzer"** in the navbar
2. Click **"⚡ Load Sample Input"** or fill in your details
3. Click **"🎯 Analyze My Profile"**
4. View AI-powered scores, strengths, weaknesses, and roadmap

---

## Sample Input

**Resume:** Alex Johnson — ML Engineer candidate with Python, PyTorch, TensorFlow, Docker, 6-month ML internship

**Job Description:** ML Engineer role requiring Python, PyTorch, TensorFlow, MLOps, Kubernetes, model deployment, AWS/GCP

**Assessment Questions Generated:**
- "Explain how backpropagation works and how PyTorch's autograd implements it"
- "You have a model in production that's degrading in accuracy over time. Walk me through how you'd diagnose and fix this"
- "What's the difference between Docker and Kubernetes, and when would you use each?"

**Output:** See [docs/sample-input-output.md](docs/sample-input-output.md)

---

## Future Improvements

- Deployed cloud URL (Render/Railway)
- PostgreSQL for production storage
- User authentication and profiles
- Email report delivery
- PDF report download
- Radar/spider chart for skill visualization
- Job board integration (LinkedIn, Indeed)

---

## Demo Video Script

### [0:00 – 0:20] Introduction
> "Hi, I'm demoing an AI-powered Skill Assessment Agent built for the Catalyst hackathon. It takes your resume and a job description, then conversationally interviews you to assess your real proficiency — not just what your resume claims. It then generates a personalised learning plan with curated resources."

### [0:20 – 0:50] Landing Page
> "Here's the landing page. The primary feature is the AI Assessment — it's a 3-step flow: upload resume and JD, get interviewed by the AI, then receive your personalised learning plan."

### [0:50 – 1:30] Setup
> "I'll click Start AI Assessment. I'll upload my resume PDF — the AI parses it automatically using Groq. Then I paste the job description for a Machine Learning Engineer role. I click Start Assessment."

### [1:30 – 2:30] Conversational Assessment
> "The AI agent introduces itself and starts asking questions. First question is about PyTorch and backpropagation. I'll type my answer. The AI scores my answer — 72 out of 100, Proficient — and gives me a reasoning. Then it moves to the next skill: MLOps. I answer that. It continues through all 6 skills."

### [2:30 – 3:15] Learning Plan
> "After all questions, I click Generate My Learning Plan. The AI generates a full report. I scored 68 overall — Developing level. I can see my skill breakdown: PyTorch 72, MLOps 45, Kubernetes 30. The skill gap analysis shows Kubernetes and MLOps as high priority gaps. The adjacent skills section shows what I can realistically learn — MLflow is adjacent to my Docker knowledge."

### [3:15 – 3:45] Resources + Interview Questions
> "The personalised learning plan is week-by-week with real resource links — Coursera courses, official docs, YouTube tutorials. Then I click Generate Interview Questions — the AI generates questions specifically on my weak skills, with answer hints and likely follow-ups."

### [3:45 – 4:00] History + Closing
> "Everything is saved in History. The backend is FastAPI with Groq llama-3.3-70b powering all AI features. Thank you!"
# Career-Readiness-Scorer
# Career-Readiness-Scorer
# Career-Readiness-Scorer
# Career-Readiness-Scorer
# Career-Readiness-Scorer
