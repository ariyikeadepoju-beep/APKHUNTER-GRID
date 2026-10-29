from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.outreach import MessageDraft, MessageApproval
from app.models.audit import AuditLog
from app.schemas.outreach import MessageDraftResponse, MessageApprovalCreate, MessageApprovalResponse

router = APIRouter(prefix="/approvals", tags=["Outreach Approvals"])


@router.get("/pending", response_model=List[MessageDraftResponse])
def get_pending_approvals(db: Session = Depends(get_db)):
    return db.query(MessageDraft).filter(MessageDraft.approval_status == "Pending Review").all()


@router.post("/{draft_id}/approve", response_model=MessageApprovalResponse)
def approve_draft(
    draft_id: int,
    payload: MessageApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    draft = db.query(MessageDraft).filter(MessageDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Message draft not found")

    draft.approval_status = "Approved"

    approval = db.query(MessageApproval).filter(MessageApproval.draft_id == draft_id).first()
    if not approval:
        approval = MessageApproval(
            draft_id=draft.id,
            approver_user_id=current_user.id,
            decision="Approved",
            comments=payload.comments or "Approved by operator for dispatch.",
            decided_at=datetime.now(timezone.utc)
        )
        db.add(approval)
    else:
        approval.approver_user_id = current_user.id
        approval.decision = "Approved"
        approval.comments = payload.comments
        approval.decided_at = datetime.now(timezone.utc)

    db.add(AuditLog(
        user_id=current_user.id,
        action="APPROVE_MESSAGE_DRAFT",
        resource_type="MessageDraft",
        resource_id=str(draft.id),
        details=f"Draft #{draft.id} formally approved for dispatch by {current_user.email}. Comments: {payload.comments}"
    ))
    db.commit()
    db.refresh(approval)
    return approval


@router.post("/{draft_id}/reject", response_model=MessageApprovalResponse)
def reject_draft(
    draft_id: int,
    payload: MessageApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    draft = db.query(MessageDraft).filter(MessageDraft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Message draft not found")

    draft.approval_status = "Rejected"

    approval = db.query(MessageApproval).filter(MessageApproval.draft_id == draft_id).first()
    if not approval:
        approval = MessageApproval(
            draft_id=draft.id,
            approver_user_id=current_user.id,
            decision="Rejected",
            comments=payload.comments or "Rejected by operator.",
            decided_at=datetime.now(timezone.utc)
        )
        db.add(approval)
    else:
        approval.approver_user_id = current_user.id
        approval.decision = "Rejected"
        approval.comments = payload.comments
        approval.decided_at = datetime.now(timezone.utc)

    db.add(AuditLog(
        user_id=current_user.id,
        action="REJECT_MESSAGE_DRAFT",
        resource_type="MessageDraft",
        resource_id=str(draft.id),
        details=f"Draft #{draft.id} rejected by {current_user.email}. Reason: {payload.comments}"
    ))
    db.commit()
    db.refresh(approval)
    return approval
