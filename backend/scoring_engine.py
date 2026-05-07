"""
Scoring Engine
- Primary:  Groq LLM (llama-3.3-70b-versatile) — fully AI-powered analysis
- Fallback: Rule-based keyword engine if GROQ_API_KEY is missing or call fails
"""

import os
import re
import json
from typing import List, Tuple, Dict

# ---------------------------------------------------------------------------
# Groq AI Analyzer
# ---------------------------------------------------------------------------

ANALYSIS_PROMPT = """You are an expert career coach and technical recruiter. Analyze the student profile below for the target role and return ONLY a valid JSON object.

Student Profile:
- Name: {name}
- Target Role: {target_role}
- Education: {education}
- Skills: {skills}
- Projects: {projects}
- Work Experience: {experience}
- Certifications: {certifications}
- Job Description / Requirements: {job_description}

Evaluate and return this exact JSON structure:
{{
  "scores": {{
    "skill_match": <number 0-100, how well skills match the target role>,
    "project_relevance": <number 0-100, how relevant projects are to the role>,
    "experience_relevance": <number 0-100, how relevant experience is>,
    "resume_strength": <number 0-100, quality of resume presentation and impact>,
    "certifications_score": <number 0-100, value of certifications for the role>,
    "overall_score": <weighted average: skill_match*0.35 + project_relevance*0.25 + experience_relevance*0.20 + resume_strength*0.10 + certifications_score*0.10>
  }},
  "strengths": [<3-4 specific strengths of this candidate for this role>],
  "weaknesses": [<3-4 specific weaknesses or gaps for this role>],
  "missing_keywords": [<8-10 important skills/technologies missing from their profile for this role>],
  "resume_improvements": [<4-5 specific, actionable resume bullet point improvements with examples>],
  "learning_roadmap": [<5-6 specific, ordered learning steps tailored to close their gaps for this exact role>],
  "recommendation_level": <one of: "Interview Ready", "Strong Candidate", "Needs Improvement", "Beginner Level">,
  "recommendation_message": <2 sentence personalized message explaining their readiness and top priority action>
}}

Scoring rules:
- Be accurate and honest, not overly generous
- overall_score 85-100 = Interview Ready, 70-84 = Strong Candidate, 50-69 = Needs Improvement, 0-49 = Beginner Level
- recommendation_level must match the overall_score range
- strengths and weaknesses must be specific to THIS person's profile, not generic
- learning_roadmap must be ordered by priority and specific to their gaps
- resume_improvements must include concrete before/after examples where possible
- Return ONLY the JSON object, no markdown, no explanation"""


def _analyze_with_groq(profile) -> dict:
    from groq import Groq

    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)

    prompt = ANALYSIS_PROMPT.format(
        name=profile.name,
        target_role=profile.target_role,
        education=profile.education,
        skills=profile.skills,
        projects=profile.projects,
        experience=profile.experience,
        certifications=profile.certifications or "None",
        job_description=profile.job_description or "Not provided",
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are an expert career coach. Always respond with valid JSON only. No markdown, no explanation."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.3,
        max_tokens=2048,
    )

    content = response.choices[0].message.content.strip()

    # Strip markdown code fences if model wraps response
    content = re.sub(r"^```(?:json)?\s*", "", content)
    content = re.sub(r"\s*```$", "", content)

    parsed = json.loads(content)

    # Ensure overall_score matches recommendation_level
    overall = parsed["scores"]["overall_score"]
    if overall >= 85:
        parsed["recommendation_level"] = "Interview Ready"
    elif overall >= 70:
        parsed["recommendation_level"] = "Strong Candidate"
    elif overall >= 50:
        parsed["recommendation_level"] = "Needs Improvement"
    else:
        parsed["recommendation_level"] = "Beginner Level"

    parsed["ai_powered"] = True
    return parsed


# ---------------------------------------------------------------------------
# Rule-based fallback
# ---------------------------------------------------------------------------

