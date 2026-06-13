from pydantic import BaseModel, Field
from typing import List, Optional

class CandidateAnalysis(BaseModel):
    candidate_name: str
    original_filename: str
    email: str
    phone: str
    match_score: int = Field(..., ge=0, le=100)
    role: str
    nationality: Optional[str] = "Unknown"
    visa_status: str
    is_emirati: bool
    skills_matched: List[str]
    missing_skills: List[str]
    strengths: List[str]
    weaknesses: List[str]
    risks: List[str]
    summary: str
    rejection_reason: str
    ai_interview_questions: List[str]