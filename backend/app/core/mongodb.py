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
        # Use absolute path relative to the backend root to ensure data consistency
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.db_path = os.path.join(base_dir, "data", "mongodb", f"{collection_name}.json")
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
        """Find a single document by filter (Reloads from disk to pick up script-seeded data)"""
        if os.path.exists(self.db_path):
            with open(self.db_path, "r") as f:
                try:
                    self.data = json.load(f)
                except:
                    pass
        
        for doc in self.data.values():
            match = True
            for k, v in filter.items():
                if doc.get(k) != v:
                    match = False
                    break
            if match:
                return doc
        return None

    async def find_many(self, filter: Dict[str, Any] = None, limit: int = 100, sort: list = None) -> List[Dict[str, Any]]:
        """Find multiple documents (Reloads from disk to pick up script-seeded data)"""
        if os.path.exists(self.db_path):
            with open(self.db_path, "r") as f:
                try:
                    self.data = json.load(f)
                except:
                    pass

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
                    
        if sort and len(sort) > 0:
            sort_field = sort[0][0]
            sort_dir = sort[0][1]
            results.sort(key=lambda x: str(x.get(sort_field, "") or ""), reverse=(sort_dir == -1))
            
        return results[:limit]

    async def count_documents(self, filter: Dict[str, Any] = None) -> int:
        """Count documents matching a filter"""
        results = await self.find_many(filter, limit=999999)
        return len(results)

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