ROLE_KEYWORDS: Dict[str, List[str]] = {
    "software engineer": [
        "python", "java", "javascript", "typescript", "c++", "go", "rust",
        "data structures", "algorithms", "system design", "git", "rest api",
        "sql", "docker", "kubernetes", "aws", "ci/cd", "agile", "oop",
        "microservices", "linux", "testing", "react", "node"
    ],
    "frontend developer": [
        "html", "css", "javascript", "typescript", "react", "vue", "angular",
        "tailwind", "sass", "webpack", "vite", "responsive design",
        "git", "rest api", "figma", "testing", "performance optimization"
    ],
    "backend developer": [
        "python", "java", "node", "go", "sql", "postgresql", "mysql",
        "mongodb", "redis", "rest api", "graphql", "docker", "kubernetes",
        "aws", "microservices", "ci/cd", "linux", "system design", "caching"
    ],
    "data scientist": [
        "python", "r", "machine learning", "deep learning", "pandas", "numpy",
        "scikit-learn", "tensorflow", "pytorch", "sql", "statistics",
        "data visualization", "matplotlib", "jupyter", "feature engineering",
        "nlp", "computer vision", "a/b testing", "tableau", "spark"
    ],
    "machine learning engineer": [
        "python", "tensorflow", "pytorch", "scikit-learn", "mlops", "docker",
        "kubernetes", "aws", "gcp", "azure", "feature engineering", "model deployment",
        "rest api", "sql", "spark", "airflow", "deep learning", "nlp",
        "data pipelines", "git"
    ],
    "devops engineer": [
        "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ansible",
        "ci/cd", "jenkins", "github actions", "linux", "bash", "python",
        "monitoring", "prometheus", "grafana", "networking", "security", "git"
    ],
    "data analyst": [
        "sql", "python", "excel", "tableau", "power bi", "data visualization",
        "statistics", "pandas", "numpy", "reporting", "dashboard", "etl",
        "business intelligence", "a/b testing", "google analytics"
    ],
    "full stack developer": [
        "html", "css", "javascript", "typescript", "react", "node", "python",
        "sql", "mongodb", "rest api", "git", "docker", "aws", "testing",
        "responsive design", "system design", "ci/cd"
    ],
    "cloud engineer": [
        "aws", "gcp", "azure", "terraform", "docker", "kubernetes", "networking",
        "security", "iam", "s3", "ec2", "lambda", "python", "bash", "ci/cd",
        "monitoring", "cost optimization", "linux"
    ],
}

ROLE_ROADMAPS: Dict[str, List[str]] = {
    "software engineer": [
        "Master data structures & algorithms (LeetCode 150+)",
        "Build 2–3 full-stack projects with GitHub",
        "Learn system design fundamentals",
        "Contribute to open-source projects",
        "Practice mock interviews on Pramp or Interviewing.io",
    ],
    "data scientist": [
        "Complete Python for Data Science (NumPy, Pandas, Matplotlib)",
        "Learn ML fundamentals via Andrew Ng's Coursera course",
        "Build end-to-end ML projects and publish on Kaggle",
        "Study statistics and probability deeply",
        "Deploy a model using Flask/FastAPI",
    ],
    "machine learning engineer": [
        "Master Python, NumPy, Pandas, and Scikit-learn",
        "Deep dive into PyTorch or TensorFlow",
        "Learn MLOps: Docker, Kubernetes, MLflow",
        "Build and deploy ML pipelines on AWS/GCP",
        "Study distributed computing with Spark",
    ],
    "frontend developer": [
        "Master HTML, CSS, and JavaScript fundamentals",
        "Learn React and state management (Redux/Zustand)",
        "Study responsive design and accessibility",
        "Build portfolio projects with clean UI",
        "Learn testing with Jest and React Testing Library",
    ],
    "backend developer": [
        "Master one backend language (Python/Node/Go)",
        "Learn REST API design and GraphQL",
        "Study databases: SQL and NoSQL",
        "Learn Docker and container orchestration",
        "Practice system design and scalability patterns",
    ],
    "devops engineer": [
        "Learn Linux fundamentals and bash scripting",
        "Master Docker and Kubernetes",
        "Study CI/CD pipelines (GitHub Actions, Jenkins)",
        "Get AWS/GCP/Azure certified",
        "Learn Infrastructure as Code with Terraform",
    ],
    "full stack developer": [
        "Build strong HTML/CSS/JS foundation",
        "Learn React for frontend and Node.js for backend",
        "Master SQL and one NoSQL database",
        "Deploy projects on AWS/Vercel/Render",
        "Learn Docker and basic CI/CD",
    ],
}

