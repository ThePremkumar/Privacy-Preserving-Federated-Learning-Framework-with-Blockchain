from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
import logging

from app.services.auth_service import auth_service, User, UserRole, Permission
from app.core.database import SessionLocal
from app.core.db_models import Department as DBDepartment, User as DBUser, Hospital as DBHospital

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic models
class DepartmentBase(BaseModel):
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    head_doctor_id: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    hospital_id: Optional[str] = None

class DepartmentUpdate(DepartmentBase):
    name: Optional[str] = None
    is_active: Optional[bool] = None

class DepartmentResponse(DepartmentBase):
    id: int
    hospital_id: str
    is_active: bool
    doctor_count: int = 0

    class Config:
        from_attributes = True

# Dependency to get current user from auth.py (imported via auth_service for consistency)
from app.api.auth import get_current_user

@router.get("/", response_model=List[DepartmentResponse])
async def get_departments(
    hospital_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """List departments for a hospital"""
    db = SessionLocal()
    try:
        # If not admin/super_admin, force hospital_id to user's hospital
        if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
            hospital_id = current_user.hospital_id
        
        if not hospital_id:
            raise HTTPException(status_code=400, detail="hospital_id is required")
        
        departments = db.query(DBDepartment).filter(DBDepartment.hospital_id == hospital_id).all()
        
        # Calculate doctor counts
        results = []
        for dept in departments:
            doc_count = db.query(DBUser).filter(DBUser.department_id == dept.id).count()
            res = DepartmentResponse.from_orm(dept)
            res.doctor_count = doc_count
            results.append(res)
            
        return results
    finally:
        db.close()

@router.get("/all", response_model=List[DepartmentResponse])
async def get_all_departments(current_user: User = Depends(get_current_user)):
    """List all departments across all hospitals (admin only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    db = SessionLocal()
    try:
        departments = db.query(DBDepartment).all()
        results = []
        for dept in departments:
            doc_count = db.query(DBUser).filter(DBUser.department_id == dept.id).count()
            res = DepartmentResponse.from_orm(dept)
            res.doctor_count = doc_count
            results.append(res)
        return results
    finally:
        db.close()

@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department(department_id: int, current_user: User = Depends(get_current_user)):
    """Get single department"""
    db = SessionLocal()
    try:
        dept = db.query(DBDepartment).filter(DBDepartment.id == department_id).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
            
        # Check access
        if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN] and dept.hospital_id != current_user.hospital_id:
            raise HTTPException(status_code=403, detail="Access denied")
            
        doc_count = db.query(DBUser).filter(DBUser.department_id == dept.id).count()
        res = DepartmentResponse.from_orm(dept)
        res.doctor_count = doc_count
        return res
    finally:
        db.close()

@router.post("/", response_model=DepartmentResponse)
async def create_department(
    dept_data: DepartmentCreate,
    current_user: User = Depends(get_current_user)
):
    """Create department"""
    # Permission check: Hospital node or Admin+
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HOSPITAL]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    db = SessionLocal()
    try:
        hospital_id = dept_data.hospital_id or current_user.hospital_id
        if not hospital_id:
            raise HTTPException(status_code=400, detail="hospital_id is required")
            
        # Check if hospital exists
        hosp = db.query(DBHospital).filter(DBHospital.id == hospital_id).first()
        if not hosp:
            raise HTTPException(status_code=404, detail="Hospital not found")
            
        # Check for duplicate code in same hospital
        if dept_data.code:
            existing = db.query(DBDepartment).filter(
                DBDepartment.hospital_id == hospital_id,
                DBDepartment.code == dept_data.code
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"Department code {dept_data.code} already exists for this hospital")

        new_dept = DBDepartment(
            hospital_id=hospital_id,
            name=dept_data.name,
            code=dept_data.code,
            description=dept_data.description,
            head_doctor_id=dept_data.head_doctor_id,
            created_by=current_user.id
        )
        db.add(new_dept)
        db.commit()
        db.refresh(new_dept)
        
        # Increment hospital department count
        hosp.department_count = db.query(DBDepartment).filter(DBDepartment.hospital_id == hospital_id).count()
        db.commit()
        
        return DepartmentResponse.from_orm(new_dept)
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating department: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

@router.put("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: int,
    dept_data: DepartmentUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update department"""
    db = SessionLocal()
    try:
        dept = db.query(DBDepartment).filter(DBDepartment.id == department_id).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
            
        # Permission check
        if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN] and dept.hospital_id != current_user.hospital_id:
            raise HTTPException(status_code=403, detail="Access denied")
            
        if dept_data.name is not None:
            dept.name = dept_data.name
        if dept_data.code is not None:
            dept.code = dept_data.code
        if dept_data.description is not None:
            dept.description = dept_data.description
        if dept_data.head_doctor_id is not None:
            dept.head_doctor_id = dept_data.head_doctor_id
        if dept_data.is_active is not None:
            dept.is_active = dept_data.is_active
            
        db.commit()
        db.refresh(dept)
        return DepartmentResponse.from_orm(dept)
    finally:
        db.close()

@router.delete("/{department_id}")
async def delete_department(department_id: int, current_user: User = Depends(get_current_user)):
    """Delete department (Admin+ only)"""
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
        
    db = SessionLocal()
    try:
        dept = db.query(DBDepartment).filter(DBDepartment.id == department_id).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
            
        # Check if any active doctors are assigned
        doc_count = db.query(DBUser).filter(DBUser.department_id == department_id, DBUser.is_active == True).count()
        if doc_count > 0:
            raise HTTPException(status_code=400, detail="Cannot delete department with active doctors assigned")
            
        hospital_id = dept.hospital_id
        db.delete(dept)
        db.commit()
        
        # Update hospital department count
        hosp = db.query(DBHospital).filter(DBHospital.id == hospital_id).first()
        if hosp:
            hosp.department_count = db.query(DBDepartment).filter(DBDepartment.hospital_id == hospital_id).count()
            db.commit()
            
        return {"message": "Department deleted successfully"}
    finally:
        db.close()
