"""
NLP Service for Federated Learning Healthcare Platform
Handles symptom extraction, clinical keyword identification, and sentiment analysis of medical notes.
"""

import re
from typing import List, Dict, Any, Set
import logging

logger = logging.getLogger(__name__)

class NLPService:
    """Enterprise NLP service for clinical text analysis"""
    
    def __init__(self):
        # Basic clinical dictionary for demo purposes
        # In production, use specialized tools like MetaMap, cTAKES, or BioBERT
        self.symptom_keywords = {
            'fever', 'cough', 'dyspnea', 'fatigue', 'headache', 'nausea', 
            'vomiting', 'diarrhea', 'chest pain', 'shortness of breath',
            'dizziness', 'abdominal pain', 'rash', 'sore throat'
        }
        
        self.clinical_entities = {
            'diabetes', 'hypertension', 'asthma', 'pneumonia', 'cardiac',
            'glucose', 'insulin', 'blood pressure', 'oxygen', 'heart rate'
        }
        
        # Sentiment lexicons
        self.positive_medical = {'improving', 'stable', 'responding', 'active', 'healthy'}
        self.negative_medical = {'worsening', 'deteriorating', 'unresponsive', 'acute', 'severe'}

    def analyze_medical_note(self, text: str) -> Dict[str, Any]:
        """
        Perform complete NLP analysis on a clinical note
        """
        text_lower = text.lower()
        
        symptoms = self.extract_symptoms(text_lower)
        keywords = self.extract_clinical_keywords(text_lower)
        sentiment = self.analyze_sentiment(text_lower)
        
        # Risk indicators
        is_emergency = any(word in text_lower for word in ['critical', 'emergency', 'arrest', 'stroke', 'failure'])
        
        return {
            "symptoms": list(symptoms),
            "clinical_entities": list(keywords),
            "sentiment": sentiment,
            "risk_assessment": {
                "is_emergency": is_emergency,
                "urgency_score": self._calculate_urgency(symptoms, sentiment, is_emergency)
            },
            "summary": self._generate_summary(symptoms, keywords, sentiment)
        }

    def extract_symptoms(self, text: str) -> Set[str]:
        """Extract symptoms from text using keyword matching"""
        found = set()
        for symptom in self.symptom_keywords:
            if re.search(r'\b' + re.escape(symptom) + r'\b', text):
                found.add(symptom)
        return found

    def extract_clinical_keywords(self, text: str) -> Set[str]:
        """Extract clinical entities from text"""
        found = set()
        for entity in self.clinical_entities:
            if re.search(r'\b' + re.escape(entity) + r'\b', text):
                found.add(entity)
        return found

    def analyze_sentiment(self, text: str) -> str:
        """Simple rule-based sentiment analysis for medical context"""
        pos_count = sum(1 for word in self.positive_medical if word in text)
        neg_count = sum(1 for word in self.negative_medical if word in text)
        
        if neg_count > pos_count:
            return 'NEGATIVE/DETERIORATING'
        elif pos_count > neg_count:
            return 'POSITIVE/IMPROVING'
        return 'NEUTRAL/STABLE'

    def _calculate_urgency(self, symptoms: Set[str], sentiment: str, is_emergency: bool) -> int:
        """Calculate urgency score (1-10)"""
        score = 1
        if is_emergency: score += 7
        if sentiment == 'NEGATIVE/DETERIORATING': score += 2
        score += min(2, len(symptoms))
        return min(10, score)

    def _generate_summary(self, symptoms: Set[str], keywords: Set[str], sentiment: str) -> str:
        """Generate a human-readable summary of analysis"""
        if not symptoms and not keywords:
            return "No significant clinical entities detected."
            
        sym_str = ", ".join(symptoms) if symptoms else "none"
        ent_str = ", ".join(keywords) if keywords else "none"
        
        return f"Detected symptoms: {sym_str}. Relevant clinical entities: {ent_str}. Patient status is {sentiment}."

# Global instance
nlp_service = NLPService()
