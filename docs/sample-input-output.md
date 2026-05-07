# Sample Input & Output

## Sample Candidate

**Name:** Alex Johnson  
**Target Role:** Machine Learning Engineer

---

## Assessment Flow

### Step 1 — POST /assessment/start

**Request:**
```json
{
  "candidate_name": "Alex Johnson",
  "resume_text": "Alex Johnson | alex@email.com\n\nSKILLS\nPython, TensorFlow, PyTorch, Scikit-learn, Docker, Git, SQL, FastAPI\n\nEXPERIENCE\nML Intern – DataTech Solutions (June–Dec 2023)\n- Developed NLP models improving accuracy by 15%\n- Built data pipelines with Python and Airflow\n- Deployed models using Docker\n\nPROJECTS\n1. Sentiment Analysis API – BERT classifier, FastAPI, Docker, 92% accuracy\n2. Image Classification – CNN with PyTorch, 89% accuracy\n\nCERTIFICATIONS\nAWS ML Specialty, TensorFlow Developer Certificate",
  "job_description": "ML Engineer — Python, PyTorch, TensorFlow, MLOps, Docker, Kubernetes, model deployment, feature engineering, AWS/GCP required."
}
```

**Response:**
```json
{
  "session_id": "a3f9c1b2d4e5",
  "target_role": "Machine Learning Engineer",
  "total_questions": 6,
  "intro_message": "Hi Alex! I'll ask you 6 questions to assess your real proficiency across the key skills for this ML Engineer role.",
  "current_question_number": 1,
  "skill": "PyTorch",
  "question": "Walk me through how PyTorch's autograd works. If I call loss.backward(), what exactly happens under the hood?",
  "skills_overview": ["PyTorch", "MLOps", "Kubernetes", "Model Deployment", "Feature Engineering", "AWS"]
}
```

---

### Step 2 — POST /assessment/answer (repeated per question)

**Request:**
```json
{
  "session_id": "a3f9c1b2d4e5",
  "answer": "PyTorch builds a dynamic computation graph as operations are performed. Each tensor tracks its operations in a grad_fn. When you call loss.backward(), it traverses this graph in reverse using the chain rule, computing gradients for each parameter. The gradients are accumulated in the .grad attribute of each leaf tensor."
}
```

**Response:**
```json
{
  "skill_assessed": "PyTorch",
  "proficiency_score": 78,
  "proficiency_level": "proficient",
  "score_reasoning": "Good understanding of autograd and dynamic graphs. Missed mentioning gradient accumulation pitfalls and detach() usage.",
  "transition_message": "Nice explanation of autograd! Let's move to MLOps now.",
  "completed": false,
  "next_question_number": 2,
  "next_skill": "MLOps",
  "next_question": "You have a model in production that's degrading in accuracy over time. Walk me through how you'd detect, diagnose, and fix this.",
  "total_questions": 6
}
```

---

### Step 3 — POST /assessment/complete

