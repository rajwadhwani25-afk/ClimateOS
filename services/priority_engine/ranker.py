class PriorityRanker:
    """
    Impact & Priority Ranking Engine
    Calculates priority score (0-100) for emergency rescue allocation
    """
    def rank_incident(self, incident: dict) -> float:
        trapped = incident.get("trapped_count", 0) * 16.0
        injured = incident.get("injured_count", 0) * 20.0
        confidence = incident.get("confidence_score", 70.0) * 0.2
        
        category_weights = {
            "trapped": 30.0,
            "medical": 25.0,
            "flood": 20.0,
            "road": 15.0,
            "fire": 25.0
        }
        cat_score = category_weights.get(incident.get("category"), 10.0)

        total = trapped + injured + confidence + cat_score
        return min(99.0, round(total, 1))

priority_ranker = PriorityRanker()
