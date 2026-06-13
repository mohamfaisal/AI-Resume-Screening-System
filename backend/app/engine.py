import os
import re
import numpy as np
import faiss
from typing import List, Dict, Any
from pypdf import PdfReader
from sentence_transformers import SentenceTransformer
from transformers import pipeline

class HireMindEngine:
    def __init__(self):
        self.embedder = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
        self.classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

    def extract_text_from_pdf(self, file_path: str) -> str:
        text = ""
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        except Exception as e:
            print(f"Error reading PDF {file_path}: {str(e)}")
        return text

    def detect_candidate_meta(self, text: str) -> Dict[str, Any]:
        text_lower = text.lower()
        is_emirati = any(kw in text_lower for kw in ["emirati", "uae national", "خلاصة القيد", "مواطن إماراتي"])
        
        visa_status = "Employment Visa"
        if is_emirati:
            visa_status = "UAE National"
        elif "golden visa" in text_lower:
            visa_status = "Golden Visa"

        # Extract Email & Phone
        email_match = re.search(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', text)
        phone_match = re.search(r'(\+971|05[0-6|8-9])[\s\-]?\d{3}[\s\-]?\d{4}', text)
        
        # Name Extraction
        name_match = re.search(r"^[Name\s:]*([A-Z][a-z]+\s[A-Z][a-z]+)", text)
        
        return {
            "name": name_match.group(1) if name_match else "Candidate File",
            "email": email_match.group(0) if email_match else "Not Provided",
            "phone": phone_match.group(0) if phone_match else "Not Provided",
            "is_emirati": is_emirati, 
            "visa_status": visa_status
        }

    def compute_vector_match(self, resume_text: str, jd_text: str) -> float:
        embeddings = self.embedder.encode([resume_text, jd_text])
        index = faiss.IndexFlatIP(embeddings.shape[1])
        faiss.normalize_L2(embeddings)
        index.add(np.array([embeddings[0]]))
        D, I = index.search(np.array([embeddings[1]]), 1)
        return max(0.0, min(100.0, float(D[0][0]) * 100))

    def evaluate_risks_and_insights(self, resume_text: str, jd_text: str, is_emirati: bool, match_score: float) -> Dict[str, Any]:
        text_lower = resume_text.lower()
        risks, strengths, weaknesses = [], [], []

        job_hop_count = len(re.findall(r"(202\d|201\d)", text_lower))
        if job_hop_count > 5:
            risks.append("Job Hopping: High volume of role transitions in recent years.")
            weaknesses.append("Potential long-term retention risk.")
        
        if is_emirati:
            strengths.append("Fulfills UAE Emiratization quota requirements.")

        res = self.classifier(resume_text[:1000], candidate_labels=["leadership", "technical depth", "communication"])
        top_trait = res['labels'][0]
        strengths.append(f"Demonstrates strong indicators of {top_trait}.")

        # Generate realistic summary and rejection reason
        summary = f"The candidate's profile yields a semantic alignment of {int(match_score)}% with the provided job description. Their background suggests a primary proficiency in {top_trait}, making them a viable asset for teams requiring that specific dynamic. However, further technical assessment is recommended to verify their hands-on capabilities."
        
        rejection_reason = "Not Fit: Candidate lacks sufficient deep-domain overlap with the core technical requirements specified in the JD." if match_score < 60 else "Fit: Candidate meets the operational threshold for this role."

        return {
            "risks": risks,
            "strengths": strengths,
            "weaknesses": weaknesses if weaknesses else ["Requires specific technical vetting."],
            "summary": summary,
            "rejection_reason": rejection_reason,
            "interview_questions": [
                f"Can you provide a specific example of how you utilized your {top_trait} skills in a high-pressure scenario?",
                "Walk me through a time when a project requirement changed drastically. How did you adapt your workflow?"
            ]
        }