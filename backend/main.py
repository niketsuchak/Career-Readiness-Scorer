import os
import uuid
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models import (
    StudentProfile, AnalysisResult, ScoreBreakdown,
    AssessmentStartRequest, AssessmentAnswerRequest, AssessmentCompleteRequest
)
from scoring_engine import analyze_profile
from database import save_analysis, get_history, clear_history
from resume_parser import parse_resume_pdf
from assessment_agent import start_assessment, evaluate_answer, complete_assessment, generate_interview_questions

app = FastAPI(title="AI Skill Assessment Agent API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store (keyed by session_id)
# Each session: { skills_to_assess, current_index, skill_scores, conversation_history, meta }
SESSIONS: dict = {}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ai-skill-assessment-agent",
        "groq_enabled": bool(os.environ.get("GROQ_API_KEY")),
    }


# ---------------------------------------------------------------------------
# Resume analysis (existing)
# ---------------------------------------------------------------------------

@app.post("/analyze", response_model=AnalysisResult)
def analyze(profile: StudentProfile):
    try:
        result_data = analyze_profile(profile)
        record = {"student_name": profile.name, "target_role": profile.target_role, **result_data}
        saved = save_analysis(record)
        return AnalysisResult(
            id=saved["id"],
            timestamp=saved["timestamp"],
            student_name=saved["student_name"],
            target_role=saved["target_role"],
            scores=ScoreBreakdown(**saved["scores"]),
            strengths=saved["strengths"],
            weaknesses=saved["weaknesses"],
            missing_keywords=saved["missing_keywords"],
            resume_improvements=saved["resume_improvements"],
            learning_roadmap=saved["learning_roadmap"],
            recommendation_level=saved["recommendation_level"],
            recommendation_message=saved["recommendation_message"],
            ai_powered=saved.get("ai_powered", False),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history")
def history():
    return get_history()


@app.delete("/history")
def delete_history():
    clear_history()
    return {"message": "History cleared"}


@app.post("/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    try:
        contents = await file.read()
        return parse_resume_pdf(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Assessment Agent endpoints
# ---------------------------------------------------------------------------

@app.post("/assessment/start")
def assessment_start(req: AssessmentStartRequest):
    """Start a new conversational assessment session."""
    if not os.environ.get("GROQ_API_KEY"):
        raise HTTPException(status_code=503, detail="GROQ_API_KEY not configured")
    try:
        data = start_assessment(req.resume_text, req.job_description, req.candidate_name)

        session_id = str(uuid.uuid4())[:12]
        skills = data.get("skills_to_assess", [])[:6]

        SESSIONS[session_id] = {
            "candidate_name": req.candidate_name,
            "target_role": data.get("target_role", ""),
            "resume_text": req.resume_text,
            "job_description": req.job_description,
            "skills_to_assess": skills,
            "current_skill_index": 0,
            "current_question": data.get("first_question", {}),
            "skill_scores": [],
            "conversation_history": [],
            "total": min(len(skills), 6),
        }

        first_q = data.get("first_question", {})
        return {
            "session_id": session_id,
            "target_role": data.get("target_role", ""),
            "total_questions": SESSIONS[session_id]["total"],
            "intro_message": data.get("intro_message", ""),
            "current_question_number": 1,
            "skill": first_q.get("skill", ""),
            "question": first_q.get("question", ""),
            "skills_overview": [s["skill"] for s in skills],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/assessment/answer")
def assessment_answer(req: AssessmentAnswerRequest):
    """Submit an answer, get score + next question."""
    session = SESSIONS.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    try:
        current_q = session["current_question"]
        skill = current_q.get("skill", "")

        # Add to conversation history
        session["conversation_history"].extend([
            {"role": "assistant", "content": current_q.get("question", "")},
            {"role": "user", "content": req.answer},
        ])

        # Remaining skills (excluding current)
        idx = session["current_skill_index"]
        all_skills = session["skills_to_assess"]
        remaining = all_skills[idx + 1:] if idx + 1 < len(all_skills) else []

        result = evaluate_answer(
            skill=skill,
            question=current_q.get("question", ""),
            answer=req.answer,
            conversation_history=session["conversation_history"],
            remaining_skills=remaining,
            target_role=session["target_role"],
        )

        # Save score
        session["skill_scores"].append({
            "skill": skill,
            "proficiency_score": result.get("proficiency_score", 50),
            "proficiency_level": result.get("proficiency_level", "familiar"),
            "score_reasoning": result.get("score_reasoning", ""),
            "question": current_q.get("question", ""),
            "answer": req.answer,
        })

        follow = result.get("follow_up_or_next", {})
        follow_type = follow.get("type", "complete")

        # Advance index if moving to next skill
        if follow_type == "next_skill":
            session["current_skill_index"] = idx + 1

        # Update current question
        if follow_type in ("next_skill", "follow_up") and follow.get("question"):
            session["current_question"] = {
                "skill": follow.get("skill", skill),
                "question": follow.get("question", ""),
            }

        completed = follow_type == "complete" or (
            follow_type == "next_skill" and not remaining
        )

        return {
            "skill_assessed": skill,
            "proficiency_score": result.get("proficiency_score", 50),
            "proficiency_level": result.get("proficiency_level", "familiar"),
            "score_reasoning": result.get("score_reasoning", ""),
            "transition_message": follow.get("transition_message", ""),
            "completed": completed,
            "next_question_number": len(session["skill_scores"]) + 1 if not completed else None,
            "next_skill": follow.get("skill", "") if not completed else None,
            "next_question": follow.get("question", "") if not completed else None,
            "total_questions": session["total"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/assessment/complete")
def assessment_complete(req: AssessmentCompleteRequest):
    """Generate final learning plan after all questions answered."""
    session = SESSIONS.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired")

    try:
        result = complete_assessment(
            candidate_name=session["candidate_name"],
            target_role=session["target_role"],
            skill_scores=session["skill_scores"],
            resume_text=session["resume_text"],
            job_description=session["job_description"],
        )

        result["session_id"] = req.session_id
        result["candidate_name"] = session["candidate_name"]
        result["target_role"] = session["target_role"]
        result["skill_scores"] = session["skill_scores"]

        # Save full report to history
        save_analysis({
            "student_name": session["candidate_name"],
            "target_role": session["target_role"],
            "type": "assessment",
            "overall_proficiency_score": result.get("overall_proficiency_score", 0),
            "proficiency_level": result.get("proficiency_level", ""),
            "interview_readiness": result.get("interview_readiness", ""),
            "skill_scores": session["skill_scores"],
            "summary": result.get("summary", ""),
            "top_3_priorities": result.get("top_3_priorities", []),
            "skill_gap_analysis": result.get("skill_gap_analysis", []),
            "adjacent_skills": result.get("adjacent_skills", []),
            "learning_plan": result.get("learning_plan", []),
            "candidate_name": session["candidate_name"],
            "session_id": req.session_id,
        })

        # Store skill_scores + job_description for interview questions endpoint
        # Keep a lightweight record keyed by candidate name
        SESSIONS[f"report_{req.session_id}"] = {
            "candidate_name": session["candidate_name"],
            "target_role": session["target_role"],
            "skill_scores": session["skill_scores"],
            "job_description": session["job_description"],
        }

        # Clean up main session
        del SESSIONS[req.session_id]

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class InterviewQuestionsRequest(BaseModel):
    session_id: str


@app.post("/assessment/interview-questions")
def interview_questions(req: InterviewQuestionsRequest):
    """Generate mock interview questions based on assessed skill scores."""
    report_key = f"report_{req.session_id}"
    session = SESSIONS.get(report_key)
    if not session:
        raise HTTPException(status_code=404, detail="Report session not found. Complete the assessment first.")
    try:
        result = generate_interview_questions(
            candidate_name=session["candidate_name"],
            target_role=session["target_role"],
            skill_scores=session["skill_scores"],
            job_description=session["job_description"],
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
