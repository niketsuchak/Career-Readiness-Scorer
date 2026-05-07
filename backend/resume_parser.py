"""
Resume PDF parser
- Primary:  Groq LLM (llama-3.3-70b-versatile) for accurate structured extraction
- Fallback: Rule-based section splitter if GROQ_API_KEY is missing or call fails
"""

import re
import io
import os
import json
from pypdf import PdfReader

# ---------------------------------------------------------------------------
# PDF text extraction (shared by both paths)
# ---------------------------------------------------------------------------

def _extract_text(pdf_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text(extraction_mode="layout") or page.extract_text() or ""
        pages.append(text)
    return "\n".join(pages)


# ---------------------------------------------------------------------------
# Groq LLM parser
# ---------------------------------------------------------------------------

GROQ_PROMPT = """You are a resume parser. Extract information from the resume text below and return ONLY a valid JSON object with exactly these keys:

{{
  "name": "full name of the candidate",
  "target_role": "infer the most suitable job role based on their skills and experience (e.g. Machine Learning Engineer, Frontend Developer)",
  "education": "all education details including degree, university, year, GPA if present",
  "skills": "comma-separated list of all technical skills, tools, languages, frameworks",
  "experience": "all work experience, internships with company, role, duration, and achievements",
  "projects": "all projects with name, description, tech stack, and outcomes",
  "certifications": "all certifications, courses, awards",
  "summary": "professional summary or objective if present, else empty string"
}}

Rules:
- Return ONLY the JSON object, no markdown, no explanation, no code blocks
- If a section is missing from the resume, use an empty string ""
- For skills, extract ALL technologies mentioned anywhere in the resume (projects, experience, skills section)
- For target_role, be specific (e.g. "Machine Learning Engineer" not just "Engineer")

Resume text:
{text}"""


def _parse_with_groq(raw_text: str) -> dict:
    from groq import Groq

    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)

    # Truncate to ~12k chars to stay within token limits
    truncated = raw_text[:12000]

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are an expert resume parser. Always respond with valid JSON only."
            },
            {
                "role": "user",
                "content": GROQ_PROMPT.format(text=truncated)
            }
        ],
        temperature=0.1,
        max_tokens=2048,
    )

    content = response.choices[0].message.content.strip()

    # Strip markdown code fences if model wraps in them
    content = re.sub(r"^```(?:json)?\s*", "", content)
    content = re.sub(r"\s*```$", "", content)

    parsed = json.loads(content)

    return {
        "name":            parsed.get("name", ""),
        "target_role":     parsed.get("target_role", ""),
        "education":       parsed.get("education", ""),
        "skills":          parsed.get("skills", ""),
        "projects":        parsed.get("projects", ""),
        "experience":      parsed.get("experience", ""),
        "certifications":  parsed.get("certifications", ""),
        "summary":         parsed.get("summary", ""),
        "job_description": "",
        "raw_text":        raw_text,
        "parser":          "groq",
    }


# ---------------------------------------------------------------------------
# Rule-based fallback parser
# ---------------------------------------------------------------------------

SECTION_ALIASES = {
    "education": [
        "education", "academic background", "academic qualifications",
        "qualifications", "educational background", "degrees", "academics",
    ],
    "skills": [
        "skills", "technical skills", "core skills", "key skills",
        "technologies", "tech stack", "tools", "tools & technologies",
        "programming languages", "languages & frameworks", "competencies",
        "areas of expertise", "expertise", "technical expertise",
        "skills & technologies", "skills and technologies",
    ],
    "experience": [
        "experience", "work experience", "professional experience",
        "employment history", "employment", "work history",
        "internships", "internship experience", "industry experience",
        "career history", "positions held",
    ],
    "projects": [
        "projects", "personal projects", "academic projects",
        "key projects", "notable projects", "selected projects",
        "project experience", "portfolio",
    ],
    "certifications": [
        "certifications", "certification", "certificates", "certificate",
        "licenses & certifications", "professional certifications",
        "courses", "achievements", "awards", "honors", "training",
    ],
    "summary": [
        "summary", "professional summary", "profile", "about me",
        "objective", "career objective", "overview",
    ],
}

