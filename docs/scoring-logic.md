# Scoring Logic

## Overview

The scoring engine uses keyword-based analysis to evaluate a student's profile against a target job role. It is rule-based by design, making it fast, transparent, and free — while being structured to accept LLM enhancement later.

---

## Weightage Table

| Dimension | Weight | Max Score | Description |
|-----------|--------|-----------|-------------|
| Skill Match | 35% | 100 | Overlap between student skills and role/JD keywords |
| Project Relevance | 25% | 100 | Keyword match in projects + project count bonus |
| Experience Relevance | 20% | 100 | Keyword match in experience + years bonus |
| Resume Strength | 10% | 100 | Action verbs, quantifiable metrics, detail level |
| Certifications | 10% | 100 | Recognized cert keywords + count |

---

## Score Calculation Formula

```
Overall Score = (Skill Match × 0.35)
              + (Project Relevance × 0.25)
              + (Experience Relevance × 0.20)
              + (Resume Strength × 0.10)
              + (Certifications × 0.10)
```

All individual scores are clamped to [0, 100].

---

## Dimension Details

### 1. Skill Match (35%)

```python
rate = matched_role_keywords / total_role_keywords

# If job description provided:
jd_overlap = skill_words ∩ jd_words / len(jd_words)
final_rate = 0.7 × rate + 0.3 × min(jd_overlap × 3, 1.0)

skill_score = final_rate × 100
```

Role keyword database covers: Software Engineer, Frontend, Backend, Data Scientist, ML Engineer, DevOps, Product Manager, Data Analyst, Full Stack, Cloud Engineer.

### 2. Project Relevance (25%)

```python
rate = matched_role_keywords_in_projects / total_role_keywords
project_count_bonus = min(project_mentions × 5, 20) / 100
project_score = min((rate + bonus) × 100, 100)
```

Project mentions are detected by keywords: project, app, system, tool, platform, website, api, model, dashboard.

### 3. Experience Relevance (20%)

```python
rate = matched_role_keywords_in_experience / total_role_keywords
years_bonus = min(total_years_mentioned × 0.05, 0.20)
experience_score = min((rate + years_bonus) × 100, 100)
```

No experience = 5.0 (not 0, to avoid penalizing fresh graduates too harshly).

### 4. Resume Strength (10%)

Checks for 20 action verbs: developed, built, designed, implemented, led, improved, increased, reduced, optimized, deployed, created, managed, collaborated, architected, automated, delivered, launched, achieved, scaled, integrated.

```python
verb_rate = matched_verbs / 20
length_bonus = min(word_count / 500, 0.30)
resume_score = min((verb_rate + length_bonus) × 100, 100)
```

### 5. Certifications (10%)

```python
score = min((cert_keyword_hits × 15) + (cert_count × 10), 100)
```

Recognized keywords include: aws, gcp, azure, google, coursera, certified, tensorflow, pytorch, microsoft, oracle, cisco, comptia, pmp, scrum.

---

## Recommendation Levels

| Score Range | Level | Message |
|-------------|-------|---------|
| 85 – 100 | 🟢 Interview Ready | Well-prepared, start applying |
| 70 – 84 | 🔵 Strong Candidate | Great profile, address a few gaps |
| 50 – 69 | 🟠 Needs Improvement | Solid foundation, build more projects |
| 0 – 49 | 🔴 Beginner Level | Follow the roadmap systematically |

---

## LLM Extension Points

To upgrade any dimension with an LLM, replace the function body while keeping the same signature:

```python
# Current rule-based
def score_skill_match(skills, target_role, job_description):
    ...
    return score, matched, missing

# Future LLM-powered
def score_skill_match(skills, target_role, job_description):
    prompt = f"Rate skill match 0-100 for {target_role}. Skills: {skills}. JD: {job_description}"
    response = openai.chat.completions.create(...)
    return parse_score(response), matched, missing
```