**Response:**
```json
{
  "candidate_name": "Alex Johnson",
  "target_role": "Machine Learning Engineer",
  "overall_proficiency_score": 62,
  "proficiency_level": "Developing",
  "interview_readiness": "2-3 months away",
  "summary": "Alex has solid Python and PyTorch foundations with real project experience. The main gaps are in MLOps tooling (MLflow, Kubeflow), Kubernetes orchestration, and production-scale model deployment. With focused effort on these areas over 2-3 months, Alex would be a strong candidate.",
  "skill_scores": [
    { "skill": "PyTorch", "proficiency_score": 78, "proficiency_level": "proficient", "score_reasoning": "Good autograd understanding, minor gaps in advanced usage" },
    { "skill": "MLOps", "proficiency_score": 42, "proficiency_level": "beginner", "score_reasoning": "Aware of the concept but limited hands-on with MLflow/Kubeflow" },
    { "skill": "Kubernetes", "proficiency_score": 28, "proficiency_level": "beginner", "score_reasoning": "Basic Docker knowledge but no Kubernetes experience" },
    { "skill": "Model Deployment", "proficiency_score": 65, "proficiency_level": "familiar", "score_reasoning": "Has deployed with FastAPI/Docker but not at production scale" },
    { "skill": "Feature Engineering", "proficiency_score": 70, "proficiency_level": "proficient", "score_reasoning": "Good practical knowledge from internship projects" },
    { "skill": "AWS", "proficiency_score": 55, "proficiency_level": "familiar", "score_reasoning": "Used Lambda and S3 but limited broader AWS experience" }
  ],
  "skill_gap_analysis": [
    { "skill": "Kubernetes", "current_score": 28, "required_level": 75, "gap": 47, "priority": "high" },
    { "skill": "MLOps", "current_score": 42, "required_level": 80, "gap": 38, "priority": "high" },
    { "skill": "AWS", "current_score": 55, "required_level": 75, "gap": 20, "priority": "medium" }
  ],
  "adjacent_skills": [
    {
      "skill": "MLflow",
      "why_adjacent": "Already knows Python and has trained ML models — MLflow just adds experiment tracking on top",
      "impact": "Directly addresses the MLOps gap and is the most in-demand MLOps tool",
      "time_to_learn": "2 weeks",
      "resources": [
        { "title": "MLflow Official Docs", "url": "https://mlflow.org/docs/latest/index.html", "type": "docs", "duration": "1 week" }
      ]
    },
    {
      "skill": "Kubernetes",
      "why_adjacent": "Has Docker experience — Kubernetes is the natural next step for container orchestration",
      "impact": "Listed as required in the JD and currently the biggest gap",
      "time_to_learn": "1 month",
      "resources": [
        { "title": "Kubernetes Official Tutorials", "url": "https://kubernetes.io/docs/tutorials/", "type": "docs", "duration": "2 weeks" }
      ]
    }
  ],
  "learning_plan": [
    {
      "week_range": "Week 1-2",
      "focus": "MLflow & Experiment Tracking",
      "goal": "Set up MLflow locally, track 2 existing projects, log metrics and artifacts",
      "time_estimate": "8 hours/week",
      "resources": [
        { "title": "MLflow Official Docs", "url": "https://mlflow.org/docs/latest/index.html", "type": "docs", "duration": "1 week" },
        { "title": "MLOps Specialization – Coursera", "url": "https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops", "type": "course", "duration": "2 months" }
      ]
    },
    {
      "week_range": "Week 3-6",
      "focus": "Kubernetes",
      "goal": "Deploy a containerised ML model on a local Kubernetes cluster using minikube",
      "time_estimate": "10 hours/week",
      "resources": [
        { "title": "Kubernetes Official Tutorials", "url": "https://kubernetes.io/docs/tutorials/", "type": "docs", "duration": "2 weeks" },
        { "title": "CKA Course – FreeCodeCamp YouTube", "url": "https://www.youtube.com/watch?v=X48VuDVv0do", "type": "video", "duration": "1 month" }
      ]
    }
  ],
  "top_3_priorities": [
    "Learn MLflow for experiment tracking — 2 weeks, highest ROI for MLOps gap",
    "Complete Kubernetes basics and deploy one project — addresses biggest JD gap",
    "Get AWS Solutions Architect or ML Specialty cert to strengthen cloud credibility"
  ]
}
```

---

### Step 4 — POST /assessment/interview-questions (sample)

**Response (excerpt):**
```json
{
  "weak_skill_questions": [
    {
      "skill": "Kubernetes",
      "score": 28,
      "question": "What is the difference between a Kubernetes Deployment and a StatefulSet? When would you use each for an ML workload?",
      "difficulty": "medium",
      "what_interviewer_tests": "Whether the candidate understands Kubernetes resource types and can apply them to ML use cases",
      "answer_hint": "Deployments are for stateless apps; StatefulSets for stateful ones needing stable network IDs. For ML: model serving = Deployment, distributed training with shared storage = StatefulSet.",
      "follow_up": "How would you set up autoscaling for a model serving deployment?"
    }
  ],
  "behavioral_questions": [
    {
      "question": "Tell me about a time you deployed a model to production and something went wrong. How did you handle it?",
      "what_interviewer_tests": "Production experience, debugging skills, and ownership under pressure",
      "answer_hint": "Use STAR: describe the deployment, what failed (data drift, latency, etc.), how you diagnosed it, what you fixed, and what you'd do differently."
    }
  ],
  "preparation_tips": [
    "Focus on Kubernetes hands-on practice — spin up minikube and deploy your sentiment analysis API",
    "Build an end-to-end MLOps pipeline with MLflow + Docker + a simple CI/CD script",
    "Be ready to discuss model monitoring and data drift detection in depth",
    "Quantify your internship achievements with specific numbers in every answer"
  ]
}
```
