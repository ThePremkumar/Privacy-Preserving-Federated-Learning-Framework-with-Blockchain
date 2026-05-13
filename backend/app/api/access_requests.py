from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.db_models import AccessRequest, User, UserRole, Hospital, Notification
from app.core.dependencies import get_current_user, require_role
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import bcrypt
import random
import string
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Access Requests"])

class AccessRequestCreate(BaseModel):
    request_type: str # 'new_user' or 'new_hospital'
    full_name: Optional[str] = None
    designation: Optional[str] = None
    hospital_name: Optional[str] = None
    location: Optional[str] = None
    contact_number: Optional[str] = None
    email: EmailStr
    num_users: Optional[int] = None
    hospital_id: Optional[str] = None
    reason: Optional[str] = None

class AccessRequestUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None

def generate_password(length=12):
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(characters) for i in range(length))

def send_email_notification(to_email: str, subject: str, body: str):
    # Mock email notification
    logger.info(f"--- MOCK EMAIL ---")
    logger.info(f"To: {to_email}")
    logger.info(f"Subject: {subject}")
    logger.info(f"Body: \n{body}")
    logger.info(f"------------------")

@router.post("/", summary="Submit a new access request")
def submit_access_request(request: AccessRequestCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_request = AccessRequest(
        request_type=request.request_type,
        full_name=request.full_name,
        designation=request.designation,
        hospital_name=request.hospital_name,
        location=request.location,
        contact_number=request.contact_number,
        email=request.email,
        num_users=request.num_users,
        hospital_id=request.hospital_id,
        reason=request.reason,
        status="pending"
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)

    # Notify admins
    admins = db.query(User).filter(User.role.in_([UserRole.SUPER_ADMIN, UserRole.ADMIN])).all()
    for admin in admins:
        # Create in-app notification
        notif = Notification(
            user_id=admin.id,
            type="access_request",
            severity="info",
            title="New Access Request",
            message=f"New {request.request_type} access request from {request.full_name or request.hospital_name}.",
            meta_data={"request_id": db_request.id}
        )
        db.add(notif)
        
        # Email notification
        subject = f"New Access Request: {request.request_type}"
        body = f"A new access request has been submitted.\n\nType: {request.request_type}\nName: {request.full_name}\nHospital: {request.hospital_name}\nEmail: {request.email}\nReason: {request.reason}\n\nPlease review this request in the admin dashboard."
        background_tasks.add_task(send_email_notification, admin.email, subject, body)
    
    db.commit()
    return {"message": "Access request submitted successfully", "request_id": db_request.id}

@router.get("/public/hospitals", summary="Get list of registered hospitals for access request form")
def get_public_hospitals(db: Session = Depends(get_db)):
    hospitals = db.query(Hospital).all()
    return [{"id": h.id, "name": h.name} for h in hospitals]

@router.get("/", summary="Get all access requests")
def get_access_requests(db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOSPITAL]))):
    logger.info(f"DEBUG: current_user type: {type(current_user)}")
    logger.info(f"DEBUG: current_user content: {current_user}")
    if current_user.get("role") == UserRole.HOSPITAL:
        return db.query(AccessRequest).filter(
            AccessRequest.hospital_id == current_user.get("hospital_id"),
            AccessRequest.request_type == "new_user",
            AccessRequest.status == "approved"
        ).order_by(AccessRequest.created_at.desc()).all()
    return db.query(AccessRequest).order_by(AccessRequest.created_at.desc()).all()

@router.put("/{request_id}", summary="Approve or reject an access request")
def update_access_request(request_id: str, update_data: AccessRequestUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: Dict[str, Any] = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOSPITAL]))):
    db_request = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Access request not found")

    if db_request.status != "pending" and update_data.status != "completed":
        raise HTTPException(status_code=400, detail="Request is already processed")

    db_request.status = update_data.status
    
    if update_data.status == "rejected":
        # Send rejection email
        subject = "Access Request Update - Rejected"
        body = f"Dear {db_request.full_name or db_request.hospital_name},\n\nYour access request has been rejected.\nReason: {update_data.rejection_reason}\n\nRegards,\nAdmin Team"
        background_tasks.add_task(send_email_notification, db_request.email, subject, body)
        
    elif update_data.status == "approved":
        if db_request.request_type == "new_hospital":
            # 1. Generate password
            plain_password = generate_password()
            salt = bcrypt.gensalt()
            hashed_pw = bcrypt.hashpw(plain_password.encode('utf-8'), salt).decode('utf-8')
            
            # 2. Create hospital
            new_hospital = Hospital(
                name=db_request.hospital_name,
                contact_email=db_request.email,
                address=db_request.location,
                admin_name=db_request.full_name,
                contact_phone=db_request.contact_number
            )
            db.add(new_hospital)
            db.flush() # get ID
            
            # 3. Create hospital admin user
            node_username = f"{db_request.hospital_name.lower().replace(' ', '_')[:10]}_admin"
            admin_user = User(
                username=node_username,
                email=db_request.email,
                password_hash=hashed_pw,
                role=UserRole.HOSPITAL,
                hospital_id=new_hospital.id,
                is_first_login=True,
                auto_password_expires_at=datetime.utcnow() + timedelta(hours=48)
            )
            db.add(admin_user)
            
            # 4. Email credentials
            subject = "Welcome to HealthConnect - Hospital Credentials"
            body = f"Dear {db_request.full_name},\n\nYour hospital '{db_request.hospital_name}' has been approved.\n\nLogin URL: https://portal.healthconnect.com\nUsername: {node_username}\nPassword: {plain_password}\n\nPlease change your password upon first login.\n\nRegards,\nAdmin Team"
            background_tasks.add_task(send_email_notification, db_request.email, subject, body)
            
        elif db_request.request_type == "new_user":
            # 1. Notify Hospital Admin of the user's hospital
            # Try to match hospital by name
            hospital = db.query(Hospital).filter(Hospital.name.ilike(f"%{db_request.hospital_name}%")).first()
            if hospital:
                db_request.hospital_id = hospital.id
                hosp_admins = db.query(User).filter(User.hospital_id == hospital.id, User.role == UserRole.HOSPITAL).all()
                for h_admin in hosp_admins:
                    # Notify them
                    notif = Notification(
                        user_id=h_admin.id,
                        type="user_access_approved",
                        severity="info",
                        title="New User Approved",
                        message=f"User {db_request.full_name} has been approved. Please generate their credentials."
                    )
                    db.add(notif)
                    
                    # Email them
                    subject = "Action Required: Generate Credentials for New User"
                    body = f"Dear Hospital Admin,\n\nA new user ({db_request.full_name}) has requested access under your hospital and has been approved by the platform admins.\n\nPlease log in to your dashboard and generate their credentials.\n\nEmail: {db_request.email}\nDesignation: {db_request.designation}\n\nRegards,\nAdmin Team"
                    background_tasks.add_task(send_email_notification, h_admin.email, subject, body)
            else:
                # If hospital not found, email user about the issue or just let admin know
                logger.warning(f"Could not find hospital matching '{db_request.hospital_name}' for approved user {db_request.full_name}")

    db.commit()
    return {"message": f"Request {update_data.status} successfully"}
