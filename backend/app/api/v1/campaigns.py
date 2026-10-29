from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.campaign import Campaign, CampaignTarget
from app.models.community import Community
from app.models.audit import AuditLog
from app.schemas.campaign import CampaignResponse, CampaignCreate, CampaignUpdate

router = APIRouter(prefix="/campaigns", tags=["Campaign Manager"])


@router.get("/", response_model=List[CampaignResponse])
@router.get("", response_model=List[CampaignResponse])
def get_campaigns(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Campaign)
    if status:
        q = q.filter(Campaign.status == status)
    return q.order_by(Campaign.created_at.desc()).all()


@router.post("/", response_model=CampaignResponse)
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = Campaign(
        name=payload.name,
        target_service=payload.target_service,
        target_criteria=payload.target_criteria,
        template_id=payload.template_id,
        status="Draft",
        max_approved_posts=payload.max_approved_posts,
        posts_sent_count=0,
        start_date=payload.start_date or datetime.now(timezone.utc),
        end_date=payload.end_date
    )
    db.add(campaign)
    db.flush()

    for cid in payload.target_community_ids:
        comm = db.query(Community).filter(Community.id == cid).first()
        if comm:
            target = CampaignTarget(
                campaign_id=campaign.id,
                community_id=comm.id,
                status="Pending"
            )
            db.add(target)

    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_CAMPAIGN",
        resource_type="Campaign",
        resource_id=str(campaign.id),
        details=f"Created campaign '{campaign.name}' for service '{campaign.target_service}' with {len(payload.target_community_ids)} targets."
    ))
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/{id}", response_model=CampaignResponse)
def get_campaign(id: int, db: Session = Depends(get_db)):
    c = db.query(Campaign).filter(Campaign.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return c


@router.put("/{id}/status", response_model=CampaignResponse)
def update_campaign_status(
    id: int,
    payload: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c = db.query(Campaign).filter(Campaign.id == id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found")

    if payload.status:
        c.status = payload.status
    if payload.name:
        c.name = payload.name
    if payload.target_service:
        c.target_service = payload.target_service
    if payload.max_approved_posts is not None:
        c.max_approved_posts = payload.max_approved_posts

    db.add(AuditLog(
        user_id=current_user.id,
        action="UPDATE_CAMPAIGN_STATUS",
        resource_type="Campaign",
        resource_id=str(c.id),
        details=f"Campaign '{c.name}' updated. Status: {c.status}."
    ))
    db.commit()
    db.refresh(c)
    return c
