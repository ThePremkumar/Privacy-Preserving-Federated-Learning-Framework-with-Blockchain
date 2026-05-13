from typing import List, Dict, Any, Optional

def calculate_composite_risk(medical_history: List[str], ai_score: Optional[float] = None) -> Dict[str, Any]:
    """
    Unify risk calculation across the platform.
    Weights: 
    - Base risk from history: 0 (0-1 items), 4 (2-3 items), 7.5 (4+ items)
    - AI score: 0-10
    """
    history_count = len(medical_history)
    history_base = 2.0 if history_count <= 1 else 5.0 if history_count <= 3 else 8.5
    
    final_score = history_base
    if ai_score is not None:
        # Balanced clinical risk (50% AI, 50% History)
        final_score = (ai_score * 0.5) + (history_base * 0.5)
    
    if final_score >= 7.5:
        return {"level": "High", "score": round(final_score, 1), "label": "Critical"}
    if final_score >= 4.0:
        return {"level": "Moderate", "score": round(final_score, 1), "label": "Moderate"}
    return {"level": "Low", "score": round(final_score, 1), "label": "Nominal"}