_ALIAS_MAP: dict[str, str] = {
    alias: section
    for section, aliases in SECTION_ALIASES.items()
    for alias in aliases
}

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[a-z]{2,}", re.IGNORECASE)
PHONE_RE = re.compile(r"(\+?\d[\d\s\-().]{7,17})")
URL_RE   = re.compile(r"https?://\S+|www\.\S+|linkedin\.com\S*|github\.com\S*", re.IGNORECASE)
DATE_RE  = re.compile(r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{4})\b", re.IGNORECASE)


def _clean_header(line: str) -> str:
    cleaned = re.sub(r"^[\-=_|*#•:\s]+|[\-=_|*#•:\s]+$", "", line)
    return cleaned.rstrip(":").strip()


def _detect_section(line: str) -> str | None:
    stripped = line.strip()
    if not stripped or len(stripped) > 80:
        return None
    candidate = _clean_header(stripped).lower()
    return _ALIAS_MAP.get(candidate)


def _split_sections(text: str) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {"header": []}
    current = "header"
    for line in text.splitlines():
        detected = _detect_section(line)
        if detected:
            current = detected
            sections.setdefault(current, [])
        else:
            s = line.strip()
            if s:
                sections.setdefault(current, []).append(s)
    return sections


def _extract_name(lines: list[str]) -> str:
    for line in lines:
        line = line.strip()
        if not line or EMAIL_RE.search(line) or URL_RE.search(line):
            continue
        cleaned = PHONE_RE.sub("", line).strip()
        words = cleaned.split()
        if 2 <= len(words) <= 5 and words[0][0].isupper() and not DATE_RE.search(cleaned) and "|" not in cleaned:
            return cleaned
    return next((l.strip() for l in lines if l.strip() and not EMAIL_RE.search(l)), "")


def _extract_skills(lines: list[str]) -> str:
    all_skills: list[str] = []
    for line in lines:
        parts = re.split(r"[,|•·/]|(?:\s{2,})", line)
        for part in parts:
            skill = part.strip().strip("-").strip()
            if skill and len(skill) < 50:
                all_skills.append(skill)
    seen: set[str] = set()
    unique = []
    for s in all_skills:
        if s.lower() not in seen and len(s) > 1:
            seen.add(s.lower())
            unique.append(s)
    return ", ".join(unique)


def _parse_rule_based(raw_text: str) -> dict:
    sections = _split_sections(raw_text)
    skill_lines = sections.get("skills", [])
    skills_text = _extract_skills(skill_lines)

    if not skills_text:
        m = re.search(r"(?:skills?|technologies|tools)[:\s]+([^\n]{10,200})", raw_text, re.IGNORECASE)
        if m:
            skills_text = m.group(1).strip()

    return {
        "name":            _extract_name(sections.get("header", [])),
        "target_role":     "",
        "education":       "\n".join(sections.get("education", [])),
        "skills":          skills_text,
        "projects":        "\n".join(sections.get("projects", [])),
        "experience":      "\n".join(sections.get("experience", [])),
        "certifications":  "\n".join(sections.get("certifications", [])),
        "summary":         "\n".join(sections.get("summary", [])),
        "job_description": "",
        "raw_text":        raw_text,
        "parser":          "rule-based",
    }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def parse_resume_pdf(pdf_bytes: bytes) -> dict:
    raw_text = _extract_text(pdf_bytes)

    # Try Groq first
    if os.environ.get("GROQ_API_KEY"):
        try:
            return _parse_with_groq(raw_text)
        except Exception as e:
            print(f"[resume_parser] Groq failed ({e}), falling back to rule-based")

    return _parse_rule_based(raw_text)
