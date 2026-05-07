"""
Assessment Agent — conversational skill proficiency assessor.
Flow:
  1. start_assessment()  → extracts skills from JD + resume, generates first question
  2. evaluate_answer()   → scores answer, generates next question or finishes
  3. complete_assessment() → final proficiency scores + personalised learning plan
"""

import os
import json
import re
from typing import List, Dict, Optional


# ---------------------------------------------------------------------------
# Curated resource database (fallback when LLM doesn't provide links)
# ---------------------------------------------------------------------------
RESOURCE_DB: Dict[str, List[Dict]] = {
    "python": [
        {"title": "Python for Everybody – Coursera", "url": "https://www.coursera.org/specializations/python", "type": "course", "duration": "2 months"},
        {"title": "Official Python Tutorial", "url": "https://docs.python.org/3/tutorial/", "type": "docs", "duration": "1 week"},
    ],
    "machine learning": [
        {"title": "ML Specialization – Andrew Ng (Coursera)", "url": "https://www.coursera.org/specializations/machine-learning-introduction", "type": "course", "duration": "3 months"},
        {"title": "fast.ai Practical Deep Learning", "url": "https://course.fast.ai", "type": "course", "duration": "2 months"},
    ],
    "deep learning": [
        {"title": "Deep Learning Specialization – Coursera", "url": "https://www.coursera.org/specializations/deep-learning", "type": "course", "duration": "3 months"},
        {"title": "PyTorch Official Tutorials", "url": "https://pytorch.org/tutorials/", "type": "docs", "duration": "2 weeks"},
    ],
    "pytorch": [
        {"title": "PyTorch Official Tutorials", "url": "https://pytorch.org/tutorials/", "type": "docs", "duration": "2 weeks"},
        {"title": "Zero to Mastery PyTorch – YouTube", "url": "https://www.youtube.com/watch?v=Z_ikDlimN6A", "type": "video", "duration": "1 month"},
    ],
    "tensorflow": [
        {"title": "TensorFlow Developer Certificate – Coursera", "url": "https://www.coursera.org/professional-certificates/tensorflow-in-practice", "type": "course", "duration": "2 months"},
        {"title": "TensorFlow Official Tutorials", "url": "https://www.tensorflow.org/tutorials", "type": "docs", "duration": "2 weeks"},
    ],
    "docker": [
        {"title": "Docker Getting Started", "url": "https://docs.docker.com/get-started/", "type": "docs", "duration": "1 week"},
        {"title": "Docker & Kubernetes – Udemy", "url": "https://www.udemy.com/course/docker-kubernetes-the-practical-guide/", "type": "course", "duration": "3 weeks"},
    ],
    "kubernetes": [
        {"title": "Kubernetes Official Docs", "url": "https://kubernetes.io/docs/tutorials/", "type": "docs", "duration": "2 weeks"},
        {"title": "CKA Certification Course – FreeCodeCamp", "url": "https://www.youtube.com/watch?v=X48VuDVv0do", "type": "video", "duration": "1 month"},
    ],
    "aws": [
        {"title": "AWS Cloud Practitioner – AWS Training", "url": "https://aws.amazon.com/training/learn-about/cloud-practitioner/", "type": "course", "duration": "1 month"},
        {"title": "AWS Solutions Architect – Coursera", "url": "https://www.coursera.org/learn/aws-certified-solutions-architect-associate", "type": "course", "duration": "2 months"},
    ],
    "sql": [
        {"title": "SQL for Data Science – Coursera", "url": "https://www.coursera.org/learn/sql-for-data-science", "type": "course", "duration": "2 weeks"},
        {"title": "SQLZoo Interactive Tutorial", "url": "https://sqlzoo.net", "type": "interactive", "duration": "1 week"},
    ],
    "react": [
        {"title": "React Official Docs (react.dev)", "url": "https://react.dev/learn", "type": "docs", "duration": "2 weeks"},
        {"title": "Full Stack Open – University of Helsinki", "url": "https://fullstackopen.com", "type": "course", "duration": "2 months"},
    ],
    "system design": [
        {"title": "Grokking System Design – Educative", "url": "https://www.educative.io/courses/grokking-modern-system-design-interview", "type": "course", "duration": "1 month"},
        {"title": "System Design Primer – GitHub", "url": "https://github.com/donnemartin/system-design-primer", "type": "docs", "duration": "2 weeks"},
    ],
    "mlops": [
        {"title": "MLOps Specialization – Coursera", "url": "https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops", "type": "course", "duration": "2 months"},
        {"title": "MLflow Official Docs", "url": "https://mlflow.org/docs/latest/index.html", "type": "docs", "duration": "1 week"},
    ],
    "data structures": [
        {"title": "DSA – NeetCode.io", "url": "https://neetcode.io/roadmap", "type": "interactive", "duration": "2 months"},
        {"title": "Algorithms Specialization – Coursera", "url": "https://www.coursera.org/specializations/algorithms", "type": "course", "duration": "2 months"},
    ],
    "default": [
        {"title": "Search on Coursera", "url": "https://www.coursera.org/search?query={skill}", "type": "course", "duration": "varies"},
        {"title": "Search on YouTube", "url": "https://www.youtube.com/results?search_query={skill}+tutorial", "type": "video", "duration": "varies"},
    ],
}