DEFAULT_ROADMAP = [
    "Identify core skills required for your target role",
    "Build 2–3 portfolio projects demonstrating those skills",
    "Earn relevant certifications (Coursera, AWS, Google)",
    "Practice interview questions and system design",
    "Network on LinkedIn and contribute to open source",
]

RESUME_VERBS = [
    "developed", "built", "designed", "implemented", "led", "improved",
    "increased", "reduced", "optimized", "deployed", "created", "managed",
    "collaborated", "architected", "automated", "delivered", "launched",
    "achieved", "scaled", "integrated",
]

CERT_KEYWORDS = [
    "aws", "gcp", "azure", "google", "coursera", "udemy", "certified",
    "certification", "certificate", "microsoft", "oracle", "cisco",
    "comptia", "pmp", "scrum", "agile", "tensorflow", "pytorch",
]


def _normalize(text: str) -> str:
    return text.lower().strip()


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-z0-9#+./]+", _normalize(text))


def _keyword_hit_rate(text: str, keywords: List[str]) -> Tuple[float, List[str], List[str]]:
    normalized = _normalize(text)
    tokens = set(_tokenize(text))
    matched = list(set([
        kw for kw in keywords
        if kw in normalized
        or any(kw in token or token in kw for token in tokens)
        or any(part in normalized for part in kw.split() if len(part) > 3)
    ]))
    missing = [kw for kw in keywords if kw not in matched]
    return len(matched) / len(keywords) if keywords else 0.0, matched, missing


def _get_role_keywords(target_role: str) -> List[str]:
    role = _normalize(target_role)
    for key in ROLE_KEYWORDS:
        if key in role or role in key:
            return ROLE_KEYWORDS[key]
    role_words = set(role.split())
    best_key = max(ROLE_KEYWORDS.keys(), key=lambda k: len(set(k.split()) & role_words))
    return ROLE_KEYWORDS[best_key]


def _get_roadmap(target_role: str) -> List[str]:
    role = _normalize(target_role)
    for key in ROLE_ROADMAPS:
        if key in role or role in key:
            return ROLE_ROADMAPS[key]
    return DEFAULT_ROADMAP


