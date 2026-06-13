import time
import shutil
import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from app.schemas import CandidateAnalysis
from app.engine import HireMindEngine

app = FastAPI(title="HireMind AI")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

engine = HireMindEngine()
CANDIDATE_DB = {}

@app.post("/api/upload-resumes", response_model=List[CandidateAnalysis])
async def upload_and_screen_resumes(
    files: List[UploadFile] = File(...),
    job_title: str = Form(...),
    job_requirements: str = Form(...),
    emiratization_priority: bool = Form(False)
):
    results = []
    TEMP_DIR = "temp_cvs"
    os.makedirs(TEMP_DIR, exist_ok=True)

    for file in files:
        if not file.filename.endswith('.pdf'): continue
        
        file_path = os.path.join(TEMP_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        raw_text = engine.extract_text_from_pdf(file_path)
        meta = engine.detect_candidate_meta(raw_text)
        semantic_score = engine.compute_vector_match(raw_text, job_requirements)
        
        final_score = semantic_score
        if meta["is_emirati"] and emiratization_priority:
            final_score = min(100, final_score + 15) 
        
        insights = engine.evaluate_risks_and_insights(raw_text, job_requirements, meta["is_emirati"], final_score)
        
        analysis = CandidateAnalysis(
            candidate_name=meta["name"] if meta["name"] != "Candidate File" else file.filename.replace(".pdf", ""),
            original_filename=file.filename,
            email=meta["email"],
            phone=meta["phone"],
            match_score=int(final_score),
            role=job_title,
            visa_status=meta["visa_status"],
            is_emirati=meta["is_emirati"],
            skills_matched=["Extracted from semantic overlap"],
            missing_skills=["Requires manual review"],
            strengths=insights["strengths"],
            weaknesses=insights["weaknesses"],
            risks=insights["risks"],
            summary=insights["summary"],
            rejection_reason=insights["rejection_reason"],
            ai_interview_questions=insights["interview_questions"]
        )
        
        CANDIDATE_DB[file.filename] = analysis
        results.append(analysis)
        os.remove(file_path)

    results.sort(key=lambda x: x.match_score, reverse=True)
    return results

@app.get("/api/candidates", response_model=List[CandidateAnalysis])
async def get_all_indexed_candidates():
    return list(CANDIDATE_DB.values())