def _get_resources(skill: str) -> List[Dict]:
    skill_lower = skill.lower()
    for key in RESOURCE_DB:
        if key in skill_lower or skill_lower in key:
            return RESOURCE_DB[key]
    return [
        {"title": f"Learn {skill} on Coursera", "url": f"https://www.coursera.org/search?query={skill.replace(' ', '+')}", "type": "course", "duration": "varies"},
        {"title": f"{skill} Tutorial – YouTube", "url": f"https://www.youtube.com/results?search_query={skill.replace(' ', '+')}+tutorial", "type": "video", "duration": "varies"},
    ]


# ---------------------------------------------------------------------------
# Groq helpers
# ---------------------------------------------------------------------------

def _groq_client():
    from groq import Groq
    return Groq(api_key=os.environ["GROQ_API_KEY"])


def _chat(messages: List[Dict], temperature: float = 0.4, max_tokens: int = 2048) -> str:
    client = _groq_client()
    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    content = resp.choices[0].message.content.strip()
    content = re.sub(r"^```(?:json)?\s*", "", content)
    content = re.sub(r"\s*```$", "", content)
    return content


def _parse_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON object from text
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group())
        raise


# ---------------------------------------------------------------------------
# Step 1: Start assessment — extract skills + generate first question
# ---------------------------------------------------------------------------

def start_assessment(resume_text: str, job_description: str, candidate_name: str) -> dict:
    """
    Extract required skills from JD, cross-reference with resume,
    return ordered list of skills to assess + first question.
    """
    prompt = f"""You are an expert technical interviewer. Analyze this job description and resume.

Job Description:
{job_description}

Candidate Resume:
{resume_text}

Return ONLY a JSON object:
{{
  "candidate_name": "{candidate_name}",
  "target_role": "<infer from JD>",
  "skills_to_assess": [
    {{
      "skill": "<skill name>",
      "importance": "<critical|important|nice-to-have>",
      "claimed_in_resume": <true|false>,
      "jd_required": <true|false>
    }}
  ],
  "first_question": {{
    "skill": "<most critical skill to assess first>",
    "question": "<specific, open-ended technical question to assess real proficiency — not yes/no>",
    "what_good_answer_includes": "<internal note: key concepts a strong answer should mention>"
  }},
  "total_skills_to_assess": <number, max 6>,
  "intro_message": "<friendly 1-sentence intro explaining you'll ask {min(6, 5)} questions to assess their skills>"
}}

Rules:
- Pick max 6 most important skills from the JD to assess
- Start with the most critical skill
- Questions must test real understanding, not just yes/no
- skills_to_assess should be ordered by importance"""

    result = _parse_json(_chat([
        {"role": "system", "content": "You are an expert technical interviewer. Return valid JSON only."},
        {"role": "user", "content": prompt}
    ]))

    return result


