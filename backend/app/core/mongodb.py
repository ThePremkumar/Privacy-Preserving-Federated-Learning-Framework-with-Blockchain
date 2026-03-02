"""
MongoDB Integration with a generic repository pattern for Patient Data and Predictions.
In production, this would use Motor or PyMongo.
"""

import json
import os
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Mocking MongoDB for simulation/development
# This would be switched to Motor/PyMongo in production
# URL: settings.MONGODB_URL

class MongoRepository:
    """Mock MongoDB repository for Patient Data and Predictions"""
    
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self.db_path = f"./data/mongodb/{collection_name}.json"
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        # Load data if exists
        if os.path.exists(self.db_path):
            with open(self.db_path, "r") as f:
                try:
                    self.data = json.load(f)
                except json.JSONDecodeError:
                    self.data = {}
        else:
            self.data = {}

    def _save(self):
        with open(self.db_path, "w") as f:
            json.dump(self.data, f, indent=4)

    async def insert_one(self, item: Dict[str, Any]) -> str:
        """Insert a document"""
        item_id = str(uuid.uuid4())
        item["_id"] = item_id
        item["created_at"] = datetime.utcnow().isoformat()
        self.data[item_id] = item
        self._save()
        return item_id

    async def find_one(self, filter: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Find a single document by filter (simple EQUALS matching)"""
        for doc in self.data.values():
            match = True
            for k, v in filter.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None

    async def find_many(self, filter: Dict[str, Any] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Find multiple documents"""
        results = []
        for doc in self.data.values():
            if not filter:
                results.append(doc)
            else:
                match = True
                for k, v in filter.items():
                    if doc.get(k) != v:
                        match = False
                        break
                if match:
                    results.append(doc)
            
            if len(results) >= limit:
                break
        return results

    async def delete_one(self, filter: Dict[str, Any]) -> bool:
        doc = await self.find_one(filter)
        if doc:
            del self.data[doc["_id"]]
            self._save()
            return True
        return False

# Patient Data Repository
patient_repo = MongoRepository("patients")

# Predictions Repository
prediction_repo = MongoRepository("predictions")
