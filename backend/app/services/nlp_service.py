"""
NLP Service for Federated Learning Healthcare Platform
Handles symptom extraction, clinical keyword identification, and sentiment analysis of medical notes.
"""

import re
from typing import List, Dict, Any, Set
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class NLPService:
    """Enterprise NLP service for clinical text analysis"""
    
    def __init__(self):
        self.symptom_keywords = {
            'fever', 'cough', 'dyspnea', 'fatigue', 'headache', 'nausea', 
            'vomiting', 'diarrhea', 'chest pain', 'shortness of breath',
            'dizziness', 'abdominal pain', 'rash', 'sore throat', 'joint pain',
            'swelling', 'numbness', 'palpitation', 'blurred vision'
        }
        
        self.clinical_entities = {
            'diabetes', 'hypertension', 'asthma', 'pneumonia', 'cardiac',
            'glucose', 'insulin', 'blood pressure', 'oxygen', 'heart rate',
            'cholesterol', 'mri', 'ct scan', 'x-ray', 'ecg', 'blood test'
        }
        
        self.task_keywords = [
            (r'(schedule|book|arrange)\s+(a|an)?\s+(\w+\s+)?(appointment|test|scan|mri|ct|x-ray)', 'appointment'),
            (r'(increase|decrease|change|stop|start)\s+(the\s+)?(dosage|medication|dose|medicine)', 'medication'),
            (r'(refer|send)\s+(to|for)\s+(\w+\s+)?(specialist|department|surgeon|consultation)', 'referral'),
            (r'(follow-up|check-up)\s+(in|after)\s+(\w+\s+)?(days|weeks|months)', 'follow-up')
        ]
        
        # Sentiment lexicons
        self.positive_medical = {'improving', 'stable', 'responding', 'active', 'healthy', 'normal'}
        self.negative_medical = {'worsening', 'deteriorating', 'unresponsive', 'acute', 'severe', 'painful', 'critical'}

    def analyze_medical_note(self, text: str, patient_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Perform complete NLP analysis on a clinical note with optional patient context"""
        text_lower = text.lower()
        
        symptoms = self.extract_symptoms(text_lower)
        entities = self.extract_clinical_keywords(text_lower)
        sentiment = self.analyze_sentiment(text_lower)
        tasks = self.extract_tasks(text_lower)
        
        # Risk indicators
        is_emergency = any(word in text_lower for word in ['critical', 'emergency', 'arrest', 'stroke', 'failure', 'seizure', 'unconscious'])
        
        urgency_score = self._calculate_urgency(symptoms, sentiment, is_emergency)
        
        return {
            "symptoms": list(symptoms),
            "clinical_entities": list(entities),
            "sentiment": sentiment,
            "tasks": tasks,
            "risk_assessment": {
                "is_emergency": is_emergency,
                "urgency_score": urgency_score,
                "risk_level": "High" if urgency_score > 7 else "Moderate" if urgency_score > 4 else "Low"
            },
            "summary": self._generate_summary(symptoms, entities, sentiment, tasks, patient_context)
        }

    def extract_symptoms(self, text: str) -> Set[str]:
        found = set()
        for symptom in self.symptom_keywords:
            if re.search(r'\b' + re.escape(symptom) + r'\b', text):
                found.add(symptom)
        return found

    def extract_clinical_keywords(self, text: str) -> Set[str]:
        found = set()
        for entity in self.clinical_entities:
            if re.search(r'\b' + re.escape(entity) + r'\b', text):
                found.add(entity)
        return found

    def extract_tasks(self, text: str) -> List[Dict[str, str]]:
        tasks = []
        for pattern, task_type in self.task_keywords:
            matches = re.finditer(pattern, text)
            for match in matches:
                tasks.append({
                    "type": task_type,
                    "description": match.group(0).capitalize(),
                    "status": "pending"
                })
        return tasks

    def analyze_sentiment(self, text: str) -> str:
        pos_count = sum(1 for word in self.positive_medical if word in text)
        neg_count = sum(1 for word in self.negative_medical if word in text)
        
        if neg_count > pos_count:
            return 'NEGATIVE/DETERIORATING'
        elif pos_count > neg_count:
            return 'POSITIVE/IMPROVING'
        return 'NEUTRAL/STABLE'

    def _calculate_urgency(self, symptoms: Set[str], sentiment: str, is_emergency: bool) -> int:
        score = 1
        if is_emergency: score += 7
        if sentiment == 'NEGATIVE/DETERIORATING': score += 2
        score += min(2, len(symptoms))
        return min(10, score)

    def _generate_summary(self, symptoms: Set[str], entities: Set[str], sentiment: str, tasks: List[Dict[str, str]], patient_context: Dict[str, Any] = None) -> str:
        if not symptoms and not entities and not tasks:
            return "No significant clinical entities or tasks detected."
            
        sym_str = ", ".join(symptoms) if symptoms else "none"
        ent_str = ", ".join(entities) if entities else "none"
        task_count = len(tasks)
        
        prefix = ""
        if patient_context:
            name = patient_context.get("name", "Unknown Patient")
            pid = patient_context.get("patient_id_manual", "Unknown ID")
            prefix = f"Clinical assessment for {name} ({pid}): "
            
        summary = f"{prefix}Detected symptoms: {sym_str}. Relevant clinical entities: {ent_str}. Patient status is {sentiment}."
        if task_count > 0:
            summary += f" Extracted {task_count} follow-up tasks."
            
        return summary

# Global instance
nlp_service = NLPService()