# ---------------------------------------------------------------------------
# Step 2: Evaluate answer + generate next question
# ---------------------------------------------------------------------------

def evaluate_answer(
    skill: str,
    question: str,
    answer: str,
    conversation_history: List[Dict],
    remaining_skills: List[Dict],
    target_role: str,
) -> dict:
    """
    Score the candidate's answer for a skill, then either ask next question or finish.
    """
    next_skill = remaining_skills[0] if remaining_skills else None

    prompt = f"""You are assessing a candidate for {target_role}.

Skill being assessed: {skill}
Question asked: {question}
Candidate's answer: {answer}

{"Next skill to assess: " + next_skill['skill'] if next_skill else "This was the last skill to assess."}

Return ONLY a JSON object:
{{
  "skill_assessed": "{skill}",
  "proficiency_score": <0-100, honest assessment of their answer>,
  "proficiency_level": "<expert|proficient|familiar|beginner|no_knowledge>",
  "score_reasoning": "<1 sentence explaining the score>",
  "follow_up_or_next": {{
    "type": "<follow_up|next_skill|complete>",
    "skill": "<skill name if next_skill or follow_up>",
    "question": "<next question to ask, or null if complete>",
    "transition_message": "<natural 1-sentence transition acknowledging their answer and moving to next topic>"
  }}
}}

Scoring guide:
- 85-100: Expert — deep understanding, mentions edge cases, best practices
- 70-84: Proficient — solid understanding, correct answer, minor gaps
- 50-69: Familiar — basic understanding, some gaps or vague answers
- 25-49: Beginner — partial/incorrect understanding
- 0-24: No knowledge — wrong or no answer

{"Ask a follow-up on the same skill if the answer was very vague (under 20 words) or completely off-topic." if next_skill else "Set type to 'complete' since all skills assessed."}"""

    result = _parse_json(_chat([
        {"role": "system", "content": "You are an expert technical interviewer. Return valid JSON only."},
        *conversation_history,
        {"role": "user", "content": prompt}
    ]))

    return result


# ---------------------------------------------------------------------------
# Step 3: Complete assessment — generate full learning plan
# ---------------------------------------------------------------------------

def complete_assessment(
    candidate_name: str,
    target_role: str,
    skill_scores: List[Dict],
    resume_text: str,
    job_description: str,
) -> dict:
    """
    Generate final proficiency report + personalised learning plan
    with adjacent skills, time estimates, and curated resources.
    """
    scores_summary = "\n".join([
        f"- {s['skill']}: {s['proficiency_score']}/100 ({s['proficiency_level']}) — {s['score_reasoning']}"
        for s in skill_scores
    ])

    prompt = f"""You are an expert career coach. Based on this skill assessment, create a personalised learning plan.

Candidate: {candidate_name}
Target Role: {target_role}

Assessed Skill Proficiency:
{scores_summary}

Job Description:
{job_description}

Return ONLY a JSON object:
{{
  "overall_proficiency_score": <weighted average of skill scores, 0-100>,
  "proficiency_level": "<Expert|Proficient|Developing|Beginner>",
  "summary": "<3-4 sentence personalised summary of their current readiness and biggest opportunities>",
  "skill_gap_analysis": [
    {{
      "skill": "<skill name>",
      "current_score": <0-100>,
      "required_level": <0-100>,
      "gap": <required - current>,
      "priority": "<high|medium|low>"
    }}
  ],
  "adjacent_skills": [
    {{
      "skill": "<skill they can realistically learn given what they already know>",
      "why_adjacent": "<1 sentence: why this is achievable given their current skills>",
      "impact": "<1 sentence: how this skill will help them get the role>",
      "time_to_learn": "<realistic estimate e.g. 2 weeks, 1 month, 3 months>"
    }}
  ],
  "learning_plan": [
    {{
      "week_range": "<e.g. Week 1-2>",
      "focus": "<skill or topic>",
      "goal": "<specific, measurable goal for this period>",
      "time_estimate": "<hours per week>",
      "resources": [
        {{
          "title": "<resource name>",
          "url": "<actual URL>",
          "type": "<course|video|docs|book|practice>",
          "duration": "<time to complete>"
        }}
      ]
    }}
  ],
  "interview_readiness": "<Ready to interview|1 month away|2-3 months away|6+ months away>",
  "top_3_priorities": ["<most impactful thing to do first>", "<second>", "<third>"]
}}

Rules:
- adjacent_skills must be skills they can REALISTICALLY learn in 1-3 months given their background
- learning_plan must be ordered by priority (biggest gaps first)
- All resource URLs must be real, working URLs
- time estimates must be realistic, not optimistic
- skill_gap_analysis only for skills with gap > 10"""

    result = _parse_json(_chat([
        {"role": "system", "content": "You are an expert career coach. Return valid JSON only."},
        {"role": "user", "content": prompt}
    ], temperature=0.3))

    # Enrich resources with our curated DB where LLM might have generic URLs
    for step in result.get("learning_plan", []):
        if not step.get("resources"):
            step["resources"] = _get_resources(step["focus"])

    # Add resources to adjacent skills too
    for adj in result.get("adjacent_skills", []):
        adj["resources"] = _get_resources(adj["skill"])

    return result


