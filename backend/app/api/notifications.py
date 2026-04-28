from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import SessionLocal
from app.core import db_models
from app.core.dependencies import get_current_user
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[Dict[str, Any]])
async def get_notifications(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notifications for the current user (and global notifications)"""
    user_id = current_user.get("user_id")
    
    # Get user specific and global notifications
    notifications = db.query(db_models.Notification).filter(
        (db_models.Notification.user_id == user_id) | (db_models.Notification.user_id == None)
    ).order_by(db_models.Notification.created_at.desc()).limit(50).all()
    
    result = []
    for n in notifications:
        result.append({
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        })
    
    return result

@router.post("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a specific notification as read"""
    notification = db.query(db_models.Notification).filter(
        db_models.Notification.id == notification_id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    # Check if global or belongs to user
    if notification.user_id and notification.user_id != current_user.get("user_id"):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    notification.is_read = True
    db.commit()
    
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_read(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for the user"""
    user_id = current_user.get("user_id")
    
    db.query(db_models.Notification).filter(
        (db_models.Notification.user_id == user_id) | (db_models.Notification.user_id == None),
        db_models.Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    return {"status": "success"}
