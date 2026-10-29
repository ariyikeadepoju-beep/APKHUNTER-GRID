from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.outreach import OutreachTemplate, MessageDraft, MessageApproval
from app.models.lead import Lead
from app.models.community import Community
from app.models.discord import DiscordChannel
from app.models.audit import AuditLog
from app.schemas.outreach import (
    OutreachTemplateResponse,
    MessageDraftCreate,
    MessageDraftUpdate,
    MessageDraftResponse
)
from app.services.outreach_service import render_template, check_for_duplicate_dispatch

router = APIRouter(prefix="/outreach", tags=["Outreach Message Studio"])


@router.get("/templates", response_model=List[OutreachTemplateResponse])
def get_templates(db: Session = Depends(get_db)):
    return db.query(OutreachTemplate).all()


@router.post("/generate-draft", response_model=MessageDraftResponse)
def generate_draft(
    payload: MessageDraftCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == payload.lead_id).first() if payload.lead_id else None
    community = db.query(Community).filter(Community.id == payload.community_id).first() if payload.community_id else None
    template = db.query(OutreachTemplate).filter(OutreachTemplate.id == payload.template_id).first() if payload.template_id else None

    content = payload.content
    subject = payload.subject

    if template:
        channel_name = "promotions"
        if payload.target_channel_id:
            ch = db.query(DiscordChannel).filter(DiscordChannel.id == payload.target_channel_id).first()
            if ch:
                channel_name = ch.name

        content = render_template(
            template.body_template,
            lead=lead,
            community=community,
            extra_vars={"channel_name": channel_name}
        )
        if not subject and template.subject:
            subject = render_template(
                template.subject,
                lead=lead,
                community=community,
                extra_vars={"channel_name": channel_name}
            )

    # Check for duplicate dispatch in target within 7 days
    is_duplicate = check_for_duplicate_dispatch(db, payload.target_channel_id, payload.community_id)

    draft = MessageDraft(
        campaign_id=payload.campaign_id,
        lead_id=payload.lead_id,
        community_id=payload.community_id,
        target_channel_id=payload.target_channel_id,
        template_id=payload.template_id,
        subject=subject,
        content=content,
        approval_status="Draft",
        is_duplicate_check_passed=not is_duplicate,
        created_by_user_id=current_user.id
    )
    db.add(draft)
    db.flush()

    db.add(AuditLog(
        user_id=current_user.id,
        action="GENERATE_MESSAGE_DRAFT",
        resource_type="MessageDraft",
        resource_id=str(draft.id),
        details=f"Generated draft for lead '{lead.display_name if lead else 'General'}' using template '{template.name if template else 'Custom'}'."
    ))
    db.commit()
    db.refresh(draft)
    return draft


@router.get("/drafts", response_model=List[MessageDraftResponse])
def get_drafts(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(MessageDraft)
    if status:
        q = q.filter(MessageDraft.approval_status == status)
    return q.order_by(MessageDraft.updated_at.desc()).all()


@router.get("/drafts/{id}", response_model=MessageDraftResponse)
def get_draft(id: int, db: Session = Depends(get_db)):
    draft = db.query(MessageDraft).filter(MessageDraft.id == id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Message draft not found")
    return draft


@router.put("/drafts/{id}", response_model=MessageDraftResponse)
def update_draft(
    id: int,
    payload: MessageDraftUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    draft = db.query(MessageDraft).filter(MessageDraft.id == id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Message draft not found")

    if payload.subject is not None:
        draft.subject = payload.subject
    if payload.content is not None:
        draft.content = payload.content
    if payload.target_channel_id is not None:
        draft.target_channel_id = payload.target_channel_id
    if payload.approval_status is not None:
        draft.approval_status = payload.approval_status

    db.add(AuditLog(
        user_id=current_user.id,
        action="UPDATE_MESSAGE_DRAFT",
        resource_type="MessageDraft",
        resource_id=str(draft.id),
        details=f"Draft #{draft.id} updated. Approval status: {draft.approval_status}"
    ))
    db.commit()
    db.refresh(draft)
    return draft


@router.post("/drafts/{id}/submit-for-approval", response_model=MessageDraftResponse)
def submit_draft_for_approval(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    draft = db.query(MessageDraft).filter(MessageDraft.id == id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Message draft not found")

    draft.approval_status = "Pending Review"
    db.add(AuditLog(
        user_id=current_user.id,
        action="SUBMIT_FOR_APPROVAL",
        resource_type="MessageDraft",
        resource_id=str(draft.id),
        details=f"Draft #{draft.id} submitted for operator review."
    ))
    db.commit()
    db.refresh(draft)
    return draft