# ---------------------------------------------------------------------------
# Step 4: Generate mock interview questions based on weak skills
# ---------------------------------------------------------------------------

def generate_interview_questions(
    candidate_name: str,
    target_role: str,
    skill_scores: List[Dict],
    job_description: str,
) -> dict:
    sorted_skills = sorted(skill_scores, key=lambda s: s["proficiency_score"])
    scores_summary = "\n".join([
        f"- {s['skill']}: {s['proficiency_score']}/100 ({s['proficiency_level']})"
        for s in sorted_skills
    ])

    prompt = f"""You are a senior technical interviewer preparing mock interview questions for a {target_role} candidate.

Candidate: {candidate_name}
Skill Assessment Results (weakest first):
{scores_summary}

Job Description:
{job_description}

Return ONLY a JSON object:
{{
  "weak_skill_questions": [
    {{
      "skill": "<skill name>",
      "score": <proficiency score>,
      "question": "<realistic interview question>",
      "difficulty": "<easy|medium|hard>",
      "what_interviewer_tests": "<1 sentence: what this evaluates>",
      "answer_hint": "<2-3 sentences: key points a strong answer covers>",
      "follow_up": "<natural follow-up question>"
    }}
  ],
  "strong_skill_questions": [
    {{
      "skill": "<skill name>",
      "score": <proficiency score>,
      "question": "<harder question to challenge their strong area>",
      "difficulty": "hard",
      "what_interviewer_tests": "<1 sentence>",
      "answer_hint": "<2-3 sentences>",
      "follow_up": "<follow-up question>"
    }}
  ],
  "behavioral_questions": [
    {{
      "question": "<STAR-format behavioral question relevant to the role>",
      "what_interviewer_tests": "<1 sentence>",
      "answer_hint": "<how to structure using STAR method>"
    }}
  ],
  "preparation_tips": ["<3-4 specific tips based on their weak areas>"]
}}

Rules:
- 2-3 questions per weak skill (score < 75), max 8 total weak skill questions
- 1 question per strong skill, max 3 total
- 3 behavioral questions relevant to {target_role}
- Questions must be realistic — things actually asked in {target_role} interviews
- answer_hint should guide but not give away the full answer"""

    return _parse_json(_chat([
        {"role": "system", "content": "You are a senior technical interviewer. Return valid JSON only."},
        {"role": "user", "content": prompt}
    ], temperature=0.4, max_tokens=3000))