def _analyze_rule_based(profile) -> dict:
    role_kws = _get_role_keywords(profile.target_role)
    combined_skills = profile.skills + " " + (profile.job_description or "")
    skill_rate, matched, missing = _keyword_hit_rate(combined_skills, role_kws)
    if profile.job_description:
        jd_overlap = len(set(_tokenize(profile.job_description)) & set(_tokenize(profile.skills))) / max(len(set(_tokenize(profile.job_description))), 1)
        skill_rate = 0.7 * skill_rate + 0.3 * min(jd_overlap * 3, 1.0)
    skill_score = round(min(skill_rate * 100, 100), 1)

    proj_rate, _, _ = _keyword_hit_rate(profile.projects, role_kws)
    proj_count = len(re.findall(r"\b(project|app|system|tool|api|model|dashboard)\b", _normalize(profile.projects)))
    project_score = round(min((proj_rate + min(proj_count * 5, 20) / 100) * 100, 100), 1)

    exp_rate, _, _ = _keyword_hit_rate(profile.experience, role_kws)
    year_bonus = min(len(re.findall(r"\d+\s*(?:year|yr|month)", _normalize(profile.experience))) * 0.08, 0.25)
    work_bonus = 0.15 if re.search(r"intern|engineer|developer|analyst|scientist", _normalize(profile.experience)) else 0
    experience_score = round(min((exp_rate + year_bonus + work_bonus) * 100, 100), 1) if profile.experience.strip() else 5.0

    combined = " ".join([profile.skills, profile.projects, profile.experience])
    verb_hits = sum(1 for v in RESUME_VERBS if v in combined.lower())
    resume_score = round(min((verb_hits / len(RESUME_VERBS) + min(len(combined.split()) / 500, 0.3)) * 100, 100), 1)

    cert_hits = sum(1 for kw in CERT_KEYWORDS if kw in (profile.certifications or "").lower())
    cert_count = len(re.findall(r",|;|\n", profile.certifications or "")) + 1
    cert_score = round(min(cert_hits * 15 + cert_count * 10, 100), 1) if (profile.certifications or "").strip() else 0.0

    overall = round(skill_score * 0.35 + project_score * 0.25 + experience_score * 0.20 + resume_score * 0.10 + cert_score * 0.10, 1)

    if overall >= 85:
        level, message = "Interview Ready", "You're well-prepared! Start applying and practicing interviews."
    elif overall >= 70:
        level, message = "Strong Candidate", "Great profile! Address a few gaps to become interview-ready."
    elif overall >= 50:
        level, message = "Needs Improvement", "Solid foundation. Focus on missing skills and build more projects."
    else:
        level, message = "Beginner Level", "Keep learning! Follow the roadmap to build your profile systematically."

    strengths = []
    if len(matched) >= 5:
        strengths.append(f"Strong skill alignment: {', '.join(matched[:5])}")
    if profile.experience.strip() and len(profile.experience.split()) > 20:
        strengths.append("Relevant work experience demonstrated")
    if (profile.certifications or "").strip():
        strengths.append("Professional certifications add credibility")
    if len(matched) >= 8:
        strengths.append("Broad technical skill set covering key role requirements")
    if not strengths:
        strengths.append("Foundational knowledge present — build on it!")

    weaknesses = []
    if missing:
        weaknesses.append(f"Missing key skills: {', '.join(missing[:5])}")
    if not profile.experience.strip() or len(profile.experience.split()) < 15:
        weaknesses.append("Limited or no work experience mentioned")
    if not profile.projects.strip() or len(profile.projects.split()) < 15:
        weaknesses.append("Projects section needs more detail")
    if not weaknesses:
        weaknesses.append("No critical weaknesses identified — keep improving!")

    improvements = []
    if verb_hits < 3:
        improvements.append("Use strong action verbs: 'Developed', 'Architected', 'Optimized', 'Deployed'")
    if not re.search(r"\d+%|\d+x|\d+ users", combined.lower()):
        improvements.append("Add quantifiable metrics: 'Improved performance by 40%', 'Served 10K+ users'")
    if len(profile.projects.split()) < 30:
        improvements.append("Expand project descriptions with tech stack, your role, and outcomes")
    if "github" not in combined.lower():
        improvements.append("Add GitHub profile or portfolio link to showcase your work")
    improvements.append("Tailor your resume keywords to match the job description exactly")

    return {
        "scores": {
            "skill_match": skill_score,
            "project_relevance": project_score,
            "experience_relevance": experience_score,
            "resume_strength": resume_score,
            "certifications_score": cert_score,
            "overall_score": overall,
        },
        "strengths": strengths,
        "weaknesses": weaknesses,
        "missing_keywords": missing[:10],
        "resume_improvements": improvements,
        "learning_roadmap": _get_roadmap(profile.target_role),
        "recommendation_level": level,
        "recommendation_message": message,
        "ai_powered": False,
    }


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def analyze_profile(profile) -> dict:
    if os.environ.get("GROQ_API_KEY"):
        try:
            return _analyze_with_groq(profile)
        except Exception as e:
            print(f"[scoring_engine] Groq failed ({e}), falling back to rule-based")
    return _analyze_rule_based(profile)
