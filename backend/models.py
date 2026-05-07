from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class StudentProfile(BaseModel):
    name: str
    target_role: str
    education: str
    skills: str
    projects: str
    experience: str
    certifications: Optional[str] = ""
    job_description: Optional[str] = ""


class ScoreBreakdown(BaseModel):
    skill_match: float
    project_relevance: float
    experience_relevance: float
    resume_strength: float
    certifications_score: float
    overall_score: float


class AnalysisResult(BaseModel):
    id: Optional[str] = None
    timestamp: Optional[str] = None
    student_name: str
    target_role: str
    scores: ScoreBreakdown
    strengths: List[str]
    weaknesses: List[str]
    missing_keywords: List[str]
    resume_improvements: List[str]
    learning_roadmap: List[str]
    recommendation_level: str
    recommendation_message: str
    ai_powered: Optional[bool] = False


# ---------------------------------------------------------------------------
# Assessment models
# ---------------------------------------------------------------------------

class AssessmentStartRequest(BaseModel):
    candidate_name: str
    resume_text: str
    job_description: str


class AssessmentAnswerRequest(BaseModel):
    session_id: str
    answer: str


class AssessmentCompleteRequest(BaseModel):
    session_id: str
