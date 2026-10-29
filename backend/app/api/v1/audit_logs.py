from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.audit import AuditLog
from app.schemas.settings import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["Audit Trail"])


@router.get("/", response_model=List[AuditLogResponse])
@router.get("", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    db: Session = Depends(get_db)
):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    if resource_type:
        q = q.filter(AuditLog.resource_type == resource_type)

    return q.order_by(AuditLog.created_at.desc()).limit(limit).all()
